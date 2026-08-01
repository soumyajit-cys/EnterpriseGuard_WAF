from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.auth.password import hash_password, verify_password
from app.core.redis_client import redis_client
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    ChangePasswordRequest,
)

repo = UserRepository()


class AuthService:

    async def register(
        self,
        db: AsyncSession,
        payload: RegisterRequest,
    ) -> dict:
        existing = await repo.get_by_username(db, payload.username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken",
            )

        existing_email = await repo.get_by_email(db, payload.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        hashed = hash_password(payload.password)
        user = await repo.create(
            db,
            username=payload.username,
            email=payload.email,
            password_hash=hashed,
            role="analyst",
        )

        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id, user.role)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
            },
        }

    async def login(
        self,
        db: AsyncSession,
        payload: LoginRequest,
    ) -> dict:
        user = await repo.get_by_username(db, payload.username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated",
            )

        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id, user.role)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
            },
        }

    async def refresh(
        self,
        db: AsyncSession,
        payload: RefreshRequest,
    ) -> dict:
        token_data = decode_token(payload.refresh_token)
        user_id = token_data.get("sub")
        token_type = token_data.get("type")

        if not user_id or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        blacklisted = await redis_client.get(
            f"token_blacklist:{payload.refresh_token}"
        )
        if blacklisted:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
            )

        user = await repo.get_by_id(db, int(user_id))
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        await redis_client.setex(
            f"token_blacklist:{payload.refresh_token}",
            86400 * 7,
            "revoked",
        )

        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id, user.role)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    async def logout(
        self,
        access_token: str,
        refresh_token: str,
    ) -> dict:
        expiry = 86400 * 7
        await redis_client.setex(
            f"token_blacklist:{access_token}",
            expiry,
            "revoked",
        )
        await redis_client.setex(
            f"token_blacklist:{refresh_token}",
            expiry,
            "revoked",
        )
        return {"message": "Logged out successfully"}

    async def get_me(self, db: AsyncSession, user: User) -> dict:
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
        }

    async def change_password(
        self,
        db: AsyncSession,
        user: User,
        payload: ChangePasswordRequest,
    ) -> dict:
        if not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        if payload.current_password == payload.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password",
            )

        new_hashed = hash_password(payload.new_password)
        await repo.change_password(db, user.id, new_hashed)
        return {"message": "Password changed successfully"}


auth_service = AuthService()

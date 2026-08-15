from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import (
    create_access_token,
    create_refresh_token,
    create_mfa_token,
    decode_token,
)
from app.auth.password import hash_password, verify_password
from app.core.csrf import issue_csrf_token
from app.core.redis_client import redis_client
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    ChangePasswordRequest,
)
from app.services.bruteforce_service import bruteforce_service
from app.services.audit_service import audit_service

repo = UserRepository()


class AuthService:

    async def register(
        self,
        db: AsyncSession,
        payload: RegisterRequest,
        ip: str | None = None,
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
            "csrf_token": issue_csrf_token(user.id),
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
        ip: str | None = None,
    ) -> dict:
        if await bruteforce_service.is_locked(payload.username, ip):
            await audit_service.log(
                action="LOGIN_BLOCKED",
                resource="auth",
                username=payload.username,
                ip_address=ip,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Try again later.",
            )

        user = await repo.get_by_username(db, payload.username)
        if not user:
            await bruteforce_service.register_failure(payload.username, ip)
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
            await bruteforce_service.register_failure(payload.username, ip)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        await bruteforce_service.register_success(payload.username, ip)

        user_payload = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
        }

        if user.totp_enabled:
            await audit_service.log(
                action="LOGIN_2FA_STEP",
                resource="auth",
                username=user.username,
                ip_address=ip,
            )
            return {
                "requires_2fa": True,
                "mfa_token": create_mfa_token(user.id),
                "user": user_payload,
            }

        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id, user.role)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "csrf_token": issue_csrf_token(user.id),
            "token_type": "bearer",
            "user": user_payload,
        }

    async def verify_2fa(
        self,
        db: AsyncSession,
        mfa_token: str,
        code: str,
    ) -> dict:
        payload = decode_token(mfa_token)
        if not payload or payload.get("type") != "mfa":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="2FA session expired. Log in again.",
            )

        user = await repo.get_by_id(db, int(payload["sub"]))
        if not user or not user.totp_enabled or not user.totp_secret:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="2FA is not enabled for this account",
            )

        import pyotp

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(code.strip(), valid_window=1):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid 2FA code",
            )

        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id, user.role)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "csrf_token": issue_csrf_token(user.id),
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

    async def setup_2fa(self, db: AsyncSession, user: User) -> dict:
        import pyotp

        if user.totp_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA is already enabled. Disable it first to regenerate.",
            )

        secret = pyotp.random_base32()
        user.totp_secret = secret
        await db.commit()

        uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.username,
            issuer_name="EnterpriseGuard WAF",
        )
        return {
            "secret": secret,
            "otpauth_uri": uri,
            "enabled": False,
        }

    async def enable_2fa(self, db: AsyncSession, user: User, code: str) -> dict:
        if not user.totp_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Request a setup secret first",
            )

        import pyotp

        if not pyotp.TOTP(user.totp_secret).verify(code.strip(), valid_window=1):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid 2FA code",
            )

        user.totp_enabled = True
        await db.commit()
        return {"enabled": True}

    async def disable_2fa(self, db: AsyncSession, user: User, code: str) -> dict:
        if not user.totp_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA is not enabled",
            )

        import pyotp

        if not user.totp_secret or not pyotp.TOTP(user.totp_secret).verify(
            code.strip(), valid_window=1
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid 2FA code",
            )

        user.totp_enabled = False
        user.totp_secret = None
        await db.commit()
        return {"enabled": False}

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
            "csrf_token": issue_csrf_token(user.id),
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

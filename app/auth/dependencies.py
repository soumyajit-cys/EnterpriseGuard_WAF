from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import decode_token
from app.auth.roles import (
    ADMIN,
    ANALYST,
    OPERATOR,
    VIEWER,
    SUPERADMIN,
    role_ge,
)
from app.core.database import get_db
from app.core.redis_client import redis_client
from app.models.user import User
from app.repositories.user_repository import UserRepository

security = HTTPBearer(auto_error=False)
repo = UserRepository()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = None
    if credentials is not None:
        token = credentials.credentials
    else:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = decode_token(token)
    user_id = payload.get("sub")
    token_type = payload.get("type")

    if not user_id or token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    blacklisted = await redis_client.get(f"token_blacklist:{token}")
    if blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )

    user = await repo.get_by_id(db, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


def require_role(required_role: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if not role_ge(current_user.role, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {required_role} or higher",
            )
        return current_user
    return role_checker


require_admin = lambda: require_role(ADMIN)
require_analyst = lambda: require_role(ANALYST)
require_operator = lambda: require_role(OPERATOR)
require_viewer = lambda: require_role(VIEWER)


def require_superadmin():
    """Platform role outside the org hierarchy: manages organizations,
    has no org-scoped data access."""

    async def superadmin_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != SUPERADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Requires role: superadmin",
            )
        return current_user

    return superadmin_checker
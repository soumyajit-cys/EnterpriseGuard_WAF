from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.core.client_ip import get_client_ip
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    ChangePasswordRequest,
    Verify2FARequest,
    CodeRequest,
    TokenResponse,
    AuthResponse,
    LoginResponse,
    UserResponse,
    MessageResponse,
)
from app.services.auth_service import auth_service
from app.services.rate_limit_service import RateLimitService
from app.services.audit_service import audit_service

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

login_rate_limit = RateLimitService()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=201,
    summary="Register a new user",
)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    return await auth_service.register(db, payload)


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login and receive JWT tokens (or a 2FA challenge)",
)
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    ip = get_client_ip(request)
    if not await login_rate_limit.check_login(ip):
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts from this IP. Try again later.",
        )
    return await auth_service.login(db, payload, ip)


@router.post(
    "/verify-2fa",
    response_model=AuthResponse,
    summary="Complete login with a 2FA code",
)
async def verify_2fa(
    payload: Verify2FARequest,
    db: AsyncSession = Depends(get_db),
):
    return await auth_service.verify_2fa(db, payload.mfa_token, payload.code)


@router.get(
    "/2fa/setup",
    summary="Generate a TOTP secret for the current user",
)
async def setup_2fa(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await auth_service.setup_2fa(db, current_user)
    await audit_service.log(
        action="2FA_SETUP",
        user_id=current_user.id,
        username=current_user.username,
        resource="auth",
        ip_address=None,
    )
    return result


@router.post(
    "/2fa/enable",
    summary="Enable 2FA after confirming a TOTP code",
)
async def enable_2fa(
    payload: CodeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await auth_service.enable_2fa(db, current_user, payload.code)
    await audit_service.log(
        action="2FA_ENABLED",
        user_id=current_user.id,
        username=current_user.username,
        resource="auth",
    )
    return result


@router.post(
    "/2fa/disable",
    summary="Disable 2FA after confirming a TOTP code",
)
async def disable_2fa(
    payload: CodeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await auth_service.disable_2fa(db, current_user, payload.code)
    await audit_service.log(
        action="2FA_DISABLED",
        user_id=current_user.id,
        username=current_user.username,
        resource="auth",
    )
    return result


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token using refresh token",
)
async def refresh(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    return await auth_service.refresh(db, payload)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout and revoke tokens",
)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    auth_header = request.headers.get("Authorization", "")
    access_token = auth_header.replace("Bearer ", "")
    refresh_token = request.headers.get("X-Refresh-Token", "")
    return await auth_service.logout(access_token, refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.put(
    "/change-password",
    response_model=MessageResponse,
    summary="Change current user password",
)
async def change_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await auth_service.change_password(db, current_user, payload)

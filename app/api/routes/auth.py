from fastapi import APIRouter, Depends, Request, Response, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.cookies import clear_auth_cookies, set_auth_cookies
from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.core.client_ip import get_client_ip
from app.core.csrf import issue_csrf_token
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    ChangePasswordRequest,
    Verify2FARequest,
    CodeRequest,
    CsrfTokenResponse,
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


def _user_payload(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "totp_enabled": user.totp_enabled,
    }


def _attach_session(response: Response, result: dict) -> dict:
    set_auth_cookies(
        response,
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
    )
    return {
        "csrf_token": result.get("csrf_token") or issue_csrf_token(result["user"]["id"]),
        "user": result["user"],
    }


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=201,
    summary="Register a new user",
)
async def register(
    response: Response,
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await auth_service.register(db, payload)
    return _attach_session(response, result)


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login and receive JWT tokens (or a 2FA challenge)",
)
async def login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    ip = get_client_ip(request)
    if not await login_rate_limit.check_login(ip):
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts from this IP. Try again later.",
        )
    result = await auth_service.login(db, payload, ip)
    if result.get("requires_2fa"):
        return result
    return _attach_session(response, result)


@router.post(
    "/verify-2fa",
    response_model=AuthResponse,
    summary="Complete login with a 2FA code",
)
async def verify_2fa(
    response: Response,
    payload: Verify2FARequest,
    db: AsyncSession = Depends(get_db),
):
    result = await auth_service.verify_2fa(db, payload.mfa_token, payload.code)
    return _attach_session(response, result)


@router.get(
    "/csrf",
    response_model=CsrfTokenResponse,
    summary="Issue a CSRF token for the authenticated session",
)
async def get_csrf_token(
    current_user: User = Depends(get_current_user),
):
    return {"csrf_token": issue_csrf_token(current_user.id)}


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
    response_model=CsrfTokenResponse,
    summary="Refresh access token using refresh token",
)
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Missing refresh token",
        )

    result = await auth_service.refresh(db, RefreshRequest(refresh_token=refresh_token))
    set_auth_cookies(
        response,
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
    )
    return {"csrf_token": result["csrf_token"]}


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout and revoke tokens",
)
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
):
    access_token = request.cookies.get("access_token", "")
    refresh_token = request.cookies.get("refresh_token", "")
    result = await auth_service.logout(access_token, refresh_token)
    clear_auth_cookies(response)
    return result


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
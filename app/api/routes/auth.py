from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    ChangePasswordRequest,
    TokenResponse,
    AuthResponse,
    UserResponse,
    MessageResponse,
)
from app.services.auth_service import auth_service

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


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
    response_model=AuthResponse,
    summary="Login and receive JWT tokens",
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    return await auth_service.login(db, payload)


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

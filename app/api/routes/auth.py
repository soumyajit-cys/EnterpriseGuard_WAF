from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from app.schemas.auth import (
    LoginRequest
)

from app.auth.jwt import (
    create_token
)

from app.auth.password import (
    verify_password
)

from app.repositories.user_repository import (
    UserRepository
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/login")
async def login(
    payload: LoginRequest
):

    db = None

    repo = UserRepository()

    user = await repo.get_by_username(
        db,
        payload.username
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    valid = verify_password(
        payload.password,
        user.password_hash
    )

    if not valid:

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_token(
        user.id,
        user.role
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }
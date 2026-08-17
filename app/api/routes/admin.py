from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_admin
from app.auth.password import hash_password
from app.core.database import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserOut, PaginatedUsers
from app.services.audit_service import audit_service

router = APIRouter(
    prefix="/users",
    tags=["User Management"],
)

repo = UserRepository()


@router.get("/", response_model=PaginatedUsers)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: str | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("id"),
    sort_desc: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    skip = (page - 1) * page_size
    users, total = await repo.get_all(
        db, current_user.organization_id, skip=skip, limit=page_size, role=role,
        search=search, sort_by=sort_by, sort_desc=sort_desc,
    )
    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    user = await repo.get_by_id(
        db, user_id, organization_id=current_user.organization_id
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", status_code=201, response_model=UserOut)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    existing = await repo.get_by_username(db, payload.username)
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")
    existing_email = await repo.get_by_email(db, payload.email)
    if existing_email:
        raise HTTPException(status_code=409, detail="Email already registered")

    password_hash_value = hash_password(payload.password)
    user = await repo.create(
        db,
        username=payload.username,
        email=payload.email,
        password_hash=password_hash_value,
        role=payload.role,
        organization_id=current_user.organization_id,
    )
    await audit_service.log(
        action="USER_CREATED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"user:{user.id}",
        details=f"Created user: {user.username}",
    )
    return user


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    user = await repo.update(
        db, user_id, organization_id=current_user.organization_id, **update_data
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await audit_service.log(
        action="USER_UPDATED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"user:{user_id}",
        details=f"Updated user: {user.username}",
    )
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    deleted = await repo.delete(
        db, user_id, organization_id=current_user.organization_id
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    await audit_service.log(
        action="USER_DELETED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"user:{user_id}",
        details=f"Deleted user ID: {user_id}",
    )

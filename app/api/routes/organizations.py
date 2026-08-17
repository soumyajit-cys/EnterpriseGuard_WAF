from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_superadmin
from app.core.database import get_db
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationOut,
    OrganizationUpdate,
)
from app.services.audit_service import audit_service

router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"],
)


@router.get("/", response_model=list[OrganizationOut])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superadmin()),
):
    rows = await db.execute(
        select(
            Organization,
            func.count(User.id).label("user_count"),
        )
        .outerjoin(User, User.organization_id == Organization.id)
        .group_by(Organization.id)
        .order_by(Organization.created_at.asc())
    )
    return [
        {
            "id": org.id,
            "name": org.name,
            "is_active": org.is_active,
            "created_at": org.created_at,
            "user_count": count or 0,
        }
        for org, count in rows
    ]


@router.post("/", status_code=201, response_model=OrganizationOut)
async def create_organization(
    payload: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superadmin()),
):
    existing = await db.execute(
        select(Organization).where(Organization.name == payload.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization name already exists",
        )

    org = Organization(name=payload.name, is_active=True)
    db.add(org)
    await db.commit()
    await db.refresh(org)

    await audit_service.log(
        action="ORG_CREATED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"organization:{org.id}",
        details=f"Created organization: {org.name}",
    )
    return {"id": org.id, "name": org.name, "is_active": True, "created_at": org.created_at, "user_count": 0}


@router.patch("/{org_id}", response_model=OrganizationOut)
async def update_organization(
    org_id: int,
    payload: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superadmin()),
):
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    if "name" in data:
        conflict = await db.execute(
            select(Organization).where(
                Organization.name == data["name"],
                Organization.id != org_id,
            )
        )
        if conflict.scalar_one_or_none():
            raise HTTPException(
                status_code=409,
                detail="Organization name already exists",
            )
        org.name = data["name"]
    if "is_active" in data:
        org.is_active = data["is_active"]
    await db.commit()
    await db.refresh(org)

    await audit_service.log(
        action="ORG_UPDATED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"organization:{org.id}",
        details=f"Updated organization: {org.name} (active={org.is_active})",
    )
    return {"id": org.id, "name": org.name, "is_active": org.is_active, "created_at": org.created_at, "user_count": 0}
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
import ipaddress

from app.core.database import get_db
from app.core.config import settings
from app.repositories.ip_repository import BlockedIPRepository, AllowedIPRepository
from app.auth.dependencies import require_admin, require_analyst
from app.models.user import User
from app.services.audit_service import audit_service
from app.services.runtime_sync import runtime_sync
from app.waf.runtime import waf_mode

router = APIRouter(
    prefix="/waf",
    tags=["WAF"],
)

blocked_repo = BlockedIPRepository()
allowed_repo = AllowedIPRepository()


def _validate_ip(ip: str) -> str:
    try:
        return str(ipaddress.ip_address(ip))
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid IP address: {ip}")


@router.get("/mode")
async def get_mode():
    return {"mode": waf_mode.get()}


@router.get("/blocklist")
async def list_blocked(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    permanent: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    skip = (page - 1) * page_size
    items, total = await blocked_repo.get_all(
        db, skip=skip, limit=page_size, search=search, permanent=permanent
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.post("/blocklist", status_code=201)
async def add_blocked_ip(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    ip = _validate_ip(payload["ip_address"])
    existing = await blocked_repo.get_by_ip(db, ip)
    if existing:
        raise HTTPException(status_code=409, detail="IP already blocked")

    expires_at = None
    if not payload.get("is_permanent") and payload.get("duration_hours"):
        try:
            hours = int(payload["duration_hours"])
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="duration_hours must be an integer")
        if hours <= 0:
            raise HTTPException(status_code=400, detail="duration_hours must be positive")
        expires_at = datetime.now() + timedelta(hours=hours)

    entry = await blocked_repo.create(
        db,
        ip_address=ip,
        reason=payload.get("reason"),
        is_permanent=payload.get("is_permanent", False),
        expires_at=expires_at,
    )
    await audit_service.log(
        action="IP_BLOCKED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"blocked_ip:{entry.id}",
        details=f"Blocked IP: {ip}",
    )
    await runtime_sync.sync_once()
    return entry


@router.delete("/blocklist/{ip_id}", status_code=204)
async def remove_blocked_ip(
    ip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    deleted = await blocked_repo.delete(db, ip_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Blocked IP not found")
    await audit_service.log(
        action="IP_UNBLOCKED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"blocked_ip:{ip_id}",
        details=f"Unblocked IP ID: {ip_id}",
    )
    await runtime_sync.sync_once()


@router.get("/allowlist")
async def list_allowed(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    skip = (page - 1) * page_size
    items, total = await allowed_repo.get_all(
        db, skip=skip, limit=page_size, search=search
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.post("/allowlist", status_code=201)
async def add_allowed_ip(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    ip = _validate_ip(payload["ip_address"])
    existing = await allowed_repo.get_by_ip(db, ip)
    if existing:
        raise HTTPException(status_code=409, detail="IP already allowed")

    entry = await allowed_repo.create(
        db, ip_address=ip, description=payload.get("description")
    )
    await audit_service.log(
        action="IP_ALLOWED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"allowed_ip:{entry.id}",
        details=f"Allowed IP: {ip}",
    )
    await runtime_sync.sync_once()
    return entry


@router.delete("/allowlist/{ip_id}", status_code=204)
async def remove_allowed_ip(
    ip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    deleted = await allowed_repo.delete(db, ip_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Allowed IP not found")
    await audit_service.log(
        action="IP_REMOVED_FROM_ALLOWLIST",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"allowed_ip:{ip_id}",
        details=f"Removed allowed IP ID: {ip_id}",
    )
    await runtime_sync.sync_once()


@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    from app.repositories.audit_repository import AuditLogRepository
    audit_repo = AuditLogRepository()
    skip = (page - 1) * page_size
    logs, total = await audit_repo.get_all(
        db, skip=skip, limit=page_size, action=action
    )
    return {
        "items": logs,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }

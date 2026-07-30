from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.alert_repository import AlertRepository
from app.auth.dependencies import require_analyst
from app.models.user import User

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"],
)

repo = AlertRepository()


@router.get("/")
async def get_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    severity: str | None = Query(None),
    resolved: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    skip = (page - 1) * page_size
    alerts, total = await repo.get_all(
        db,
        skip=skip,
        limit=page_size,
        severity=severity,
        resolved=resolved,
    )
    return {
        "items": alerts,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/stats")
async def get_alert_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    return await repo.get_stats(db)


@router.patch("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    alert = await repo.resolve(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.delete("/{alert_id}", status_code=204)
async def delete_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    deleted = await repo.delete(db, alert_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Alert not found")

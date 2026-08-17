from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.request_log import RequestLog
from app.auth.dependencies import require_analyst
from app.models.user import User

router = APIRouter(
    prefix="/requests",
    tags=["Request Logs"],
)


@router.get("/")
async def list_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    ip_address: str | None = Query(None),
    action: str | None = Query(None),
    attack_type: str | None = Query(None),
    search: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    sort_by: str = Query("created_at"),
    sort_desc: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    query = select(RequestLog).where(
        RequestLog.organization_id == current_user.organization_id
    )
    count_query = select(func.count(RequestLog.id)).where(
        RequestLog.organization_id == current_user.organization_id
    )

    conditions = []
    if ip_address:
        conditions.append(RequestLog.ip_address.ilike(f"%{ip_address}%"))
    if action:
        conditions.append(RequestLog.action == action.upper())
    if attack_type:
        conditions.append(RequestLog.attack_type.ilike(f"%{attack_type}%"))
    if start_date:
        conditions.append(RequestLog.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        conditions.append(RequestLog.created_at <= datetime.fromisoformat(end_date))
    if search:
        pattern = f"%{search}%"
        conditions.append(
            or_(
                RequestLog.ip_address.ilike(pattern),
                RequestLog.path.ilike(pattern),
                RequestLog.attack_type.ilike(pattern),
            )
        )

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    sort_col = getattr(RequestLog, sort_by, RequestLog.created_at)
    if sort_desc:
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size)
    result = await db.execute(query)
    logs = list(result.scalars().all())
    total = await db.scalar(count_query) or 0

    return {
        "items": logs,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/{log_id}")
async def get_request(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    log = await db.get(RequestLog, log_id)
    if not log or log.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Log not found")
    return log

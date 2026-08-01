from fastapi import APIRouter
from sqlalchemy import select, func, and_, cast, Integer
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.request_log import RequestLog
from app.models.alert import Alert
from app.models.rule import Rule

router = APIRouter(
    prefix="/public",
    tags=["Public"],
)


@router.get("/stats")
async def public_stats(db: AsyncSession = Depends(get_db)):
    now = datetime.now()
    since_24h = now - timedelta(hours=24)

    total = await db.scalar(select(func.count(RequestLog.id))) or 0
    blocked = await db.scalar(
        select(func.count(RequestLog.id)).where(RequestLog.action == "BLOCK")
    ) or 0
    alerts = await db.scalar(select(func.count(Alert.id))) or 0
    rules = await db.scalar(select(func.count(Rule.id))) or 0

    today = await db.scalar(
        select(func.count(RequestLog.id)).where(RequestLog.created_at >= since_24h)
    ) or 0
    blocked_today = await db.scalar(
        select(func.count(RequestLog.id)).where(
            and_(RequestLog.action == "BLOCK", RequestLog.created_at >= since_24h)
        )
    ) or 0

    threats = await db.execute(
        select(RequestLog.attack_type, func.count(RequestLog.id).label("count"))
        .where(
            and_(
                RequestLog.attack_type != None,
                RequestLog.attack_type != "",
            )
        )
        .group_by(RequestLog.attack_type)
        .order_by(func.count(RequestLog.id).desc())
        .limit(6)
    )

    return {
        "total_requests": total,
        "total_blocked": blocked,
        "total_alerts": alerts,
        "active_rules": rules,
        "requests_24h": today,
        "blocked_24h": blocked_today,
        "attack_rate_24h": round((blocked_today / today * 100) if today > 0 else 0, 1),
        "top_threats": [
            {"name": row[0] or "Unknown", "count": row[1]} for row in threats
        ],
    }

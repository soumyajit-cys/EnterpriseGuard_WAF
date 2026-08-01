from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, cast, Integer, text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.request_log import RequestLog
from app.models.alert import Alert
from app.auth.dependencies import require_analyst
from app.models.user import User

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)

SERVER_START = datetime.utcnow()


@router.get("/traffic")
async def traffic_analytics(
    period: str = Query("7d", regex="^(24h|7d|30d|live)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    now = datetime.utcnow()
    if period == "24h":
        since = now - timedelta(hours=24)
        trunc = "hour"
    elif period == "7d":
        since = now - timedelta(days=7)
        trunc = "day"
    elif period == "30d":
        since = now - timedelta(days=30)
        trunc = "day"
    else:
        since = SERVER_START
        trunc = "minute" if (now - SERVER_START).total_seconds() < 7200 else "hour"

    trunc_expr = func.date_trunc(text(f"'{trunc}'"), RequestLog.created_at).label("date")
    traffic = await db.execute(
        select(
            trunc_expr,
            func.count(RequestLog.id).label("requests"),
            func.sum(cast(RequestLog.action == "BLOCK", Integer)).label("blocked"),
            func.sum(cast(RequestLog.action == "ALLOW", Integer)).label("allowed"),
        )
        .where(RequestLog.created_at >= since)
        .group_by(trunc_expr)
        .order_by(trunc_expr)
    )

    attack_dist = await db.execute(
        select(RequestLog.attack_type, func.count(RequestLog.id).label("value"))
        .where(
            and_(
                RequestLog.attack_type != None,
                RequestLog.attack_type != "",
                RequestLog.created_at >= since,
            )
        )
        .group_by(RequestLog.attack_type)
        .order_by(func.count(RequestLog.id).desc())
        .limit(10)
    )

    top_ips = await db.execute(
        select(RequestLog.ip_address, func.count(RequestLog.id).label("count"))
        .where(
            and_(
                RequestLog.action == "BLOCK",
                RequestLog.created_at >= since,
            )
        )
        .group_by(RequestLog.ip_address)
        .order_by(func.count(RequestLog.id).desc())
        .limit(10)
    )

    return {
        "server_started": SERVER_START.isoformat(),
        "traffic_trend": [
            {
                "date": row[0].isoformat() if row[0] else "",
                "requests": row[1],
                "blocked": row[2] or 0,
                "allowed": row[3] or 0,
            }
            for row in traffic
        ],
        "attack_distribution": [
            {"name": row[0] or "Unknown", "value": row[1]} for row in attack_dist
        ],
        "top_ips": [{"ip": row[0], "count": row[1]} for row in top_ips],
    }


@router.get("/attacks")
async def attack_analytics(
    period: str = Query("7d", regex="^(24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    now = datetime.utcnow()
    if period == "24h":
        since = now - timedelta(hours=24)
    elif period == "7d":
        since = now - timedelta(days=7)
    else:
        since = now - timedelta(days=30)

    total = await db.scalar(
        select(func.count(RequestLog.id)).where(RequestLog.created_at >= since)
    ) or 0

    blocked = await db.scalar(
        select(func.count(RequestLog.id)).where(
            and_(RequestLog.action == "BLOCK", RequestLog.created_at >= since)
        )
    ) or 0

    alerts_count = await db.scalar(
        select(func.count(Alert.id)).where(Alert.created_at >= since)
    ) or 0

    by_type = await db.execute(
        select(Alert.severity, func.count(Alert.id).label("count"))
        .where(Alert.created_at >= since)
        .group_by(Alert.severity)
        .order_by(func.count(Alert.id).desc())
    )

    return {
        "total_requests": total,
        "total_blocked": blocked,
        "total_alerts": alerts_count,
        "block_rate": round((blocked / total * 100) if total > 0 else 0, 2),
        "alerts_by_severity": {row[0]: row[1] for row in by_type},
    }

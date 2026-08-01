from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, cast, Integer
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.auth.dependencies import require_analyst
from app.core.database import get_db
from app.models.request_log import RequestLog
from app.models.alert import Alert
from app.models.rule import Rule
from app.models.user import User

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats")
async def dashboard_stats(
    period: str = Query("24h", pattern="^(24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    now = datetime.now()
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

    allowed = total - blocked
    attack_rate = round((blocked / total * 100) if total > 0 else 0, 1)

    alerts_today = await db.scalar(
        select(func.count(Alert.id)).where(Alert.created_at >= since)
    ) or 0

    active_rules = await db.scalar(
        select(func.count(Rule.id)).where(Rule.enabled == True)
    ) or 0

    mode_result = await db.execute(
        select(RequestLog.attack_type, func.count(RequestLog.id).label("cnt"))
        .where(
            and_(
                RequestLog.attack_type.isnot(None),
                RequestLog.attack_type != "",
                RequestLog.created_at >= since,
            )
        )
        .group_by(RequestLog.attack_type)
        .order_by(func.count(RequestLog.id).desc())
        .limit(10)
    )
    threats_by_type = [
        {"name": row[0], "value": row[1]} for row in mode_result
    ]

    ip_result = await db.execute(
        select(RequestLog.ip_address, func.count(RequestLog.id).label("cnt"))
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
    top_attacker_ips = [
        {"ip": row[0], "count": row[1]} for row in ip_result
    ]

    rule_result = await db.execute(
        select(RequestLog.attack_type, func.count(RequestLog.id).label("cnt"))
        .where(
            and_(
                RequestLog.attack_type.isnot(None),
                RequestLog.attack_type != "",
                RequestLog.created_at >= since,
            )
        )
        .group_by(RequestLog.attack_type)
        .order_by(func.count(RequestLog.id).desc())
        .limit(10)
    )
    top_rules = [
        {"name": row[0], "count": row[1]} for row in rule_result
    ]

    # traffic by hour - SQLite compatible
    rows = await db.execute(
        select(RequestLog.created_at, RequestLog.action)
        .where(RequestLog.created_at >= since)
        .order_by(RequestLog.created_at)
    )
    hourly = {}
    for row in rows:
        hour_key = row[0].strftime("%Y-%m-%d %H:00") if row[0] else ""
        if hour_key not in hourly:
            hourly[hour_key] = {"time": hour_key, "requests": 0, "blocked": 0}
        hourly[hour_key]["requests"] += 1
        if row[1] == "BLOCK":
            hourly[hour_key]["blocked"] += 1

    traffic_last_24h = sorted(hourly.values(), key=lambda x: x["time"])[-24:]

    return {
        "requests_today": total,
        "blocked_today": blocked,
        "allowed_today": allowed,
        "alerts_today": alerts_today,
        "attack_rate": f"{attack_rate}%",
        "total_requests": total,
        "total_blocked": blocked,
        "total_alerts": alerts_today,
        "active_rules": active_rules,
        "mode": "detection",
        "threats_by_type": threats_by_type,
        "top_attacker_ips": top_attacker_ips,
        "top_rules": top_rules,
        "traffic_last_24h": traffic_last_24h,
    }

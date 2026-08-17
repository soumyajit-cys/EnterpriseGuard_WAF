from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, cast, Integer, text, or_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.request_log import RequestLog
from app.models.alert import Alert
from app.models.blocked_ip import BlockedIP
from app.auth.dependencies import require_analyst
from app.models.user import User

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)

SERVER_START = datetime.now()


@router.get("/overview")
async def analytics_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    org = current_user.organization_id
    total_requests = await db.scalar(
        select(func.count(RequestLog.id)).where(RequestLog.organization_id == org)
    ) or 0
    blocked = await db.scalar(
        select(func.count(RequestLog.id)).where(
            RequestLog.organization_id == org,
            RequestLog.action == "BLOCK",
        )
    ) or 0
    alerts = await db.scalar(
        select(func.count(Alert.id)).where(
            Alert.organization_id == org,
            Alert.resolved == False,
        )
    ) or 0
    blocked_ips = await db.scalar(
        select(func.count(BlockedIP.id)).where(
            BlockedIP.organization_id == org,
            BlockedIP.is_permanent == True,
        )
    ) or 0

    return {
        "total_requests": total_requests,
        "blocked": blocked,
        "alerts": alerts,
        "blocked_ips": blocked_ips,
    }


@router.get("/geo")
async def geo_analytics(
    hours: int = Query(24, ge=1, le=720),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    """Attack heatmap data: blocked requests grouped by country."""
    since = datetime.now() - timedelta(hours=hours)

    rows = await db.execute(
        select(
            RequestLog.country,
            RequestLog.attack_type,
            func.count(RequestLog.id).label("cnt"),
        )
        .where(
            and_(
                RequestLog.organization_id == current_user.organization_id,
                RequestLog.action == "BLOCK",
                RequestLog.created_at >= since,
                RequestLog.country.isnot(None),
            )
        )
        .group_by(RequestLog.country, RequestLog.attack_type)
        .order_by(func.count(RequestLog.id).desc())
    )

    countries: dict[str, dict] = {}
    for country, attack_type, cnt in rows:
        entry = countries.setdefault(
            country,
            {"country": country, "total": 0, "attacks": []},
        )
        entry["total"] += cnt
        entry["attacks"].append({"type": attack_type or "unknown", "count": cnt})

    return {
        "countries": list(countries.values()),
        "window_hours": hours,
    }


@router.get("/attackers")
async def attacker_dossiers(
    hours: int = Query(24, ge=1, le=720),
    limit: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    """Per-IP attacker dossiers: profiling, kill-chain status, tooling.

    Aggregates blocked requests into attacker profiles so analysts can see
    what each IP tried, in what order, and whether it escalated into a
    persistent kill-chain ban.
    """
    since = datetime.now() - timedelta(hours=hours)

    blocked_rows = await db.execute(
        select(
            RequestLog.ip_address,
            RequestLog.attack_type,
            RequestLog.created_at,
            RequestLog.path,
            RequestLog.score,
            RequestLog.user_agent,
        )
        .where(
            and_(
                RequestLog.organization_id == current_user.organization_id,
                RequestLog.action == "BLOCK",
                RequestLog.created_at >= since,
            )
        )
        .order_by(RequestLog.created_at.desc())
        .limit(2000)
    )

    total_rows = await db.execute(
        select(
            RequestLog.ip_address,
            func.count(RequestLog.id).label("cnt"),
        )
        .where(
            RequestLog.organization_id == current_user.organization_id,
            RequestLog.created_at >= since,
        )
        .group_by(RequestLog.ip_address)
    )

    ban_rows = await db.execute(
        select(BlockedIP.ip_address, BlockedIP.reason).where(
            BlockedIP.organization_id == current_user.organization_id,
            or_(
                BlockedIP.is_permanent.is_(True),
                BlockedIP.reason.like("killchain:%"),
            ),
        )
    )

    totals = {ip: cnt for ip, cnt in total_rows}
    bans = {}
    for ip, reason in ban_rows:
        bans[ip] = reason or "banned"

    profiles: dict[str, dict] = {}
    for ip, attack_type, created_at, path, score, user_agent in blocked_rows:
        profile = profiles.setdefault(
            ip,
            {
                "ip": ip,
                "blocks": 0,
                "threat_types": {},
                "first_seen": created_at,
                "last_seen": created_at,
                "paths": {},
                "max_score": 0,
                "user_agents": set(),
            },
        )
        profile["blocks"] += 1
        t = attack_type or "UNKNOWN"
        profile["threat_types"][t] = profile["threat_types"].get(t, 0) + 1
        profile["paths"][path] = profile["paths"].get(path, 0) + 1
        profile["max_score"] = max(profile["max_score"], score or 0)
        if created_at < profile["first_seen"]:
            profile["first_seen"] = created_at
        if created_at > profile["last_seen"]:
            profile["last_seen"] = created_at
        if user_agent:
            profile["user_agents"].add(user_agent)

    dossiers = []
    for ip, profile in profiles.items():
        threat_types = sorted(
            (
                {"type": t, "count": c}
                for t, c in profile["threat_types"].items()
            ),
            key=lambda x: x["count"],
            reverse=True,
        )
        distinct = len(threat_types)
        dossiers.append(
            {
                "ip": ip,
                "blocks": profile["blocks"],
                "total_requests": totals.get(ip, profile["blocks"]),
                "distinct_threats": distinct,
                "threat_types": threat_types,
                "top_paths": sorted(
                    (
                        {"path": p, "count": c}
                        for p, c in profile["paths"].items()
                    ),
                    key=lambda x: x["count"],
                    reverse=True,
                )[:5],
                "max_score": profile["max_score"],
                "first_seen": profile["first_seen"],
                "last_seen": profile["last_seen"],
                "kill_chain": distinct >= 3 or ip in bans,
                "banned": ip in bans,
                "ban_reason": bans.get(ip),
                "user_agents": list(profile["user_agents"])[:3],
                "country": None,
            }
        )

    dossiers.sort(key=lambda d: (d["kill_chain"], d["blocks"]), reverse=True)
    dossiers = dossiers[:limit]

    from app.services.geo_service import get_country

    import asyncio

    countries = await asyncio.gather(
        *(get_country(d["ip"]) for d in dossiers),
        return_exceptions=True,
    )
    for dossier, country in zip(dossiers, countries):
        dossier["country"] = country if isinstance(country, str) else None

    return {"dossiers": dossiers, "window_hours": hours}


@router.get("/attackers/{ip_address}")
async def attacker_dossier_detail(
    ip_address: str,
    hours: int = Query(24, ge=1, le=720),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    """Full timeline for a single attacker IP."""
    since = datetime.now() - timedelta(hours=hours)

    events = await db.execute(
        select(
            RequestLog.created_at,
            RequestLog.action,
            RequestLog.attack_type,
            RequestLog.path,
            RequestLog.score,
            RequestLog.status_code,
            RequestLog.user_agent,
            RequestLog.country,
        )
        .where(
            and_(
                RequestLog.organization_id == current_user.organization_id,
                RequestLog.ip_address == ip_address,
                RequestLog.created_at >= since,
            )
        )
        .order_by(RequestLog.created_at.desc())
        .limit(limit)
    )

    from app.services.geo_service import get_country

    timeline = [
        {
            "time": created_at,
            "action": action,
            "attack_type": attack_type,
            "path": path,
            "score": score,
            "status_code": status_code,
            "user_agent": user_agent,
            "country": country,
        }
        for created_at, action, attack_type, path, score, status_code, user_agent, country in events
    ]

    return {
        "ip": ip_address,
        "timeline": timeline,
        "country": timeline[0]["country"] if timeline else await get_country(ip_address),
    }


@router.get("/traffic")
async def traffic_analytics(
    period: str = Query("7d", regex="^(24h|7d|30d|live)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    now = datetime.now()
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
        .where(
            RequestLog.organization_id == current_user.organization_id,
            RequestLog.created_at >= since,
        )
        .group_by(trunc_expr)
        .order_by(trunc_expr)
    )

    attack_dist = await db.execute(
        select(RequestLog.attack_type, func.count(RequestLog.id).label("value"))
        .where(
            and_(
                RequestLog.organization_id == current_user.organization_id,
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
                RequestLog.organization_id == current_user.organization_id,
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
    now = datetime.now()
    if period == "24h":
        since = now - timedelta(hours=24)
    elif period == "7d":
        since = now - timedelta(days=7)
    else:
        since = now - timedelta(days=30)

    org = current_user.organization_id
    total = await db.scalar(
        select(func.count(RequestLog.id)).where(
            RequestLog.organization_id == org,
            RequestLog.created_at >= since,
        )
    ) or 0

    blocked = await db.scalar(
        select(func.count(RequestLog.id)).where(
            and_(
                RequestLog.organization_id == org,
                RequestLog.action == "BLOCK",
                RequestLog.created_at >= since,
            )
        )
    ) or 0

    alerts_count = await db.scalar(
        select(func.count(Alert.id)).where(
            Alert.organization_id == org,
            Alert.created_at >= since,
        )
    ) or 0

    by_type = await db.execute(
        select(Alert.severity, func.count(Alert.id).label("count"))
        .where(
            Alert.organization_id == org,
            Alert.created_at >= since,
        )
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

from fastapi import APIRouter, Depends
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


@router.post("/playground/test")
async def public_playground_test(payload: dict):
    """Public rule-testing playground (no auth) — powers shareable links.

    Mirrors the authenticated /waf/test endpoint so anyone can evaluate a
    payload against the detection engine without an account.
    """
    from app.waf.detector import Detector
    from app.waf.actions import should_block
    from app.waf.engine import get_severity
    from app.waf.runtime import waf_mode

    input_value = str(payload.get("input") or "")
    source = payload.get("source") or "query"

    class _PlaygroundRequest:
        pass

    request = _PlaygroundRequest()
    request.headers = {
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"
    }
    for header in ("content-length", "transfer-encoding"):
        if header in payload.get("headers", {}):
            request.headers[header] = str(payload["headers"][header])

    if source == "headers":
        request.headers["x-test-input"] = input_value

    request.query_params = {source: input_value} if source == "query" else {}
    request.url = type("_Url", (), {"path": str(payload.get("path") or (input_value if source == "path" else "/"))})()
    request.cookies = {}

    async def _body():
        body = payload.get("body") or (input_value if source == "body" else "")
        return str(body).encode()

    request.body = _body

    detector = Detector()
    findings = await detector.detect(request)
    max_score = max((f["score"] for f in findings), default=0)
    total_score = sum(f["score"] for f in findings)
    effective_score = min(max_score + (total_score - max_score) // 2, 100)
    block = should_block(effective_score)

    return {
        "input": input_value,
        "findings": findings,
        "effective_score": effective_score,
        "severity": get_severity(effective_score),
        "verdict": "BLOCK" if block else "ALLOW",
        "mode": waf_mode.get(),
    }


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

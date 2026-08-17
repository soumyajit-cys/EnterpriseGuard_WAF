from app.waf.detector import Detector
from app.waf.actions import should_block
from app.waf.rules.anomaly import anomaly_detector
from app.core.client_ip import get_client_ip
from app.services.alert_service import alert_service
from app.services.request_logger import request_logger
from app.services.traffic_stream import traffic_stream
from app.services.geo_service import get_country
from app.services.tenant_service import get_default_org_id
from app.services.metrics import (
    REQUESTS_TOTAL,
    BLOCKS_TOTAL,
    ALERTS_TOTAL,
    RULES_MATCHED,
    REQUEST_DURATION,
)

detector = Detector()

SEVERITY_MAP = {
    (0, 20): "low",
    (20, 50): "medium",
    (50, 80): "high",
    (80, 101): "critical",
}


def get_severity(score: int) -> str:
    for (low, high), severity in SEVERITY_MAP.items():
        if low <= score < high:
            return severity
    return "low"


class WAFEngine:

    async def _anomaly_score(self, request) -> int:
        """Structural anomaly signal: field size/entropy vs. the per
        route+field rolling baseline stored in Redis. Additive only —
        raises the score, never decides the verdict on its own. Fails
        open (0) when Redis is unavailable."""
        import time as _time

        try:
            body = (await request.body()).decode("utf-8", errors="ignore")
        except Exception:
            body = ""
        fields = {
            "path": str(request.url.path),
            "query": str(request.query_params),
            "body": body,
        }
        best = 0
        for field, value in fields.items():
            if not value:
                continue
            score = await anomaly_detector.score_and_update(
                request.url.path, field, value
            )
            if score > best:
                best = score
        return best

    async def inspect(self, request):
        import time as _time

        start = _time.monotonic()
        findings = await detector.detect(request)
        max_score = max((f["score"] for f in findings), default=0)
        total_score = sum(f["score"] for f in findings)
        anomaly_score = await self._anomaly_score(request)
        effective_score = min(
            max_score + (total_score - max_score) // 2 + anomaly_score // 2,
            100,
        )

        block = should_block(effective_score)
        ip = get_client_ip(request)
        action = "BLOCK" if block else "ALLOW"
        attack_types = [f["type"] for f in findings]

        for finding in findings:
            RULES_MATCHED.labels(
                rule_id=finding.get("rule", finding["type"]),
                category=finding["type"],
            ).inc()
        REQUESTS_TOTAL.labels(
            action=action,
            attack_type=",".join(attack_types) if attack_types else "none",
        ).inc()
        if block:
            BLOCKS_TOTAL.labels(reason=attack_types[0] if attack_types else "waf").inc()

        country = None
        if block:
            try:
                import asyncio

                country = await asyncio.wait_for(get_country(ip), timeout=1.5)
            except Exception:
                country = None

        organization_id = await get_default_org_id()

        await request_logger.log(
            ip=ip,
            path=request.url.path,
            action=action,
            organization_id=organization_id,
            score=effective_score,
            method=request.method,
            attack_type=",".join(attack_types) if attack_types else None,
            status_code=403 if block else None,
            user_agent=request.headers.get("user-agent"),
            country=country,
        )

        import time as _time

        REQUEST_DURATION.observe(_time.monotonic() - start)

        await traffic_stream.broadcast(
            {
                "event": "request",
                "id": f"req-{_time.time_ns()}",
                "timestamp": _time.time(),
                "ip_address": ip,
                "method": request.method,
                "path": request.url.path,
                "action": action,
                "score": effective_score,
                "attack_type": ",".join(attack_types) if attack_types else None,
                "status": 403 if block else 200,
                "user_agent": request.headers.get("user-agent"),
            }
        )

        severity = get_severity(effective_score)
        if findings and effective_score >= 30:
            ALERTS_TOTAL.labels(severity=severity).inc()
            await alert_service.create(
                severity=severity,
                message=f"{attack_types[0]} detected from {ip} on {request.url.path} (score: {effective_score})",
                source=attack_types[0] if attack_types else None,
                ip_address=ip,
                organization_id=organization_id,
            )

        return {
            "block": block,
            "reason": attack_types[0] if findings else None,
            "score": effective_score,
            "findings": findings,
        }


waf_engine = WAFEngine()

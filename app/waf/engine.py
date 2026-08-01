from app.waf.detector import Detector
from app.waf.actions import should_block
from app.services.alert_service import alert_service
from app.services.request_logger import request_logger
from app.services.traffic_stream import traffic_stream

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

    async def inspect(self, request):
        findings = await detector.detect(request)
        max_score = max((f["score"] for f in findings), default=0)
        total_score = sum(f["score"] for f in findings)
        effective_score = min(max_score + (total_score - max_score) // 2, 100)

        block = should_block(effective_score)
        ip = request.client.host
        action = "BLOCK" if block else "ALLOW"
        attack_types = [f["type"] for f in findings]

        await request_logger.log(
            ip=ip,
            path=request.url.path,
            action=action,
            score=effective_score,
            method=request.method,
            attack_type=",".join(attack_types) if attack_types else None,
            status_code=403 if block else None,
            user_agent=request.headers.get("user-agent"),
        )

        import time as _time

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
            await alert_service.create(
                severity=severity,
                message=f"{attack_types[0]} detected from {ip} on {request.url.path} (score: {effective_score})",
                source=attack_types[0] if attack_types else None,
                ip_address=ip,
            )

        return {
            "block": block,
            "reason": attack_types[0] if findings else None,
            "score": effective_score,
            "findings": findings,
        }


waf_engine = WAFEngine()

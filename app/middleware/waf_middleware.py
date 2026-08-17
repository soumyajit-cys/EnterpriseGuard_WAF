from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from app.waf.engine import waf_engine
from app.services.rate_limit_service import RateLimitService
from app.services.autoban_service import autoban
from app.waf.rules.blocklist import BlockList
from app.waf.rules.allowlist import AllowList
from app.waf.rules.csrf import CSRFValidator
from app.core.client_ip import get_client_ip
from app.services.request_logger import request_logger
from app.services.traffic_stream import traffic_stream
from app.services.tenant_service import get_default_org_id

rate_limit = RateLimitService()
csrf_validator = CSRFValidator()


async def _log_blocked_request(
    request,
    ip: str | None,
    reason: str,
    action: str,
):
    try:
        country = None
        if action == "BLOCK":
            try:
                import asyncio

                from app.services.geo_service import get_country

                country = await asyncio.wait_for(get_country(ip or "unknown"), timeout=1.5)
            except Exception:
                country = None
        organization_id = await get_default_org_id()
        await request_logger.log(
            ip=ip or "unknown",
            path=request.url.path,
            action=action,
            organization_id=organization_id,
            score=100 if action == "BLOCK" else 0,
            method=request.method,
            attack_type=reason,
            status_code=403 if action == "BLOCK" else 429,
            user_agent=request.headers.get("user-agent"),
            country=country,
        )
        await traffic_stream.broadcast(
            {
                "event": "blocked",
                "id": f"blk-{request.method}-{request.url.path}-{id(request)}",
                "ip_address": ip or "unknown",
                "method": request.method,
                "path": request.url.path,
                "action": action,
                "score": 100 if action == "BLOCK" else 0,
                "attack_type": reason,
                "status": 403 if action == "BLOCK" else 429,
            }
        )
        if action == "BLOCK":
            from app.services.metrics import BLOCKS_TOTAL

            BLOCKS_TOTAL.labels(reason=reason).inc()
            await autoban.record_block(ip or "unknown", reason, organization_id)
    except Exception:
        pass


class WAFMiddleware(BaseHTTPMiddleware):

    async def dispatch(
        self,
        request,
        call_next
    ):

        ip = get_client_ip(request)

        if request.url.path in ("/waf/test", "/public/playground/test"):
            allowed = await rate_limit.check_playground(ip)
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={
                        "status": "blocked",
                        "reason": "playground_rate_limit"
                    }
                )
            return await call_next(request)

        if AllowList.contains(ip):
            return await call_next(request)

        if BlockList.contains(ip):

            await _log_blocked_request(
                request,
                ip,
                "blocklist",
                "BLOCK",
            )

            return JSONResponse(
                status_code=403,
                content={
                    "status": "blocked",
                    "reason": "blocklist"
                }
            )

        allowed = await rate_limit.check(ip)

        if not allowed:

            await _log_blocked_request(
                request,
                ip,
                "rate_limit",
                "RATE_LIMIT",
            )

            return JSONResponse(
                status_code=429,
                content={
                    "status": "blocked",
                    "reason": "rate_limit"
                }
            )

        route_allowed = await rate_limit.check_route(ip, request.url.path)

        if not route_allowed:

            await _log_blocked_request(
                request,
                ip,
                "route_rate_limit",
                "RATE_LIMIT",
            )

            return JSONResponse(
                status_code=429,
                content={
                    "status": "blocked",
                    "reason": "route_rate_limit"
                }
            )

        csrf_valid = (
            await csrf_validator.validate(
                request
            )
        )

        if not csrf_valid:

            await _log_blocked_request(
                request,
                ip,
                "csrf",
                "BLOCK",
            )

            return JSONResponse(
                status_code=403,
                content={
                    "status": "blocked",
                    "reason": "csrf"
                }
            )

        decision = (
            await waf_engine.inspect(
                request
            )
        )

        if decision["block"]:

            try:
                await autoban.record_block(
                    ip or "unknown",
                    decision["reason"] or "waf",
                    await get_default_org_id(),
                )
            except Exception:
                pass

            return JSONResponse(
                status_code=403,
                content={
                    "status": "blocked",
                    "reason": decision[
                        "reason"
                    ]
                }
            )

        return await call_next(
            request
        )

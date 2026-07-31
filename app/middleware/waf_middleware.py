from starlette.middleware.base import (
    BaseHTTPMiddleware
)

from fastapi.responses import (
    JSONResponse
)

from app.waf.engine import waf_engine

from app.services.rate_limit_service import (
    RateLimitService
)

from app.services.request_logger import (
    request_logger
)

from app.waf.rules.blocklist import (
    BlockList
)

from app.waf.rules.allowlist import (
    AllowList
)

from app.waf.rules.csrf import (
    CSRFValidator
)


rate_limit = RateLimitService()

csrf_validator = CSRFValidator()


class WAFMiddleware(
    BaseHTTPMiddleware
):

    async def dispatch(
        self,
        request,
        call_next
    ):

        ip = request.client.host

        print(f"[WAF] dispatching {request.method} {request.url.path} from {ip}")

        if AllowList.contains(ip):
            return await call_next(request)

        if BlockList.contains(ip):

            await request_logger.log(
                ip=ip,
                path=request.url.path,
                method=request.method,
                action="BLOCK",
                score=100,
                attack_type="BLOCKLIST",
                status_code=403,
                user_agent=request.headers.get("User-Agent"),
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

            await request_logger.log(
                ip=ip,
                path=request.url.path,
                method=request.method,
                action="BLOCK",
                score=100,
                attack_type="RATE_LIMIT",
                status_code=429,
                user_agent=request.headers.get("User-Agent"),
            )

            return JSONResponse(
                status_code=429,
                content={
                    "status": "blocked",
                    "reason": "rate_limit"
                }
            )

        csrf_valid = (
            await csrf_validator.validate(
                request
            )
        )

        if not csrf_valid:

            await request_logger.log(
                ip=ip,
                path=request.url.path,
                method=request.method,
                action="BLOCK",
                score=70,
                attack_type="CSRF",
                status_code=403,
                user_agent=request.headers.get("User-Agent"),
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

            await request_logger.log(
                ip=ip,
                path=request.url.path,
                method=request.method,
                action="BLOCK",
                score=decision.get("score", 100),
                attack_type=decision.get("reason", "WAF"),
                status_code=403,
                user_agent=request.headers.get("User-Agent"),
            )

            return JSONResponse(
                status_code=403,
                content={
                    "status": "blocked",
                    "reason": decision[
                        "reason"
                    ]
                }
            )

        response = await call_next(
            request
        )

        await request_logger.log(
            ip=ip,
            path=request.url.path,
            method=request.method,
            action="ALLOW",
            score=decision.get("score", 0),
            attack_type=decision.get("attack_type") if decision.get("score", 0) > 0 else None,
            status_code=response.status_code,
            user_agent=request.headers.get("User-Agent"),
        )

        return response
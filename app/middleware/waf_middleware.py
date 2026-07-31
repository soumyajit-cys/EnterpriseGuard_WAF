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

        if AllowList.contains(ip):
            return await call_next(request)

        if BlockList.contains(ip):

            return JSONResponse(
                status_code=403,
                content={
                    "status": "blocked",
                    "reason": "blocklist"
                }
            )

        allowed = await rate_limit.check(ip)

        if not allowed:

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
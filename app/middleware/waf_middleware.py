from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse

from app.waf.engine import waf_engine


class WAFMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request, call_next):

        decision = await waf_engine.inspect(request)

        if decision["block"]:

            return JSONResponse(
                status_code=403,
                content={
                    "status": "blocked",
                    "reason": decision["reason"]
                }
            )

        return await call_next(request)
    

    
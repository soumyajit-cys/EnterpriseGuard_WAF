import time

from starlette.middleware.base import (
    BaseHTTPMiddleware
)

from app.core.logging import logger


class AuditMiddleware(
    BaseHTTPMiddleware
):

    async def dispatch(
        self,
        request,
        call_next
    ):

        start = time.time()

        response = await call_next(
            request
        )

        duration = (
            time.time() - start
        )

        logger.info({
            "event": "request",
            "path": request.url.path,
            "method": request.method,
            "status": response.status_code,
            "duration": duration
        })

        return response
    
    
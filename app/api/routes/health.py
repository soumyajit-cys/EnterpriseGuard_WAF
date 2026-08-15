from fastapi import APIRouter

from app.core.redis_client import redis_client

router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("/")
async def health():
    degraded = redis_client.degraded
    return {
        "status": "degraded" if degraded else "healthy",
        "version": "1.0.0",
        "redis": "down" if degraded else "up",
        "warnings": (
            ["Redis unavailable - rate limiting, autoban, and token "
             "revocation are inactive"]
            if degraded
            else []
        ),
    }
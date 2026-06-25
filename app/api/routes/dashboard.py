from fastapi import APIRouter


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
async def stats():

    return {
        "status": "online",
        "mode": "detection",
        "active_rules": [
            "SQLI",
            "XSS",
            "CSRF",
            "BOT",
            "RATE_LIMIT"
        ]
    }
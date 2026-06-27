from fastapi import APIRouter

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
async def dashboard_stats():

    return {
        "requests_today": 1250,
        "blocked_today": 87,
        "alerts_today": 12,
        "mode": "detection",
        "active_rules": 5
    }
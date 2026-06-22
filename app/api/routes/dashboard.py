from fastapi import APIRouter

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
async def stats():

    return {
        "total_requests": 0,
        "blocked_requests": 0,
        "alerts": 0
    }
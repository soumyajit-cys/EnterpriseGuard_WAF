from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(
    prefix="/waf",
    tags=["WAF"]
)


@router.get("/mode")
async def get_mode():

    return {
        "mode": settings.WAF_MODE
    }


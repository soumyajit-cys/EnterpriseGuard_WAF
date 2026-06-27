from fastapi import APIRouter
from fastapi import Depends

from app.auth.dependencies import (
    require_admin
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/health")
async def admin_health(
    user=Depends(
        require_admin()
    )
):

    return {
        "status": "ok"
    }
from fastapi import APIRouter

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


@router.get("/")
async def list_alerts():

    return {
        "alerts": []
    }


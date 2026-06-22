from fastapi import APIRouter

router = APIRouter(
    prefix="/rules",
    tags=["Rules"]
)


@router.get("/")
async def list_rules():

    return []
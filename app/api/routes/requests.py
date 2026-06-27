from fastapi import APIRouter

router = APIRouter(
    prefix="/requests",
    tags=["Requests"]
)


@router.get("/")
async def list_requests():

    return {
        "requests": []
    }
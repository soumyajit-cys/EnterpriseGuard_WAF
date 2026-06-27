from fastapi import APIRouter

router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)

WAF_MODE = {
    "mode": "detection"
}


@router.get("/mode")
async def get_mode():

    return WAF_MODE


@router.put("/mode/{mode}")
async def update_mode(
    mode: str
):

    if mode not in [
        "detection",
        "prevention"
    ]:

        return {
            "error": "invalid mode"
        }

    WAF_MODE["mode"] = mode

    return WAF_MODE


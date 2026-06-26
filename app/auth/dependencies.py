from fastapi import Depends
from fastapi import HTTPException

from fastapi.security import (
    HTTPBearer
)

security = HTTPBearer()


async def get_current_user():

    return {
        "id": 1,
        "role": "admin"
    }


def require_admin():

    async def dependency():

        user = await get_current_user()

        if user["role"] != "admin":

            raise HTTPException(
                status_code=403,
                detail="Forbidden"
            )

        return user

    return dependency
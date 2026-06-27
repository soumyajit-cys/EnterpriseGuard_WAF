from jose import jwt
from jose import JWTError

from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import HTTPBearer

from app.core.config import settings

security = HTTPBearer()

ALGORITHM = "HS256"


async def get_current_user(credentials=Depends(security)):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return {
            "id": payload["sub"],
            "role": payload["role"]
        }

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
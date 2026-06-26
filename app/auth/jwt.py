from jose import jwt

from datetime import datetime
from datetime import timedelta

from app.core.config import settings

ALGORITHM = "HS256"


def create_token(
    user_id: int,
    role: str
):

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.utcnow()
        + timedelta(hours=8)
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=ALGORITHM
    )
from jose import jwt, JWTError

from datetime import datetime, timedelta
from typing import Optional

from app.core.config import settings

ALGORITHM = settings.ALGORITHM


def create_access_token(
    user_id: int,
    role: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(
    user_id: int,
    role: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    expire = datetime.utcnow() + (
        expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "refresh",
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return {}


def create_token(
    user_id: int,
    role: str
) -> str:
    return create_access_token(user_id, role)

from fastapi import Request

from app.core.config import settings


def get_client_ip(request: Request) -> str | None:
    """Resolve the real client IP.

    X-Forwarded-For is only honored when the request arrived directly from
    a configured trusted reverse proxy (TRUSTED_PROXIES). Otherwise the
    raw socket peer is used, so clients cannot spoof their IP by setting
    the header themselves.
    """
    peer = request.client.host if request.client else None
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded and peer in settings.TRUSTED_PROXIES:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    return peer
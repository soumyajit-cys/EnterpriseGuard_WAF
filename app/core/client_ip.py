from fastapi import Request


def get_client_ip(request: Request) -> str | None:
    """Resolve the real client IP, honoring X-Forwarded-For when present."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    return request.client.host if request.client else None

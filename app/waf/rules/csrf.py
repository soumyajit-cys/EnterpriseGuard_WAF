from fastapi import Request

from app.auth.jwt import decode_token
from app.core.config import settings
from app.core.csrf import validate_csrf_token


SAFE_METHODS = {
    "GET",
    "HEAD",
    "OPTIONS",
}

CSRF_EXEMPT_PATHS = {
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
    "/auth/verify-2fa",
    "/public/playground/test",
    "/waf/test",
}


class CSRFValidator:

    async def validate(self, request: Request):

        if request.method in SAFE_METHODS:
            return True

        if request.url.path in CSRF_EXEMPT_PATHS:
            return True

        origin = request.headers.get("Origin") or request.headers.get("Referer")
        if origin:
            host = request.headers.get("Host", "")
            from urllib.parse import urlparse

            parsed = urlparse(origin)
            if parsed.hostname and parsed.hostname != host.split(":")[0]:
                # Cross-origin deployments (e.g. a Vercel frontend calling
                # the Render API) send Origin = frontend domain, which never
                # matches the API Host. Only allow origins explicitly listed
                # in CORS_ORIGINS — everything else stays rejected.
                netloc = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
                allowed = {f"{o.rstrip('/')}" for o in settings.CORS_ORIGINS}
                if netloc not in allowed:
                    return False

        token = request.headers.get("X-CSRF-Token")
        if not token:
            return False

        user_id = self._session_user_id(request)
        if user_id is not None:
            return validate_csrf_token(token, user_id)

        return len(token) >= 32

    @staticmethod
    def _session_user_id(request: Request) -> int | None:
        token = request.cookies.get("access_token")
        if not token:
            return None
        payload = decode_token(token)
        sub = payload.get("sub")
        if payload.get("type") != "access" or not sub:
            return None
        try:
            return int(sub)
        except (TypeError, ValueError):
            return None
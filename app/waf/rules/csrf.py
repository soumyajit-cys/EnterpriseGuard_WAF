from fastapi import Request


SAFE_METHODS = {
    "GET",
    "HEAD",
    "OPTIONS",
}


class CSRFValidator:

    async def validate(self, request: Request):

        if request.method in SAFE_METHODS:
            return True

        origin = request.headers.get("Origin") or request.headers.get("Referer")
        if origin:
            host = request.headers.get("Host", "")
            from urllib.parse import urlparse

            parsed = urlparse(origin)
            if parsed.hostname and parsed.hostname != host.split(":")[0]:
                return False

        token = request.headers.get(
            "X-CSRF-Token"
        )

        if not token:
            return False

        return len(token) >= 32

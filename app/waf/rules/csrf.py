from fastapi import Request


SAFE_METHODS = {
    "GET",
    "HEAD",
    "OPTIONS"
}


class CSRFValidator:

    async def validate(self, request: Request):

        if request.method in SAFE_METHODS:
            return True

        token = request.headers.get(
            "X-CSRF-Token"
        )

        if not token:
            return False

        return len(token) >= 32
    
    
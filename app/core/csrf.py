"""Server-issued, HMAC-signed CSRF tokens.

Tokens are bound to the authenticated user id and expire after
CSRF_TOKEN_TTL_SECONDS. Because they are signed with the server secret,
they can be validated statelessly (no session store) while remaining
unguessable by cross-site attackers, who also cannot read them due to
same-origin policy.
"""

import base64
import hashlib
import hmac
import time

from app.core.config import settings

CSRF_TOKEN_TTL_SECONDS = 24 * 60 * 60
_CSRF_VALIDITY_WINDOW = 60


def issue_csrf_token(user_id: int) -> str:
    issued_at = int(time.time())
    payload = f"{user_id}:{issued_at}"
    signature = _sign(payload)
    return base64.urlsafe_b64encode(f"{payload}.{signature}".encode()).decode()


def validate_csrf_token(token: str, user_id: int) -> bool:
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        payload, signature = raw.rsplit(".", 1)
        expected = _sign(payload)
        if not hmac.compare_digest(signature, expected):
            return False
        token_user_id, issued_at = payload.split(":", 1)
        if int(token_user_id) != user_id:
            return False
        age = int(time.time()) - int(issued_at)
        return 0 <= age <= CSRF_TOKEN_TTL_SECONDS + _CSRF_VALIDITY_WINDOW
    except (ValueError, TypeError, base64.binascii.Error):
        return False


def _sign(payload: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
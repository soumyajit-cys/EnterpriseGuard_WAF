from fastapi import Response

from app.core.config import settings


def _samesite() -> str:
    # Cross-origin deployments (e.g. Vercel frontend + Render API) must
    # send cookies on cross-site requests, which requires SameSite=None
    # and, per browser rules, a Secure cookie. Local dev stays Lax.
    return "none" if settings.COOKIE_SECURE else "lax"


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=_samesite(),
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=_samesite(),
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
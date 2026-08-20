"""Cross-origin CSRF origin validation.

The dashboard frontend (e.g. a Vercel app) is a different origin from the
API (e.g. Render). The CSRF validator must allow state-changing requests
whose Origin is listed in CORS_ORIGINS while rejecting everything else.
"""

import asyncio

import pytest

from app.core.config import settings
from app.waf.rules.csrf import CSRFValidator

_TEST_ORIGINS = ["https://dashboard.example.com"]


@pytest.fixture(autouse=True)
def _patch_origins(monkeypatch):
    monkeypatch.setattr(settings, "CORS_ORIGINS", _TEST_ORIGINS)


class _Request:
    def __init__(self, origin: str | None, host: str, method: str = "POST"):
        self._origin = origin
        self._host = host
        self._method = method

    @property
    def method(self) -> str:
        return self._method

    @property
    def url(self):
        return type("_Url", (), {"path": "/rules/1/toggle"})()

    @property
    def headers(self):
        headers = {"Host": self._host}
        if self._origin:
            headers["Origin"] = self._origin
        if self._method not in ("GET", "HEAD", "OPTIONS"):
            headers["X-CSRF-Token"] = "x" * 40
        return headers

    @property
    def cookies(self):
        return {}


def _validate(origin: str | None, host: str, method: str = "POST") -> bool:
    return asyncio.run(CSRFValidator().validate(_Request(origin, host, method)))


def test_same_origin_allowed():
    assert _validate("http://localhost:3000", "localhost:8000") is True


def test_configured_cross_origin_allowed():
    assert _validate(
        "https://dashboard.example.com", "api.example.com"
    ) is True


def test_unknown_cross_origin_rejected():
    assert _validate("https://evil.example.com", "api.example.com") is False


def test_referer_from_configured_origin_allowed():
    assert _validate("https://dashboard.example.com/path", "api.example.com") is True


def test_safe_method_skips_origin_check():
    assert _validate("https://evil.example.com", "api.example.com", "GET") is True
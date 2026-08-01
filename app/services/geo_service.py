import json

import httpx

from app.core.redis_client import redis_client
from app.settings import settings

CACHE_TTL = 86400 * 7

_LOCAL_NETS = ("127.0.0.1", "::1", "localhost")


def _is_private(ip: str) -> bool:
    if not ip or ip in _LOCAL_NETS:
        return True
    try:
        import ipaddress

        return ipaddress.ip_address(ip).is_private
    except ValueError:
        return True


def get_country(ip: str) -> str:
    """Best-effort, fully fail-open geolocation with 7-day Redis cache.

    Falls back to ipinfo.io (no token needed for low volume), then ipapi.co.
    Never raises; returns None on any failure.
    """
    if _is_private(ip):
        return None

    cache_key = f"geo:{ip}"
    try:
        cached = redis_client.get_sync(cache_key)
        if cached:
            return cached if cached != "unknown" else None
    except Exception:
        pass

    providers = []
    token = getattr(settings, "IPINFO_TOKEN", None)
    if token:
        providers.append(f"https://ipinfo.io/{ip}/json?token={token}")
    providers.append(f"https://ipinfo.io/{ip}/json")
    providers.append(f"https://ipapi.co/{ip}/json/")

    country = None
    for url in providers:
        try:
            resp = httpx.get(url, timeout=3)
            if resp.status_code != 200:
                continue
            data = resp.json()
            country = (
                data.get("country")
                or data.get("country_name")
                or data.get("countryCode")
            )
            if country:
                break
        except Exception:
            continue

    try:
        value = country or "unknown"
        redis_client.set_sync(cache_key, value, ex=CACHE_TTL)
    except Exception:
        pass

    return country

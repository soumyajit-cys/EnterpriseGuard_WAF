import ipaddress

import httpx

from app.core.redis_client import redis_client

CACHE_TTL = 86400 * 7

GEO_PROVIDERS = (
    "https://ipapi.co/{ip}/json/",
    "https://ipinfo.io/{ip}/json",
)


def _is_private(ip: str) -> bool:
    if not ip or ip in ("127.0.0.1", "::1", "localhost"):
        return True
    try:
        return ipaddress.ip_address(ip).is_private
    except ValueError:
        return True


async def get_country(ip: str) -> str | None:
    """Best-effort, fully fail-open geolocation with 7-day Redis cache.

    Falls back to ipinfo.io (no token needed for low volume), then ipapi.co.
    Never raises; returns None on any failure.
    """
    if _is_private(ip):
        return None

    cache_key = f"geo:{ip}"
    try:
        cached = await redis_client.get(cache_key)
        if cached:
            return cached if cached != "unknown" else None
    except Exception:
        pass

    providers = [url.format(ip=ip) for url in GEO_PROVIDERS]

    country = None
    async with httpx.AsyncClient(timeout=3) as client:
        for url in providers:
            try:
                resp = await client.get(url)
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
        await redis_client.setex(cache_key, CACHE_TTL, country or "unknown")
    except Exception:
        pass

    return country

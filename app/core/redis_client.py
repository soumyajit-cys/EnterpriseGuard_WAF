import logging
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger("waf.redis")


def _build_client():
    return redis.from_url(settings.REDIS_URL, decode_responses=True)


class SafeRedis:
    """Redis wrapper that degrades gracefully when Redis is unavailable.

    All operations fail-open (return None / False / 0) and log a warning
    once per outage so the WAF never becomes a self-DoS when Redis dies.
    """

    def __init__(self):
        self._client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self._reported_down = False

    @property
    def degraded(self) -> bool:
        return self._reported_down

    def _reconnect(self):
        try:
            self._client = _build_client()
        except Exception:
            pass

    def _ok(self, result):
        if self._reported_down:
            self._reported_down = False
            logger.info("Redis connection restored")
            try:
                from app.services.alert_service import alert_service
                import asyncio

                asyncio.create_task(
                    alert_service.create(
                        severity="info",
                        message="Redis connection restored - WAF protections back to full strength",
                        source="WAF_DEGRADED",
                    )
                )
            except Exception:
                pass
        return result

    def _degraded(self, exc: Exception):
        if not self._reported_down:
            self._reported_down = True
            logger.warning(f"Redis unavailable, failing open: {exc}")
            try:
                from app.services.metrics import REDIS_DOWN

                REDIS_DOWN.inc()
            except Exception:
                pass
            try:
                from app.services.alert_service import alert_service
                import asyncio

                asyncio.create_task(
                    alert_service.create(
                        severity="critical",
                        message="Redis unavailable - WAF degraded: rate limiting, autoban, and token revocation are inactive",
                        source="WAF_DEGRADED",
                    )
                )
            except Exception:
                pass
        try:
            self._reconnect()
        except Exception:
            pass
        return None

    async def get(self, key):
        try:
            return self._ok(await self._client.get(key))
        except Exception as exc:
            return self._degraded(exc)

    async def setex(self, key, seconds, value):
        try:
            return self._ok(await self._client.setex(key, seconds, value))
        except Exception as exc:
            return self._degraded(exc)

    async def incr(self, key):
        try:
            return self._ok(await self._client.incr(key))
        except Exception as exc:
            self._degraded(exc)
            return 0

    async def expire(self, key, seconds):
        try:
            return self._ok(await self._client.expire(key, seconds))
        except Exception as exc:
            return self._degraded(exc)

    async def setnx(self, key, value):
        try:
            return self._ok(await self._client.setnx(key, value))
        except Exception as exc:
            self._degraded(exc)
            return False

    async def ttl(self, key):
        try:
            return self._ok(await self._client.ttl(key))
        except Exception as exc:
            self._degraded(exc)
            return -1

    async def pipeline(self):
        try:
            return await self._client.pipeline()
        except Exception as exc:
            self._degraded(exc)
            return None

    async def ping(self):
        try:
            return bool(self._ok(await self._client.ping()))
        except Exception as exc:
            self._degraded(exc)
            return False


redis_client = SafeRedis()

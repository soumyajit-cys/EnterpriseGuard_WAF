from datetime import datetime, timedelta

from app.core.redis_client import redis_client

THRESHOLD = 5

WINDOW_SECONDS = 300

AUTO_BAN_SECONDS = 3600


class AutoBanService:
    """Tracks blocked-request counts per IP and auto-adds repeat offenders
    to the persistent blocklist after THRESHOLD blocks within a window."""

    async def record_block(
        self,
        ip: str,
        reason: str,
    ) -> bool:
        """Returns True if the IP crossed the auto-ban threshold."""
        if not ip or ip in ("127.0.0.1", "::1"):
            return False

        key = f"autoban:{ip}"
        count = await redis_client.incr(key)
        if count == 1:
            await redis_client.expire(key, WINDOW_SECONDS)
        elif count >= THRESHOLD:
            await redis_client.expire(key, 1)
            await self._persist_ban(ip, reason)
            return True
        return False

    async def _persist_ban(self, ip: str, reason: str):
        try:
            from app.core.database import AsyncSessionLocal
            from app.repositories.ip_repository import BlockedIPRepository
            from app.services.runtime_sync import runtime_sync

            async with AsyncSessionLocal() as db:
                repo = BlockedIPRepository()
                existing = await repo.get_by_ip(db, ip)
                if existing:
                    return
                await repo.create(
                    db,
                    ip_address=ip,
                    reason=f"AUTO-BAN: {reason}",
                    is_permanent=False,
                    expires_at=datetime.now() + timedelta(seconds=AUTO_BAN_SECONDS),
                )
            await runtime_sync.sync_once()
            print(f"[WAF] AUTO-BAN: {ip} blocked for {AUTO_BAN_SECONDS}s ({reason})")
        except Exception as exc:
            print(f"[WAF] Auto-ban failed for {ip}: {exc}")


autoban = AutoBanService()

from datetime import datetime, timedelta

from app.core.redis_client import redis_client

THRESHOLD = 5

WINDOW_SECONDS = 300

AUTO_BAN_SECONDS = 3600

KILLCHAIN_DISTINCT_TYPES = 3

KILLCHAIN_MIN_BLOCKS = 2


class AutoBanService:
    """Tracks blocked-request counts per IP and auto-adds repeat offenders
    to the persistent blocklist after THRESHOLD blocks within a window.
    Also escalates kill-chain behavior: 3+ distinct attack types from the
    same IP within the window trigger an immediate ban."""

    async def record_block(
        self,
        ip: str,
        reason: str,
        organization_id: int | None,
    ) -> bool:
        """Returns True if the IP crossed the auto-ban threshold."""
        if not ip or ip in ("127.0.0.1", "::1"):
            return False

        key = f"autoban:{ip}"
        types_key = f"autoban_types:{ip}"
        count = await redis_client.incr(key)
        if count == 1:
            await redis_client.expire(key, WINDOW_SECONDS)
            await redis_client.expire(types_key, WINDOW_SECONDS)

        distinct = await redis_client.sadd(types_key, reason or "waf")

        killchain = (
            count >= KILLCHAIN_MIN_BLOCKS
            and distinct >= KILLCHAIN_DISTINCT_TYPES
        )

        if killchain:
            await redis_client.expire(key, 1)
            await self._persist_ban(ip, f"killchain:{reason}", organization_id)
            await self._notify_killchain(ip, count, distinct, organization_id)
            return True

        if count >= THRESHOLD:
            await redis_client.expire(key, 1)
            await self._persist_ban(ip, reason, organization_id)
            return True
        return False

    async def _notify_killchain(
        self, ip: str, blocks: int, distinct: int, organization_id: int | None
    ):
        try:
            from app.services.alert_service import alert_service

            await alert_service.create(
                severity="critical",
                message=(
                    f"Kill-chain escalation: {ip} triggered {distinct} distinct "
                    f"attack classes across {blocks} blocked requests — auto-banned."
                ),
                source="killchain",
                ip_address=ip,
                organization_id=organization_id,
            )
        except Exception as exc:
            print(f"[WAF] Kill-chain alert failed for {ip}: {exc}")

    async def _persist_ban(
        self, ip: str, reason: str, organization_id: int | None
    ):
        try:
            from app.core.database import AsyncSessionLocal
            from app.repositories.ip_repository import BlockedIPRepository
            from app.services.runtime_sync import runtime_sync

            if organization_id is None:
                return
            async with AsyncSessionLocal() as db:
                repo = BlockedIPRepository()
                existing = await repo.get_by_ip(db, organization_id, ip)
                if existing:
                    return
                await repo.create(
                    db,
                    organization_id=organization_id,
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

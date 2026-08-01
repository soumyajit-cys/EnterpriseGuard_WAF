import asyncio
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.models.blocked_ip import BlockedIP
from app.models.allowed_ip import AllowedIP
from app.models.waf_setting import WAFSetting
from app.waf.rules.blocklist import BlockList
from app.waf.rules.allowlist import AllowList
from app.waf.runtime import waf_mode

SYNC_INTERVAL_SECONDS = 30


class RuntimeSyncService:

    def __init__(self):
        self._task = None

    async def _purge_expired(self):
        from datetime import datetime
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(BlockedIP).where(
                    BlockedIP.is_permanent == False,
                    BlockedIP.expires_at != None,
                    BlockedIP.expires_at <= datetime.now(),
                )
            )
            expired = list(result.scalars().all())
            for entry in expired:
                await db.delete(entry)
            if expired:
                await db.commit()
                print(f"[WAF] Purged {len(expired)} expired blocked IPs")

    async def sync_once(self):
        from datetime import datetime

        blocked = set()
        allowed = set()

        try:
            async with AsyncSessionLocal() as db:
                blocked_rows = await db.execute(select(BlockedIP))
                for entry in blocked_rows.scalars().all():
                    if entry.is_permanent:
                        blocked.add(entry.ip_address)
                    elif entry.expires_at and entry.expires_at > datetime.now():
                        blocked.add(entry.ip_address)

                allowed_rows = await db.execute(select(AllowedIP))
                for entry in allowed_rows.scalars().all():
                    allowed.add(entry.ip_address)

                mode_row = await db.execute(
                    select(WAFSetting).where(WAFSetting.key == "waf_mode")
                )
                mode = mode_row.scalar_one_or_none()
                if mode and mode.value in ("detection", "prevention"):
                    waf_mode.set(mode.value)
        except Exception as exc:
            print(f"[WAF] Runtime sync failed: {exc}")

        BlockList.BLOCKED_IPS = blocked
        AllowList.ALLOWED_IPS = allowed | {"::1"}
        print(
            f"[WAF] Runtime synced: {len(blocked)} blocked, {len(allowed)} allowed, "
            f"mode={waf_mode.get()}"
        )

        await self._purge_expired()

    async def _run_loop(self):
        while True:
            try:
                await self.sync_once()
            except Exception as exc:
                print(f"[WAF] Sync loop error: {exc}")
            await asyncio.sleep(SYNC_INTERVAL_SECONDS)

    async def start(self):
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        if self._task:
            self._task.cancel()
            self._task = None


runtime_sync = RuntimeSyncService()

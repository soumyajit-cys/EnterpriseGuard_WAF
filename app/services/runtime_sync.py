import asyncio
import re
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.models.blocked_ip import BlockedIP
from app.models.allowed_ip import AllowedIP
from app.models.rule import Rule
from app.models.waf_setting import WAFSetting
from app.waf.rules.blocklist import BlockList
from app.waf.rules.allowlist import AllowList
from app.waf.runtime import waf_mode

SYNC_INTERVAL_SECONDS = 30


class CustomRuleSet:
    """Compiled custom rules loaded from the rules table."""

    def __init__(self):
        self._rules: list[dict] = []

    def load(self, rows):
        rules = []
        for row in rows:
            if not row.pattern or not row.enabled:
                continue
            try:
                regex = re.compile(row.pattern, re.IGNORECASE)
            except re.error:
                continue
            rules.append(
                {
                    "id": row.id,
                    "name": row.name,
                    "regex": regex,
                    "score": max(min(row.priority or 50, 100), 1),
                    "category": row.category or "CUSTOM_RULE",
                }
            )
        self._rules = rules

    def match(self, text: str) -> list[dict]:
        hits = []
        for rule in self._rules:
            if rule["regex"].search(text):
                hits.append(
                    {
                        "type": f"CUSTOM:{rule['category']}",
                        "score": rule["score"],
                        "source": "custom_rule",
                        "rule": rule["name"],
                    }
                )
        return hits

    def count(self) -> int:
        return len(self._rules)


custom_rules = CustomRuleSet()


class RuntimeSyncService:

    def __init__(self):
        self._task = None

    async def _purge_expired(self):
        from datetime import datetime, timezone
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(BlockedIP).where(
                    BlockedIP.is_permanent == False,
                    BlockedIP.expires_at != None,
                    BlockedIP.expires_at <= datetime.now(timezone.utc),
                )
            )
            expired = list(result.scalars().all())
            for entry in expired:
                await db.delete(entry)
            if expired:
                await db.commit()
                print(f"[WAF] Purged {len(expired)} expired blocked IPs")

    async def sync_once(self):
        from datetime import datetime, timezone

        blocked = set()
        allowed = set()

        try:
            async with AsyncSessionLocal() as db:
                blocked_rows = await db.execute(select(BlockedIP))
                for entry in blocked_rows.scalars().all():
                    if entry.is_permanent:
                        blocked.add(entry.ip_address)
                    elif entry.expires_at and entry.expires_at > datetime.now(timezone.utc):
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

                rule_rows = await db.execute(
                    select(Rule).where(Rule.enabled == True)
                )
                custom_rules.load(rule_rows.scalars().all())
        except Exception as exc:
            print(f"[WAF] Runtime sync failed: {exc}")

        BlockList.BLOCKED_IPS = blocked
        AllowList.ALLOWED_IPS = allowed | {"::1"}
        print(
            f"[WAF] Runtime synced: {len(blocked)} blocked, {len(allowed)} allowed, "
            f"mode={waf_mode.get()}, custom_rules={custom_rules.count()}"
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
            try:
                await self._task
            except (asyncio.CancelledError, Exception):
                pass
            self._task = None


runtime_sync = RuntimeSyncService()

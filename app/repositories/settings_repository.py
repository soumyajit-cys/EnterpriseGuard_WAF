from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.waf_setting import WAFSetting


class SettingsRepository:

    async def get(self, db: AsyncSession, key: str) -> Optional[str]:
        result = await db.execute(
            select(WAFSetting).where(WAFSetting.key == key)
        )
        setting = result.scalar_one_or_none()
        return setting.value if setting else None

    async def set(
        self,
        db: AsyncSession,
        key: str,
        value: str,
        description: str | None = None,
    ):
        result = await db.execute(
            select(WAFSetting).where(WAFSetting.key == key)
        )
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = value
            if description:
                setting.description = description
        else:
            setting = WAFSetting(key=key, value=value, description=description)
            db.add(setting)
        await db.commit()

    async def get_all(self, db: AsyncSession) -> dict[str, str]:
        result = await db.execute(select(WAFSetting))
        settings = result.scalars().all()
        return {s.key: s.value for s in settings}

    async def get_mode(self, db: AsyncSession) -> str:
        mode = await self.get(db, "waf_mode")
        return mode or "detection"

    async def set_mode(self, db: AsyncSession, mode: str):
        await self.set(db, "waf_mode", mode, "WAF operation mode")

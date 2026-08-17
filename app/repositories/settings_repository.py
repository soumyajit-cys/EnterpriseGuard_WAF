from typing import Optional

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.waf_setting import WAFSetting
from app.services.tenant_service import DEFAULT_ORG_NAME, get_default_org_id


class SettingsRepository:
    """Org-scoped settings with global fallback: a key is resolved from
    the caller's org first, then from the deployment's default org."""

    async def get(
        self,
        db: AsyncSession,
        organization_id: int,
        key: str,
    ) -> Optional[str]:
        result = await db.execute(
            select(WAFSetting).where(
                WAFSetting.organization_id == organization_id,
                WAFSetting.key == key,
            )
        )
        setting = result.scalar_one_or_none()
        if setting:
            return setting.value

        default_id = await get_default_org_id()
        if default_id is not None and default_id != organization_id:
            result = await db.execute(
                select(WAFSetting).where(
                    WAFSetting.organization_id == default_id,
                    WAFSetting.key == key,
                )
            )
            setting = result.scalar_one_or_none()
            if setting:
                return setting.value
        return None

    async def set(
        self,
        db: AsyncSession,
        organization_id: int,
        key: str,
        value: str,
        description: str | None = None,
    ):
        result = await db.execute(
            select(WAFSetting).where(
                WAFSetting.organization_id == organization_id,
                WAFSetting.key == key,
            )
        )
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = value
            if description:
                setting.description = description
        else:
            setting = WAFSetting(
                organization_id=organization_id,
                key=key,
                value=value,
                description=description,
            )
            db.add(setting)
        await db.commit()

    async def get_all(self, db: AsyncSession, organization_id: int) -> dict[str, str]:
        """Merged view: default-org rows first, then the caller's own
        rows override them."""
        default_id = await get_default_org_id()
        org_ids = {organization_id}
        if default_id is not None:
            org_ids.add(default_id)

        result = await db.execute(
            select(WAFSetting).where(
                WAFSetting.organization_id.in_(org_ids)
            )
        )
        settings = result.scalars().all()

        merged: dict[str, str] = {}
        # default first so the caller's own rows win
        if default_id is not None:
            for s in settings:
                if s.organization_id == default_id:
                    merged[s.key] = s.value
        for s in settings:
            if s.organization_id != default_id:
                merged[s.key] = s.value
        return merged

    async def get_mode(self, db: AsyncSession, organization_id: int) -> str:
        mode = await self.get(db, organization_id, "waf_mode")
        return mode or "detection"

    async def set_mode(self, db: AsyncSession, organization_id: int, mode: str):
        await self.set(db, organization_id, "waf_mode", mode, "WAF operation mode")

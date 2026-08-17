"""Tenant context resolution.

The deployment-level (engine) tenant is the "Default Organization"
created by the migration. Inbound WAF traffic has no auth context, so
the engine path resolves the default org once and caches it; per-request
org context in the API layer always comes from the authenticated user.
"""

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.organization import Organization

DEFAULT_ORG_NAME = "Default Organization"

_default_org_id: int | None = None


async def get_default_org_id() -> int | None:
    """Resolve (and cache) the deployment-level organization id.

    Fails open to None on any DB error so the WAF engine can degrade
    gracefully; in production the default org is guaranteed by the
    migration and the cache is warmed during startup sync.
    """
    global _default_org_id
    if _default_org_id is not None:
        return _default_org_id
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Organization.id).where(Organization.name == DEFAULT_ORG_NAME)
            )
            _default_org_id = result.scalar_one_or_none()
    except Exception:
        return None
    return _default_org_id


def reset_default_org_cache() -> None:
    global _default_org_id
    _default_org_id = None

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.settings_repository import SettingsRepository
from app.auth.dependencies import require_admin
from app.models.user import User
from app.schemas.settings import SettingsUpdate, WebhookTestRequest
from app.services.audit_service import audit_service
from app.services.runtime_sync import runtime_sync
from app.waf.runtime import waf_mode

router = APIRouter(
    prefix="/settings",
    tags=["Settings"],
)

repo = SettingsRepository()


@router.get("/")
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    return await repo.get_all(db, current_user.organization_id)


@router.put("/")
async def update_settings(
    payload: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    for key, value in payload.root.items():
        await repo.set(db, current_user.organization_id, key, str(value))
    await audit_service.log(
        action="SETTINGS_UPDATED",
        user_id=current_user.id,
        username=current_user.username,
        resource="settings",
        details=f"Updated settings: {', '.join(payload.root.keys())}",
    )
    return await repo.get_all(db, current_user.organization_id)


@router.get("/mode")
async def get_mode(
    db: AsyncSession = Depends(get_db),
):
    from app.services.tenant_service import get_default_org_id

    organization_id = await get_default_org_id()
    mode = await repo.get_mode(db, organization_id)
    return {"mode": mode}


@router.put("/mode/{mode}")
async def update_mode(
    mode: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    if mode not in ["detection", "prevention"]:
        raise HTTPException(status_code=400, detail="Mode must be 'detection' or 'prevention'")
    await repo.set_mode(db, current_user.organization_id, mode)
    # The engine enforces the default org's mode only; other orgs store
    # their preference without affecting the shared deployment.
    from app.services.tenant_service import get_default_org_id

    if current_user.organization_id == await get_default_org_id():
        waf_mode.set(mode)
    await audit_service.log(
        action="MODE_CHANGED",
        user_id=current_user.id,
        username=current_user.username,
        resource="settings",
        details=f"WAF mode changed to: {mode}",
    )
    return {"mode": mode}


@router.post("/webhooks/test")
async def test_webhook(
    payload: WebhookTestRequest,
    current_user: User = Depends(require_admin()),
):
    from app.services.webhook_service import test_webhook as send_test

    url = payload.url.strip()
    webhook_type = payload.type
    if not url:
        raise HTTPException(status_code=400, detail="Webhook URL is required")

    ok, message = await send_test(url, webhook_type)
    if not ok:
        raise HTTPException(status_code=400, detail=message)

    await audit_service.log(
        action="WEBHOOK_TESTED",
        user_id=current_user.id,
        username=current_user.username,
        resource="settings",
        details=f"Test webhook delivered ({webhook_type})",
    )
    return {"ok": True, "message": message}

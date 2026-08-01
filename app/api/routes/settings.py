from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.settings_repository import SettingsRepository
from app.auth.dependencies import require_admin
from app.models.user import User
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
    return await repo.get_all(db)


@router.put("/")
async def update_settings(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    for key, value in payload.items():
        await repo.set(db, key, str(value))
    await audit_service.log(
        action="SETTINGS_UPDATED",
        user_id=current_user.id,
        username=current_user.username,
        resource="settings",
        details=f"Updated settings: {', '.join(payload.keys())}",
    )
    return await repo.get_all(db)


@router.get("/mode")
async def get_mode(
    db: AsyncSession = Depends(get_db),
):
    mode = await repo.get_mode(db)
    return {"mode": mode}


@router.put("/mode/{mode}")
async def update_mode(
    mode: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    if mode not in ["detection", "prevention"]:
        raise HTTPException(status_code=400, detail="Mode must be 'detection' or 'prevention'")
    await repo.set_mode(db, mode)
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
    payload: dict,
    current_user: User = Depends(require_admin()),
):
    from app.services.webhook_service import test_webhook as send_test

    url = (payload.get("url") or "").strip()
    webhook_type = payload.get("type", "generic")
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

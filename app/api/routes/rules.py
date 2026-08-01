from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
import re

from app.core.database import get_db
from app.repositories.rule_repository import RuleRepository
from app.auth.dependencies import require_analyst
from app.models.user import User
from app.services.audit_service import audit_service
from app.services.runtime_sync import runtime_sync

router = APIRouter(
    prefix="/rules",
    tags=["Rules"],
)

repo = RuleRepository()


def _validate_pattern(pattern: str | None):
    if pattern:
        try:
            re.compile(pattern)
        except re.error as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid regex pattern: {exc}",
            )


@router.get("/")
async def get_rules(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    enabled: bool | None = Query(None),
    severity: str | None = Query(None),
    category: str | None = Query(None),
    sort_by: str = Query("priority"),
    sort_desc: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    skip = (page - 1) * page_size
    rules, total = await repo.get_all(
        db,
        skip=skip,
        limit=page_size,
        search=search,
        enabled=enabled,
        severity=severity,
        category=category,
        sort_by=sort_by,
        sort_desc=sort_desc,
    )
    return {
        "items": rules,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/{rule_id}")
async def get_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    rule = await repo.get_by_id(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.post("/", status_code=201)
async def create_rule(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    rule = await repo.create(
        db,
        name=payload["name"],
        description=payload.get("description", ""),
        enabled=payload.get("enabled", True),
        priority=payload.get("priority", 50),
        severity=payload.get("severity", "medium"),
        pattern=payload.get("pattern"),
        category=payload.get("category"),
        rule_type=payload.get("rule_type"),
    )
    await audit_service.log(
        action="RULE_CREATED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"rule:{rule.id}",
        details=f"Created rule: {rule.name}",
    )
    return rule


@router.put("/{rule_id}")
async def update_rule(
    rule_id: int,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    rule = await repo.update(db, rule_id, **payload)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await audit_service.log(
        action="RULE_UPDATED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"rule:{rule.id}",
        details=f"Updated rule: {rule.name}",
    )
    return rule


@router.delete("/{rule_id}", status_code=204)
async def delete_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    rule = await repo.get_by_id(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await repo.delete(db, rule_id)
    await audit_service.log(
        action="RULE_DELETED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"rule:{rule_id}",
        details=f"Deleted rule: {rule.name}",
    )


@router.patch("/{rule_id}/toggle")
async def toggle_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    rule = await repo.toggle(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await audit_service.log(
        action="RULE_TOGGLED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"rule:{rule.id}",
        details=f"{'Enabled' if rule.enabled else 'Disabled'} rule: {rule.name}",
    )
    return rule

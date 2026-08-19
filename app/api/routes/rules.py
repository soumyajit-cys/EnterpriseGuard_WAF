from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.rule_repository import RuleRepository
from app.auth.dependencies import require_analyst
from app.models.rule import Rule
from app.models.user import User
from app.schemas.rule import RuleCreate, RuleUpdate
from app.services.audit_service import audit_service
from app.services.runtime_sync import runtime_sync

router = APIRouter(
    prefix="/rules",
    tags=["Rules"],
)

repo = RuleRepository()


def _serialize(rule: Rule) -> dict:
    data = {c.name: getattr(rule, c.name) for c in Rule.__table__.columns}
    data["source"] = "builtin" if rule.is_builtin else "custom"
    return data


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
        current_user.organization_id,
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
        "items": [_serialize(rule) for rule in rules],
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
    rule = await repo.get_by_id(db, current_user.organization_id, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return _serialize(rule)


@router.post("/", status_code=201)
async def create_rule(
    payload: RuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    rule = await repo.create(
        db,
        current_user.organization_id,
        name=payload.name,
        description=payload.description or "",
        enabled=payload.enabled,
        priority=payload.priority,
        severity=payload.severity,
        pattern=payload.pattern,
        category=payload.category,
        rule_type=payload.rule_type,
    )
    await audit_service.log(
        action="RULE_CREATED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"rule:{rule.id}",
        details=f"Created rule: {rule.name}",
    )
    await runtime_sync.sync_once()
    return rule


@router.put("/{rule_id}")
async def update_rule(
    rule_id: int,
    payload: RuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    rule = await repo.update(
        db,
        current_user.organization_id,
        rule_id,
        **payload.model_dump(exclude_unset=True),
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await audit_service.log(
        action="RULE_UPDATED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"rule:{rule.id}",
        details=f"Updated rule: {rule.name}",
    )
    await runtime_sync.sync_once()
    return _serialize(rule)


@router.delete("/{rule_id}", status_code=204)
async def delete_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    rule = await repo.get_by_id(db, current_user.organization_id, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if rule.is_builtin:
        raise HTTPException(
            status_code=409,
            detail="Built-in rules cannot be deleted — disable them instead",
        )
    await repo.delete(db, current_user.organization_id, rule_id)
    await audit_service.log(
        action="RULE_DELETED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"rule:{rule_id}",
        details=f"Deleted rule: {rule.name}",
    )
    await runtime_sync.sync_once()


@router.patch("/{rule_id}/toggle")
async def toggle_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst()),
):
    rule = await repo.toggle(db, current_user.organization_id, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await audit_service.log(
        action="RULE_TOGGLED",
        user_id=current_user.id,
        username=current_user.username,
        resource=f"rule:{rule.id}",
        details=f"{'Enabled' if rule.enabled else 'Disabled'} rule: {rule.name}",
    )
    await runtime_sync.sync_once()
    return _serialize(rule)

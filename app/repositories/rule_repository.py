from typing import Optional

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rule import Rule


class RuleRepository:

    async def get_all(
        self,
        db: AsyncSession,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        enabled: bool | None = None,
        severity: str | None = None,
        category: str | None = None,
        sort_by: str = "priority",
        sort_desc: bool = False,
    ) -> tuple[list[Rule], int]:
        query = select(Rule).where(Rule.organization_id == organization_id)
        count_query = select(func.count(Rule.id)).where(
            Rule.organization_id == organization_id
        )

        if enabled is not None:
            query = query.where(Rule.enabled == enabled)
            count_query = count_query.where(Rule.enabled == enabled)
        if severity:
            query = query.where(Rule.severity == severity)
            count_query = count_query.where(Rule.severity == severity)
        if category:
            query = query.where(Rule.category == category)
            count_query = count_query.where(Rule.category == category)
        if search:
            pattern = f"%{search}%"
            query = query.where(
                or_(
                    Rule.name.ilike(pattern),
                    Rule.description.ilike(pattern),
                    Rule.pattern.ilike(pattern),
                )
            )
            count_query = count_query.where(
                or_(
                    Rule.name.ilike(pattern),
                    Rule.description.ilike(pattern),
                    Rule.pattern.ilike(pattern),
                )
            )

        sort_col = getattr(Rule, sort_by, Rule.priority)
        if sort_desc:
            query = query.order_by(sort_col.desc())
        else:
            query = query.order_by(sort_col.asc())

        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        rules = list(result.scalars().all())

        total = await db.scalar(count_query)
        return rules, total or 0

    async def get_by_id(
        self, db: AsyncSession, organization_id: int, rule_id: int
    ) -> Optional[Rule]:
        result = await db.execute(
            select(Rule).where(
                Rule.organization_id == organization_id,
                Rule.id == rule_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        db: AsyncSession,
        organization_id: int,
        name: str,
        description: str = "",
        enabled: bool = True,
        priority: int = 50,
        severity: str = "medium",
        pattern: str | None = None,
        category: str | None = None,
        rule_type: str | None = None,
    ) -> Rule:
        rule = Rule(
            organization_id=organization_id,
            name=name,
            description=description,
            enabled=enabled,
            priority=priority,
            severity=severity,
            pattern=pattern,
            category=category,
            rule_type=rule_type,
        )
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        return rule

    async def update(
        self,
        db: AsyncSession,
        organization_id: int,
        rule_id: int,
        **kwargs,
    ) -> Optional[Rule]:
        rule = await self.get_by_id(db, organization_id, rule_id)
        if not rule:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(rule, key):
                setattr(rule, key, value)
        await db.commit()
        await db.refresh(rule)
        return rule

    async def delete(
        self, db: AsyncSession, organization_id: int, rule_id: int
    ) -> bool:
        rule = await self.get_by_id(db, organization_id, rule_id)
        if not rule:
            return False
        await db.delete(rule)
        await db.commit()
        return True

    async def toggle(
        self, db: AsyncSession, organization_id: int, rule_id: int
    ) -> Optional[Rule]:
        rule = await self.get_by_id(db, organization_id, rule_id)
        if not rule:
            return None
        rule.enabled = not rule.enabled
        await db.commit()
        await db.refresh(rule)
        return rule

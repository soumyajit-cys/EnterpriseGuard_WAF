from typing import Optional

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert


class AlertRepository:

    async def get_all(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        severity: str | None = None,
        resolved: bool | None = None,
    ) -> tuple[list[Alert], int]:
        query = select(Alert)
        count_query = select(func.count(Alert.id))

        conditions = []
        if severity:
            conditions.append(Alert.severity == severity)
        if resolved is not None:
            conditions.append(Alert.resolved == resolved)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        query = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        alerts = list(result.scalars().all())

        total = await db.scalar(count_query)
        return alerts, total or 0

    async def get_by_id(self, db: AsyncSession, alert_id: int) -> Optional[Alert]:
        return await db.get(Alert, alert_id)

    async def create(
        self,
        db: AsyncSession,
        severity: str,
        message: str,
        source: str | None = None,
        ip_address: str | None = None,
    ) -> Alert:
        alert = Alert(
            severity=severity,
            message=message,
            source=source,
            ip_address=ip_address,
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)
        return alert

    async def resolve(self, db: AsyncSession, alert_id: int) -> Optional[Alert]:
        from datetime import datetime
        alert = await self.get_by_id(db, alert_id)
        if not alert:
            return None
        alert.resolved = True
        alert.resolved_at = datetime.utcnow()
        await db.commit()
        await db.refresh(alert)
        return alert

    async def delete(self, db: AsyncSession, alert_id: int) -> bool:
        alert = await self.get_by_id(db, alert_id)
        if not alert:
            return False
        await db.delete(alert)
        await db.commit()
        return True

    async def get_stats(self, db: AsyncSession) -> dict:
        from datetime import datetime

        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        total = await db.scalar(select(func.count(Alert.id)))
        unresolved = await db.scalar(
            select(func.count(Alert.id)).where(Alert.resolved == False)
        )
        today = await db.scalar(
            select(func.count(Alert.id)).where(Alert.created_at >= today_start)
        )

        severity_result = await db.execute(
            select(Alert.severity, func.count(Alert.id).label("cnt"))
            .group_by(Alert.severity)
            .order_by(func.count(Alert.id).desc())
        )
        by_severity = {row[0]: row[1] for row in severity_result}

        return {
            "total": total or 0,
            "unresolved": unresolved or 0,
            "today": today or 0,
            "by_severity": by_severity,
        }

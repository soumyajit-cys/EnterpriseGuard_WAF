from app.core.database import AsyncSessionLocal
from app.models.alert import Alert


class AlertService:

    async def create(
        self,
        severity: str,
        message: str,
        source: str | None = None,
        ip_address: str | None = None,
        organization_id: int | None = None,
    ):
        if organization_id is None:
            # Fail open: without a tenant we cannot write a valid row.
            return None
        async with AsyncSessionLocal() as db:
            alert = Alert(
                organization_id=organization_id,
                severity=severity,
                message=message,
                source=source,
                ip_address=ip_address,
                resolved=False,
            )
            db.add(alert)
            await db.commit()
            await db.refresh(alert)

        try:
            from app.services.webhook_service import fire_alert_webhook

            fire_alert_webhook(
                "alert_created",
                {
                    "severity": alert.severity,
                    "message": alert.message,
                    "source": alert.source,
                    "ip_address": alert.ip_address,
                },
            )
        except Exception:
            pass

        return alert

    async def get_all(
        self,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
        severity: str | None = None,
        resolved: bool | None = None,
    ) -> tuple[list[Alert], int]:
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select, func, and_

            query = select(Alert).where(Alert.organization_id == organization_id)
            count_query = select(func.count(Alert.id)).where(
                Alert.organization_id == organization_id
            )

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

            total_result = await db.execute(count_query)
            total = total_result.scalar() or 0

            return alerts, total

    async def resolve(
        self, organization_id: int, alert_id: int
    ) -> Alert | None:
        async with AsyncSessionLocal() as db:
            from datetime import datetime

            alert = await db.get(Alert, alert_id)
            if not alert or alert.organization_id != organization_id:
                return None
            alert.resolved = True
            alert.resolved_at = datetime.now()
            await db.commit()
            await db.refresh(alert)
            return alert

    async def delete(self, organization_id: int, alert_id: int) -> bool:
        async with AsyncSessionLocal() as db:
            alert = await db.get(Alert, alert_id)
            if not alert or alert.organization_id != organization_id:
                return False
            await db.delete(alert)
            await db.commit()
            return True

    async def get_stats(self, organization_id: int) -> dict:
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select, func
            from datetime import datetime, timedelta

            now = datetime.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

            base = Alert.organization_id == organization_id
            total = await db.scalar(select(func.count(Alert.id)).where(base))
            unresolved = await db.scalar(
                select(func.count(Alert.id)).where(base, Alert.resolved == False)
            )
            today = await db.scalar(
                select(func.count(Alert.id)).where(base, Alert.created_at >= today_start)
            )

            severity_result = await db.execute(
                select(Alert.severity, func.count(Alert.id).label("cnt"))
                .where(base)
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


alert_service = AlertService()

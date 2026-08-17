from app.core.database import AsyncSessionLocal
from app.models.audit_log import AuditLog


class AuditService:

    async def log(
        self,
        action: str,
        user_id: int | None = None,
        username: str | None = None,
        resource: str | None = None,
        details: str | None = None,
        ip_address: str | None = None,
        severity: str = "info",
        organization_id: int | None = None,
    ):
        async with AsyncSessionLocal() as db:
            log = AuditLog(
                organization_id=organization_id,
                user_id=user_id,
                username=username,
                action=action,
                resource=resource,
                details=details,
                ip_address=ip_address,
                severity=severity,
            )
            db.add(log)
            await db.commit()

    async def get_all(
        self,
        organization_id: int | None = None,
        skip: int = 0,
        limit: int = 100,
        action: str | None = None,
    ) -> tuple[list[AuditLog], int]:
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select, func

            query = select(AuditLog)
            count_query = select(func.count(AuditLog.id))

            if organization_id is not None:
                query = query.where(AuditLog.organization_id == organization_id)
                count_query = count_query.where(
                    AuditLog.organization_id == organization_id
                )

            if action:
                query = query.where(AuditLog.action == action)
                count_query = count_query.where(AuditLog.action == action)

            query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
            result = await db.execute(query)
            logs = list(result.scalars().all())

            total = await db.scalar(count_query)

            return logs, total or 0


audit_service = AuditService()

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
    ):
        async with AsyncSessionLocal() as db:
            log = AuditLog(
                user_id=user_id,
                username=username,
                action=action,
                resource=resource,
                details=details,
                ip_address=ip_address,
            )
            db.add(log)
            await db.commit()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        action: str | None = None,
    ) -> tuple[list[AuditLog], int]:
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select, func

            query = select(AuditLog)
            count_query = select(func.count(AuditLog.id))

            if action:
                query = query.where(AuditLog.action == action)
                count_query = count_query.where(AuditLog.action == action)

            query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
            result = await db.execute(query)
            logs = list(result.scalars().all())

            total = await db.scalar(count_query)

            return logs, total or 0


audit_service = AuditService()

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditLogRepository:

    async def get_all(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        action: str | None = None,
    ) -> tuple[list[AuditLog], int]:
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

    async def create(
        self,
        db: AsyncSession,
        action: str,
        user_id: int | None = None,
        username: str | None = None,
        resource: str | None = None,
        details: str | None = None,
        ip_address: str | None = None,
    ) -> AuditLog:
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
        await db.refresh(log)
        return log

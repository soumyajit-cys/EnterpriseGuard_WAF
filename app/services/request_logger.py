from app.core.database import AsyncSessionLocal
from app.models.request_log import RequestLog


class RequestLogger:

    async def log(
        self,
        ip: str,
        path: str,
        action: str,
        organization_id: int | None,
        score: int = 0,
        method: str | None = None,
        attack_type: str | None = None,
        status_code: int | None = None,
        user_agent: str | None = None,
        request_body: str | None = None,
        response_time: float | None = None,
        country: str | None = None,
    ):
        if organization_id is None:
            # Fail open: without a tenant we cannot write a valid row.
            return
        async with AsyncSessionLocal() as db:
            log = RequestLog(
                organization_id=organization_id,
                ip_address=ip,
                method=method,
                path=path,
                action=action,
                score=score,
                attack_type=attack_type,
                status_code=status_code,
                user_agent=user_agent,
                request_body=request_body,
                response_time=response_time,
                country=country,
            )
            db.add(log)
            await db.commit()

    async def get_stats(self, period: str = "24h") -> dict:
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select, func, and_
            from datetime import datetime, timedelta

            now = datetime.now()
            if period == "24h":
                since = now - timedelta(hours=24)
            elif period == "7d":
                since = now - timedelta(days=7)
            elif period == "30d":
                since = now - timedelta(days=30)
            else:
                since = now - timedelta(hours=24)

            total = await db.scalar(
                select(func.count(RequestLog.id)).where(RequestLog.created_at >= since)
            )
            blocked = await db.scalar(
                select(func.count(RequestLog.id)).where(
                    and_(RequestLog.action == "BLOCK", RequestLog.created_at >= since)
                )
            )

            top_ips_result = await db.execute(
                select(RequestLog.ip_address, func.count(RequestLog.id).label("cnt"))
                .where(RequestLog.created_at >= since)
                .group_by(RequestLog.ip_address)
                .order_by(func.count(RequestLog.id).desc())
                .limit(10)
            )
            top_ips = [{"ip": row[0], "count": row[1]} for row in top_ips_result]

            attack_types_result = await db.execute(
                select(RequestLog.attack_type, func.count(RequestLog.id).label("cnt"))
                .where(
                    and_(
                        RequestLog.attack_type != None,
                        RequestLog.created_at >= since,
                    )
                )
                .group_by(RequestLog.attack_type)
                .order_by(func.count(RequestLog.id).desc())
                .limit(10)
            )
            attack_types_list = [
                {"name": row[0] or "Unknown", "value": row[1]}
                for row in attack_types_result
            ]

            return {
                "total": total or 0,
                "blocked": blocked or 0,
                "allowed": (total or 0) - (blocked or 0),
                "top_ips": top_ips,
                "attack_types": attack_types_list,
            }


request_logger = RequestLogger()

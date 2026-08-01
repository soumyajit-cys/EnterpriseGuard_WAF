from typing import Optional

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.blocked_ip import BlockedIP
from app.models.allowed_ip import AllowedIP
import ipaddress


class BlockedIPRepository:

    async def get_all(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        permanent: bool | None = None,
    ) -> tuple[list[BlockedIP], int]:
        query = select(BlockedIP)
        count_query = select(func.count(BlockedIP.id))

        if permanent is not None:
            query = query.where(BlockedIP.is_permanent == permanent)
            count_query = count_query.where(BlockedIP.is_permanent == permanent)
        if search:
            pattern = f"%{search}%"
            query = query.where(
                or_(
                    BlockedIP.ip_address.ilike(pattern),
                    BlockedIP.reason.ilike(pattern),
                )
            )
            count_query = count_query.where(
                or_(
                    BlockedIP.ip_address.ilike(pattern),
                    BlockedIP.reason.ilike(pattern),
                )
            )

        query = query.order_by(BlockedIP.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        items = list(result.scalars().all())
        total = await db.scalar(count_query)
        return items, total or 0

    async def get_by_ip(self, db: AsyncSession, ip: str) -> Optional[BlockedIP]:
        result = await db.execute(
            select(BlockedIP).where(BlockedIP.ip_address == ip)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        db: AsyncSession,
        ip_address: str,
        reason: str | None = None,
        is_permanent: bool = False,
        expires_at=None,
    ) -> BlockedIP:
        entry = BlockedIP(
            ip_address=ip_address,
            reason=reason,
            is_permanent=is_permanent,
            expires_at=expires_at,
        )
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return entry

    async def delete(self, db: AsyncSession, ip_id: int) -> bool:
        entry = await db.get(BlockedIP, ip_id)
        if not entry:
            return False
        await db.delete(entry)
        await db.commit()
        return True

    async def is_blocked(self, db: AsyncSession, ip: str) -> bool:
        from datetime import datetime
        result = await db.execute(
            select(BlockedIP).where(
                and_(
                    BlockedIP.ip_address == ip,
                    or_(
                        BlockedIP.is_permanent == True,
                        BlockedIP.expires_at > datetime.now(),
                    ),
                )
            )
        )
        return result.scalar_one_or_none() is not None

    def ip_in_cidr(self, ip: str, cidr: str) -> bool:
        try:
            return ipaddress.ip_address(ip) in ipaddress.ip_network(cidr, strict=False)
        except ValueError:
            return False


class AllowedIPRepository:

    async def get_all(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
    ) -> tuple[list[AllowedIP], int]:
        query = select(AllowedIP)
        count_query = select(func.count(AllowedIP.id))

        if search:
            pattern = f"%{search}%"
            query = query.where(
                or_(
                    AllowedIP.ip_address.ilike(pattern),
                    AllowedIP.description.ilike(pattern),
                )
            )
            count_query = count_query.where(
                or_(
                    AllowedIP.ip_address.ilike(pattern),
                    AllowedIP.description.ilike(pattern),
                )
            )

        query = query.order_by(AllowedIP.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        items = list(result.scalars().all())
        total = await db.scalar(count_query)
        return items, total or 0

    async def get_by_ip(self, db: AsyncSession, ip: str) -> Optional[AllowedIP]:
        result = await db.execute(
            select(AllowedIP).where(AllowedIP.ip_address == ip)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        db: AsyncSession,
        ip_address: str,
        description: str | None = None,
    ) -> AllowedIP:
        entry = AllowedIP(ip_address=ip_address, description=description)
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return entry

    async def delete(self, db: AsyncSession, ip_id: int) -> bool:
        entry = await db.get(AllowedIP, ip_id)
        if not entry:
            return False
        await db.delete(entry)
        await db.commit()
        return True

    async def is_allowed(self, db: AsyncSession, ip: str) -> bool:
        result = await db.execute(
            select(AllowedIP).where(AllowedIP.ip_address == ip)
        )
        return result.scalar_one_or_none() is not None

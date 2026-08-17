from typing import Optional

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:

    async def get_by_id(
        self,
        db: AsyncSession,
        user_id: int,
        organization_id: int | None = None,
    ) -> Optional[User]:
        query = select(User).where(User.id == user_id)
        if organization_id is not None:
            query = query.where(User.organization_id == organization_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_username(self, db: AsyncSession, username: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_all(
        self,
        db: AsyncSession,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
        role: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "id",
        sort_desc: bool = False,
    ) -> tuple[list[User], int]:
        query = select(User).where(User.organization_id == organization_id)
        count_query = select(func.count(User.id)).where(
            User.organization_id == organization_id
        )

        if role:
            query = query.where(User.role == role)
            count_query = count_query.where(User.role == role)

        if search:
            pattern = f"%{search}%"
            query = query.where(
                User.username.ilike(pattern) | User.email.ilike(pattern)
            )
            count_query = count_query.where(
                User.username.ilike(pattern) | User.email.ilike(pattern)
            )

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        sort_column = getattr(User, sort_by, User.id)
        if sort_desc:
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        users = list(result.scalars().all())

        return users, total

    async def create(
        self,
        db: AsyncSession,
        username: str,
        email: str,
        password_hash: str,
        role: str = "analyst",
        organization_id: int | None = None,
    ) -> User:
        user = User(
            organization_id=organization_id,
            username=username,
            email=email,
            password_hash=password_hash,
            role=role,
            is_active=True,
            is_verified=False,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def update(
        self,
        db: AsyncSession,
        user_id: int,
        **kwargs,
    ) -> Optional[User]:
        user = await self.get_by_id(db, user_id)
        if not user:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(user, key):
                setattr(user, key, value)
        await db.commit()
        await db.refresh(user)
        return user

    async def delete(self, db: AsyncSession, user_id: int) -> bool:
        user = await self.get_by_id(db, user_id)
        if not user:
            return False
        await db.delete(user)
        await db.commit()
        return True

    async def change_password(
        self,
        db: AsyncSession,
        user_id: int,
        new_password_hash: str,
    ) -> bool:
        user = await self.get_by_id(db, user_id)
        if not user:
            return False
        user.password_hash = new_password_hash
        await db.commit()
        return True

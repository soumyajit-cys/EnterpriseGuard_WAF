from sqlalchemy import select

from app.models.user import User


class UserRepository:

    async def get_by_username(
        self,
        db,
        username
    ):

        result = await db.execute(
            select(User).where(
                User.username == username
            )
        )

        return result.scalar_one_or_none()
    

    
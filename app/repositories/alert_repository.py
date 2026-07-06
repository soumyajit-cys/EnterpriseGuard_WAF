from sqlalchemy import select

from app.models.alert import Alert


class AlertRepository:

    async def get_all(
        self,
        db
    ):
        result = await db.execute(
            select(Alert)
        )

        return result.scalars().all()

    async def create(
        self,
        db,
        severity,
        message
    ):

        alert = Alert(
            severity=severity,
            message=message
        )

        db.add(alert)

        await db.commit()

        await db.refresh(alert)

        return alert
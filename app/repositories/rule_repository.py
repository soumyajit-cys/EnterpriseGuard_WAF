from sqlalchemy import select

from app.models.rule import Rule


class RuleRepository:

    async def get_all(self, db):

        result = await db.execute(
            select(Rule)
        )

        return result.scalars().all()

    async def create(
        self,
        db,
        name,
        description=""
    ):

        rule = Rule(
            name=name,
            description=description,
            enabled=True
        )

        db.add(rule)

        await db.commit()

        await db.refresh(rule)

        return rule
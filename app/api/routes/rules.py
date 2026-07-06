from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

from app.repositories.rule_repository import (
    RuleRepository
)

router = APIRouter(
    prefix="/rules",
    tags=["Rules"]
)

repo = RuleRepository()


@router.get("/")
async def get_rules(
    db: AsyncSession = Depends(get_db)
):

    rules = await repo.get_all(db)

    return rules


@router.post("/")
async def create_rule(
    payload: dict,
    db: AsyncSession = Depends(get_db)
):

    rule = await repo.create(
        db,
        payload["name"],
        payload.get(
            "description",
            ""
        )
    )

    return rule
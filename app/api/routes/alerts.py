from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

from app.repositories.alert_repository import (
    AlertRepository
)

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)

repo = AlertRepository()


@router.get("/")
async def get_alerts(
    db: AsyncSession = Depends(get_db)
):

    return await repo.get_all(db)


@router.post("/")
async def create_alert(
    payload: dict,
    db: AsyncSession = Depends(get_db)
):

    return await repo.create(
        db,
        payload["severity"],
        payload["message"]
    )

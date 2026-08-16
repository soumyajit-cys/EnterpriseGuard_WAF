import asyncio
from pathlib import Path

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)

from alembic import command
from alembic.config import Config

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


def _upgrade_db_to_head() -> None:
    alembic_ini = Path(__file__).resolve().parents[2] / "alembic.ini"
    cfg = Config(str(alembic_ini))
    command.upgrade(cfg, "head")


async def init_db():
    # Schema is managed exclusively by Alembic migrations. On a fresh
    # database this applies the baseline; on existing databases it
    # applies any pending migrations to the current head.
    await asyncio.to_thread(_upgrade_db_to_head)
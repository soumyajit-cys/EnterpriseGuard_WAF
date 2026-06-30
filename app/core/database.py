from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker
)

from app.core.config import settings
from app.models.base import Base


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """
    Register models and create tables.
    """

    from app.models.user import User
    from app.models.rule import Rule
    from app.models.alert import Alert
    from app.models.request_log import RequestLog
    from app.models.blocked_ip import BlockedIP
    from app.models.allowed_ip import AllowedIP
    from app.models.waf_setting import WAFSetting

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
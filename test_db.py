import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://wafuser:waf123@localhost/wafdb"

async def main():
    engine = create_async_engine(DATABASE_URL)

    async with engine.begin() as conn:
        print("CONNECTED")

asyncio.run(main())

from app.core.redis_client import redis_client


class BruteForceService:

    LIMIT = 10

    WINDOW = 300

    async def register_failure(
        self,
        username: str
    ):

        key = f"bf:{username}"

        count = await redis_client.incr(key)

        if count == 1:
            await redis_client.expire(
                key,
                self.WINDOW
            )

    async def is_locked(
        self,
        username: str
    ):

        count = await redis_client.get(
            f"bf:{username}"
        )

        if not count:
            return False

        return int(count) >= self.LIMIT
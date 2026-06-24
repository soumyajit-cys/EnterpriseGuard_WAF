from app.core.redis_client import redis_client


class RateLimitService:

    WINDOW_SECONDS = 60

    MAX_REQUESTS = 120

    async def check(self, ip: str):

        key = f"rl:{ip}"

        count = await redis_client.incr(key)

        if count == 1:
            await redis_client.expire(
                key,
                self.WINDOW_SECONDS
            )

        return count <= self.MAX_REQUESTS
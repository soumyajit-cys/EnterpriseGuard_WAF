from app.core.redis_client import redis_client


class RateLimitService:

    WINDOW_SECONDS = 60

    MAX_REQUESTS = 120

    LOGIN_WINDOW_SECONDS = 60

    LOGIN_MAX_REQUESTS = 20

    async def check(self, ip: str | None):

        if not ip:
            return True

        key = f"rl:{ip}"

        count = await redis_client.incr(key)

        if count == 1:
            await redis_client.expire(
                key,
                self.WINDOW_SECONDS
            )

        return count <= self.MAX_REQUESTS

    async def check_login(self, ip: str | None):

        if not ip:
            return True

        key = f"rl_login:{ip}"

        count = await redis_client.incr(key)

        if count == 1:
            await redis_client.expire(
                key,
                self.LOGIN_WINDOW_SECONDS
            )

        return count <= self.LOGIN_MAX_REQUESTS

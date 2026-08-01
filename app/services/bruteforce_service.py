from app.core.redis_client import redis_client


class BruteForceService:

    LIMIT = 10

    WINDOW = 300

    IP_LIMIT = 30

    async def register_failure(
        self,
        username: str,
        ip: str | None = None,
    ):

        key = f"bf:{username}"

        count = await redis_client.incr(key)

        if count == 1:
            await redis_client.expire(
                key,
                self.WINDOW,
            )

        if ip:
            ip_key = f"bf_ip:{ip}"
            ip_count = await redis_client.incr(ip_key)
            if ip_count == 1:
                await redis_client.expire(ip_key, self.WINDOW)

    async def register_success(self, username: str, ip: str | None = None):
        await redis_client.expire(f"bf:{username}", 1)
        if ip:
            await redis_client.expire(f"bf_ip:{ip}", 1)

    async def is_locked(
        self,
        username: str,
        ip: str | None = None,
    ) -> bool:

        count = await redis_client.get(
            f"bf:{username}"
        )

        if count and int(count) >= self.LIMIT:
            return True

        if ip:
            ip_count = await redis_client.get(f"bf_ip:{ip}")
            if ip_count and int(ip_count) >= self.IP_LIMIT:
                return True

        return False


bruteforce_service = BruteForceService()

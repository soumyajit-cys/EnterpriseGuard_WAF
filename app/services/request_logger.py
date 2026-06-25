from app.core.logging import logger


class RequestLogger:

    async def log(
        self,
        ip,
        path,
        action,
        score
    ):

        logger.info(
            {
                "ip": ip,
                "path": path,
                "action": action,
                "score": score
            }
        )


request_logger = RequestLogger()


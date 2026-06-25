from app.core.logging import logger


class AlertService:

    async def create(
        self,
        severity,
        message
    ):

        logger.warning(
            {
                "severity": severity,
                "message": message
            }
        )


alert_service = AlertService()


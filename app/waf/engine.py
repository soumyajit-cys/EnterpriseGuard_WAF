from app.waf.detector import Detector

from app.waf.actions import (
    should_block
)

from app.services.alert_service import (
    alert_service
)

from app.services.request_logger import (
    request_logger
)


detector = Detector()


class WAFEngine:

    async def inspect(
        self,
        request
    ):

        findings = await detector.detect(
            request
        )

        score = sum(
            f["score"]
            for f in findings
        )

        block = should_block(score)

        ip = request.client.host

        action = (
            "BLOCK"
            if block
            else "ALLOW"
        )

        await request_logger.log(
            ip,
            request.url.path,
            action,
            score
        )

        if score >= 50:

            await alert_service.create(
                "HIGH",
                f"Threat score={score}"
            )

        return {
            "block": block,
            "reason": findings[0]["type"]
            if findings else None,
            "score": score
        }


waf_engine = WAFEngine()


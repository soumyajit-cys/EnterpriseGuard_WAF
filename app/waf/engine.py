from app.waf.detector import Detector
from app.waf.actions import should_block

detector = Detector()


class WAFEngine:

    async def inspect(self, request):

        findings = await detector.detect(request)

        score = sum(
            item["score"]
            for item in findings
        )

        block = should_block(score)

        return {
            "block": block,
            "reason": findings[0]["type"]
            if findings else None,
            "score": score
        }


waf_engine = WAFEngine()


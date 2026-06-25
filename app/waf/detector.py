from app.waf.rules.sqli import (
    SQLInjectionDetector
)

from app.waf.rules.xss import (
    XSSDetector
)

from app.waf.rules.bot import (
    BotDetector
)


class Detector:

    def __init__(self):

        self.sqli = SQLInjectionDetector()

        self.xss = XSSDetector()

        self.bot = BotDetector()

    async def detect(self, request):

        findings = []

        query_params = str(
            request.query_params
        )

        score = self.sqli.inspect(
            query_params
        )

        if score:
            findings.append(
                {
                    "type": "SQL_INJECTION",
                    "score": score
                }
            )

        score = self.xss.inspect(
            query_params
        )

        if score:
            findings.append(
                {
                    "type": "XSS",
                    "score": score
                }
            )

        ua_score = self.bot.inspect(
            request.headers.get(
                "user-agent",
                ""
            )
        )

        if ua_score:
            findings.append(
                {
                    "type": "BOT_TRAFFIC",
                    "score": ua_score
                }
            )

        return findings
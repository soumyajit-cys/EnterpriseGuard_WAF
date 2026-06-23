class BotDetector:

    SUSPICIOUS_AGENTS = [
        "curl",
        "wget",
        "python-requests",
        "httpclient",
        "scanner",
    ]

    def inspect(self, user_agent: str):

        if not user_agent:
            return 20

        ua = user_agent.lower()

        for item in self.SUSPICIOUS_AGENTS:

            if item in ua:
                return 20

        return 0
    
    
import re


class HTTPParameterPollutionDetector:

    def __init__(self):
        self.sensitive_params = [
            "id", "uid", "user", "admin", "role", "type",
            "action", "cmd", "exec", "query", "search",
            "page", "file", "dir", "path", "debug", "test",
            "token", "session", "password", "pass", "key",
        ]

    def inspect(self, params: dict) -> int:

        seen = {}
        score = 0

        for key, value in params.items():
            if key in seen:
                score += 30
            seen[key] = value

        if isinstance(params, dict):
            values = list(params.values())
            if len(values) != len(set(values)):
                score += 40

        for key in params:
            if key.lower() in self.sensitive_params:
                val = params[key]
                if isinstance(val, list) and len(val) > 1:
                    score += 50

        return min(score, 100)

    def inspect_string(self, query_string: str) -> int:
        score = 0

        params = query_string.split("&")
        seen_keys = {}
        for param in params:
            if "=" in param:
                key = param.split("=", 1)[0]
                if key in seen_keys:
                    score += 30
                seen_keys[key] = True

                for sensitive in self.sensitive_params:
                    pattern = re.compile(
                        rf"(?:^|&){re.escape(sensitive)}=[^&]*(?:&|$)",
                        re.I
                    )
                    matches = pattern.findall(query_string)
                    if len(matches) > 1:
                        score += 50

        return min(score, 100)

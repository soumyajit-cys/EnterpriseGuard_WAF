import re


class XSSDetector:

    def __init__(self):
        self.patterns = [
            (re.compile(r"<script[^>]*>", re.I), 60),
            (re.compile(r"</script", re.I), 50),
            (re.compile(r"<svg[^>]*onload", re.I), 70),
            (re.compile(r"<img[^>]*onerror", re.I), 70),
            (re.compile(r"javascript\s*:", re.I), 55),
            (re.compile(r"on\w+\s*=", re.I), 45),
            (re.compile(r"expression\s*\(", re.I), 55),
            (re.compile(r"document\.cookie", re.I), 45),
            (re.compile(r"window\.location", re.I), 35),
            (re.compile(r"(alert|prompt|confirm)\s*\(", re.I), 30),
            (re.compile(r"<iframe|<embed|<object|<form", re.I), 30),
            (re.compile(r"data\s*:\s*text/html", re.I), 50),
        ]

    def inspect(self, value: str):
        score = 0

        for pattern, weight in self.patterns:
            if pattern.search(value):
                score += weight

        return min(score, 100)

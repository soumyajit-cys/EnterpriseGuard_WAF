import re


class HeaderInjectionDetector:

    def __init__(self):
        self.patterns = [
            re.compile(r"\r\n\s*(?:Location|Set-Cookie|Content-Length|Content-Type|Refresh|WWW-Authenticate)", re.I),
            re.compile(r"\r\n\s*HTTP/", re.I),
            re.compile(r"\r\n\s*\d{3}\s+", re.I),
            re.compile(r"\n\n\s*<script", re.I),
            re.compile(r"\r\n\r\n\s*<?(?:html|xml|script|iframe)", re.I),
        ]

        self.injection_patterns = [
            re.compile(r"%0d%0a", re.I),
            re.compile(r"%0a%0d", re.I),
            re.compile(r"%0a", re.I),
            re.compile(r"%0d", re.I),
            re.compile(r"\r\n"),
            re.compile(r"\n\r"),
        ]

    def inspect(self, value: str) -> int:
        score = 0

        for pattern in self.patterns:
            if pattern.search(value):
                score += 80

        for pattern in self.injection_patterns:
            if pattern.search(value):
                score += 30

        return min(score, 100)

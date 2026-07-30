import re


class LFIDetector:

    def __init__(self):
        self.patterns = [
            re.compile(r"\.\./etc/passwd", re.I),
            re.compile(r"\.\./etc/shadow", re.I),
            re.compile(r"php://filter", re.I),
            re.compile(r"php://input", re.I),
            re.compile(r"data://", re.I),
            re.compile(r"expect://", re.I),
            re.compile(r"file://", re.I),
            re.compile(r"\.\./proc/self/", re.I),
            re.compile(r"\.\./var/log/", re.I),
            re.compile(r"\.\./boot\.ini", re.I),
            re.compile(r"\.\./windows/", re.I),
        ]

    def inspect(self, value: str) -> int:
        score = 0
        for pattern in self.patterns:
            if pattern.search(value):
                score += 70
        return score

import re


class XXEDetector:

    def __init__(self):
        self.patterns = [
            re.compile(r"<!DOCTYPE\s+[a-zA-Z]+\s+\[", re.I),
            re.compile(r"<!DOCTYPE\s+[a-zA-Z]+\s+SYSTEM", re.I),
            re.compile(r"<!ENTITY\s+[a-zA-Z]+\s+SYSTEM\s+", re.I),
            re.compile(r"<!ENTITY\s+[a-zA-Z]+\s+PUBLIC\s+", re.I),
            re.compile(r"<!ENTITY\s+%\s+[a-zA-Z]+\s+SYSTEM\s+", re.I),
            re.compile(r"<!ENTITY\s+%\s+[a-zA-Z]+\s+PUBLIC\s+", re.I),
            re.compile(r"xinclude", re.I),
            re.compile(r"<!\[CDATA\[", re.I),
            re.compile(r"xmlns:xi\s*=", re.I),
            re.compile(r"xi:include", re.I),
            re.compile(r"ENTITY\s+\w+\s+SYSTEM\s+['\"](?:file|http|ftp|php)://", re.I),
            re.compile(r"ENTITY\s+\w+\s+SYSTEM\s+['\"]\/etc\/", re.I),
        ]

    def inspect(self, value: str) -> int:
        score = 0
        for pattern in self.patterns:
            if pattern.search(value):
                score += 80
        return score

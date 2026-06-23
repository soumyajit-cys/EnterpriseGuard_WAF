import re


class XSSDetector:

    def __init__(self):

        self.patterns = [
            re.compile(r"<script", re.I),
            re.compile(r"javascript:", re.I),
            re.compile(r"onerror=", re.I),
            re.compile(r"onload=", re.I),
            re.compile(r"document\.cookie", re.I),
            re.compile(r"window\.location", re.I),
        ]

    def inspect(self, value: str):

        score = 0

        for pattern in self.patterns:

            if pattern.search(value):
                score += 25

        return score
    

    
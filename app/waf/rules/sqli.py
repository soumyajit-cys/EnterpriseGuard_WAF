import re


class SQLInjectionDetector:

    def __init__(self):

        self.patterns = [
            re.compile(r"union\s+select", re.I),
            re.compile(r"information_schema", re.I),
            re.compile(r"sleep\s*\(", re.I),
            re.compile(r"benchmark\s*\(", re.I),
            re.compile(r"drop\s+table", re.I),
            re.compile(r"insert\s+into", re.I),
            re.compile(r"delete\s+from", re.I),
            re.compile(r"update\s+\w+\s+set", re.I),
        ]

    def inspect(self, value: str):

        score = 0

        for pattern in self.patterns:

            if pattern.search(value):
                score += 30

        return score
    
    
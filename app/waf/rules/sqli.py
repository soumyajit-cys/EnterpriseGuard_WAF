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
            re.compile(r"or\s+1\s*=\s*1", re.I),
            re.compile(r"or\s+1\s*=\s*1\s*--", re.I),
            re.compile(r"or\s+'1'\s*=\s*'1'", re.I),
            re.compile(r"or\s+\"1\"\s*=\s*\"1\"", re.I),
            re.compile(r"or\s+1\s*=\s*1#", re.I),
            re.compile(r"\badmin'\s*--", re.I),
            re.compile(r"'\s*or\s*'", re.I),
            re.compile(r"'\s*or\s*'1'\s*=\s*'1", re.I),
            re.compile(r"\"\s*or\s*\"1\"\s*=\s*\"1", re.I),
            re.compile(r"or\s+1\s*=\s*1\s*/\*", re.I),
            re.compile(r"\w+'\s*and\s*\w+\s*=\s*'", re.I),
            re.compile(r"select\s+\*?\s*from\s+\w+", re.I),
            re.compile(r"select\s+\w+\s+from\s+\w+", re.I),
            re.compile(r"waitfor\s+delay", re.I),
            re.compile(r"pg_sleep\s*\(", re.I),
            re.compile(r"\bexec\s*\(", re.I),
            re.compile(r"execute\s+immediate", re.I),
            re.compile(r"char\s*\(\d+\s*,", re.I),
            re.compile(r"concat\s*\([^)]*0x", re.I),
            re.compile(r"--\s*[-+]\s*$", re.I),
            re.compile(r"\bor\b\s+\w+\s*=\s*\w+\s*;?\s*--", re.I),
            re.compile(r"#\s*\(?\s*comment", re.I),
            re.compile(r"0x27\s*(?:or|and)", re.I),
            re.compile(r"0x[0-9a-f]{8,}", re.I),
            re.compile(r"cast\s*\([^)]*as\s+(?:int|char|varchar)", re.I),
        ]

    def inspect(self, value: str):

        score = 0

        for pattern in self.patterns:

            if pattern.search(value):
                score += 30

        if re.search(r"['\"]", value):
            score += 5

        if re.search(r"--", value) or re.search(r"#", value):
            score += 10

        if re.search(r"sleep|benchmark|pg_sleep|waitfor", value, re.I):
            score += 40

        if re.search(r"union\s+select|information_schema", value, re.I):
            score += 40

        if re.search(r"\bor\b", value, re.I) and re.search(r"=\s*1", value):
            score += 30

        if re.search(r"(?:select|union|insert|update|delete|drop)", value, re.I) and re.search(r"--|#|\bor\b", value, re.I):
            score += 20

        return min(score, 100)
    
    
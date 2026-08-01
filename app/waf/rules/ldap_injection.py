import re


class LDAPInjectionDetector:

    def __init__(self):
        self.patterns = [
            re.compile(r"\([&|!]\s*\(.+?\)\s*\)"),
            re.compile(r"\(uid=\*\)", re.I),
            re.compile(r"\(cn=\*\)", re.I),
            re.compile(r"\(sn=\*\)", re.I),
            re.compile(r"\(mail=\*\)", re.I),
            re.compile(r"admin\)\s*\(", re.I),
            re.compile(r"admin\s*=\s*\*", re.I),
            re.compile(r"\(\w+=\*\)", re.I),
            re.compile(r"\*\)\s*\(", re.I),
            re.compile(r"\|\(uid=", re.I),
            re.compile(r"&\(uid=", re.I),
            re.compile(r"\(cn=", re.I),
            re.compile(r"\(sn=", re.I),
            re.compile(r"\(objectClass=", re.I),
        ]

    def inspect(self, value: str) -> int:
        score = 0
        for pattern in self.patterns:
            if pattern.search(value):
                score += 40

        if "(" in value and ")" in value and ("|" in value or "&" in value or "!" in value):
            score += 30

        if value.startswith("*") or value.endswith("*"):
            score += 25

        return min(score, 100)

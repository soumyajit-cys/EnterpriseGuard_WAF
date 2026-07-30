import re


class CommandInjectionDetector:

    def __init__(self):
        self.patterns = [
            re.compile(r"[;&|`]\s*(?:id|whoami|pwd|ls|cat|rm|chmod|wget|curl|bash|sh|python|perl|ruby|nc|ncat)", re.I),
            re.compile(r"\$\s*\(.*\)"),
            re.compile(r"`.*`"),
            re.compile(r"(?:\||&&|\|\|)\s*(?:ping|nslookup|dig|traceroute|wget|curl)", re.I),
            re.compile(r"(?:/bin/|/usr/bin/|/usr/local/bin/)(?:bash|sh|python|perl|php)", re.I),
        ]

    def inspect(self, value: str) -> int:
        score = 0
        for pattern in self.patterns:
            if pattern.search(value):
                score += 85
        return score

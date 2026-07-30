import re


class PathTraversalDetector:

    def __init__(self):
        self.patterns = [
            re.compile(r"\.\./"),
            re.compile(r"\.\.\\"),
            re.compile(r"\.\.%2f", re.I),
            re.compile(r"\.\.%5c", re.I),
            re.compile(r"%2e%2e%2f", re.I),
            re.compile(r"%252e%252e%252f", re.I),
            re.compile(r"\.\./\.\./"),
            re.compile(r"\.\.\\\.\.\\"),
        ]

        self.sensitive_paths = [
            "/etc/passwd",
            "/etc/shadow",
            "/etc/hosts",
            "/etc/nginx/",
            "/var/log/",
            "/windows/system32",
            "/boot.ini",
            "/proc/self/environ",
            "/proc/self/cmdline",
        ]

    def inspect(self, value: str) -> int:
        score = 0
        for pattern in self.patterns:
            if pattern.search(value):
                score += 40

        for path in self.sensitive_paths:
            if path.lower() in value.lower():
                score += 60

        return min(score, 100)

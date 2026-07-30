import re


class RFIDetector:

    def __init__(self):
        self.patterns = [
            re.compile(r"(?:https?|ftp)://[^\s'\"<>]+\.(?:php|asp|aspx|jsp|pl|cgi|py|rb|sh|exe|dll|jar|war|zip|tar\.gz)", re.I),
            re.compile(r"(?:include|require)(?:_once)?\s*\(?\s*['\"]?(?:https?|ftp)://", re.I),
            re.compile(r"(?:include|require)(?:_once)?\s*\(?\s*\$_(?:GET|POST|REQUEST|COOKIE)", re.I),
            re.compile(r"(?:fopen|fread|file_get_contents|curl_exec|readfile)\s*\(.*\$_(?:GET|POST|REQUEST)", re.I),
            re.compile(r"(?:allow_url_include|allow_url_fopen)\s*=\s*on", re.I),
        ]

        self.suspicious_domains = [
            "evil.com",
            "malware.com",
            "hacker.com",
            "shell.com",
            "pastebin.com",
            "bit.ly",
        ]

    def inspect(self, value: str) -> int:
        score = 0
        for pattern in self.patterns:
            if pattern.search(value):
                score += 85

        for domain in self.suspicious_domains:
            if domain in value.lower():
                score += 50

        if re.search(r"(?:https?|ftp)://", value, re.I):
            score += 20

        return min(score, 100)

import re


class SSRFDetector:

    def __init__(self):
        self.internal_ips = [
            r"127\.0\.0\.1",
            r"0\.0\.0\.0",
            r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}",
            r"172\.1[6-9]\d{0,2}\.\d{1,3}\.\d{1,3}",
            r"172\.2[0-9]\d{0,2}\.\d{1,3}\.\d{1,3}",
            r"172\.3[0-1]\d{0,2}\.\d{1,3}\.\d{1,3}",
            r"192\.168\.\d{1,3}\.\d{1,3}",
            r"169\.254\.\d{1,3}\.\d{1,3}",
        ]

        self.strong_patterns = [
            re.compile(r"metadata\.google\.internal", re.I),
            re.compile(r"169\.254\.169\.254"),
            re.compile(r"metadata\.amazonaws\.com", re.I),
            re.compile(r"metadata\.azure\.com", re.I),
            re.compile(r"metadata\.tencentyun\.com", re.I),
            re.compile(r"field(?:_|\.)internal\.taobao\.com", re.I),
            re.compile(r"100\.100\.100\.204"),
            re.compile(r"dict://"),
            re.compile(r"gopher://"),
            re.compile(r"file://"),
        ]

        self.url_pattern = re.compile(r"https?://[^\s'\"]+", re.I)

    def inspect(self, value: str) -> int:
        score = 0

        for pattern in self.strong_patterns:
            if pattern.search(value):
                score += 75

        if re.search(r"https?://localhost", value, re.I):
            score += 75
        elif re.search(r"localhost", value, re.I):
            score += 25

        url_matches = self.url_pattern.findall(value) or []
        url_matches = " ".join(url_matches)
        for ip_pattern in self.internal_ips:
            if re.search(ip_pattern, url_matches):
                score += 90
            elif re.search(ip_pattern, value):
                score += 30

        if re.search(r"(?:curl|wget|file_get_contents|fopen|fsockopen)\s*\(?\s*['\"]?(?:https?|ftp)://", value, re.I):
            score += 40

        return min(score, 100)

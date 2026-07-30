import re


class SSTIDetector:

    def __init__(self):
        self.patterns = [
            re.compile(r"\{\{.*\}\}"),
            re.compile(r"\$\{.*\}"),
            re.compile(r"\{%.*%\}"),
            re.compile(r"#\{.*\}"),
            re.compile(r"<%=.*%>"),
            re.compile(r"\$\!\{.*\}"),
            re.compile(r"@\{.*\}"),
            re.compile(r"\{\/\*.*\*\/\}"),
            re.compile(r"\{#.*#\}"),
            re.compile(r"\.class\b"),
            re.compile(r"\.forName\b"),
            re.compile(r"\.getRuntime\b"),
            re.compile(r"\.exec\s*\("),
            re.compile(r"\.eval\s*\("),
            re.compile(r"\.execScript\s*\("),
            re.compile(r"\.invoke\s*\("),
            re.compile(r"__class__"),
            re.compile(r"__subclasses__"),
            re.compile(r"__mro__"),
            re.compile(r"__globals__"),
            re.compile(r"__builtins__"),
            re.compile(r"__import__"),
            re.compile(r"os\.popen"),
            re.compile(r"subprocess\.Popen"),
            re.compile(r"base64\.b64decode"),
            re.compile(r"self\.__dict__"),
        ]

    def inspect(self, value: str) -> int:
        score = 0
        for pattern in self.patterns:
            if pattern.search(value):
                score += 50

        combined = re.search(r"\{\{.*(?:__class__|__subclasses__|__globals__|os\.|subprocess|exec|eval).*\}\}", value)
        if combined:
            score = 95

        return min(score, 100)

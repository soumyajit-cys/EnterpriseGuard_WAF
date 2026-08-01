import re


class FileUploadDetector:
    """Scores multipart uploads carrying executable scripts or disguised
    file types (double extensions, mismatched magic bytes)."""

    DANGEROUS_EXTENSIONS = (
        ".php", ".php3", ".php5", ".php7", ".phtml", ".phar",
        ".jsp", ".jspx", ".jspf", ".asp", ".aspx", ".ashx",
        ".exe", ".bat", ".cmd", ".sh", ".bash", ".py", ".cgi",
        ".pl", ".htaccess", ".shtml", ".dll", ".so",
    )

    def __init__(self):
        self._filename = re.compile(
            r'filename\s*=\s*["\']([^"\']+)["\']', re.I
        )
        self._script_markers = [
            re.compile(r"<\?php", re.I),
            re.compile(r"<%[\s@]", re.I),
            re.compile(r"#!\s*/bin/(ba)?sh", re.I),
            re.compile(r"powershell\s+-", re.I),
            re.compile(r"<script\s+language\s*=\s*['\"]?(php|jscript|vbscript)", re.I),
        ]

    def _extensions(self, filename: str) -> list[str]:
        lowered = filename.lower().replace("\\", "/").split("/")[-1]
        parts = lowered.split(".")
        if len(parts) < 2:
            return []
        return [f".{p}" for p in parts[1:]]

    def inspect(self, source_value: str) -> int:
        score = 0

        if not source_value:
            return 0

        is_multipart = (
            "content-disposition" in source_value.lower()
            or "filename=" in source_value.lower()
        )

        if not is_multipart:
            return 0

        for match in self._filename.finditer(source_value):
            filename = match.group(1)
            exts = self._extensions(filename)
            for ext in exts:
                if ext in self.DANGEROUS_EXTENSIONS:
                    score = max(score, 70)
                if len(exts) > 1 and ext != exts[-1] and ext in self.DANGEROUS_EXTENSIONS:
                    score = max(score, 75)

        if score > 0:
            for marker in self._script_markers:
                if marker.search(source_value):
                    score = max(score, 90)
                    break

        return score

import re


class HTTPRequestSmugglingDetector:
    """Detects HTTP request smuggling / desync indicators (CL.TE, TE.CL,
    duplicate or conflicting framing headers)."""

    def __init__(self):
        self._te_pattern = re.compile(r"^\s*transfer-encoding\s*:", re.I)
        self._cl_pattern = re.compile(r"^\s*content-length\s*:", re.I)

    def inspect_headers(self, headers) -> int:
        if not headers:
            return 0

        content_lengths: list[str] = []
        transfer_encodings: list[str] = []

        for key, value in headers.items():
            lkey = key.lower()
            if lkey == "content-length":
                content_lengths.append(value.strip())
            elif lkey == "transfer-encoding":
                transfer_encodings.append(value.strip())

        score = 0

        if transfer_encodings and content_lengths:
            score = max(score, 90)

        if len(content_lengths) > 1 and len(set(content_lengths)) > 1:
            score = max(score, 85)

        if len(transfer_encodings) > 1:
            score = max(score, 90)

        for te in transfer_encodings:
            parts = [p.strip().lower() for p in re.split(r"[,\s]+", te) if p.strip()]
            if parts and any(p != "chunked" for p in parts):
                score = max(score, 80)

        return score

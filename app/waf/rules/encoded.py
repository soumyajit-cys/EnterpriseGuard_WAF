import base64
import binascii
import html
import re

import re as _re

_HEX_CHARS = _re.compile(r"^[0-9a-fA-F\s]+$")
_B64_LIKE = _re.compile(r"^[A-Za-z0-9+/=\s]{12,}$")
_UNICODE_ESCAPE = _re.compile(r"\\u[0-9a-fA-F]{4}")
_HTML_ENTITY = _re.compile(r"&#x?[0-9a-fA-F]{1,6};|&[a-zA-Z]{1,8};")
_MULTI_ENCODED = _re.compile(r"%25|%252[0-7]|&#37;")


def decode_candidates(value: str, max_candidates: int = 12) -> list[dict]:
    """Returns [{kind, value}] decoded variants of a WAF input string."""
    candidates: list[dict] = []
    if not value:
        return candidates

    seen = set()
    stripped = value.strip()

    def add(kind: str, decoded: str):
        if not decoded or len(decoded) > 4096:
            return
        key = f"{kind}:{decoded}"
        if decoded == value or decoded == stripped or key in seen:
            return
        seen.add(key)
        if len(candidates) < max_candidates:
            candidates.append({"kind": kind, "value": decoded})

    if _B64_LIKE.match(stripped.replace("\n", "").replace("\r", "")):
        try:
            raw = base64.b64decode(stripped, validate=False)
            text = raw.decode("utf-8", errors="ignore")
            if any(ord(c) < 32 and c not in "\t\n\r" for c in text) is False and len(text) >= 4:
                add("base64", text)
        except (binascii.Error, ValueError):
            pass

    compact = re.sub(r"\s+", "", stripped)
    if _HEX_CHARS.match(compact) and len(compact) >= 8 and len(compact) % 2 == 0:
        try:
            raw = bytes.fromhex(compact)
            text = raw.decode("utf-8", errors="ignore")
            if len(text) >= 4:
                add("hex", text)
        except ValueError:
            pass

    if _UNICODE_ESCAPE.search(value):
        try:
            text = value.encode("utf-8").decode("unicode_escape", errors="ignore")
            add("unicode_escape", text)
        except Exception:
            pass

    if _HTML_ENTITY.search(value):
        try:
            text = html.unescape(value)
            add("html_entity", text)
        except Exception:
            pass

    if _MULTI_ENCODED.search(value):
        from urllib.parse import unquote
        once = unquote(value)
        twice = unquote(once)
        add("double_url_decode", twice)

    return candidates

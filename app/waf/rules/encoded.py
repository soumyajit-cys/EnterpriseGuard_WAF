import base64
import binascii
import html
import re
import unicodedata
from urllib.parse import unquote

import re as _re

_HEX_CHARS = _re.compile(r"^[0-9a-fA-F\s]+$")
_B64_LIKE = _re.compile(r"^[A-Za-z0-9+/=\s]{12,}$")
_UNICODE_ESCAPE = _re.compile(r"\\u[0-9a-fA-F]{4}")
_HTML_ENTITY = _re.compile(r"&#x?[0-9a-fA-F]{1,6};|&[a-zA-Z]{1,8};")

_MAX_DECODED_LEN = 4096


def _single_pass_decoders(value: str):
    """Yield (kind, decoded) pairs for one decoding pass over ``value``."""
    for run in _re.finditer(r"[A-Za-z0-9+/]{8,}={0,2}", value):
        token = run.group(0)
        if not _B64_LIKE.match(token):
            continue
        try:
            raw = base64.b64decode(token, validate=False)
            text = raw.decode("utf-8", errors="ignore")
            if len(text) >= 4:
                yield ("base64", text)
        except (binascii.Error, ValueError):
            pass

    for run in _re.finditer(r"[0-9a-fA-F]{8,}", value):
        token = run.group(0)
        if len(token) % 2 != 0:
            continue
        try:
            raw = bytes.fromhex(token)
            text = raw.decode("utf-8", errors="ignore")
            if len(text) >= 4:
                yield ("hex", text)
        except ValueError:
            pass

    if _UNICODE_ESCAPE.search(value):
        try:
            text = value.encode("utf-8").decode("unicode_escape", errors="ignore")
            yield ("unicode_escape", text)
        except Exception:
            pass

    if _HTML_ENTITY.search(value):
        try:
            text = html.unescape(value)
            yield ("html_entity", text)
        except Exception:
            pass

    once = unquote(value)
    if once != value:
        yield ("url_decode", once)


def decode_candidates(
    value: str,
    max_candidates: int = 12,
    max_passes: int = 3,
) -> list[dict]:
    """Returns [{kind, value}] decoded variants of a WAF input string.

    Decoding is iterative: each decoded candidate is itself passed through
    the decoders again, so nested encodings (URL-encoded base64, base64 of
    URL-encoded text, double URL encoding, ...) are uncovered. The number of
    passes and total candidates are capped to bound CPU cost on crafted
    inputs. A Unicode NFKC normalization pass is included as a candidate so
    fullwidth/homoglyph characters (e.g. fullwidth ``<`` U+FF1C) normalize
    to their ASCII equivalents before signature matching.
    """
    candidates: list[dict] = []
    if not value:
        return candidates

    seen = set()
    stripped = value.strip()

    def add(kind: str, decoded: str) -> bool:
        if not decoded or len(decoded) > _MAX_DECODED_LEN:
            return False
        key = f"{kind}:{decoded}"
        if decoded == value or decoded == stripped or key in seen:
            return False
        seen.add(key)
        if len(candidates) < max_candidates:
            candidates.append({"kind": kind, "value": decoded})
            return True
        return False

    try:
        normalized = unicodedata.normalize("NFKC", stripped)
        add("nfkc", normalized)
    except Exception:
        pass

    frontier = [("raw", stripped)]
    for _ in range(max_passes):
        next_frontier = []
        for _, source in frontier:
            for kind, decoded in _single_pass_decoders(source):
                if len(candidates) >= max_candidates:
                    return candidates
                if add(kind, decoded):
                    next_frontier.append((kind, decoded))
        if not next_frontier:
            break
        frontier = next_frontier

    return candidates
from app.core.config import settings

_DEFAULT = settings.WAF_MODE if settings.WAF_MODE in ("detection", "prevention") else "detection"


class WAFMode:
    """In-memory WAF mode, kept in sync with the DB by RuntimeSyncService."""

    def __init__(self):
        self._mode = _DEFAULT

    def get(self) -> str:
        return self._mode

    def set(self, mode: str):
        if mode in ("detection", "prevention"):
            self._mode = mode

    @property
    def is_prevention(self) -> bool:
        return self._mode == "prevention"


waf_mode = WAFMode()

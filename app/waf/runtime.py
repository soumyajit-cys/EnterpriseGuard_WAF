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


class BuiltinRuleState:
    """Enabled state of the 16 built-in detectors, kept in sync with the
    rules table by RuntimeSyncService. Unsynced detectors default to
    enabled so a fresh process behaves like the always-on engine."""

    def __init__(self):
        self._enabled: dict[str, bool] = {}

    def sync(self, state: dict[str, bool]):
        self._enabled = state

    def is_enabled(self, attack_type: str) -> bool:
        return self._enabled.get(attack_type, True)

    def count(self) -> int:
        return len(self._enabled)


waf_mode = WAFMode()
builtin_rules = BuiltinRuleState()

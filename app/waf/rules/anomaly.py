import json
import math

from app.core.redis_client import redis_client


def shannon_entropy(value: str) -> float:
    """Shannon entropy (bits per character) of a string.

    High entropy is a marker for encoded/obfuscated payloads (base64,
    hex dumps, random token stuffing); very low entropy is not penalized.
    """
    if not value:
        return 0.0
    length = len(value)
    counts: dict[str, int] = {}
    for ch in value:
        counts[ch] = counts.get(ch, 0) + 1
    entropy = 0.0
    for count in counts.values():
        p = count / length
        entropy -= p * math.log2(p)
    return entropy


class AnomalyDetector:
    """Structural (non-signature) anomaly scoring.

    Two signals feed the score:

    * ``inspect`` — a stateless heuristic on a single value (absolute
      entropy / length outliers). Works with no state at all.
    * ``score_and_update`` — compares a field against its per
      route+field rolling baseline stored in Redis (exponential moving
      average with a TTL window), then folds the sample into the
      baseline so it adapts over time.

    The detector never blocks on its own; the WAF engine adds its output
    as one contributing signal to the additive severity score.
    """

    BASELINE_TTL = 3600
    ALPHA = 0.2

    def __init__(self, redis=None):
        self._redis = redis or redis_client

    def inspect(self, value: str) -> int:
        if not value:
            return 0
        score = 0
        entropy = shannon_entropy(value)
        if len(value) >= 12:
            if entropy >= 7.0:
                score += 35
            elif entropy >= 6.0:
                score += 20
        if len(value) >= 4000:
            score += 20
        elif len(value) >= 2000:
            score += 10
        return min(score, 60)

    def _baseline_key(self, route: str, field: str) -> str:
        return f"anom_baseline:{route}:{field}"

    async def _load_baseline(self, key: str) -> dict | None:
        raw = await self._redis.get(key)
        if not raw:
            return None
        try:
            data = json.loads(raw)
            if "n" in data and "size_avg" in data and "entropy_avg" in data:
                return data
        except (TypeError, ValueError):
            pass
        return None

    async def _save_baseline(self, key: str, baseline: dict) -> None:
        await self._redis.setex(key, self.BASELINE_TTL, json.dumps(baseline))

    def _score_deviation(
        self,
        value_len: int,
        entropy: float,
        baseline: dict,
    ) -> int:
        avg_size = max(float(baseline["size_avg"]), 1.0)
        avg_entropy = float(baseline["entropy_avg"])
        size_dev = (value_len - avg_size) / avg_size
        entropy_dev = entropy - avg_entropy

        score = 0
        if size_dev >= 4.0:
            score += 30
        elif size_dev >= 2.0:
            score += 15
        if entropy_dev >= 1.5:
            score += 25
        elif entropy_dev >= 0.8:
            score += 12
        if entropy >= 7.2:
            score += 15
        return min(score, 60)

    async def score_and_update(
        self,
        route: str,
        field: str,
        value: str,
    ) -> int:
        """Compare ``value`` against the route+field baseline, update the
        baseline, and return an anomaly score (0-60). Fails open (0) when
        Redis is unavailable."""
        if not value:
            return 0

        key = self._baseline_key(route, field)
        baseline = await self._load_baseline(key)

        entropy = shannon_entropy(value)
        if baseline is None:
            baseline = {
                "n": 0,
                "size_avg": float(len(value)),
                "entropy_avg": entropy,
            }
        else:
            baseline["n"] += 1
            baseline["size_avg"] = (
                baseline["size_avg"]
                + (len(value) - baseline["size_avg"]) * self.ALPHA
            )
            baseline["entropy_avg"] = (
                baseline["entropy_avg"]
                + (entropy - baseline["entropy_avg"]) * self.ALPHA
            )

        score = self._score_deviation(len(value), entropy, baseline)

        try:
            await self._save_baseline(key, baseline)
        except Exception:
            pass

        return score


anomaly_detector = AnomalyDetector()
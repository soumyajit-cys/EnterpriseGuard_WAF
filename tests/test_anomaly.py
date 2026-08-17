"""Tests for the anomaly-scoring signal (app/waf/rules/anomaly.py).

The rolling baselines live in Redis via the SafeRedis wrapper; unit tests
inject a fake in-memory client so they run without infrastructure. The
engine integration test monkeypatches the module-level detector to prove
the score is additive.
"""

import pytest

from app.waf.engine import WAFEngine
from app.waf.rules.anomaly import AnomalyDetector, shannon_entropy


class FakeRedis:
    def __init__(self):
        self.store = {}

    async def get(self, key):
        return self.store.get(key)

    async def setex(self, key, seconds, value):
        self.store[key] = value


class BrokenRedis:
    async def get(self, key):
        raise ConnectionError("redis down")

    async def setex(self, key, seconds, value):
        raise ConnectionError("redis down")


class TestShannonEntropy:
    def test_empty_is_zero(self):
        assert shannon_entropy("") == 0.0

    def test_single_repeated_char_is_zero(self):
        assert shannon_entropy("aaaa") == 0.0

    def test_high_variety_is_high(self):
        assert shannon_entropy("".join(chr(32 + (i * 37) % 220) for i in range(5000))) > 7.0


class TestAnomalyDetector:
    def test_inspect_scores_high_entropy(self):
        detector = AnomalyDetector(redis=FakeRedis())
        high = "".join(chr(32 + (i * 37) % 220) for i in range(5000))
        assert detector.inspect(high) >= 35

    def test_inspect_ignores_short_plain_values(self):
        detector = AnomalyDetector(redis=FakeRedis())
        assert detector.inspect("hello world") == 0

    @pytest.mark.asyncio
    async def test_first_sample_scores_zero_and_seeds_baseline(self):
        fake = FakeRedis()
        detector = AnomalyDetector(redis=fake)
        score = await detector.score_and_update("/api", "query", "q=hello")
        assert score == 0
        assert len(fake.store) == 1

    @pytest.mark.asyncio
    async def test_normal_traffic_not_penalized(self):
        fake = FakeRedis()
        detector = AnomalyDetector(redis=fake)
        for _ in range(10):
            await detector.score_and_update("/api", "query", "q=hello+world")
        score = await detector.score_and_update("/api", "query", "q=another+normal")
        assert score == 0

    @pytest.mark.asyncio
    async def test_outlier_relative_to_baseline_scores_higher(self):
        fake = FakeRedis()
        detector = AnomalyDetector(redis=fake)
        for _ in range(10):
            await detector.score_and_update("/api", "body", "name=alice")
        outlier = "".join(chr(32 + (i * 37) % 220) for i in range(5000))
        score = await detector.score_and_update("/api", "body", outlier)
        assert score >= 30

    @pytest.mark.asyncio
    async def test_redis_outage_fails_open(self):
        detector = AnomalyDetector(redis=BrokenRedis())
        score = await detector.score_and_update("/api", "body", "x" * 100)
        assert score == 0

    @pytest.mark.asyncio
    async def test_corrupt_baseline_recovers(self):
        fake = FakeRedis()
        fake.store["anom_baseline:/api:query"] = "{not json"
        detector = AnomalyDetector(redis=fake)
        score = await detector.score_and_update("/api", "query", "q=hi")
        assert score == 0


class TestEngineIntegration:
    @pytest.mark.asyncio
    async def test_anomaly_score_contributes_to_effective_score(
        self, request_factory, monkeypatch
    ):
        class FakeAnomaly:
            async def score_and_update(self, route, field, value):
                return 40

        monkeypatch.setattr("app.waf.engine.anomaly_detector", FakeAnomaly())

        async def _noop_log(*args, **kwargs):
            return None

        monkeypatch.setattr("app.waf.engine.request_logger.log", _noop_log)
        monkeypatch.setattr("app.waf.engine.traffic_stream.broadcast", _noop_log)

        req = request_factory(query="q=hello+world")
        result = await WAFEngine().inspect(req)
        assert result["findings"] == []
        assert result["score"] == 20

    @pytest.mark.asyncio
    async def test_zero_anomaly_does_not_penalize(
        self, request_factory, monkeypatch
    ):
        class FakeAnomaly:
            async def score_and_update(self, route, field, value):
                return 0

        monkeypatch.setattr("app.waf.engine.anomaly_detector", FakeAnomaly())

        async def _noop_log(*args, **kwargs):
            return None

        monkeypatch.setattr("app.waf.engine.request_logger.log", _noop_log)
        monkeypatch.setattr("app.waf.engine.traffic_stream.broadcast", _noop_log)

        req = request_factory(query="q=hello+world")
        result = await WAFEngine().inspect(req)
        assert result["score"] == 0
        assert result["block"] is False
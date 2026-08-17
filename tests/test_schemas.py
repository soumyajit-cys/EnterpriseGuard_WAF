"""Tests for request-body schema validation on the dict-typed routes.

Unit tests assert the Pydantic models reject invalid payloads (the same
ValidationError FastAPI maps to HTTP 422), and one HTTP-level test covers
the unauthenticated /public/playground/test endpoint end to end.
"""

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.api.routes.public_stats import router as public_router
from app.schemas.rule import RuleCreate, RuleUpdate
from app.schemas.settings import SettingsUpdate, WebhookTestRequest
from app.schemas.waf import AllowedIPCreate, BlockedIPCreate, PlaygroundTestRequest


class TestRuleCreate:
    def test_valid_rule_accepted(self):
        rule = RuleCreate(
            name="Block SQLi",
            severity="high",
            priority=80,
            pattern=r"union\s+select",
        )
        assert rule.name == "Block SQLi"
        assert rule.pattern == r"union\s+select"

    def test_invalid_regex_rejected(self):
        with pytest.raises(ValidationError):
            RuleCreate(name="Broken", pattern="([unclosed")

    def test_invalid_severity_rejected(self):
        with pytest.raises(ValidationError):
            RuleCreate(name="X", severity="severe")

    def test_priority_out_of_range_rejected(self):
        with pytest.raises(ValidationError):
            RuleCreate(name="X", priority=500)

    def test_empty_name_rejected(self):
        with pytest.raises(ValidationError):
            RuleCreate(name="")

    def test_update_allows_partial_payload(self):
        rule = RuleUpdate(severity="critical")
        assert rule.model_dump(exclude_unset=True) == {"severity": "critical"}


class TestBlockedIPCreate:
    def test_valid_ip_normalized(self):
        payload = BlockedIPCreate(ip_address="203.0.113.7", reason="scanning")
        assert payload.ip_address == "203.0.113.7"

    def test_invalid_ip_rejected(self):
        with pytest.raises(ValidationError):
            BlockedIPCreate(ip_address="not-an-ip")

    def test_negative_duration_rejected(self):
        with pytest.raises(ValidationError):
            BlockedIPCreate(ip_address="203.0.113.7", duration_hours=-1)


class TestAllowedIPCreate:
    def test_valid_ip_accepted(self):
        payload = AllowedIPCreate(ip_address="10.0.0.5", description="office")
        assert payload.ip_address == "10.0.0.5"

    def test_invalid_ip_rejected(self):
        with pytest.raises(ValidationError):
            AllowedIPCreate(ip_address="999.1.1.1")


class TestPlaygroundTestRequest:
    def test_defaults_match_previous_contract(self):
        payload = PlaygroundTestRequest()
        assert payload.input == ""
        assert payload.source == "query"
        assert payload.headers == {}
        assert payload.body is None

    def test_oversized_input_rejected(self):
        with pytest.raises(ValidationError):
            PlaygroundTestRequest(input="A" * 4097)

    def test_oversized_body_rejected(self):
        with pytest.raises(ValidationError):
            PlaygroundTestRequest(body="B" * 4097)

    def test_invalid_source_rejected(self):
        with pytest.raises(ValidationError):
            PlaygroundTestRequest(source="cookie")


class TestSettingsUpdate:
    def test_flat_dict_accepted(self):
        payload = SettingsUpdate.model_validate({"webhook_url": "https://x", "enabled": True})
        assert payload.root["webhook_url"] == "https://x"

    def test_nested_values_rejected(self):
        with pytest.raises(ValidationError):
            SettingsUpdate.model_validate({"webhook_url": {"inner": 1}})


class TestWebhookTestRequest:
    def test_valid_accepted(self):
        payload = WebhookTestRequest(url="https://hooks.example.com/x")
        assert payload.type == "generic"

    def test_unknown_type_rejected(self):
        with pytest.raises(ValidationError):
            WebhookTestRequest(url="https://x", type="carrier-pigeon")

    def test_empty_url_rejected(self):
        with pytest.raises(ValidationError):
            WebhookTestRequest(url="")


@pytest.mark.asyncio
class TestPublicPlaygroundEndpoint:
    @pytest.fixture
    def client(self):
        app = FastAPI()
        app.include_router(public_router)
        return AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        )

    async def test_valid_payload_scores_200(self, client):
        async with client as c:
            resp = await c.post(
                "/public/playground/test",
                json={"input": "' OR 1=1 --", "source": "query"},
            )
        assert resp.status_code == 200
        assert resp.json()["verdict"] in {"BLOCK", "ALLOW"}

    async def test_oversized_input_returns_422(self, client):
        async with client as c:
            resp = await c.post(
                "/public/playground/test",
                json={"input": "A" * 4097},
            )
        assert resp.status_code == 422

    async def test_invalid_source_returns_422(self, client):
        async with client as c:
            resp = await c.post(
                "/public/playground/test",
                json={"input": "x", "source": "cookie"},
            )
        assert resp.status_code == 422

    async def test_empty_body_returns_422(self, client):
        async with client as c:
            resp = await c.post("/public/playground/test", json={})
        assert resp.status_code == 200
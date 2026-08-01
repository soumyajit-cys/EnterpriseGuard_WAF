"""Tests for the webhook service (payload formatting + delivery gating)."""

import pytest

from app.services import webhook_service
from app.services.webhook_service import _format_payload

ALERT = {
    "severity": "high",
    "source": "SQL_INJECTION",
    "ip_address": "203.0.113.7",
    "message": "SQLi payload blocked on /login",
}


class TestPayloadFormatting:
    def test_generic_payload_has_text(self):
        payload = _format_payload("alert.created", "generic", ALERT)
        assert payload["text"].startswith("**[EnterpriseGuard WAF] HIGH alert**")
        assert "203.0.113.7" in payload["text"]
        assert "SQLi payload blocked" in payload["text"]

    def test_slack_payload_has_blocks(self):
        payload = _format_payload("alert.created", "slack", ALERT)
        assert payload["blocks"][0]["text"]["text"].startswith("🚨")
        assert payload["blocks"][1]["fields"][0]["text"].endswith("SQL_INJECTION")

    def test_discord_payload_has_embed_with_color(self):
        payload = _format_payload("alert.created", "discord", ALERT)
        embed = payload["embeds"][0]
        assert embed["color"] == 0xF97316
        assert embed["title"] == "HIGH WAF alert"

    def test_discord_color_by_severity(self):
        for severity, color in (
            ("critical", 0xEF4444),
            ("high", 0xF97316),
            ("medium", 0xEAB308),
            ("low", 0x22C55E),
        ):
            payload = _format_payload(
                "alert.created", "discord", {**ALERT, "severity": severity}
            )
            assert payload["embeds"][0]["color"] == color

    def test_telegram_payload_has_text(self):
        payload = _format_payload("alert.created", "telegram", ALERT)
        assert "EnterpriseGuard WAF" in payload["text"]

    def test_unknown_type_falls_back_to_generic(self):
        payload = _format_payload("alert.created", "teams", ALERT)
        assert "text" in payload


class TestSendAlertGating:
    @pytest.mark.asyncio
    async def test_disabled_webhooks_skip(self, monkeypatch):
        async def fake_load():
            return {"webhook_enabled": "false"}

        monkeypatch.setattr(webhook_service, "_load_settings", fake_load)
        assert await webhook_service.send_alert("alert.created", ALERT) is False

    @pytest.mark.asyncio
    async def test_missing_url_skips(self, monkeypatch):
        async def fake_load():
            return {"webhook_enabled": "true", "webhook_url": "  "}

        monkeypatch.setattr(webhook_service, "_load_settings", fake_load)
        assert await webhook_service.send_alert("alert.created", ALERT) is False

    @pytest.mark.asyncio
    async def test_severity_below_threshold_skips(self, monkeypatch):
        async def fake_load():
            return {
                "webhook_enabled": "true",
                "webhook_url": "https://example.invalid/hook",
                "webhook_events": "critical",
            }

        monkeypatch.setattr(webhook_service, "_load_settings", fake_load)
        assert await webhook_service.send_alert("alert.created", ALERT) is False

    @pytest.mark.asyncio
    async def test_delivery_success(self, monkeypatch):
        async def fake_load():
            return {
                "webhook_enabled": "true",
                "webhook_url": "https://example.invalid/hook",
                "webhook_events": "high",
            }

        monkeypatch.setattr(webhook_service, "_load_settings", fake_load)

        class FakeResponse:
            status_code = 200

        class FakeClient:
            def __init__(self, *a, **k):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *a):
                return False

            async def post(self, url, json=None):
                assert url == "https://example.invalid/hook"
                assert "HIGH" in json.get("text", "") or json.get("text")
                return FakeResponse()

        monkeypatch.setattr(webhook_service.httpx, "AsyncClient", FakeClient)
        assert await webhook_service.send_alert("alert.created", ALERT) is True

    @pytest.mark.asyncio
    async def test_delivery_http_error_fails(self, monkeypatch):
        async def fake_load():
            return {
                "webhook_enabled": "true",
                "webhook_url": "https://example.invalid/hook",
                "webhook_events": "low",
            }

        monkeypatch.setattr(webhook_service, "_load_settings", fake_load)

        class FakeResponse:
            status_code = 500

        class FakeClient:
            def __init__(self, *a, **k):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *a):
                return False

            async def post(self, url, json=None):
                return FakeResponse()

        monkeypatch.setattr(webhook_service.httpx, "AsyncClient", FakeClient)
        assert await webhook_service.send_alert("alert.created", ALERT) is False

    @pytest.mark.asyncio
    async def test_delivery_exception_fails(self, monkeypatch):
        async def fake_load():
            return {
                "webhook_enabled": "true",
                "webhook_url": "https://example.invalid/hook",
                "webhook_events": "low",
            }

        monkeypatch.setattr(webhook_service, "_load_settings", fake_load)

        class FakeClient:
            def __init__(self, *a, **k):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *a):
                return False

            async def post(self, url, json=None):
                raise TimeoutError("boom")

        monkeypatch.setattr(webhook_service.httpx, "AsyncClient", FakeClient)
        assert await webhook_service.send_alert("alert.created", ALERT) is False

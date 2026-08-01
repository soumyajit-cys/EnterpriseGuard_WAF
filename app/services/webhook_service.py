import asyncio
import logging

import httpx

from app.core.database import AsyncSessionLocal

logger = logging.getLogger("waf.webhooks")

DEFAULT_KEYS = {
    "webhook_url": "",
    "webhook_type": "generic",
    "webhook_enabled": "false",
    "webhook_events": "critical",
}


async def _load_settings() -> dict:
    from app.repositories.settings_repository import SettingsRepository

    repo = SettingsRepository()
    try:
        async with AsyncSessionLocal() as db:
            stored = await repo.get_all(db)
    except Exception:
        stored = {}
    return {**DEFAULT_KEYS, **stored}


def _format_payload(event_type: str, webhook_type: str, alert: dict) -> dict | str:
    severity = alert.get("severity", "low").upper()
    title = f"[EnterpriseGuard WAF] {severity} alert"
    text = (
        f"**{title}**\n"
        f"- **Source:** {alert.get('source') or 'WAF'}\n"
        f"- **IP:** {alert.get('ip_address') or 'unknown'}\n"
        f"- **Message:** {alert.get('message', '')}\n"
        f"- **Event:** {event_type}"
    )

    if webhook_type == "slack":
        return {
            "text": text,
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"🚨 {severity} WAF alert",
                    },
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Source:* {alert.get('source') or 'WAF'}"},
                        {"type": "mrkdwn", "text": f"*IP:* {alert.get('ip_address') or 'unknown'}"},
                        {"type": "mrkdwn", "text": f"*Event:* {event_type}"},
                        {"type": "mrkdwn", "text": "*Message:*"},
                    ],
                },
                {"type": "section", "text": {"type": "mrkdwn", "text": alert.get("message", "")}},
                {"type": "divider"},
                {"type": "context", "elements": [{"type": "mrkdwn", "text": "EnterpriseGuard WAF"}]},
            ],
        }
    if webhook_type == "discord":
        color_map = {"critical": 0xEF4444, "high": 0xF97316, "medium": 0xEAB308, "low": 0x22C55E}
        return {
            "embeds": [
                {
                    "title": f"{severity} WAF alert",
                    "description": alert.get("message", ""),
                    "color": color_map.get(alert.get("severity", "low"), 0x3B82F6),
                    "fields": [
                        {"name": "Source", "value": alert.get("source") or "WAF", "inline": True},
                        {"name": "IP", "value": alert.get("ip_address") or "unknown", "inline": True},
                        {"name": "Event", "value": event_type, "inline": True},
                    ],
                    "footer": {"text": "EnterpriseGuard WAF"},
                }
            ]
        }
    if webhook_type == "telegram":
        return {"text": text}

    return {"text": text}


async def send_alert(event_type: str, alert: dict) -> bool:
    settings = await _load_settings()
    if settings.get("webhook_enabled") != "true":
        return False

    url = settings.get("webhook_url", "").strip()
    if not url:
        return False

    min_severity = settings.get("webhook_events", "critical")
    order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    if order.get(alert.get("severity", "low"), 0) < order.get(min_severity, 4):
        return False

    payload = _format_payload(event_type, settings.get("webhook_type", "generic"), alert)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, json=payload)
            return resp.status_code < 400
    except Exception as exc:
        logger.warning("Webhook delivery failed: %s", exc)
        return False


def fire_alert_webhook(event_type: str, alert: dict):
    try:
        asyncio.get_event_loop().create_task(send_alert(event_type, alert))
    except RuntimeError:
        pass


async def test_webhook(url: str, webhook_type: str) -> tuple[bool, str]:
    payload = _format_payload(
        "test",
        webhook_type,
        {
            "severity": "low",
            "source": "EnterpriseGuard WAF",
            "ip_address": "127.0.0.1",
            "message": "Test webhook — EnterpriseGuard WAF is live.",
        },
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code < 400:
                return True, f"Delivered (HTTP {resp.status_code})"
            return False, f"Webhook rejected (HTTP {resp.status_code})"
    except Exception as exc:
        return False, f"Delivery failed: {exc}"

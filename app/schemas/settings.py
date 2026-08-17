from typing import Literal

from pydantic import BaseModel, Field, RootModel

SettingsValue = str | int | float | bool


class SettingsUpdate(RootModel[dict[str, SettingsValue]]):
    """Flat key/value settings body (preserves the historical
    ``PUT /settings/`` contract while validating the value types)."""


class WebhookTestRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048)
    type: Literal["generic", "slack", "discord", "telegram"] = "generic"
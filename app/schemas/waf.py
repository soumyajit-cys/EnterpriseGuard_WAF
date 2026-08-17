from ipaddress import ip_address
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class BlockedIPCreate(BaseModel):
    ip_address: str
    reason: str | None = Field(None, max_length=500)
    is_permanent: bool = False
    duration_hours: int | None = Field(None, gt=0, le=8760)

    @field_validator("ip_address")
    @classmethod
    def validate_ip_address(cls, v: str) -> str:
        try:
            return str(ip_address(v))
        except ValueError as exc:
            raise ValueError(f"Invalid IP address: {v}") from exc


class AllowedIPCreate(BaseModel):
    ip_address: str
    description: str | None = Field(None, max_length=500)

    @field_validator("ip_address")
    @classmethod
    def validate_ip_address(cls, v: str) -> str:
        try:
            return str(ip_address(v))
        except ValueError as exc:
            raise ValueError(f"Invalid IP address: {v}") from exc


class PlaygroundTestRequest(BaseModel):
    """Rule-testing playground payload (used by /waf/test and the
    unauthenticated /public/playground/test, hence the 4096-char caps)."""

    input: str = Field(default="", max_length=4096)
    source: Literal["query", "body", "path", "headers"] = "query"
    body: str | None = Field(None, max_length=4096)
    path: str | None = Field(None, max_length=2048)
    headers: dict[str, str] = Field(default_factory=dict)
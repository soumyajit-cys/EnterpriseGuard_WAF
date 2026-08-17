import re

from pydantic import BaseModel, Field, field_validator
from typing import Literal


class RuleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    enabled: bool = True
    priority: int = Field(50, ge=0, le=100)
    severity: Literal["low", "medium", "high", "critical"] = "medium"
    pattern: str | None = Field(None, max_length=1000)
    category: str | None = Field(None, max_length=100)
    rule_type: str | None = Field(None, max_length=100)

    @field_validator("pattern")
    @classmethod
    def validate_pattern(cls, v: str | None) -> str | None:
        if v:
            try:
                re.compile(v)
            except re.error as exc:
                raise ValueError(f"Invalid regex pattern: {exc}")
        return v


class RuleCreate(RuleBase):
    pass


class RuleUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    enabled: bool | None = None
    priority: int | None = Field(None, ge=0, le=100)
    severity: Literal["low", "medium", "high", "critical"] | None = None
    pattern: str | None = Field(None, max_length=1000)
    category: str | None = Field(None, max_length=100)
    rule_type: str | None = Field(None, max_length=100)

    @field_validator("pattern")
    @classmethod
    def validate_pattern(cls, v: str | None) -> str | None:
        if v:
            try:
                re.compile(v)
            except re.error as exc:
                raise ValueError(f"Invalid regex pattern: {exc}")
        return v
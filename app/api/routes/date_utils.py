from datetime import datetime

from fastapi import HTTPException


def parse_date(value: str, field: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field}. Use ISO format, e.g. 2026-08-01 or 2026-08-01T12:00:00",
        )
import json
from datetime import datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_admin
from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.api.routes.date_utils import parse_date
from app.repositories.audit_repository import AuditLogRepository

router = APIRouter(
    prefix="/audit",
    tags=["Audit"],
)

repo = AuditLogRepository()

DEFAULT_EXPORT_WINDOW_DAYS = 7

_SEVERITIES = Literal["info", "low", "medium", "high", "critical"]


def _to_ecs(log: AuditLog) -> dict:
    """Map an audit row into a minimal ECS-like shape so Splunk/ELK
    forwarders can ingest NDJSON lines without custom parsing."""
    return {
        "@timestamp": log.created_at.isoformat(),
        "event": {
            "action": log.action,
            "severity": log.severity or "info",
        },
        "source": {
            "ip": log.ip_address,
            "geo": {"country": None},
        },
        "user": {
            "id": str(log.user_id) if log.user_id is not None else None,
            "name": log.username,
        },
        "resource": log.resource,
        "details": log.details,
        "waf": {"audit_id": log.id},
    }


@router.get("/export")
async def export_audit(
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    severity: _SEVERITIES | None = Query(None),
    event_type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    """Stream the audit log as newline-delimited JSON (one event per
    line) in an ECS-like shape for SIEM ingestion."""
    now = datetime.now()
    since = (
        parse_date(start_date, "start_date")
        if start_date
        else now - timedelta(days=DEFAULT_EXPORT_WINDOW_DAYS)
    )
    until = parse_date(end_date, "end_date") if end_date else now
    if since > until:
        raise HTTPException(
            status_code=400,
            detail="start_date must be before or equal to end_date",
        )

    async def generate():
        async for row in repo.stream_filtered(
            db, since, until, severity=severity, event_type=event_type
        ):
            yield json.dumps(_to_ecs(row), default=str) + "\n"

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={
            "Content-Disposition": 'attachment; filename="audit_export.ndjson"'
        },
    )
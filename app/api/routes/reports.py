import csv
import json
import io
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.request_log import RequestLog
from app.models.alert import Alert
from app.auth.dependencies import require_admin
from app.models.user import User

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get("/generate")
async def generate_report(
    type: str = Query("traffic", regex="^(attack|traffic|alert)$"),
    format: str = Query("json", regex="^(pdf|csv|json)$"),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    now = datetime.utcnow()
    since = datetime.fromisoformat(start_date) if start_date else now - timedelta(days=7)
    until = datetime.fromisoformat(end_date) if end_date else now

    if type == "traffic" or type == "attack":
        result = await db.execute(
            select(RequestLog)
            .where(
                and_(
                    RequestLog.created_at >= since,
                    RequestLog.created_at <= until,
                )
            )
            .order_by(RequestLog.created_at.desc())
            .limit(10000)
        )
        rows = result.scalars().all()
        data = [
            {
                "id": r.id,
                "ip": r.ip_address,
                "method": r.method,
                "path": r.path,
                "action": r.action,
                "score": r.score,
                "attack_type": r.attack_type,
                "status_code": r.status_code,
                "user_agent": r.user_agent,
                "timestamp": r.created_at.isoformat() if r.created_at else "",
            }
            for r in rows
        ]
    else:
        result = await db.execute(
            select(Alert)
            .where(
                and_(
                    Alert.created_at >= since,
                    Alert.created_at <= until,
                )
            )
            .order_by(Alert.created_at.desc())
            .limit(10000)
        )
        rows = result.scalars().all()
        data = [
            {
                "id": a.id,
                "severity": a.severity,
                "message": a.message,
                "source": a.source,
                "ip_address": a.ip_address,
                "resolved": a.resolved,
                "timestamp": a.created_at.isoformat() if a.created_at else "",
            }
            for a in rows
        ]

    if format == "json":
        content = json.dumps(data, indent=2)
        media_type = "application/json"
        filename = f"{type}_report.json"
    elif format == "csv":
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        content = output.getvalue()
        media_type = "text/csv"
        filename = f"{type}_report.csv"
    else:
        content = json.dumps(data, indent=2)
        media_type = "application/json"
        filename = f"{type}_report.json"

    return StreamingResponse(
        iter([content]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

import csv
import json
import io
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.request_log import RequestLog
from app.models.alert import Alert
from app.auth.dependencies import require_admin
from app.api.routes.date_utils import parse_date
from app.models.user import User

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


_parse_date = parse_date


def _to_pdf(data: list[dict], title: str) -> bytes:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), title=title)
    styles = getSampleStyleSheet()

    elements = [Paragraph(f"EnterpriseGuard WAF — {title}", styles["Title"])]
    if not data:
        elements.append(Paragraph("No records found for the selected period.", styles["Normal"]))
    else:
        headers = list(data[0].keys())
        table_data = [headers]
        for row in data:
            table_data.append([str(row.get(h, "")) for h in headers])
        table = Table(table_data, repeatRows=1)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        elements.append(table)

    doc.build(elements)
    return buffer.getvalue()


@router.get("/generate")
async def generate_report(
    type: str = Query("traffic", regex="^(attack|traffic|alert)$"),
    format: str = Query("json", regex="^(pdf|csv|json)$"),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    now = datetime.now()
    since = _parse_date(start_date, "start_date") if start_date else now - timedelta(days=7)
    until = _parse_date(end_date, "end_date") if end_date else now

    if since > until:
        raise HTTPException(
            status_code=400,
            detail="start_date must be before or equal to end_date",
        )

    if type == "traffic" or type == "attack":
        result = await db.execute(
            select(RequestLog)
            .where(
                and_(
                    RequestLog.organization_id == current_user.organization_id,
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
        title = f"{type.upper()} Report"
    else:
        result = await db.execute(
            select(Alert)
            .where(
                and_(
                    Alert.organization_id == current_user.organization_id,
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
        title = "ALERT Report"

    filename = f"{type}_report_{now.strftime('%Y%m%d_%H%M%S')}"

    if format == "json":
        content = json.dumps(data, indent=2)
        media_type = "application/json"
        filename += ".json"
    elif format == "csv":
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        content = output.getvalue()
        media_type = "text/csv"
        filename += ".csv"
    else:
        content = _to_pdf(data, title)
        media_type = "application/pdf"
        filename += ".pdf"

    return StreamingResponse(
        iter([content]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

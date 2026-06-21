from sqlalchemy import (
    Integer,
    String,
    DateTime
)

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from datetime import datetime

from app.models.base import Base


class RequestLog(Base):

    __tablename__ = "request_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    ip_address: Mapped[str] = mapped_column(
        String(100)
    )

    path: Mapped[str] = mapped_column(
        String(500)
    )

    action: Mapped[str] = mapped_column(
        String(50)
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
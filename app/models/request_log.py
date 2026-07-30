from datetime import datetime

from sqlalchemy import Integer, String, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class RequestLog(Base):

    __tablename__ = "request_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ip_address: Mapped[str] = mapped_column(String(100), nullable=False)
    method: Mapped[str | None] = mapped_column(String(10), nullable=True)
    path: Mapped[str] = mapped_column(String(1000), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    score: Mapped[int | None] = mapped_column(Integer, default=0)
    attack_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    request_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_time: Mapped[float | None] = mapped_column(Integer, nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

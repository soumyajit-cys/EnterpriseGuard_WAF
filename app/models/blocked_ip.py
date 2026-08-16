from datetime import datetime

from sqlalchemy import Integer, String, Boolean, DateTime, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class BlockedIP(Base):

    __tablename__ = "blocked_ips"
    __table_args__ = (
        Index("ix_blocked_ips_ip", "ip_address"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ip_address: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_permanent: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

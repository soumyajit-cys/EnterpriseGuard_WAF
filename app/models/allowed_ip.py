from datetime import datetime

from sqlalchemy import Integer, String, DateTime, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AllowedIP(Base):

    __tablename__ = "allowed_ips"
    __table_args__ = (
        Index("ix_allowed_ips_ip", "ip_address"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ip_address: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

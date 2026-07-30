from datetime import datetime

from sqlalchemy import Integer, String, Boolean, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class WAFSetting(Base):

    __tablename__ = "waf_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

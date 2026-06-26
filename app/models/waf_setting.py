from sqlalchemy import String
from sqlalchemy import Integer

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.models.base import Base


class WAFSetting(Base):

    __tablename__ = "waf_settings"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    mode: Mapped[str] = mapped_column(
        String(20),
        default="detection"
    )
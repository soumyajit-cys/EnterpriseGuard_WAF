from sqlalchemy import Integer
from sqlalchemy import String

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.models.base import Base


class AllowedIP(Base):

    __tablename__ = "allowed_ips"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    ip_address: Mapped[str] = mapped_column(
        String(100),
        unique=True
    )

    
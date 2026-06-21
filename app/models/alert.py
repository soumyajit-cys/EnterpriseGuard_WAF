from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import Mapped

from app.models.base import Base


class Alert(Base):

    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    severity: Mapped[str] = mapped_column(
        String(30)
    )

    message: Mapped[str] = mapped_column(
        String(500)
    )      
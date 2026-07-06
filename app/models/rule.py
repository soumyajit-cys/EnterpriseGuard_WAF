from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import mapped_column, Mapped

from app.models.base import Base


class Rule(Base):

    __tablename__ = "rules"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    pattern: Mapped[str] = mapped_column(
        String(500)
    )

    severity: Mapped[str] = mapped_column(
        String(30),
        default="medium"
    )

    
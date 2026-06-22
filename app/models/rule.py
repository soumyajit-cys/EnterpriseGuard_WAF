from sqlalchemy import Integer
from sqlalchemy import String

from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import Mapped

from app.models.base import Base


class Rule(Base):

    __tablename__ = "rules"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(100)
    )

    enabled: Mapped[bool]
"""add is_builtin to rules

Revision ID: b3c9f0a2e5d1
Revises: d27aa81d07e2
Create Date: 2026-08-19 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b3c9f0a2e5d1"
down_revision: Union[str, None] = "d27aa81d07e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rules",
        sa.Column(
            "is_builtin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("rules", "is_builtin")
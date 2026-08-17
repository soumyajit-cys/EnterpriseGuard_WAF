"""add severity to audit logs

Revision ID: d27aa81d07e2
Revises: a1b2c3d4e5f6
Create Date: 2026-08-17 07:39:41.823888

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd27aa81d07e2'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "audit_logs",
        sa.Column(
            "severity",
            sa.String(length=30),
            nullable=True,
            server_default=sa.text("'info'"),
        ),
    )


def downgrade() -> None:
    op.drop_column("audit_logs", "severity")
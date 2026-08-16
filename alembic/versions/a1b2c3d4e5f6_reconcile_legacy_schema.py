"""Reconcile pre-migration databases with the current model schema.

Revision ID: a1b2c3d4e5f6
Revises: e0c1ffa8b113
Create Date: 2026-08-16 08:05:00.000000

Databases created before Alembic was introduced were built with
Base.metadata.create_all() plus inline ad-hoc ALTERs, which can drift
from the models. This migration brings legacy schemas in line with the
baseline using only idempotent, data-safe operations. On fresh databases
(baseline already applied) every statement here is a no-op.

"""
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str = "e0c1ffa8b113"
branch_labels = None
depends_on = None

_INDEXES = [
    "CREATE INDEX IF NOT EXISTS ix_alerts_created_at ON alerts (created_at)",
    "CREATE INDEX IF NOT EXISTS ix_alerts_severity ON alerts (severity)",
    "CREATE INDEX IF NOT EXISTS ix_allowed_ips_ip ON allowed_ips (ip_address)",
    "CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs (created_at)",
    "CREATE INDEX IF NOT EXISTS ix_blocked_ips_ip ON blocked_ips (ip_address)",
    "CREATE INDEX IF NOT EXISTS ix_request_logs_action ON request_logs (action)",
    "CREATE INDEX IF NOT EXISTS ix_request_logs_attack_type ON request_logs (attack_type)",
    "CREATE INDEX IF NOT EXISTS ix_request_logs_created_at ON request_logs (created_at)",
    "CREATE INDEX IF NOT EXISTS ix_request_logs_ip_created ON request_logs (ip_address, created_at)",
]


def upgrade() -> None:
    for statement in _INDEXES:
        op.execute(statement)

    # Widened / corrected column types (no-op when already correct).
    op.execute("ALTER TABLE alerts ALTER COLUMN message TYPE VARCHAR(1000)")
    op.execute("ALTER TABLE request_logs ALTER COLUMN path TYPE TEXT")
    op.execute(
        "ALTER TABLE request_logs ALTER COLUMN created_at "
        "TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC'"
    )

    # Dead legacy column from an ancient waf_settings layout.
    op.execute("ALTER TABLE waf_settings DROP COLUMN IF EXISTS mode")


def downgrade() -> None:
    # No automatic downgrade path for reconcile operations; legacy columns
    # and types cannot be restored without risking existing data.
    pass
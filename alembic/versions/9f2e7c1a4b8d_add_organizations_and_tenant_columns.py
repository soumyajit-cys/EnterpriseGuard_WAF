"""add organizations and tenant-scoped columns

Revision ID: 9f2e7c1a4b8d
Revises: d27aa81d07e2
Create Date: 2026-08-17 08:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f2e7c1a4b8d'
down_revision: Union[str, None] = 'd27aa81d07e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = [
    "alerts",
    "allowed_ips",
    "blocked_ips",
    "request_logs",
    "rules",
    "waf_settings",
]

# tables where organization_id stays nullable (pre-auth / platform events)
NULLABLE_TABLES = ["audit_logs", "users"]


def upgrade() -> None:
    org = op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_unique_constraint(
        "organizations_name_key", "organizations", ["name"]
    )

    op.execute(
        "INSERT INTO organizations (name, is_active) "
        "VALUES ('Default Organization', true)"
    )
    default_id = sa.table(
        "organizations",
        sa.column("id", sa.Integer),
        sa.column("name", sa.String),
    )
    conn = op.get_bind()
    result = conn.execute(
        sa.select(default_id.c.id).where(
            default_id.c.name == "Default Organization"
        )
    )
    default_org_id = result.scalar()
    if default_org_id is None:
        raise RuntimeError("Default Organization row missing after insert")

    for table in TABLES + NULLABLE_TABLES:
        op.add_column(
            table,
            sa.Column(
                "organization_id",
                sa.Integer(),
                nullable=True,
            ),
        )

    # backfill every existing row into the default org
    for table in TABLES + NULLABLE_TABLES:
        op.execute(
            f"UPDATE {table} SET organization_id = {default_org_id} "
            f"WHERE organization_id IS NULL"
        )

    for table in TABLES:
        op.alter_column(
            table,
            "organization_id",
            nullable=False,
        )

    for table in TABLES + NULLABLE_TABLES:
        op.create_foreign_key(
            f"fk_{table}_organization_id",
            table,
            "organizations",
            ["organization_id"],
            ["id"],
        )

    # replace global-unique constraints with per-org composite unique.
    # Some legacy DBs never had the global unique (e.g. the pre-Alembic
    # dev database), so the drops are conditional.
    conn = op.get_bind()

    def _has_constraint(table: str, name: str) -> bool:
        row = conn.execute(
            sa.text(
                "SELECT 1 FROM pg_constraint WHERE conrelid = to_regclass(:t) "
                "AND conname = :n"
            ),
            {"t": table, "n": name},
        )
        return row.scalar() is not None

    if _has_constraint("allowed_ips", "allowed_ips_ip_address_key"):
        op.drop_constraint("allowed_ips_ip_address_key", "allowed_ips", type_="unique")
    op.create_unique_constraint(
        "uq_allowed_ips_organization_ip", "allowed_ips", ["organization_id", "ip_address"]
    )

    if _has_constraint("blocked_ips", "blocked_ips_ip_address_key"):
        op.drop_constraint("blocked_ips_ip_address_key", "blocked_ips", type_="unique")
    op.create_unique_constraint(
        "uq_blocked_ips_organization_ip", "blocked_ips", ["organization_id", "ip_address"]
    )

    if _has_constraint("waf_settings", "waf_settings_key_key"):
        op.drop_constraint("waf_settings_key_key", "waf_settings", type_="unique")
    op.create_unique_constraint(
        "uq_waf_settings_organization_key", "waf_settings", ["organization_id", "key"]
    )

    if _has_constraint("rules", "rules_name_key"):
        op.drop_constraint("rules_name_key", "rules", type_="unique")
    op.create_unique_constraint(
        "uq_rules_organization_name", "rules", ["organization_id", "name"]
    )

    # hot-path composite indexes
    for table in ("alerts", "request_logs"):
        op.create_index(
            f"ix_{table}_organization_created",
            table,
            ["organization_id", "created_at"],
        )
    op.create_index(
        "ix_audit_logs_organization_created",
        "audit_logs",
        ["organization_id", "created_at"],
    )
    op.create_index("ix_users_organization_id", "users", ["organization_id"])

    # promote the earliest-created admin to the platform superadmin role
    op.execute(
        "UPDATE users SET role = 'superadmin' WHERE id = ("
        "  SELECT id FROM users WHERE role = 'admin' "
        "  ORDER BY created_at ASC, id ASC LIMIT 1"
        ")"
    )


def downgrade() -> None:
    for table in ("alerts", "request_logs"):
        op.drop_index(f"ix_{table}_organization_created", table_name=table)
    op.drop_index("ix_audit_logs_organization_created", table_name="audit_logs")
    op.drop_index("ix_users_organization_id", table_name="users")

    op.drop_constraint("uq_rules_organization_name", "rules", type_="unique")
    op.create_unique_constraint("rules_name_key", "rules", ["name"])

    op.drop_constraint("uq_waf_settings_organization_key", "waf_settings", type_="unique")
    op.create_unique_constraint("waf_settings_key_key", "waf_settings", ["key"])

    op.drop_constraint("uq_blocked_ips_organization_ip", "blocked_ips", type_="unique")
    op.create_unique_constraint("blocked_ips_ip_address_key", "blocked_ips", ["ip_address"])

    op.drop_constraint("uq_allowed_ips_organization_ip", "allowed_ips", type_="unique")
    op.create_unique_constraint("allowed_ips_ip_address_key", "allowed_ips", ["ip_address"])

    for table in TABLES + NULLABLE_TABLES:
        op.drop_constraint(f"fk_{table}_organization_id", table, type_="foreignkey")
        op.drop_column(table, "organization_id")

    op.drop_table("organizations")
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy import text

from app.core.config import settings
from app.models.base import Base

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    from app.models.user import User
    from app.models.rule import Rule
    from app.models.alert import Alert
    from app.models.request_log import RequestLog
    from app.models.blocked_ip import BlockedIP
    from app.models.allowed_ip import AllowedIP
    from app.models.waf_setting import WAFSetting
    from app.models.audit_log import AuditLog

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await _run_migrations()


async def _run_migrations():
    async with engine.begin() as conn:
        migrations = [
            ("users", "is_active", "BOOLEAN DEFAULT TRUE"),
            ("users", "is_verified", "BOOLEAN DEFAULT FALSE"),
            ("users", "created_at", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
            ("users", "updated_at", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
            ("rules", "priority", "INTEGER DEFAULT 50"),
            ("rules", "severity", "VARCHAR(30) DEFAULT 'medium'"),
            ("rules", "pattern", "VARCHAR(1000)"),
            ("rules", "category", "VARCHAR(100)"),
            ("rules", "rule_type", "VARCHAR(100)"),
            ("rules", "created_at", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
            ("rules", "updated_at", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
            ("request_logs", "method", "VARCHAR(10)"),
            ("request_logs", "score", "INTEGER DEFAULT 0"),
            ("request_logs", "attack_type", "VARCHAR(100)"),
            ("request_logs", "status_code", "INTEGER"),
            ("request_logs", "user_agent", "VARCHAR(500)"),
            ("request_logs", "request_body", "TEXT"),
            ("request_logs", "response_time", "INTEGER"),
            ("request_logs", "country", "VARCHAR(100)"),
            ("alerts", "source", "VARCHAR(100)"),
            ("alerts", "ip_address", "VARCHAR(100)"),
            ("alerts", "resolved", "BOOLEAN DEFAULT FALSE"),
            ("alerts", "created_at", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
            ("alerts", "resolved_at", "TIMESTAMP WITH TIME ZONE"),
            ("blocked_ips", "reason", "VARCHAR(500)"),
            ("blocked_ips", "is_permanent", "BOOLEAN DEFAULT FALSE"),
            ("blocked_ips", "expires_at", "TIMESTAMP WITH TIME ZONE"),
            ("blocked_ips", "created_at", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
            ("allowed_ips", "description", "VARCHAR(500)"),
            ("allowed_ips", "created_at", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
            ("waf_settings", "key", "VARCHAR(100) DEFAULT 'mode'"),
            ("waf_settings", "value", "TEXT DEFAULT 'detection'"),
            ("waf_settings", "description", "VARCHAR(500)"),
            ("waf_settings", "updated_at", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
        ]

        for table, column, col_type in migrations:
            try:
                await conn.execute(
                    text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type}")
                )
            except Exception:
                pass

        for table in [
            "users", "rules", "request_logs", "alerts",
            "blocked_ips", "allowed_ips", "waf_settings", "audit_logs",
        ]:
            try:
                await conn.execute(
                    text(f"ALTER TABLE {table} ALTER COLUMN created_at SET DEFAULT NOW()")
                )
            except Exception:
                pass
            try:
                await conn.execute(
                    text(f"ALTER TABLE {table} ALTER COLUMN updated_at SET DEFAULT NOW()")
                )
            except Exception:
                pass

        indexes = [
            "CREATE INDEX IF NOT EXISTS ix_request_logs_ip_created ON request_logs (ip_address, created_at)",
            "CREATE INDEX IF NOT EXISTS ix_request_logs_action ON request_logs (action)",
            "CREATE INDEX IF NOT EXISTS ix_request_logs_attack_type ON request_logs (attack_type)",
            "CREATE INDEX IF NOT EXISTS ix_request_logs_created_at ON request_logs (created_at)",
            "CREATE INDEX IF NOT EXISTS ix_alerts_created_at ON alerts (created_at)",
            "CREATE INDEX IF NOT EXISTS ix_alerts_severity ON alerts (severity)",
            "CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs (created_at)",
            "CREATE INDEX IF NOT EXISTS ix_blocked_ips_ip ON blocked_ips (ip_address)",
            "CREATE INDEX IF NOT EXISTS ix_allowed_ips_ip ON allowed_ips (ip_address)",
        ]
        for statement in indexes:
            try:
                await conn.execute(text(statement))
            except Exception:
                pass

        legacy_fixes = [
            "ALTER TABLE waf_settings ALTER COLUMN mode SET DEFAULT 'detection'",
            "ALTER TABLE waf_settings ALTER COLUMN mode DROP NOT NULL",
        ]
        for statement in legacy_fixes:
            try:
                await conn.execute(text(statement))
            except Exception:
                pass

"""Multi-tenancy tests: org isolation, settings fallback, superadmin.

These require a live Postgres (like test_2fa.py) and are skipped when the
database is unavailable.
"""

import uuid

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.routes.rules import router as rules_router
from app.api.routes.settings import router as settings_router
from app.api.routes.organizations import router as organizations_router
from app.api.routes.admin import router as users_router
from app.api.routes.alerts import router as alerts_router
from app.api.routes.audit_export import router as audit_export_router
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import AsyncSessionLocal, engine
from app.models.audit_log import AuditLog
from app.models.blocked_ip import BlockedIP
from app.models.organization import Organization
from app.models.rule import Rule
from app.models.user import User
from app.models.waf_setting import WAFSetting
from app.repositories.ip_repository import BlockedIPRepository
from app.services.audit_service import audit_service
from app.services.tenant_service import (
    get_default_org_id,
    reset_default_org_cache,
)

SUFFIX = uuid.uuid4().hex[:8]


@pytest.fixture(scope="module")
def db_available():
    try:
        import asyncio

        async def _ping():
            async with AsyncSessionLocal() as db:
                from sqlalchemy import text

                await db.execute(text("SELECT 1"))
            await engine.dispose()

        asyncio.run(_ping())
        return True
    except Exception:
        return False


@pytest.fixture(scope="module")
def default_org_id(db_available):
    if not db_available:
        pytest.skip("Database unavailable, skipping tenancy tests")
    import asyncio

    async def _resolve():
        reset_default_org_cache()
        org_id = await get_default_org_id()
        await engine.dispose()
        return org_id

    return asyncio.run(_resolve())


@pytest.fixture
async def org_factory(db_available, default_org_id):
    if not db_available:
        pytest.skip("Database unavailable")
    created: list[int] = []

    async def _make(name: str) -> int:
        org = Organization(name=name, is_active=True)
        async with AsyncSessionLocal() as db:
            db.add(org)
            await db.commit()
            await db.refresh(org)
        created.append(org.id)
        return org.id

    yield _make

    async with AsyncSessionLocal() as db:
        for org_id in created:
            for model in (AuditLog, Rule, BlockedIP, WAFSetting, User):
                rows = await db.execute(
                    __import__(
                        "sqlalchemy"
                    ).select(model).where(model.organization_id == org_id)
                )
                for row in rows.scalars().all():
                    await db.delete(row)
            org = await db.get(Organization, org_id)
            if org:
                await db.delete(org)
        await db.commit()
    await engine.dispose()


@pytest.fixture
async def user_factory(db_available, default_org_id):
    if not db_available:
        pytest.skip("Database unavailable")
    created: list[int] = []

    async def _make(org_id: int, role: str = "admin") -> User:
        user = User(
            username=f"tenant_{role}_{SUFFIX}_{len(created)}",
            email=f"tenant_{SUFFIX}_{len(created)}@example.com",
            password_hash=hash_password("TestPass123!"),
            role=role,
            is_active=True,
            is_verified=True,
            organization_id=org_id,
        )
        async with AsyncSessionLocal() as db:
            db.add(user)
            await db.commit()
            await db.refresh(user)
        created.append(user.id)
        return user

    yield _make

    async with AsyncSessionLocal() as db:
        for user_id in created:
            user = await db.get(User, user_id)
            if user:
                await db.delete(user)
        await db.commit()
    await engine.dispose()


def _client(router):
    app = FastAPI()
    app.include_router(router)
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


def _auth(user: User) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role)}"}


@pytest.mark.asyncio
async def test_register_assigns_default_org(default_org_id):
    from app.schemas.auth import RegisterRequest
    from app.services.auth_service import auth_service

    username = f"reg_org_{SUFFIX}"
    payload = RegisterRequest(
        username=username,
        email=f"reg_org_{SUFFIX}@example.com",
        password="TestPassword1!",
    )
    async with AsyncSessionLocal() as db:
        await auth_service.register(db, payload)
        from app.repositories.user_repository import UserRepository

        user = await UserRepository().get_by_username(db, username)
        assert user is not None
        assert user.organization_id == default_org_id
        await db.delete(user)
        await db.commit()
    await engine.dispose()


@pytest.mark.asyncio
async def test_rules_isolated_across_orgs(
    org_factory, user_factory, default_org_id
):
    org_a = await org_factory(f"OrgA {SUFFIX}")
    org_b = await org_factory(f"OrgB {SUFFIX}")
    admin_a = await user_factory(org_a, "admin")
    admin_b = await user_factory(org_b, "admin")

    async with _client(rules_router) as c:
        resp = await c.post(
            "/rules/",
            json={
                "name": f"rule_{SUFFIX}",
                "pattern": "evil-pattern",
                "priority": 80,
                "severity": "high",
                "enabled": True,
            },
            headers=_auth(admin_a),
        )
        assert resp.status_code == 201
        rule_id = resp.json()["id"]

        hidden = await c.get(f"/rules/{rule_id}", headers=_auth(admin_b))
        assert hidden.status_code == 404

        own = await c.get(f"/rules/{rule_id}", headers=_auth(admin_a))
        assert own.status_code == 200

        listing = await c.get("/rules/", headers=_auth(admin_b))
        assert all(r["id"] != rule_id for r in listing.json()["items"])


@pytest.mark.asyncio
async def test_rule_name_collision_allowed_across_orgs(
    org_factory, user_factory
):
    org_a = await org_factory(f"OrgA {SUFFIX}")
    org_b = await org_factory(f"OrgB {SUFFIX}")
    admin_a = await user_factory(org_a, "admin")
    admin_b = await user_factory(org_b, "admin")

    payload = {
        "name": f"shared_name_{SUFFIX}",
        "pattern": "evil-pattern",
        "priority": 50,
        "severity": "medium",
        "enabled": True,
    }
    async with _client(rules_router) as c:
        assert (await c.post("/rules/", json=payload, headers=_auth(admin_a))).status_code == 201
        assert (await c.post("/rules/", json=payload, headers=_auth(admin_b))).status_code == 201


@pytest.mark.asyncio
async def test_same_ip_blockable_in_two_orgs(
    org_factory, default_org_id
):
    org_a = await org_factory(f"OrgA {SUFFIX}")
    org_b = await org_factory(f"OrgB {SUFFIX}")
    repo = BlockedIPRepository()
    ip = f"198.51.100.{SUFFIX[:2]}"

    async with AsyncSessionLocal() as db:
        a = await repo.create(db, org_a, ip, "org a")
        await repo.create(db, org_b, ip, "org b")

        items_a, total_a = await repo.get_all(db, org_a)
        assert total_a == 1 and items_a[0].ip_address == ip

        items_b, total_b = await repo.get_all(db, org_b)
        assert total_b == 1 and items_b[0].ip_address == ip

        for org_id in (org_a, org_b):
            rows = await db.execute(
                __import__("sqlalchemy").select(BlockedIP).where(
                    BlockedIP.organization_id == org_id
                )
            )
            for row in rows.scalars().all():
                await db.delete(row)
        await db.commit()
    await engine.dispose()


@pytest.mark.asyncio
async def test_settings_default_org_fallback(
    org_factory, user_factory, default_org_id
):
    org_b = await org_factory(f"OrgB {SUFFIX}")
    admin_b = await user_factory(org_b, "admin")
    admin_default = await user_factory(default_org_id, "admin")

    async with _client(settings_router) as c:
        # org B overrides a key the default org already holds
        resp = await c.put(
            "/settings/",
            json={"waf_mode": "prevention", f"tenant_key_{SUFFIX}": "b-value"},
            headers=_auth(admin_b),
        )
        assert resp.status_code == 200
        assert resp.json().get("tenant_key_" + SUFFIX) == "b-value"

        # default org does NOT see org B's override
        resp = await c.get("/settings/", headers=_auth(admin_default))
        assert resp.json().get(f"tenant_key_{SUFFIX}") is None

        # org B sees default org's keys as fallback
        resp = await c.get("/settings/", headers=_auth(admin_b))
        assert "waf_mode" in resp.json()

    # cleanup settings rows created for org B
    async with AsyncSessionLocal() as db:
        rows = await db.execute(
            __import__("sqlalchemy").select(WAFSetting).where(
                WAFSetting.organization_id == org_b
            )
        )
        for row in rows.scalars().all():
            await db.delete(row)
        await db.commit()
    await engine.dispose()


@pytest.mark.asyncio
async def test_audit_export_org_scoped(org_factory, user_factory):
    org_a = await org_factory(f"OrgA {SUFFIX}")
    org_b = await org_factory(f"OrgB {SUFFIX}")
    admin_a = await user_factory(org_a, "admin")
    admin_b = await user_factory(org_b, "admin")

    await audit_service.log(
        action="TENANCY_TEST",
        user_id=admin_a.id,
        username=admin_a.username,
        organization_id=org_a,
    )

    async with _client(audit_export_router) as c:
        resp = await c.get(
            "/audit/export",
            params={"event_type": "TENANCY_TEST"},
            headers=_auth(admin_b),
        )
        assert resp.status_code == 200
        assert [line for line in resp.text.strip().splitlines() if line] == []

        resp = await c.get(
            "/audit/export",
            params={"event_type": "TENANCY_TEST"},
            headers=_auth(admin_a),
        )
        lines = [line for line in resp.text.strip().splitlines() if line]
        assert len(lines) == 1

    async with AsyncSessionLocal() as db:
        rows = await db.execute(
            __import__("sqlalchemy").select(AuditLog).where(
                AuditLog.action == "TENANCY_TEST"
            )
        )
        for row in rows.scalars().all():
            await db.delete(row)
        await db.commit()
    await engine.dispose()


@pytest.mark.asyncio
async def test_superadmin_manages_organizations(
    org_factory, user_factory, default_org_id
):
    superadmin = await user_factory(default_org_id, "superadmin")
    analyst = await user_factory(default_org_id, "analyst")

    async with _client(organizations_router) as c:
        denied = await c.get("/organizations/", headers=_auth(analyst))
        assert denied.status_code == 403

        listing = await c.get("/organizations/", headers=_auth(superadmin))
        assert listing.status_code == 200
        assert any(o["name"] == "Default Organization" for o in listing.json())

        created = await c.post(
            "/organizations/", json={"name": f"ManagedOrg {SUFFIX}"}, headers=_auth(superadmin)
        )
        assert created.status_code == 201
        org_id = created.json()["id"]

        renamed = await c.patch(
            f"/organizations/{org_id}",
            json={"name": f"ManagedOrgRenamed {SUFFIX}", "is_active": False},
            headers=_auth(superadmin),
        )
        assert renamed.status_code == 200
        assert renamed.json()["is_active"] is False

        dup = await c.post(
            "/organizations/", json={"name": f"ManagedOrgRenamed {SUFFIX}"}, headers=_auth(superadmin)
        )
        assert dup.status_code == 409

    async with AsyncSessionLocal() as db:
        rows = await db.execute(
            __import__("sqlalchemy").select(AuditLog).where(
                AuditLog.action.in_(["ORG_CREATED", "ORG_UPDATED"])
            )
        )
        for row in rows.scalars().all():
            await db.delete(row)
        org = await db.get(Organization, org_id)
        if org:
            await db.delete(org)
        await db.commit()
    await engine.dispose()


@pytest.mark.asyncio
async def test_superadmin_blocked_from_org_data(
    org_factory, user_factory, default_org_id
):
    superadmin = await user_factory(default_org_id, "superadmin")

    async with _client(rules_router) as c:
        resp = await c.get("/rules/", headers=_auth(superadmin))
        assert resp.status_code == 403

    async with _client(users_router) as c:
        resp = await c.get("/users/", headers=_auth(superadmin))
        assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_cannot_touch_other_org_user(
    org_factory, user_factory, default_org_id
):
    org_a = await org_factory(f"OrgA {SUFFIX}")
    org_b = await org_factory(f"OrgB {SUFFIX}")
    admin_a = await user_factory(org_a, "admin")
    admin_b = await user_factory(org_b, "admin")

    async with _client(users_router) as c:
        # admin A cannot see admin B's user record
        resp = await c.get(f"/users/{admin_b.id}", headers=_auth(admin_a))
        assert resp.status_code == 404

        # admin B cannot deactivate admin A
        resp = await c.put(
            f"/users/{admin_a.id}",
            json={"is_active": False},
            headers=_auth(admin_b),
        )
        assert resp.status_code == 404

        # admin A can still update their own user
        resp = await c.put(
            f"/users/{admin_a.id}",
            json={"is_active": False},
            headers=_auth(admin_a),
        )
        assert resp.status_code == 200


@pytest.mark.asyncio
async def test_alerts_isolated_across_orgs(org_factory, user_factory):
    org_a = await org_factory(f"OrgA {SUFFIX}")
    org_b = await org_factory(f"OrgB {SUFFIX}")
    admin_a = await user_factory(org_a, "admin")
    admin_b = await user_factory(org_b, "admin")

    from app.models.alert import Alert

    alert = Alert(
        organization_id=org_a,
        severity="high",
        message="tenant alert",
        source="test",
        ip_address="203.0.113.9",
        resolved=False,
    )
    async with AsyncSessionLocal() as db:
        db.add(alert)
        await db.commit()
        await db.refresh(alert)
    alert_id = alert.id

    async with _client(alerts_router) as c:
        listing = await c.get("/alerts/", headers=_auth(admin_b))
        assert all(a["id"] != alert_id for a in listing.json()["items"])

        resp = await c.patch(f"/alerts/{alert_id}/resolve", headers=_auth(admin_b))
        assert resp.status_code == 404

        resp = await c.patch(f"/alerts/{alert_id}/resolve", headers=_auth(admin_a))
        assert resp.status_code == 200
        assert resp.json()["resolved"] is True

    async with AsyncSessionLocal() as db:
        alert = await db.get(Alert, alert_id)
        if alert:
            await db.delete(alert)
        await db.commit()
    await engine.dispose()

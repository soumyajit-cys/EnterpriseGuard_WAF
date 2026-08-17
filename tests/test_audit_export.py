"""End-to-end tests for the SIEM audit export endpoint (GET /audit/export).

These require a live Postgres (like test_2fa.py) and are skipped when the
database is unavailable.
"""

import json

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.routes.audit_export import router as audit_export_router
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import AsyncSessionLocal, engine
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.audit_service import audit_service

repo = UserRepository()


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


@pytest.fixture
def client(db_available):
    if not db_available:
        pytest.skip("Database unavailable, skipping export tests")
    app = FastAPI()
    app.include_router(audit_export_router)
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.fixture
async def admin_user(db_available):
    if not db_available:
        pytest.skip("Database unavailable")
    user = User(
        username="siem_admin",
        email="siem_admin@example.com",
        password_hash=hash_password("TestPass123!"),
        role="admin",
        is_active=True,
        is_verified=True,
    )
    async with AsyncSessionLocal() as db:
        db.add(user)
        await db.commit()
        await db.refresh(user)
    yield user
    async with AsyncSessionLocal() as db:
        await db.delete(user)
        await db.commit()
    await engine.dispose()


@pytest.fixture
async def analyst_user(db_available):
    if not db_available:
        pytest.skip("Database unavailable")
    user = User(
        username="siem_analyst",
        email="siem_analyst@example.com",
        password_hash=hash_password("TestPass123!"),
        role="analyst",
        is_active=True,
        is_verified=True,
    )
    async with AsyncSessionLocal() as db:
        db.add(user)
        await db.commit()
        await db.refresh(user)
    yield user
    async with AsyncSessionLocal() as db:
        await db.delete(user)
        await db.commit()
    await engine.dispose()


@pytest.mark.asyncio
async def test_export_requires_admin(client, analyst_user):
    token = create_access_token(analyst_user.id, analyst_user.role)
    async with client as c:
        resp = await c.get(
            "/audit/export",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_export_streams_ndjson(client, admin_user):
    await audit_service.log(
        action="IP_BLOCKED",
        user_id=admin_user.id,
        username=admin_user.username,
        resource="blocked_ip:1",
        details="Blocked 203.0.113.7",
        ip_address="10.0.0.1",
        severity="high",
    )

    token = create_access_token(admin_user.id, admin_user.role)
    async with client as c:
        resp = await c.get(
            "/audit/export",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/x-ndjson")

    lines = [line for line in resp.text.strip().splitlines() if line]
    assert lines
    event = json.loads(lines[0])
    assert "@timestamp" in event
    assert event["event"]["action"] == "IP_BLOCKED"
    assert event["event"]["severity"] == "high"
    assert event["source"]["ip"] == "10.0.0.1"
    assert event["source"]["geo"]["country"] is None
    assert event["user"]["id"] == str(admin_user.id)
    assert event["user"]["name"] == admin_user.username


@pytest.mark.asyncio
async def test_export_respects_severity_filter(client, admin_user):
    await audit_service.log(
        action="RULE_CREATED",
        user_id=admin_user.id,
        username=admin_user.username,
        severity="info",
    )
    token = create_access_token(admin_user.id, admin_user.role)
    async with client as c:
        resp = await c.get(
            "/audit/export",
            params={"severity": "critical"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200
    lines = [line for line in resp.text.strip().splitlines() if line]
    assert lines == []


@pytest.mark.asyncio
async def test_export_rejects_bad_dates(client, admin_user):
    token = create_access_token(admin_user.id, admin_user.role)
    async with client as c:
        resp = await c.get(
            "/audit/export",
            params={"start_date": "not-a-date"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_export_requires_auth(client):
    async with client as c:
        resp = await c.get("/audit/export")
    assert resp.status_code in (401, 403)
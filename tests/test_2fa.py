"""End-to-end tests for the 2FA (TOTP) flow against a live database.

These tests require a reachable Postgres (DATABASE_URL from .env / env).
They are skipped automatically when the database is unavailable so that
pure unit tests still pass in minimal environments.
"""

import pytest

from app.core.database import AsyncSessionLocal, engine
from app.auth.password import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth_service import auth_service

repo = UserRepository()

TEST_USERNAME = "2fa_test_user"
TEST_EMAIL = "2fa_test_user@example.com"
TEST_PASSWORD = "TestPass123!"


@pytest.fixture(scope="session")
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
async def test_user(db_available):
    if not db_available:
        pytest.skip("Database unavailable")
    async with AsyncSessionLocal() as db:
        existing = await repo.get_by_username(db, TEST_USERNAME)
        if existing:
            await repo.delete(db, existing.id)
        await repo.create(
            db,
            username=TEST_USERNAME,
            email=TEST_EMAIL,
            password_hash=hash_password(TEST_PASSWORD),
            role="analyst",
        )
    yield
    async with AsyncSessionLocal() as db:
        existing = await repo.get_by_username(db, TEST_USERNAME)
        if existing:
            await repo.delete(db, existing.id)


async def _load_test_user(db) -> User:
    user = await repo.get_by_username(db, TEST_USERNAME)
    assert user is not None
    return user


async def _totp_now(secret: str) -> str:
    import pyotp

    return pyotp.TOTP(secret).now()


class TestTwoFactorFlow:
    @pytest.mark.asyncio
    async def test_login_without_2fa_returns_tokens(self, test_user):
        async with AsyncSessionLocal() as db:
            result = await auth_service.login(
                db,
                LoginRequest(username=TEST_USERNAME, password=TEST_PASSWORD),
            )
            assert "access_token" in result
            assert "requires_2fa" not in result

    @pytest.mark.asyncio
    async def test_setup_returns_secret_and_uri(self, test_user):
        async with AsyncSessionLocal() as db:
            user = await _load_test_user(db)
            result = await auth_service.setup_2fa(db, user)
            assert len(result["secret"]) == 32
            assert result["otpauth_uri"].startswith("otpauth://totp/")
            assert user.totp_secret == result["secret"]

    @pytest.mark.asyncio
    async def test_enable_requires_valid_code(self, test_user):
        async with AsyncSessionLocal() as db:
            user = await _load_test_user(db)
            await auth_service.setup_2fa(db, user)
            with pytest.raises(Exception) as exc:
                await auth_service.enable_2fa(db, user, "000000")
            assert "Invalid" in str(exc.value)
            assert user.totp_enabled is False

    @pytest.mark.asyncio
    async def test_enable_with_valid_code(self, test_user):
        async with AsyncSessionLocal() as db:
            user = await _load_test_user(db)
            await auth_service.setup_2fa(db, user)
            code = await _totp_now(user.totp_secret)
            result = await auth_service.enable_2fa(db, user, code)
            assert result == {"enabled": True}
            assert user.totp_enabled is True

    @pytest.mark.asyncio
    async def test_login_requires_2fa_after_enable(self, test_user):
        async with AsyncSessionLocal() as db:
            user = await _load_test_user(db)
            await auth_service.setup_2fa(db, user)
            code = await _totp_now(user.totp_secret)
            await auth_service.enable_2fa(db, user, code)

            result = await auth_service.login(
                db,
                LoginRequest(username=TEST_USERNAME, password=TEST_PASSWORD),
            )
            assert result["requires_2fa"] is True
            assert "mfa_token" in result
            assert "access_token" not in result

    @pytest.mark.asyncio
    async def test_verify_2fa_with_correct_code(self, test_user):
        async with AsyncSessionLocal() as db:
            user = await _load_test_user(db)
            await auth_service.setup_2fa(db, user)
            code = await _totp_now(user.totp_secret)
            await auth_service.enable_2fa(db, user, code)

            login = await auth_service.login(
                db,
                LoginRequest(username=TEST_USERNAME, password=TEST_PASSWORD),
            )
            result = await auth_service.verify_2fa(
                db, login["mfa_token"], code
            )
            assert "access_token" in result
            assert "refresh_token" in result
            assert result["user"]["username"] == TEST_USERNAME

    @pytest.mark.asyncio
    async def test_verify_2fa_rejects_wrong_code(self, test_user):
        async with AsyncSessionLocal() as db:
            user = await _load_test_user(db)
            await auth_service.setup_2fa(db, user)
            code = await _totp_now(user.totp_secret)
            await auth_service.enable_2fa(db, user, code)

            login = await auth_service.login(
                db,
                LoginRequest(username=TEST_USERNAME, password=TEST_PASSWORD),
            )
            with pytest.raises(Exception) as exc:
                await auth_service.verify_2fa(db, login["mfa_token"], "000000")
            assert "Invalid 2FA code" in str(exc.value)

    @pytest.mark.asyncio
    async def test_disable_2fa_and_login_again(self, test_user):
        async with AsyncSessionLocal() as db:
            user = await _load_test_user(db)
            await auth_service.setup_2fa(db, user)
            code = await _totp_now(user.totp_secret)
            await auth_service.enable_2fa(db, user, code)

            result = await auth_service.disable_2fa(db, user, code)
            assert result == {"enabled": False}
            assert user.totp_enabled is False
            assert user.totp_secret is None

            login = await auth_service.login(
                db,
                LoginRequest(username=TEST_USERNAME, password=TEST_PASSWORD),
            )
            assert "access_token" in login
            assert "requires_2fa" not in login

    @pytest.mark.asyncio
    async def test_setup_rejected_when_already_enabled(self, test_user):
        async with AsyncSessionLocal() as db:
            user = await _load_test_user(db)
            await auth_service.setup_2fa(db, user)
            code = await _totp_now(user.totp_secret)
            await auth_service.enable_2fa(db, user, code)

            with pytest.raises(Exception) as exc:
                await auth_service.setup_2fa(db, user)
            assert "already enabled" in str(exc.value).lower()

    @pytest.mark.asyncio
    async def test_registration_and_full_login(self, db_available):
        if not db_available:
            pytest.skip("Database unavailable")
        username = "2fa_register_test"
        email = "2fa_register_test@example.com"
        async with AsyncSessionLocal() as db:
            existing = await repo.get_by_username(db, username)
            if existing:
                await repo.delete(db, existing.id)
            try:
                result = await auth_service.register(
                    db,
                    RegisterRequest(
                        username=username,
                        email=email,
                        password=TEST_PASSWORD,
                    ),
                )
                assert "access_token" in result
                assert result["user"]["username"] == username

                login = await auth_service.login(
                    db,
                    LoginRequest(username=username, password=TEST_PASSWORD),
                )
                assert "access_token" in login
            finally:
                existing = await repo.get_by_username(db, username)
                if existing:
                    await repo.delete(db, existing.id)

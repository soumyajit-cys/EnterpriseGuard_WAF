import pytest

from app.core.database import engine

BROWSER_UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "Chrome/126.0 Safari/537.36"
)


@pytest.fixture(autouse=True)
async def _dispose_engine_after_each():
    """pytest-asyncio gives each test its own event loop; dispose the
    SQLAlchemy pool so pooled asyncpg connections never leak across
    loops."""
    yield
    try:
        await engine.dispose()
    except Exception:
        pass


class FakeUrl:
    def __init__(self, path: str = "/"):
        self.path = path


class FakeRequest:
    """Mirrors the request surface the WAF Detector depends on."""

    def __init__(
        self,
        query: str = "",
        body: str = "",
        path: str = "/",
        method: str = "GET",
        headers: dict | None = None,
        cookies: dict | None = None,
    ):
        self.headers = headers or {"user-agent": BROWSER_UA}
        self.query_params = query
        self.url = FakeUrl(path)
        self.method = method
        self.cookies = cookies or {}
        self._body = body

    async def body(self) -> bytes:
        return self._body.encode("utf-8")


@pytest.fixture
def request_factory():
    def _make(**kwargs) -> FakeRequest:
        return FakeRequest(**kwargs)

    return _make


@pytest.fixture
def playground_request_factory():
    """Builds a fake request the same way the /waf/test route does."""

    def _make(
        input_value: str = "",
        source: str = "query",
        body: str = "",
        path: str = "/",
        headers: dict | None = None,
    ) -> FakeRequest:
        hdrs = {"user-agent": BROWSER_UA}
        for header in ("content-length", "transfer-encoding"):
            if headers and header in headers:
                hdrs[header] = str(headers[header])
        return FakeRequest(
            query={source: input_value} if source == "query" else "",
            body=body,
            path=path,
            headers=hdrs,
        )

    return _make

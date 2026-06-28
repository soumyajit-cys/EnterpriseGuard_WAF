from fastapi import FastAPI
from app.core.database import init_db
from app.core.security_headers import add_security_headers
from app.middleware.waf_middleware import WAFMiddleware
from app.api.routes.health import router as health_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.rules import router as rules_router
from app.api.routes.waf import router as waf_router
from app.api.routes.auth import router as auth_router
from app.api.routes.admin import router as admin_router
from app.api.routes.alerts import router as alert_router
from app.api.routes.requests import router as request_router
from app.api.routes.settings import router as settings_router

app = FastAPI(
    title="Enterprise WAF",
    version="1.0.0",
)

app.add_middleware(WAFMiddleware)

app.include_router(health_router)
app.include_router(dashboard_router)
app.include_router(rules_router)
app.include_router(waf_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(alert_router)
app.include_router(request_router)
app.include_router(settings_router)

@app.on_event("startup")
async def startup():
    await init_db()


@app.middleware("http")
async def security_headers_middleware(request, call_next):
    response = await call_next(request)
    add_security_headers(response)
    return response
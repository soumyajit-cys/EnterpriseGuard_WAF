
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.database import init_db
from app.core.security_headers import add_security_headers

from app.middleware.waf_middleware import WAFMiddleware

# Routers
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
    title="EnterpriseGuard WAF",
    description="Enterprise-grade Web Application Firewall built with FastAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ==========================
# Root Routes
# ==========================

@app.get("/", tags=["System"])
async def root():
    return {
        "application": "EnterpriseGuard WAF",
        "version": "1.0.0",
        "status": "running",
        "swagger": "/docs",
        "redoc": "/redoc",
    }


@app.get("/ping", tags=["System"])
async def ping():
    return {
        "message": "pong"
    }


# ==========================
# Middleware
# ==========================

try:
    app.add_middleware(WAFMiddleware)
    print("[+] WAF Middleware Loaded")
except Exception as e:
    print(f"[!] Failed to load WAF Middleware: {e}")


@app.middleware("http")
async def security_headers_middleware(
    request: Request,
    call_next
):
    response = await call_next(request)

    try:
        add_security_headers(response)
    except Exception as e:
        print(f"[!] Security header error: {e}")

    return response


# ==========================
# Routers
# ==========================

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(alert_router)
app.include_router(request_router)
app.include_router(rules_router)
app.include_router(settings_router)
app.include_router(dashboard_router)
app.include_router(waf_router)


# ==========================
# Startup Event
# ==========================

@app.on_event("startup")
async def startup_event():

    print("=" * 60)
    print("Starting EnterpriseGuard WAF")
    print("=" * 60)

    try:
        await init_db()
        print("[+] Database initialized")
    except Exception as e:
        print(f"[!] Database initialization failed: {e}")

    print("[+] Application startup completed")


# ==========================
# Shutdown Event
# ==========================

@app.on_event("shutdown")
async def shutdown_event():
    print("[+] EnterpriseGuard WAF stopped")


# ==========================
# Global Exception Handler
# ==========================

import traceback

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception
):
    traceback.print_exc()

    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc)
        }
    )
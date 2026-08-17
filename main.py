
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.core.security_headers import add_security_headers

from app.middleware.waf_middleware import WAFMiddleware
from app.middleware.audit_middleware import AuditMiddleware

logger = logging.getLogger("waf.app")

# Routers
from app.api.routes.health import router as health_router
from app.api.routes.public_stats import router as public_router
from app.api.routes.traffic_ws import router as traffic_ws_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.rules import router as rules_router
from app.api.routes.waf import router as waf_router
from app.api.routes.auth import router as auth_router
from app.api.routes.admin import router as admin_router
from app.api.routes.alerts import router as alert_router
from app.api.routes.requests import router as request_router
from app.api.routes.settings import router as settings_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.reports import router as reports_router
from app.api.routes.audit_export import router as audit_export_router
from app.api.routes.organizations import router as organizations_router


_show_docs = settings.ENVIRONMENT != "production"

app = FastAPI(
    title="EnterpriseGuard WAF",
    description="Enterprise-grade Web Application Firewall built with FastAPI",
    version="1.0.0",
    docs_url="/docs" if _show_docs else None,
    redoc_url="/redoc" if _show_docs else None,
    openapi_url="/openapi.json" if _show_docs else None,
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


@app.get("/metrics", tags=["System"])
async def metrics():
    from app.services.metrics import metrics_response

    return metrics_response()


# ==========================
# CORS
# ==========================

if settings.ENVIRONMENT != "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}):\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ==========================
# Middleware
# ==========================

try:
    app.add_middleware(WAFMiddleware)
    logger.info("WAF Middleware loaded")
except Exception as e:
    logger.error("Failed to load WAF Middleware: %s", e)

try:
    app.add_middleware(AuditMiddleware)
    logger.info("Audit Middleware loaded")
except Exception as e:
    logger.error("Failed to load Audit Middleware: %s", e)


@app.middleware("http")
async def security_headers_middleware(
    request: Request,
    call_next
):
    response = await call_next(request)

    try:
        add_security_headers(response)
    except Exception as e:
        logger.error("Security header error: %s", e)

    return response


# ==========================
# Routers
# ==========================

app.include_router(health_router)
app.include_router(public_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(alert_router)
app.include_router(request_router)
app.include_router(rules_router)
app.include_router(settings_router)
app.include_router(dashboard_router)
app.include_router(waf_router)
app.include_router(analytics_router)
app.include_router(reports_router)
app.include_router(audit_export_router)
app.include_router(traffic_ws_router)
app.include_router(organizations_router)


# ==========================
# Startup Event
# ==========================

@app.on_event("startup")
async def startup_event():

    logger.info("Starting EnterpriseGuard WAF")

    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error("Database initialization failed: %s", e)

    try:
        from app.services.runtime_sync import runtime_sync
        await runtime_sync.sync_once()
        await runtime_sync.start()
        logger.info("WAF runtime sync started")
    except Exception as e:
        logger.error("WAF runtime sync failed to start: %s", e)

    logger.info("Application startup completed")


# ==========================
# Shutdown Event
# ==========================

@app.on_event("shutdown")
async def shutdown_event():
    try:
        from app.services.runtime_sync import runtime_sync
        await runtime_sync.stop()
    except Exception:
        pass
    logger.info("EnterpriseGuard WAF stopped")


# ==========================
# Global Exception Handler
# ==========================

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception
):
    logger.exception(
        f"Unhandled error on {request.method} {request.url.path}",
        exc_info=exc,
    )

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error"
        }
    )
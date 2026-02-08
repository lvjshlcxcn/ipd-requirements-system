"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import get_settings
from app.core.exceptions import AppException
from app.core.tenant import tenant_middleware

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Application lifespan manager.

    Handles startup and shutdown events.
    """
    # Startup
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    print(f"📖 Debug mode: {settings.DEBUG}")
    yield
    # Shutdown
    print("👋 Shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="IPD Requirements Management System API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
# 在开发环境允许所有源，生产环境应使用 settings.CORS_ORIGINS
allowed_origins = ["*"] if settings.DEBUG else settings.CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add tenant middleware
app.middleware("http")(tenant_middleware)


# Exception handler for AppException
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle application exceptions with CORS headers."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )


# Exception handler for ValidationError
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with CORS headers."""
    # Format error messages
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        errors.append(f"{field}: {message}")

    error_message = "; ".join(errors)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "数据验证失败",
            "detail": error_message,
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )


# Exception handler for all other exceptions
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions with CORS headers."""
    import traceback
    print(f"❌ Unhandled exception: {exc}")
    print(traceback.format_exc())

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "服务器内部错误",
            "detail": str(exc) if settings.DEBUG else "Internal server error",
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "success": True,
        "message": "Welcome to IPD Requirements Management System API",
        "data": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
        },
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "success": True,
        "message": "System is healthy",
        "data": {
            "status": "ok",
        },
    }


# API v1 routes
from app.api.v1 import (
    auth, requirements, notifications, analysis, tenant, import_export,
    verification, appeals, distribution, rtm, attachments, insights,
    prompt_templates, rice, invest, ipd_story, hello,
    requirement_review_meetings, migration,
)

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(analysis.router, prefix=settings.API_V1_PREFIX)  # 先注册更具体的路由
app.include_router(requirements.router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications.router, prefix=settings.API_V1_PREFIX)
app.include_router(tenant.router, prefix=settings.API_V1_PREFIX)
app.include_router(import_export.router, prefix=settings.API_V1_PREFIX)
app.include_router(verification.router, prefix=settings.API_V1_PREFIX)
app.include_router(appeals.router, prefix=settings.API_V1_PREFIX)
app.include_router(distribution.router, prefix=settings.API_V1_PREFIX)
app.include_router(rtm.router, prefix=settings.API_V1_PREFIX)
app.include_router(attachments.router, prefix=settings.API_V1_PREFIX)
app.include_router(insights.router, prefix=settings.API_V1_PREFIX)
app.include_router(prompt_templates.router, prefix=settings.API_V1_PREFIX)
app.include_router(requirement_review_meetings.router, prefix=settings.API_V1_PREFIX)
app.include_router(rice.router, prefix=settings.API_V1_PREFIX)
app.include_router(invest.router, prefix=settings.API_V1_PREFIX)
app.include_router(ipd_story.router, prefix=settings.API_V1_PREFIX)
app.include_router(hello.router, prefix=settings.API_V1_PREFIX)
app.include_router(migration.router, prefix=settings.API_V1_PREFIX)  # 临时迁移端点

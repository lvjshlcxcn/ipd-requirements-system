"""Multi-tenancy middleware and context management."""
from contextvars import ContextVar
from typing import TYPE_CHECKING, AsyncGenerator

from fastapi import Request, status
from fastapi.exceptions import HTTPException

# Context variable for tenant_id
tenant_context: ContextVar[int | None] = ContextVar("tenant_context", default=None)


def set_tenant_context(tenant_id: int) -> None:
    """Set current tenant context."""
    tenant_context.set(tenant_id)


def get_current_tenant() -> int | None:
    """Get current tenant from context."""
    return tenant_context.get()


async def tenant_middleware(request: Request, call_next):
    """Middleware to enforce tenant isolation.

    Extracts tenant_id from JWT token and sets it in context.
    All subsequent operations will filter by tenant_id.
    """
    # Get tenant from JWT (will be set by auth middleware)
    # For now, try to get from header (temporary, will be replaced by JWT)
    # Handle both X-Tenant-ID and x-tenant-id (case-insensitive)
    tenant_id = None
    for header_name, header_value in request.headers.items():
        if header_name.lower() == "x-tenant-id":
            try:
                tenant_id = int(header_value)
                set_tenant_context(tenant_id)
                break
            except ValueError:
                # Invalid tenant ID, but don't fail the request
                # Let it fail naturally in business logic
                pass

    response = await call_next(request)
    return response


def require_tenant() -> int:
    """Dependency to require tenant context.

    Raises HTTPException if no tenant context is set.
    """
    tenant_id = get_current_tenant()
    if tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant context required",
        )
    return tenant_id

"""Tenant API endpoints."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse
from app.models.tenant import Tenant
from app.repositories.tenant import TenantRepository
from app.api.deps import get_db, get_current_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.get("", response_model=List[TenantResponse])
async def get_tenants(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all tenants (admin only)."""
    # TODO: Add admin permission check
    repo = TenantRepository(Tenant, db)
    tenants = await repo.get_all()
    return [TenantResponse.model_validate(t) for t in tenants]


@router.get("/active", response_model=List[TenantResponse])
async def get_active_tenants(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all active tenants."""
    repo = TenantRepository(Tenant, db)
    tenants = await repo.get_active_tenants()
    return [TenantResponse.model_validate(t) for t in tenants]


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific tenant."""
    repo = TenantRepository(Tenant, db)
    tenant = await repo.get_by_id(tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    return TenantResponse.model_validate(tenant)


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new tenant (admin only)."""
    # TODO: Add admin permission check
    repo = TenantRepository(Tenant, db)
    tenant = await repo.create(**tenant_data.model_dump())
    return TenantResponse.model_validate(tenant)


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    tenant_data: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update a tenant (admin only)."""
    # TODO: Add admin permission check
    repo = TenantRepository(Tenant, db)

    tenant = await repo.get_by_id(tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    updated = await repo.update(tenant_id, **tenant_data.model_dump(exclude_unset=True))
    if updated:
        return TenantResponse.model_validate(updated)
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Tenant not found",
    )


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete a tenant (admin only)."""
    # TODO: Add admin permission check
    repo = TenantRepository(Tenant, db)

    tenant = await repo.get_by_id(tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    await repo.delete(tenant_id)

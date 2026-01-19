"""Tenant schemas for Pydantic validation."""
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class TenantBase(BaseModel):
    """Base tenant schema."""

    name: str = Field(..., min_length=1, max_length=100, description="Tenant name")
    code: str = Field(..., min_length=1, max_length=20, description="Unique tenant code")
    is_active: bool = Field(default=True, description="Tenant active status")
    settings: Optional[dict] = Field(default=None, description="Tenant-specific settings")


class TenantCreate(TenantBase):
    """Schema for creating a new tenant."""

    pass


class TenantUpdate(BaseModel):
    """Schema for updating a tenant."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None
    settings: Optional[dict] = None


class TenantResponse(TenantBase):
    """Schema for tenant response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: str
    updated_at: str

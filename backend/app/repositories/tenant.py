"""Tenant repository."""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import Tenant
from app.repositories.base import BaseRepository


class TenantRepository(BaseRepository[Tenant]):
    """Repository for tenant operations."""

    async def get_by_code(self, code: str) -> Optional[Tenant]:
        """Get tenant by code.

        Args:
            code: Tenant code

        Returns:
            Tenant instance or None
        """
        query = select(Tenant).where(Tenant.code == code)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_active_tenants(self) -> list[Tenant]:
        """Get all active tenants.

        Returns:
            List of active tenants
        """
        query = select(Tenant).where(Tenant.is_active == True)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def deactivate(self, id: int) -> bool:
        """Deactivate a tenant.

        Args:
            id: Tenant ID

        Returns:
            True if deactivated, False if not found
        """
        return await self.update(id, is_active=False)

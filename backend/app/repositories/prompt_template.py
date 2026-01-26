"""Prompt template repository."""
from typing import Optional, List
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.prompt_template import PromptTemplate
from app.repositories.base import BaseRepository


class PromptTemplateRepository(BaseRepository[PromptTemplate]):
    """Repository for prompt template operations."""

    async def get_active_template(
        self, template_key: str, tenant_id: int
    ) -> Optional[PromptTemplate]:
        """Get the active template for a key and tenant.

        Args:
            template_key: Template identifier (e.g., 'ipd_ten_questions')
            tenant_id: Tenant ID

        Returns:
            Active prompt template or None
        """
        query = select(PromptTemplate).where(
            and_(
                PromptTemplate.template_key == template_key,
                PromptTemplate.tenant_id == tenant_id,
                PromptTemplate.is_active == True
            )
        ).order_by(desc(PromptTemplate.created_at)).limit(1)

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_templates(
        self, tenant_id: int, template_key: Optional[str] = None
    ) -> List[PromptTemplate]:
        """List all templates for a tenant, optionally filtered by key.

        Args:
            tenant_id: Tenant ID
            template_key: Optional filter by template key

        Returns:
            List of templates ordered by created_at desc
        """
        query = select(PromptTemplate).where(PromptTemplate.tenant_id == tenant_id)

        if template_key:
            query = query.where(PromptTemplate.template_key == template_key)

        query = query.order_by(desc(PromptTemplate.created_at))
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def create_version(
        self,
        template_key: str,
        version: str,
        name: str,
        content: str,
        tenant_id: int,
        created_by: int,
        description: Optional[str] = None,
        variables: Optional[str] = None,
        previous_version_id: Optional[int] = None,
    ) -> PromptTemplate:
        """Create a new template version.

        Args:
            template_key: Template identifier
            version: Version string (e.g., 'v1.0')
            name: Template display name
            content: Prompt content with {variable} placeholders
            tenant_id: Tenant ID
            created_by: User ID
            description: Optional description
            variables: JSON array of variable names
            previous_version_id: Previous version ID for tracking

        Returns:
            Created template
        """
        return await self.create(
            template_key=template_key,
            version=version,
            name=name,
            content=content,
            tenant_id=tenant_id,
            created_by=created_by,
            description=description,
            variables=variables,
            previous_version_id=previous_version_id,
            is_active=True
        )

    async def get_latest_version(
        self, template_key: str, tenant_id: int
    ) -> Optional[PromptTemplate]:
        """Get the latest version (active or not) for a template key.

        Args:
            template_key: Template identifier
            tenant_id: Tenant ID

        Returns:
            Latest template version or None
        """
        query = select(PromptTemplate).where(
            and_(
                PromptTemplate.template_key == template_key,
                PromptTemplate.tenant_id == tenant_id
            )
        ).order_by(desc(PromptTemplate.created_at)).limit(1)

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def deactivate_template(self, template_id: int) -> Optional[PromptTemplate]:
        """Deactivate a template version.

        Args:
            template_id: Template ID

        Returns:
            Updated template or None
        """
        return await self.update(template_id, is_active=False)

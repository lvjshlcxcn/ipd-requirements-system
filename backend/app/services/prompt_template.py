"""Prompt template service."""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.prompt_template import PromptTemplate
from app.models.user import User
from app.repositories.prompt_template import PromptTemplateRepository
from app.repositories.workflow_history import WorkflowHistoryRepository
from app.core.permissions import has_permission
from app.core.tenant import get_current_tenant
from app.utils.json_helpers import parse_json_variables, truncate_content


def increment_version(version: str) -> str:
    """Increment version number (v1.0 -> v1.1).

    Args:
        version: Current version string (e.g., "v1.0")

    Returns:
        Next version string

    Raises:
        ValueError: If version format is invalid
    """
    try:
        # Remove 'v' prefix and parse
        version_clean = version.lstrip('v')
        parts = version_clean.split('.')

        if len(parts) == 2:
            major, minor = int(parts[0]), int(parts[1])
            return f"v{major}.{minor + 1}"
        else:
            raise ValueError(f"Unexpected version format: {version}")
    except (ValueError, IndexError) as e:
        raise ValueError(f"Invalid version format '{version}': {e}")


class PromptTemplateService:
    """Service for prompt template business logic."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = PromptTemplateRepository(PromptTemplate, session)
        # Note: WorkflowHistoryRepository expects sync session, so we don't use it here
        # self.history_repo = WorkflowHistoryRepository(session)

    async def get_active_template(self, template_key: str) -> Optional[str]:
        """Get active template content for use in LLM calls.

        Falls back to static prompts if no DB template exists.

        Args:
            template_key: Template identifier

        Returns:
            Template content string or None
        """
        tenant_id = get_current_tenant()
        if tenant_id is None:
            return None

        template = await self.repo.get_active_template(template_key, tenant_id)
        return template.content if template else None

    async def list_templates(
        self, template_key: Optional[str] = None, tenant_id: Optional[int] = None
    ) -> List[PromptTemplate]:
        """List all templates for current tenant.

        Args:
            template_key: Optional filter by key
            tenant_id: Tenant ID (optional, falls back to context)

        Returns:
            List of templates
        """
        if tenant_id is None:
            tenant_id = get_current_tenant()
        if tenant_id is None:
            return []
        return await self.repo.list_templates(tenant_id, template_key)

    async def get_template(self, template_id: int) -> Optional[PromptTemplate]:
        """Get template by ID.

        Args:
            template_id: Template ID

        Returns:
            Template or None
        """
        return await self.repo.get_by_id(template_id)

    async def create_template(
        self,
        template_key: str,
        name: str,
        content: str,
        user_id: int,
        description: Optional[str] = None,
        variables: Optional[List[str]] = None,
    ) -> PromptTemplate:
        """Create a new template (first version).

        Args:
            template_key: Template identifier
            name: Template display name
            content: Prompt content
            user_id: Creating user ID (must be admin)
            description: Optional description
            variables: Optional list of variable names

        Returns:
            Created template

        Raises:
            PermissionError: If user is not admin
        """
        # Get user to check permissions
        user = await self.session.get(User, user_id)
        if not user or not has_permission(user.role, "tenant:manage"):
            raise PermissionError("Only admins can create prompt templates")

        # Use tenant_id from user object
        tenant_id = user.tenant_id

        # Convert variables list to JSON string
        import json
        variables_json = json.dumps(variables) if variables else None

        template = await self.repo.create_version(
            template_key=template_key,
            version="v1.0",
            name=name,
            content=content,
            tenant_id=tenant_id,
            created_by=user_id,
            description=description,
            variables=variables_json,
        )

        # Note: Workflow history tracking disabled due to sync/async mismatch
        # TODO: Create async version of WorkflowHistoryRepository

        return template

    async def update_template(
        self,
        template_id: int,
        content: str,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        variables: Optional[List[str]] = None,
    ) -> PromptTemplate:
        """Update a template by creating a new version.

        Args:
            template_id: Current template ID
            content: New prompt content
            user_id: Updating user ID (must be admin)
            name: Optional new name
            description: Optional new description
            variables: Optional new variable list

        Returns:
            New template version

        Raises:
            PermissionError: If user is not admin
            ValueError: If template not found
        """
        # Get user to check permissions
        user = await self.session.get(User, user_id)
        if not user or not has_permission(user.role, "tenant:manage"):
            raise PermissionError("Only admins can update prompt templates")

        old_template = await self.repo.get_by_id(template_id)
        if not old_template:
            raise ValueError("Template not found")

        # 🔥 关键修复：禁用所有同 key 的 active 模板（不仅仅是被编辑的模板）
        from sqlalchemy import select, and_
        from app.models.prompt_template import PromptTemplate

        result = await self.session.execute(
            select(PromptTemplate).where(
                and_(
                    PromptTemplate.template_key == old_template.template_key,
                    PromptTemplate.tenant_id == old_template.tenant_id,
                    PromptTemplate.is_active == True
                )
            )
        )
        all_active_templates = result.scalars().all()

        if all_active_templates:
            print(f"[UpdateTemplate] 发现 {len(all_active_templates)} 个 active 模板，将全部禁用")
            for tpl in all_active_templates:
                print(f"[UpdateTemplate] 禁用模板 ID: {tpl.id}")
                await self.repo.deactivate_template(tpl.id)

        # Auto-increment version with error handling
        try:
            new_version = increment_version(old_template.version)
        except ValueError as e:
            # Fallback to v1.1 if parsing fails
            new_version = "v1.1"

        # Create new version
        import json
        variables_json = json.dumps(variables) if variables else old_template.variables

        new_template = await self.repo.create_version(
            template_key=old_template.template_key,
            version=new_version,
            name=name or old_template.name,
            content=content,
            tenant_id=old_template.tenant_id,
            created_by=user_id,
            description=description or old_template.description,
            variables=variables_json,
            previous_version_id=template_id,
        )

        # Note: Workflow history tracking disabled due to sync/async mismatch

        return new_template

    async def delete_template(self, template_id: int, user_id: int) -> bool:
        """Delete a template (admin only).

        Args:
            template_id: Template ID
            user_id: Deleting user ID

        Returns:
            True if deleted

        Raises:
            PermissionError: If user is not admin
        """
        # Get user to check permissions
        user = await self.session.get(User, user_id)
        if not user or not has_permission(user.role, "tenant:manage"):
            raise PermissionError("Only admins can delete prompt templates")

        success = await self.repo.delete(template_id)

        # Note: Workflow history tracking disabled due to sync/async mismatch

        return success

    async def deactivate_template(self, template_id: int) -> Optional[PromptTemplate]:
        """Deactivate a template version.

        Args:
            template_id: Template ID to deactivate

        Returns:
            Updated template or None
        """
        return await self.repo.deactivate_template(template_id)

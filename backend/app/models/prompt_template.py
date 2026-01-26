"""Prompt template model for customizable AI prompts."""
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.user import User


class PromptTemplate(Base, TimestampMixin, TenantMixin):
    """
    Customizable prompt template with version control.

    Templates are tenant-specific and can be modified by admins only.
    Each update creates a new version while preserving history.
    """

    __tablename__ = "prompt_templates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Template identification
    template_key: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # 'ipd_ten_questions', 'quick_insight'

    # Version tracking
    version: Mapped[str] = mapped_column(String(20), nullable=False)  # 'v1.0', 'v1.1', 'v2.0'
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Template content
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Metadata (JSON as string for simplicity)
    variables: Mapped[Optional[str]] = mapped_column(Text)  # JSON array of variable names
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Version tracking
    previous_version_id: Mapped[Optional[int]] = mapped_column(ForeignKey("prompt_templates.id"))

    def __repr__(self) -> str:
        return f"<PromptTemplate(key='{self.template_key}', version='{self.version}', active={self.is_active})>"

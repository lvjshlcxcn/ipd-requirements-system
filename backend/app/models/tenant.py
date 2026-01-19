"""Tenant model for multi-tenancy support."""
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.mixins import TimestampMixin
from app.db.base import Base


class Tenant(Base, TimestampMixin):
    """Tenant model for multi-tenancy.

    Each tenant represents a customer or organization
    with isolated data.
    """

    __tablename__ = "tenants"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Tenant-specific settings (JSONB)
    # Can store preferences like:
    # - notification settings
    # - theme preferences
    # - custom fields
    # - workflow configurations
    settings: Mapped[dict | None] = mapped_column(String(1000))

    def __repr__(self) -> str:
        return f"<Tenant(id={self.id}, name='{self.name}', code='{self.code}')>"

    def is_enabled(self) -> bool:
        """Check if tenant is enabled."""
        return self.is_active

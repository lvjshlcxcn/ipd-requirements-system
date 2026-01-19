"""Database model mixins for common fields."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

if TYPE_CHECKING:
    pass


class TimestampMixin:
    """Mixin for timestamp fields."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class TenantMixin:
    """Mixin for tenant isolation."""

    tenant_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)


class SoftDeleteMixin:
    """Mixin for soft delete functionality."""

    is_deleted: Mapped[bool] = mapped_column(Integer, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

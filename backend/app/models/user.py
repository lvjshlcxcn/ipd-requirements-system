"""User model."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.tenant import Tenant
    from app.models.requirement import Requirement


# User role enum - extended with new roles
UserRole = PG_ENUM(
    "admin",
    "product_manager",
    "marketing_manager",
    "sales_manager",
    # Legacy roles for backward compatibility
    "pm",
    "engineer",
    "stakeholder",
    name="user_role",
    create_type=True,
)


class User(Base, TimestampMixin, TenantMixin):
    """User model with multi-tenancy support."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(UserRole, nullable=False, default="stakeholder")
    department: Mapped[str | None] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Foreign key to tenant
    tenant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship(foreign_keys=[tenant_id])

    # requirements_collected: Mapped[list["Requirement"]] = relationship(
    #     back_populates="collector", foreign_keys="[Requirement.collector_id]"
    # )
    # requirements_created: Mapped[list["Requirement"]] = relationship(
    #     back_populates="creator", foreign_keys="[Requirement.created_by]"
    # )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}', tenant_id={self.tenant_id})>"

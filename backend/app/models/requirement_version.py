"""Requirement version history model."""
from sqlalchemy import Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin


class RequirementVersion(Base, TimestampMixin, TenantMixin):
    """Requirement version history for tracking changes."""

    __tablename__ = "requirement_versions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    requirement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True
    )

    version_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Snapshot of requirement state (JSONB)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Change tracking
    change_reason: Mapped[str | None] = mapped_column(Text)
    changed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    def __repr__(self) -> str:
        return (
            f"<RequirementVersion(id={self.id}, requirement_id={self.requirement_id}, "
            f"version={self.version_number})>"
        )

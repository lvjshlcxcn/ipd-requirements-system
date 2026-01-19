"""Verification metric model."""
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.requirement import Requirement
    from app.models.user import User


class VerificationMetric(Base, TimestampMixin, TenantMixin):
    """Verification metrics for validating requirement outcomes."""

    __tablename__ = "verification_metrics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Associated requirement
    requirement_id: Mapped[int] = mapped_column(
        ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False
    )

    # Metrics configuration (JSONB array)
    # Example: [{"name": "使用率", "target_value": 80, "unit": "%"}]
    metrics_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=[])

    # Actual metrics data (JSONB object)
    # Example: {"使用率": {"value": 85, "date": "2026-01-15", "notes": "超过预期"}}
    actual_metrics: Mapped[dict] = mapped_column(JSONB, nullable=False, default={})

    # Verification result
    verification_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending, passed, failed
    verification_notes: Mapped[str | None] = mapped_column(Text)
    verified_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    verified_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    # Relationships
    requirement: Mapped["Requirement"] = relationship("Requirement")
    verifier: Mapped["User"] = relationship(foreign_keys=[verified_by])

    def __repr__(self) -> str:
        return f"<VerificationMetric(id={self.id}, requirement_id={self.requirement_id}, status='{self.verification_status}')>"

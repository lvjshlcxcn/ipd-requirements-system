"""Verification checklist model."""
from sqlalchemy import String, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin


# Verification type enum
VerificationType = PG_ENUM(
    "fat",  # Factory Acceptance Test
    "sat",  # Site Acceptance Test
    "uat",  # User Acceptance Test
    "prototype",
    "test",
    name="verification_type",
    create_type=True,
)


# Checklist result enum
ChecklistResult = PG_ENUM(
    "not_started",
    "in_progress",
    "passed",
    "failed",
    "partial_passed",
    "blocked",
    name="checklist_result",
    create_type=True,
)


class VerificationChecklist(Base, TimestampMixin, TenantMixin):
    """Verification checklist model for FAT/SAT/UAT."""

    __tablename__ = "verification_checklists"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    requirement_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("requirements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    verification_type: Mapped[str] = mapped_column(VerificationType, nullable=False)
    checklist_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Checklist items (JSONB): Array of {id, item, checked, notes}
    checklist_items: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Verification result
    result: Mapped[str] = mapped_column(ChecklistResult, default="not_started")

    # Evidence
    evidence_attachments: Mapped[dict | None] = mapped_column(JSONB)
    customer_feedback: Mapped[str | None] = mapped_column(Text)
    issues_found: Mapped[str | None] = mapped_column(Text)

    verified_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    # Review
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    def __repr__(self) -> str:
        return (
            f"<VerificationChecklist(id={self.id}, requirement_id={self.requirement_id}, "
            f"type='{self.verification_type}', result='{self.result}')>"
        )

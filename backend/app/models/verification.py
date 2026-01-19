"""Verification model for requirement verification records."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Text, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.requirement import Requirement
    from app.models.user import User


VerificationType = PG_ENUM(
    "prototype",
    "test",
    "user_trial",
    "customer_confirmation",
    name="verification_type",
    create_type=True,
)

VerificationResult = PG_ENUM(
    "passed",
    "failed",
    "partial_passed",
    "pending",
    name="verification_result",
    create_type=True,
)


class VerificationRecord(Base):
    """Verification record for requirement validation."""

    __tablename__ = "verification_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    requirement_id: Mapped[int] = mapped_column(
        ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False
    )

    verification_type: Mapped[str] = mapped_column(VerificationType, nullable=False)
    verification_method: Mapped[str | None] = mapped_column(Text)

    # Verification result
    result: Mapped[str] = mapped_column(VerificationResult, nullable=False)
    evidence_attachments: Mapped[dict | None] = mapped_column(JSON)

    # Customer feedback
    customer_feedback: Mapped[str | None] = mapped_column(Text)
    satisfaction_score: Mapped[int | None] = mapped_column(Integer)

    # Issue records
    issues_found: Mapped[str | None] = mapped_column(Text)
    improvement_suggestions: Mapped[str | None] = mapped_column(Text)

    verified_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    verified_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    # Review information
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime)

    def __repr__(self) -> str:
        return f"<VerificationRecord(id={self.id}, requirement_id={self.requirement_id}, type='{self.verification_type}', result='{self.result}')>"

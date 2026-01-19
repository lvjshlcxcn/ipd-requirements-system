"""Feedback model."""
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Text, ForeignKey, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.requirement import Requirement
    from app.models.user import User


# Feedback type enum
FeedbackType = String(20)

# Source channel enum
FeedbackSource = String(20)

# Severity enum
FeedbackSeverity = String(20)

# Status enum
FeedbackStatus = String(20)


class Feedback(Base, TimestampMixin, TenantMixin):
    """User feedback model for collecting and tracking feedback."""

    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Feedback identification
    feedback_no: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Feedback classification
    feedback_type: Mapped[str] = mapped_column(
        FeedbackType, nullable=False
    )  # bug, feature_request, improvement, complaint
    source_channel: Mapped[str] = mapped_column(
        FeedbackSource, nullable=False
    )  # customer, support, sales, market, rd
    source_contact: Mapped[str | None] = mapped_column(String(100))  # Contact person

    # Feedback content
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str | None] = mapped_column(
        FeedbackSeverity
    )  # critical, high, medium, low

    # Status and workflow
    status: Mapped[str] = mapped_column(
        FeedbackStatus, nullable=False, default="pending"
    )  # pending, analyzing, converted, rejected, closed

    # Relationships
    requirement_id: Mapped[int | None] = mapped_column(
        ForeignKey("requirements.id", ondelete="SET NULL")
    )

    # AI analysis
    ai_suggestion: Mapped[dict | None] = mapped_column(JSONB)
    conversion_confidence: Mapped[float | None] = mapped_column(Float)

    # Metadata
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    # Relationships
    requirement: Mapped["Requirement"] = relationship(
        "Requirement", foreign_keys=[requirement_id]
    )
    creator: Mapped["User"] = relationship(foreign_keys=[created_by])
    updater: Mapped["User"] = relationship(foreign_keys=[updated_by])

    def __repr__(self) -> str:
        return f"<Feedback(id={self.id}, no='{self.feedback_no}', title='{self.title}', type='{self.feedback_type}', status='{self.status}')>"

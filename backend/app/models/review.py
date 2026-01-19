"""Review/Retrospective model."""
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.requirement import Requirement
    from app.models.user import User


class Review(Base, TimestampMixin, TenantMixin):
    """Project retrospective and review records."""

    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Associated requirement
    requirement_id: Mapped[int] = mapped_column(
        ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False
    )

    # Review identification
    review_no: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    review_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # completion, monthly, quarterly, manual

    # Review content (JSONB with template structure)
    # Example: {
    #   "objective": "目标达成情况",
    #   "successes": ["成功点1", "成功点2"],
    #   "challenges": ["挑战1", "挑战2"],
    #   "lessons_learned": "经验教训",
    #   "action_items": ["改进项1", "改进项2"],
    #   "next_steps": "后续计划"
    # }
    review_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default={})

    # Status
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft"
    )  # draft, completed
    reviewed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    # Metadata
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    # Relationships
    requirement: Mapped["Requirement"] = relationship("Requirement")
    reviewer: Mapped["User"] = relationship(foreign_keys=[reviewed_by])
    creator: Mapped["User"] = relationship(foreign_keys=[created_by])

    def __repr__(self) -> str:
        return f"<Review(id={self.id}, no='{self.review_no}', type='{self.review_type}', status='{self.status}')>"

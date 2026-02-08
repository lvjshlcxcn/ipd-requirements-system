"""Vote result archive model."""
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Integer, ForeignKey, Index, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.requirement_review_meeting import RequirementReviewMeeting
    from app.models.requirement import Requirement


class VoteResult(Base, TimestampMixin, TenantMixin):
    """Vote result archive model - stores final voting results when meeting ends."""

    __tablename__ = "vote_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirement_review_meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requirement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requirement_title: Mapped[Optional[str]] = mapped_column(Integer, nullable=True)  # 快照：需求标题
    vote_statistics: Mapped[dict] = mapped_column(JSON, nullable=False)  # 投票统计快照
    archived_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )  # 存档时间

    # Relationships
    meeting: Mapped["RequirementReviewMeeting"] = relationship("RequirementReviewMeeting")
    requirement: Mapped["Requirement"] = relationship("Requirement")

    __table_args__ = (
        Index('ix_vote_results_tenant_meeting', 'tenant_id', 'meeting_id'),
        Index('ix_vote_results_archived_at', 'archived_at'),
    )

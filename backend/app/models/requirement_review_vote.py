"""Requirement review vote model."""
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.requirement import Requirement
    from app.models.requirement_review_meeting import RequirementReviewMeeting


class RequirementReviewVote(Base, TimestampMixin, TenantMixin):
    """Review vote model."""

    __tablename__ = "requirement_review_votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirement_review_meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requirement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    voter_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vote_option: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # approve/reject/abstain
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    meeting: Mapped["RequirementReviewMeeting"] = relationship("RequirementReviewMeeting")
    requirement: Mapped["Requirement"] = relationship("Requirement")
    voter: Mapped["User"] = relationship("User")

    __table_args__ = (
        UniqueConstraint('meeting_id', 'requirement_id', 'voter_id', name='uq_meeting_requirement_voter'),
        # 关键索引：优化投票统计查询
        Index('ix_review_votes_meeting_req_option', 'meeting_id', 'requirement_id', 'vote_option'),
        Index('ix_review_votes_tenant_meeting', 'tenant_id', 'meeting_id'),
    )

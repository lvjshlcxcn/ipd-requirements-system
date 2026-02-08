"""Requirement review meeting requirement association model."""
from typing import TYPE_CHECKING, Optional, List

from sqlalchemy import Integer, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.requirement import Requirement
    from app.models.requirement_review_meeting import RequirementReviewMeeting


class RequirementReviewMeetingRequirement(Base, TimestampMixin, TenantMixin):
    """Meeting to requirement association model."""

    __tablename__ = "requirement_review_meeting_requirements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirement_review_meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requirement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    review_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    meeting_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_voter_ids: Mapped[Optional[List[int]]] = mapped_column(JSONB, nullable=True)  # 指定的投票人员ID列表

    # Relationships
    meeting: Mapped["RequirementReviewMeeting"] = relationship("RequirementReviewMeeting")
    requirement: Mapped["Requirement"] = relationship("Requirement")

    __table_args__ = (
        UniqueConstraint('meeting_id', 'requirement_id', name='uq_meeting_requirement'),
        Index('ix_meeting_reqs_tenant_meeting', 'tenant_id', 'meeting_id', 'review_order'),
    )

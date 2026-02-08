"""Requirement review meeting attendee model."""
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.requirement_review_meeting import RequirementReviewMeeting


class RequirementReviewMeetingAttendee(Base, TimestampMixin, TenantMixin):
    """Meeting attendee model."""

    __tablename__ = "requirement_review_meeting_attendees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirement_review_meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attendee_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attendance_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="invited"
    )  # invited/accepted/declined/attended

    # Relationships
    meeting: Mapped["RequirementReviewMeeting"] = relationship("RequirementReviewMeeting", back_populates="attendees")
    attendee: Mapped["User"] = relationship("User")

    __table_args__ = (
        UniqueConstraint('meeting_id', 'attendee_id', name='uq_meeting_attendee'),
        Index('ix_meeting_attendees_tenant_meeting', 'tenant_id', 'meeting_id'),
        Index('ix_meeting_attendees_tenant_user', 'tenant_id', 'attendee_id'),
    )

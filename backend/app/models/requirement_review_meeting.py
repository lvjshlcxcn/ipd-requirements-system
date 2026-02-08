"""Requirement review meeting model."""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey, Text, DateTime, JSON, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.requirement import Requirement


class RequirementReviewMeeting(Base, TimestampMixin, TenantMixin):
    """Requirement review meeting model."""

    __tablename__ = "requirement_review_meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    moderator_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="scheduled", index=True
    )  # scheduled/in_progress/completed/cancelled
    meeting_settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    moderator: Mapped["User"] = relationship("User", foreign_keys=[moderator_id])
    creator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by])
    attendees: Mapped[list["RequirementReviewMeetingAttendee"]] = relationship(
        "RequirementReviewMeetingAttendee",
        back_populates="meeting",
        cascade="all, delete-orphan"  # 级联删除：删除会议时自动删除参会人员
    )

    __table_args__ = (
        Index('ix_review_meetings_tenant_status', 'tenant_id', 'status', 'scheduled_at'),
        Index('ix_review_meetings_tenant_moderator', 'tenant_id', 'moderator_id'),
    )

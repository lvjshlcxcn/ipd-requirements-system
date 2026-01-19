"""Notification model."""
from sqlalchemy import String, Integer, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin


# Notification type enum
NotificationType = PG_ENUM(
    "requirement_created",
    "requirement_updated",
    "requirement_assigned",
    "requirement_status_changed",
    "analysis_completed",
    "verification_completed",
    "comment_added",
    "mention",
    name="notification_type",
    create_type=True,
)


class Notification(Base, TimestampMixin, TenantMixin):
    """User notification model."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    notification_type: Mapped[str] = mapped_column(NotificationType, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(String(1000), nullable=False)

    # Link to related entity
    entity_type: Mapped[str | None] = mapped_column(String(50))
    entity_id: Mapped[int | None] = mapped_column(Integer)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[int | None] = mapped_column(Integer)  # Timestamp

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, type='{self.notification_type}')>"

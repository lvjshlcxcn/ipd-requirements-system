"""Workflow history model."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class WorkflowHistory(Base):
    """Workflow history record for tracking state changes."""

    __tablename__ = "workflow_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    entity_type: Mapped[str] = mapped_column(String(30), nullable=False)  # requirement, charter, pcr, etc.
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)

    action: Mapped[str] = mapped_column(String(50), nullable=False)  # created, updated, submitted, approved, etc.
    from_status: Mapped[str | None] = mapped_column(String(30))
    to_status: Mapped[str] = mapped_column(String(30), nullable=False)

    action_reason: Mapped[str | None] = mapped_column(Text)
    comments: Mapped[str | None] = mapped_column(Text)

    performed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    performed_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Change snapshot
    changes_snapshot: Mapped[dict | None] = mapped_column(JSON)

    def __repr__(self) -> str:
        return f"<WorkflowHistory(id={self.id}, entity_type='{self.entity_type}', entity_id={self.entity_id}, action='{self.action}')>"

"""Product Change Request (PCR) model."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.requirement import Requirement
    from app.models.charter import Charter
    from app.models.user import User


ChangeType = PG_ENUM(
    "addition",
    "modification",
    "removal",
    name="change_type",
    create_type=True,
)

UrgencyLevel = PG_ENUM(
    "critical",
    "high",
    "medium",
    "low",
    name="urgency_level",
    create_type=True,
)

PCRStatus = PG_ENUM(
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "implemented",
    "closed",
    name="pcr_status",
    create_type=True,
)


class PCRRequest(Base):
    """Product Change Request model for urgent requirements."""

    __tablename__ = "pcr_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    pcr_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    requirement_id: Mapped[int | None] = mapped_column(ForeignKey("requirements.id"))
    charter_id: Mapped[int | None] = mapped_column(ForeignKey("charters.id"))

    change_type: Mapped[str | None] = mapped_column(ChangeType)
    urgency_level: Mapped[str | None] = mapped_column(UrgencyLevel)

    # Impact analysis
    impact_assessment: Mapped[str | None] = mapped_column(Text)
    risk_assessment: Mapped[str | None] = mapped_column(Text)
    estimated_effort_hours: Mapped[int | None] = mapped_column(Integer)

    # Approval workflow
    status: Mapped[str] = mapped_column(PCRStatus, default="submitted")
    submitted_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    submitted_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime)
    implemented_at: Mapped[datetime | None] = mapped_column(DateTime)

    def __repr__(self) -> str:
        return f"<PCRRequest(id={self.id}, code='{self.pcr_code}', title='{self.title}', status='{self.status}')>"

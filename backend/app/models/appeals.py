"""APPEALS analysis model."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Integer, String, Text, ForeignKey, Numeric, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.requirement import Requirement
    from app.models.user import User


class AppealsAnalysis(Base):
    """APPEALS model for 8-dimensional analysis."""

    __tablename__ = "appeals_analysis"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    requirement_id: Mapped[int] = mapped_column(
        ForeignKey("requirements.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Price dimension
    price_score: Mapped[int | None] = mapped_column(Integer)
    price_weight: Mapped[float | None] = mapped_column(DECIMAL(3, 2))
    price_comment: Mapped[str | None] = mapped_column(Text)

    # Availability dimension
    availability_score: Mapped[int | None] = mapped_column(Integer)
    availability_weight: Mapped[float | None] = mapped_column(DECIMAL(3, 2))
    availability_comment: Mapped[str | None] = mapped_column(Text)

    # Packaging dimension
    packaging_score: Mapped[int | None] = mapped_column(Integer)
    packaging_weight: Mapped[float | None] = mapped_column(DECIMAL(3, 2))
    packaging_comment: Mapped[str | None] = mapped_column(Text)

    # Performance dimension
    performance_score: Mapped[int | None] = mapped_column(Integer)
    performance_weight: Mapped[float | None] = mapped_column(DECIMAL(3, 2))
    performance_comment: Mapped[str | None] = mapped_column(Text)

    # Ease of use dimension
    ease_of_use_score: Mapped[int | None] = mapped_column(Integer)
    ease_of_use_weight: Mapped[float | None] = mapped_column(DECIMAL(3, 2))
    ease_of_use_comment: Mapped[str | None] = mapped_column(Text)

    # Assurance dimension
    assurance_score: Mapped[int | None] = mapped_column(Integer)
    assurance_weight: Mapped[float | None] = mapped_column(DECIMAL(3, 2))
    assurance_comment: Mapped[str | None] = mapped_column(Text)

    # Lifecycle cost dimension
    lifecycle_cost_score: Mapped[int | None] = mapped_column(Integer)
    lifecycle_cost_weight: Mapped[float | None] = mapped_column(DECIMAL(3, 2))
    lifecycle_cost_comment: Mapped[str | None] = mapped_column(Text)

    # Social acceptance dimension
    social_acceptance_score: Mapped[int | None] = mapped_column(Integer)
    social_acceptance_weight: Mapped[float | None] = mapped_column(DECIMAL(3, 2))
    social_acceptance_comment: Mapped[str | None] = mapped_column(Text)

    # Calculated result
    total_weighted_score: Mapped[float | None] = mapped_column(DECIMAL(10, 2))

    analyzed_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    analyzed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    # Relationships
    requirement: Mapped["Requirement"] = relationship()
    analyzer: Mapped["User"] = relationship(foreign_keys=[analyzed_by])

    def __repr__(self) -> str:
        return f"<AppealsAnalysis(id={self.id}, requirement_id={self.requirement_id}, total_score={self.total_weighted_score})>"

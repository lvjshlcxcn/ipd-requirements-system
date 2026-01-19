"""KANO model classification."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Text, ForeignKey, Numeric, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.requirement import Requirement
    from app.models.user import User


class KanoClassification(Base):
    """KANO model classification."""

    __tablename__ = "kano_classification"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    requirement_id: Mapped[int] = mapped_column(
        ForeignKey("requirements.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    category: Mapped[str] = mapped_column(String(20), nullable=False)  # basic, performance, excitement
    confidence_level: Mapped[float | None] = mapped_column(DECIMAL(4, 2))  # 0-1

    # Functional survey results
    functional_present: Mapped[int | None] = mapped_column(Integer)  # 1-5 Likert scale
    functional_absent: Mapped[int | None] = mapped_column(Integer)
    dysfunctional_present: Mapped[int | None] = mapped_column(Integer)
    dysfunctional_absent: Mapped[int | None] = mapped_column(Integer)

    # Analysis notes
    classification_reason: Mapped[str | None] = mapped_column(Text)
    better_answer: Mapped[str | None] = mapped_column(Text)
    worse_answer: Mapped[str | None] = mapped_column(Text)

    classified_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    classified_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    # Relationships
    requirement: Mapped["Requirement"] = relationship()
    classifier: Mapped["User"] = relationship(foreign_keys=[classified_by])

    def __repr__(self) -> str:
        return f"<KanoClassification(id={self.id}, requirement_id={self.requirement_id}, category='{self.category}')>"

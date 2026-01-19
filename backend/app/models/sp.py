"""Strategic Plan (SP) model."""
from datetime import datetime, date
from typing import TYPE_CHECKING
from decimal import Decimal

from sqlalchemy import String, Integer, Text, ForeignKey, Numeric, Date, DateTime
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


SPStatus = PG_ENUM(
    "draft",
    "approved",
    "in_execution",
    "completed",
    name="sp_status",
    create_type=True,
)


class StrategicPlan(Base):
    """Strategic Plan model for long-term requirements."""

    __tablename__ = "strategic_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sp_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    year: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(SPStatus, default="draft")

    strategic_importance: Mapped[str | None] = mapped_column(String(20))
    investment_budget: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))

    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    def __repr__(self) -> str:
        return f"<StrategicPlan(id={self.id}, code='{self.sp_code}', title='{self.title}')>"

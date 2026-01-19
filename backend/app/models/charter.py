"""Charter model for project task books."""
from datetime import datetime, date
from typing import TYPE_CHECKING
from decimal import Decimal

from sqlalchemy import String, Integer, Text, ForeignKey, Numeric, Date, DateTime
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.bp import BusinessPlan
    from app.models.user import User


CharterStatus = PG_ENUM(
    "draft",
    "approved",
    "in_planning",
    "in_development",
    "in_testing",
    "completed",
    "cancelled",
    name="charter_status",
    create_type=True,
)


class Charter(Base):
    """Charter model for short-term requirements."""

    __tablename__ = "charters"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    charter_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    bp_id: Mapped[int | None] = mapped_column(ForeignKey("business_plans.id"))
    project_type: Mapped[str | None] = mapped_column(String(50))  # new_product, enhancement, maintenance

    # Project key information
    objectives: Mapped[str | None] = mapped_column(Text)
    scope: Mapped[str | None] = mapped_column(Text)
    assumptions: Mapped[str | None] = mapped_column(Text)
    constraints: Mapped[str | None] = mapped_column(Text)

    # Team information
    project_manager_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    team_lead_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    team_size: Mapped[int | None] = mapped_column(Integer)

    # Time and cost
    estimated_duration_months: Mapped[int | None] = mapped_column(Integer)
    budget: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))

    status: Mapped[str] = mapped_column(CharterStatus, default="draft")

    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    def __repr__(self) -> str:
        return f"<Charter(id={self.id}, code='{self.charter_code}', title='{self.title}')>"

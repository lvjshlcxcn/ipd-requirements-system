"""Requirement model."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Text, ForeignKey, JSON, DateTime, Float
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.user import User


# Status enum
RequirementStatus = PG_ENUM(
    "collected",
    "analyzing",
    "analyzed",
    "distributing",
    "distributed",
    "implementing",
    "verifying",
    "completed",
    "rejected",
    name="requirement_status",
    create_type=True,
)

# Source channel enum
SourceChannel = PG_ENUM(
    "customer",
    "market",
    "competition",
    "sales",
    "after_sales",
    "rd",
    name="source_channel",
    create_type=True,
)

# Complexity level enum
ComplexityLevel = PG_ENUM(
    "low",
    "medium",
    "high",
    "very_high",
    name="complexity_level",
    create_type=True,
)

# Target type enum
TargetType = PG_ENUM(
    "sp",
    "bp",
    "charter",
    "pcr",
    name="target_type",
    create_type=True,
)


# KANO category enum
KanoCategory = PG_ENUM(
    "basic",
    "performance",
    "excitement",
    name="kano_category",
    create_type=True,
)


class Requirement(Base, TimestampMixin, TenantMixin):
    """Requirement model with multi-tenancy support."""

    __tablename__ = "requirements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    requirement_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # User Story format: "As a [user], I want [feature], So that [benefit]"
    user_story_role: Mapped[str | None] = mapped_column(String(100))  # "调度员"
    user_story_action: Mapped[str | None] = mapped_column(Text)  # "一键生成操作票"
    user_story_benefit: Mapped[str | None] = mapped_column(Text)  # "快速、无差错地执行倒闸操作"

    # Collection information
    source_channel: Mapped[str] = mapped_column(SourceChannel, nullable=False)
    source_contact: Mapped[str | None] = mapped_column(String(100))
    collector_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    # Customer need 10 questions (stored as JSONB)
    customer_need_10q: Mapped[dict | None] = mapped_column(JSONB)

    # Customer/Product/Scenario info (JSONB)
    customer_info: Mapped[dict | None] = mapped_column(JSONB)
    product_info: Mapped[dict | None] = mapped_column(JSONB)
    user_scenario: Mapped[str | None] = mapped_column(Text)

    # CIM model reference
    cim_model_reference: Mapped[str | None] = mapped_column(String(100))

    # Status and priority
    status: Mapped[str] = mapped_column(RequirementStatus, nullable=False, default="collected")
    priority_score: Mapped[float | None] = mapped_column(Float)
    priority_rank: Mapped[int | None] = mapped_column(Integer)

    # Analysis results - Mandatory for all requirements
    kano_category: Mapped[str | None] = mapped_column(KanoCategory)
    appeals_scores: Mapped[dict | None] = mapped_column(JSONB)
    invest_analysis: Mapped[dict | None] = mapped_column(JSONB)  # INVEST criteria
    moscow_priority: Mapped[str | None] = mapped_column(String(20))  # must/should/could/wont
    moscow_comment: Mapped[str | None] = mapped_column(Text)  # MoSCoW justification
    rice_score: Mapped[dict | None] = mapped_column(JSONB)  # Reach, Impact, Confidence, Effort

    # Distribution information
    target_type: Mapped[str | None] = mapped_column(TargetType)
    target_id: Mapped[int | None] = mapped_column(Integer)

    # Time estimation (支持小数天数)
    estimated_duration_months: Mapped[float | None] = mapped_column(Float)
    complexity_level: Mapped[str | None] = mapped_column(ComplexityLevel)

    # Metadata
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    # Relationships
    collector: Mapped["User"] = relationship(foreign_keys=[collector_id])
    creator: Mapped["User"] = relationship(foreign_keys=[created_by])
    updater: Mapped["User"] = relationship(foreign_keys=[updated_by])

    def __repr__(self) -> str:
        return f"<Requirement(id={self.id}, no='{self.requirement_no}', title='{self.title}', status='{self.status}')>"


class Requirement10QAnswer(Base, TimestampMixin, TenantMixin):
    """Customer need 10 questions detailed answers."""

    __tablename__ = "requirement_10q_answers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    requirement_id: Mapped[int] = mapped_column(
        ForeignKey("requirements.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Ten questions
    q1_who_cares: Mapped[str | None] = mapped_column(Text)
    q2_why_care: Mapped[str | None] = mapped_column(Text)
    q3_how_often: Mapped[str | None] = mapped_column(Text)
    q4_current_solution: Mapped[str | None] = mapped_column(Text)
    q5_pain_points: Mapped[str | None] = mapped_column(Text)
    q6_expected_outcome: Mapped[str | None] = mapped_column(Text)
    q7_value_impact: Mapped[str | None] = mapped_column(Text)
    q8_urgency_level: Mapped[str | None] = mapped_column(Text)
    q9_budget_willingness: Mapped[str | None] = mapped_column(Text)
    q10_alternative_solutions: Mapped[str | None] = mapped_column(Text)

    additional_notes: Mapped[str | None] = mapped_column(Text)
    answered_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    def __repr__(self) -> str:
        return f"<Requirement10QAnswer(id={self.id}, requirement_id={self.requirement_id})>"

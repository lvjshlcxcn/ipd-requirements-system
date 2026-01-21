"""Insight analysis models."""
from datetime import datetime
from typing import TYPE_CHECKING, List, Dict, Any

from sqlalchemy import String, Integer, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.requirement import Requirement


class InsightAnalysis(Base, TimestampMixin, TenantMixin):
    """文本洞察分析记录"""

    __tablename__ = "insight_analyses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # 输入信息
    input_text: Mapped[str] = mapped_column(Text, nullable=False)
    text_length: Mapped[int] = mapped_column(Integer, nullable=False)
    input_source: Mapped[str] = mapped_column(String(50), nullable=False)  # manual/upload/voice

    # AI配置
    llm_provider: Mapped[str] = mapped_column(String(50), nullable=False, default='deepseek')
    llm_model: Mapped[str] = mapped_column(String(100), nullable=False, default='deepseek-chat')
    analysis_mode: Mapped[str] = mapped_column(String(50), nullable=False, default='full')
    prompt_version: Mapped[str | None] = mapped_column(String(20), default='v1.0')

    # 分析结果 (JSONB)
    analysis_result: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)

    # 十问字段(冗余存储,便于查询)
    q1_who: Mapped[str | None] = mapped_column(Text)
    q2_why: Mapped[str | None] = mapped_column(Text)
    q3_what_problem: Mapped[str | None] = mapped_column(Text)
    q4_current_solution: Mapped[str | None] = mapped_column(Text)
    q5_current_issues: Mapped[str | None] = mapped_column(Text)
    q6_ideal_solution: Mapped[str | None] = mapped_column(Text)
    q7_priority: Mapped[str | None] = mapped_column(String(20))
    q8_frequency: Mapped[str | None] = mapped_column(String(20))
    q9_impact_scope: Mapped[str | None] = mapped_column(Text)
    q10_value: Mapped[str | None] = mapped_column(Text)

    # 扩展信息 (JSONB)
    user_persona: Mapped[Dict[str, Any] | None] = mapped_column(JSONB)
    scenario: Mapped[Dict[str, Any] | None] = mapped_column(JSONB)
    emotional_tags: Mapped[Dict[str, Any] | None] = mapped_column(JSONB)

    # 元数据
    status: Mapped[str] = mapped_column(String(20), nullable=False, default='draft')
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)

    # 性能指标
    analysis_duration: Mapped[int | None] = mapped_column(Integer)  # 秒
    tokens_used: Mapped[int | None] = mapped_column(Integer)

    # 关系
    storyboards: Mapped[List["UserStoryboard"]] = relationship(
        "UserStoryboard", back_populates="insight"
    )


class UserStoryboard(Base, TimestampMixin, TenantMixin):
    """用户故事板"""

    __tablename__ = "user_storyboards"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # 关联
    insight_id: Mapped[int] = mapped_column(
        ForeignKey('insight_analyses.id'), nullable=False
    )

    # 内容
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # 卡片数据 (JSONB)
    card_data: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)

    # 样式配置
    card_style: Mapped[str | None] = mapped_column(String(50), default='modern')
    color_theme: Mapped[str | None] = mapped_column(String(50))

    # 导出
    export_image_path: Mapped[str | None] = mapped_column(Text)
    export_pdf_path: Mapped[str | None] = mapped_column(Text)

    # 关联需求
    linked_requirement_id: Mapped[int | None] = mapped_column(ForeignKey('requirements.id'))

    # 元数据
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)

    # 关系
    insight: Mapped["InsightAnalysis"] = relationship(
        "InsightAnalysis", back_populates="storyboards"
    )

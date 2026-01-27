"""Requirement schemas."""
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


# ============================================================================
# Customer Need 10 Questions Schemas
# ============================================================================

class Requirement10QBase(BaseModel):
    """Base schema for 10 questions."""

    q1_who_cares: Optional[str] = Field(None, description="谁关注这个需求")
    q2_why_care: Optional[str] = Field(None, description="为什么关注")
    q3_how_often: Optional[str] = Field(None, description="使用频率")
    q4_current_solution: Optional[str] = Field(None, description="现有解决方案")
    q5_pain_points: Optional[str] = Field(None, description="痛点问题")
    q6_expected_outcome: Optional[str] = Field(None, description="期望结果")
    q7_value_impact: Optional[str] = Field(None, description="价值和影响")
    q8_urgency_level: Optional[str] = Field(None, description="紧急程度")
    q9_budget_willingness: Optional[str] = Field(None, description="预算意愿")
    q10_alternative_solutions: Optional[str] = Field(None, description="替代方案")
    additional_notes: Optional[str] = Field(None, description="补充说明")


class Requirement10QCreate(Requirement10QBase):
    """Schema for creating 10 questions answer."""

    pass


class Requirement10QResponse(Requirement10QBase):
    """Schema for 10 questions response."""

    id: int
    requirement_id: int
    answered_at: datetime
    answered_by: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Requirement Schemas
# ============================================================================

class RequirementBase(BaseModel):
    """Base requirement schema."""

    title: str = Field(..., min_length=1, max_length=200, description="需求标题")
    description: str = Field(..., min_length=1, description="需求描述")
    source_channel: str = Field(..., description="来源渠道")
    source_contact: Optional[str] = Field(None, max_length=100, description="联系人")
    estimated_duration_months: Optional[int] = Field(None, ge=1, le=120, description="预估工期(月)")
    complexity_level: Optional[str] = Field(None, description="复杂度级别")


class RequirementCreate(RequirementBase):
    """Schema for creating a requirement."""

    moscow_priority: Optional[str] = Field(None, description="MoSCoW priority")
    moscow_comment: Optional[str] = Field(None, description="MoSCoW priority justification")
    customer_need_10q: Optional[Requirement10QCreate] = Field(None, description="客户需求十问")


class RequirementUpdate(BaseModel):
    """Schema for updating a requirement."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    source_channel: Optional[str] = None
    source_contact: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = None
    priority_score: Optional[int] = Field(None, ge=0, le=100)
    moscow_priority: Optional[str] = Field(None, description="MoSCoW priority")
    moscow_comment: Optional[str] = Field(None, description="MoSCoW priority justification")
    estimated_duration_months: Optional[int] = Field(None, ge=1, le=120)
    complexity_level: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    customer_need_10q: Optional[Requirement10QCreate] = None


class RequirementResponse(BaseModel):
    """Schema for requirement response."""

    id: int
    requirement_no: str
    title: str
    description: str
    source_channel: str
    source_contact: Optional[str] = None
    status: str
    priority_score: Optional[int] = None
    moscow_priority: Optional[str] = None
    moscow_comment: Optional[str] = None
    priority_rank: Optional[int] = None
    kano_category: Optional[str] = None
    appeals_scores: Optional[Dict[str, Any]] = None
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    estimated_duration_months: Optional[int] = None
    complexity_level: Optional[str] = None
    customer_need_10q: Optional[Dict[str, Any]] = None
    collector_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class RequirementListItem(BaseModel):
    """Schema for requirement list item."""

    key: int = Field(..., alias="id")
    no: str = Field(..., alias="requirement_no")
    title: str
    description: str
    source: str = Field(..., alias="source_channel")
    status: str
    priority: Optional[int] = Field(None, alias="priority_score")
    moscow_priority: Optional[str] = None
    createdAt: str = Field(..., alias="created_at")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PaginatedResponse(BaseModel):
    """Paginated response schema."""

    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class RequirementListResponse(BaseModel):
    """Schema for requirement list response."""

    success: bool = True
    data: PaginatedResponse


class RequirementDetailResponse(BaseModel):
    """Schema for requirement detail response."""

    success: bool = True
    data: RequirementResponse


class RequirementStatsByStatus(BaseModel):
    """Statistics by status."""

    collected: int = 0
    analyzing: int = 0
    analyzed: int = 0
    distributing: int = 0
    distributed: int = 0
    implementing: int = 0
    verifying: int = 0
    completed: int = 0
    rejected: int = 0


class RequirementStatsByChannel(BaseModel):
    """Statistics by source channel."""

    customer: int = 0
    market: int = 0
    competition: int = 0
    sales: int = 0
    after_sales: int = 0
    rd: int = 0


class RequirementStatsData(BaseModel):
    """Statistics data."""

    total: int
    by_status: RequirementStatsByStatus
    by_channel: RequirementStatsByChannel


class RequirementStatsResponse(BaseModel):
    """Schema for statistics response."""

    success: bool = True
    data: RequirementStatsData


class MessageResponse(BaseModel):
    """Generic message response."""

    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None

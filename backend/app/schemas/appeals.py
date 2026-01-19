"""APPEALS analysis schemas for Pydantic validation."""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class APPEALSDimension(BaseModel):
    """Single APPEALS dimension schema.

    Each dimension has:
    - score: Rating from 1-10
    - weight: Importance weight (0.0-1.0)
    - comment: Optional explanation
    """

    score: int = Field(..., ge=1, le=10, description="评分 (1-10)")
    weight: float = Field(..., ge=0.0, le=1.0, description="权重 (0.0-1.0)")
    comment: Optional[str] = Field(None, description="评分说明")


class APPEALSAnalysisCreate(BaseModel):
    """Schema for creating/updating APPEALS analysis.

    $APPEALS = Price, Availability, Packaging, Performance,
               Ease of Use, Assurance, Lifecycle Cost, Social Acceptance
    """

    price: APPEALSDimension = Field(..., description="价格/成本")
    availability: APPEALSDimension = Field(..., description="可获得性")
    packaging: APPEALSDimension = Field(..., description="包装/外观")
    performance: APPEALSDimension = Field(..., description="性能")
    ease_of_use: APPEALSDimension = Field(..., description="易用性")
    assurance: APPEALSDimension = Field(..., description="保证/可靠性")
    lifecycle_cost: APPEALSDimension = Field(..., description="生命周期成本")
    social_acceptance: APPEALSDimension = Field(..., description="社会接受度/服务")


class APPEALSAnalysisResponse(BaseModel):
    """Schema for APPEALS analysis response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    requirement_id: int
    dimensions: Dict[str, APPEALSDimension]
    total_weighted_score: float
    analyzed_at: str
    analyzed_by: Optional[int] = None


class APPEALSSummary(BaseModel):
    """Schema for APPEALS summary across all requirements."""

    total_requirements: int
    analyzed_requirements: int
    average_scores: Dict[str, float]
    top_requirements: list[Dict[str, Any]]

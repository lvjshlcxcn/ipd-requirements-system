"""RICE analysis schemas."""
from typing import Optional
from pydantic import BaseModel, Field


class RICEAnalysisCreate(BaseModel):
    """RICE分析创建Schema"""
    reach: int = Field(..., ge=1, le=10, description="影响范围 (1-10)")
    impact: int = Field(..., ge=1, le=10, description="影响程度 (1-10)")
    confidence: int = Field(..., ge=1, le=10, description="信心程度 (1-10)")
    effort: int = Field(..., ge=1, le=10, description="所需努力 (1-10)")
    notes: Optional[str] = Field(None, description="备注说明")


class RICEAnalysisResponse(BaseModel):
    """RICE分析响应Schema"""
    requirement_id: int
    reach: int
    impact: int
    confidence: int
    effort: int
    score: float
    notes: Optional[str]
    analyzed_at: str

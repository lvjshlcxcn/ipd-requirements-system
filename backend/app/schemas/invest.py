"""INVEST analysis schemas."""
from typing import Optional
from pydantic import BaseModel, Field


class INVESTAnalysisCreate(BaseModel):
    """INVEST分析创建Schema - 评分系统"""
    independent: int = Field(..., ge=0, le=100, description="独立 (0-100)")
    negotiable: int = Field(..., ge=0, le=100, description="可协商 (0-100)")
    valuable: int = Field(..., ge=0, le=100, description="有价值 (0-100)")
    estimable: int = Field(..., ge=0, le=100, description="可估算 (0-100)")
    small: int = Field(..., ge=0, le=100, description="小型 (0-100)")
    testable: int = Field(..., ge=0, le=100, description="可测试 (0-100)")
    notes: Optional[str] = Field(None, description="备注说明")


class INVESTAnalysisResponse(BaseModel):
    """INVEST分析响应Schema"""
    requirement_id: int
    independent: int
    negotiable: int
    valuable: int
    estimable: int
    small: int
    testable: int
    total_score: int      # 总分 (0-600)
    average_score: float  # 平均分 (0-100)
    notes: Optional[str] = None
    analyzed_at: str

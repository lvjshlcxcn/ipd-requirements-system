"""INVEST analysis schemas."""
from typing import Optional
from pydantic import BaseModel, Field


class INVESTAnalysisCreate(BaseModel):
    """INVEST分析创建Schema"""
    independent: bool = Field(..., description="独立")
    negotiable: bool = Field(..., description="可协商")
    valuable: bool = Field(..., description="有价值")
    estimable: bool = Field(..., description="可估算")
    small: bool = Field(..., description="小型")
    testable: bool = Field(..., description="可测试")
    notes: Optional[str] = Field(None, description="备注说明")


class INVESTAnalysisResponse(BaseModel):
    """INVEST分析响应Schema"""
    requirement_id: int
    independent: bool
    negotiable: bool
    valuable: bool
    estimable: bool
    small: bool
    testable: bool
    passed_count: int
    total_count: int = 6
    notes: Optional[str]
    analyzed_at: str

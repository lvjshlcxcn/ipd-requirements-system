"""Verification metric schemas."""
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


class VerificationMetricCreate(BaseModel):
    """Schema for creating verification metrics."""

    requirement_id: int = Field(..., description="需求ID")
    metrics_config: List[Dict[str, Any]] = Field(
        ...,
        description="验证指标配置",
        examples=[
            [
                {"name": "使用率", "target_value": 80, "unit": "%", "description": "用户使用率"},
                {"name": "满意度", "target_value": 4.0, "unit": "分", "description": "用户满意度评分（5分制）"}
            ]
        ]
    )


class VerificationMetricUpdate(BaseModel):
    """Schema for updating verification metrics."""

    metrics_config: Optional[List[Dict[str, Any]]] = None
    actual_metrics: Optional[Dict[str, Any]] = Field(
        None,
        description="实际指标数据",
        examples=[
            {
                "使用率": {"value": 85, "date": "2026-01-15", "notes": "超过预期"},
                "满意度": {"value": 4.2, "date": "2026-01-15", "notes": "用户反馈良好"}
            }
        ]
    )
    verification_status: Optional[str] = None
    verification_notes: Optional[str] = None


class VerificationMetricResponse(BaseModel):
    """Schema for verification metric response."""

    id: int
    requirement_id: int
    metrics_config: List[Dict[str, Any]]
    actual_metrics: Dict[str, Any]
    verification_status: str
    verification_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VerificationSubmitRequest(BaseModel):
    """Schema for submitting verification results."""

    verification_status: str = Field(..., description="验证状态: passed/failed")
    actual_metrics: Dict[str, Any] = Field(..., description="实际指标数据")
    verification_notes: Optional[str] = Field(None, description="验证备注")


class VerificationDashboardData(BaseModel):
    """Schema for verification dashboard data."""

    total_requirements: int
    verified_count: int
    passed_count: int
    pending_count: int
    pass_rate: float
    requirements: List[Dict[str, Any]]


class VerificationDashboardResponse(BaseModel):
    """Schema for dashboard response."""

    success: bool = True
    data: VerificationDashboardData


class MessageResponse(BaseModel):
    """Generic message response."""

    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None

"""RTM schemas for request and response validation."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TraceabilityLinkBase(BaseModel):
    """追溯关联基础 Schema."""

    design_id: Optional[str] = Field(None, max_length=100, description="设计文档ID")
    code_id: Optional[str] = Field(None, max_length=100, description="代码ID")
    test_id: Optional[str] = Field(None, max_length=100, description="测试用例ID")
    notes: Optional[str] = Field(None, description="备注")


class TraceabilityLinkCreate(TraceabilityLinkBase):
    """创建追溯关联 Schema."""

    requirement_id: int = Field(..., description="需求ID")


class TraceabilityLinkUpdate(TraceabilityLinkBase):
    """更新追溯关联 Schema."""

    status: Optional[str] = Field(None, max_length=50, description="状态")


class TraceabilityLinkResponse(TraceabilityLinkBase):
    """追溯关联响应 Schema."""

    id: int
    requirement_id: int
    status: str
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TraceabilityItem(BaseModel):
    """追溯项 Schema."""

    id: int
    design_id: Optional[str] = None
    code_id: Optional[str] = None
    test_id: Optional[str] = None


class TraceabilityMatrix(BaseModel):
    """需求追溯矩阵 Schema."""

    requirement_no: str  # 业务需求编号 (REQ-2025-0001)
    requirement_title: str
    design_items: List[TraceabilityItem] = []
    code_items: List[TraceabilityItem] = []
    test_items: List[TraceabilityItem] = []


class TraceabilityMatrixResponse(BaseModel):
    """追溯矩阵响应 Schema."""

    data: List[TraceabilityMatrix]
    total: int

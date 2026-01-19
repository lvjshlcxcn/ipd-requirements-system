"""Workflow history schemas."""
from datetime import datetime
from typing import Optional, List, Any

from pydantic import BaseModel, Field, ConfigDict


class WorkflowHistoryResponse(BaseModel):
    """Workflow history record response."""

    id: int
    entity_type: str
    entity_id: int
    action: str
    from_status: Optional[str] = None
    to_status: str
    action_reason: Optional[str] = None
    comments: Optional[str] = None
    performed_by: Optional[int] = None
    performed_at: datetime
    changes_snapshot: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


class WorkflowHistoryListResponse(BaseModel):
    """History record list response."""

    success: bool = True
    data: List[WorkflowHistoryResponse]


class WorkflowHistoryCreate(BaseModel):
    """Schema for creating manual history record (note/comment)."""

    comments: str = Field(..., min_length=1, max_length=2000, description="备注内容")
    action_reason: Optional[str] = Field(None, max_length=500, description="变更原因")
    metadata: Optional[dict] = Field(None, description="额外元数据")

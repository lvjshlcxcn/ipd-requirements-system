"""Feedback schemas."""
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


class FeedbackBase(BaseModel):
    """Base feedback schema."""

    title: str = Field(..., min_length=1, max_length=200, description="反馈标题")
    description: str = Field(..., min_length=1, description="反馈描述")
    feedback_type: str = Field(..., description="反馈类型")
    source_channel: str = Field(..., description="来源渠道")
    source_contact: Optional[str] = Field(None, max_length=100, description="联系人")
    severity: Optional[str] = Field(None, description="严重程度")


class FeedbackCreate(FeedbackBase):
    """Schema for creating feedback."""

    pass


class FeedbackUpdate(BaseModel):
    """Schema for updating feedback."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    status: Optional[str] = None
    severity: Optional[str] = None
    requirement_id: Optional[int] = None


class FeedbackResponse(BaseModel):
    """Schema for feedback response."""

    id: int
    feedback_no: str
    title: str
    description: str
    feedback_type: str
    source_channel: str
    source_contact: Optional[str] = None
    severity: Optional[str] = None
    status: str
    requirement_id: Optional[int] = None
    ai_suggestion: Optional[Dict[str, Any]] = None
    conversion_confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class FeedbackListItem(BaseModel):
    """Schema for feedback list item."""

    id: int
    feedback_no: str
    title: str
    feedback_type: str
    source_channel: str
    status: str
    severity: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PaginatedFeedbackResponse(BaseModel):
    """Paginated feedback response."""

    success: bool = True
    data: Dict[str, Any]


class FeedbackConvertRequest(BaseModel):
    """Schema for feedback conversion request."""

    confirmed: bool = Field(..., description="是否确认转化")
    notes: Optional[str] = Field(None, description="备注")


class FeedbackConvertResponse(BaseModel):
    """Schema for feedback conversion response."""

    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None


class MessageResponse(BaseModel):
    """Generic message response."""

    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None

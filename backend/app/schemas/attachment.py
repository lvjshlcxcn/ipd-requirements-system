"""Attachment schemas."""
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict


# ============================================================================
# Attachment Schemas
# ============================================================================

class AttachmentBase(BaseModel):
    """Base attachment schema."""

    file_name: str = Field(..., description="文件名")
    description: Optional[str] = Field(None, description="文件描述")


class AttachmentResponse(BaseModel):
    """Schema for attachment response."""

    id: int
    entity_type: str
    entity_id: int
    file_name: str
    file_path: str
    file_size: int
    file_type: Optional[str] = None
    mime_type: Optional[str] = None
    uploaded_by: Optional[int] = None
    uploaded_at: datetime
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AttachmentListResponse(BaseModel):
    """Schema for attachment list response."""

    success: bool
    data: List[AttachmentResponse]


class MessageResponse(BaseModel):
    """Generic message response."""

    success: bool
    message: str

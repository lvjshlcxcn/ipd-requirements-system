"""Review schemas."""
from datetime import datetime
from typing import Optional, Dict, Any, List

from pydantic import BaseModel, Field, ConfigDict


class ReviewBase(BaseModel):
    """Base review schema."""

    requirement_id: int = Field(..., description="需求ID")
    review_type: str = Field(..., description="复盘类型")
    review_data: Dict[str, Any] = Field(
        ...,
        description="复盘内容",
        examples=[
            {
                "objective": "目标达成情况",
                "successes": ["成功点1", "成功点2"],
                "challenges": ["挑战1", "挑战2"],
                "lessons_learned": "经验教训",
                "action_items": ["改进项1", "改进项2"],
                "next_steps": "后续计划"
            }
        ]
    )


class ReviewCreate(ReviewBase):
    """Schema for creating review."""

    pass


class ReviewUpdate(BaseModel):
    """Schema for updating review."""

    review_data: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


class ReviewResponse(BaseModel):
    """Schema for review response."""

    id: int
    review_no: str
    requirement_id: int
    review_type: str
    review_data: Dict[str, Any]
    status: str
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewListItem(BaseModel):
    """Schema for review list item."""

    key: str = Field(..., alias="id")
    review_no: str
    requirement_id: int
    review_type: str
    status: str
    createdAt: str = Field(..., alias="created_at")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ReviewListResponse(BaseModel):
    """Schema for review list response."""

    success: bool = True
    data: List[ReviewResponse]


class MessageResponse(BaseModel):
    """Generic message response."""

    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None

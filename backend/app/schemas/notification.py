"""Notification schemas for Pydantic validation."""
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class NotificationBase(BaseModel):
    """Base notification schema."""

    notification_type: str = Field(..., description="Notification type")
    title: str = Field(..., max_length=200, description="Notification title")
    message: str = Field(..., max_length=1000, description="Notification message")
    entity_type: Optional[str] = Field(None, max_length=50, description="Related entity type")
    entity_id: Optional[int] = Field(None, description="Related entity ID")


class NotificationCreate(NotificationBase):
    """Schema for creating a notification."""

    user_id: int = Field(..., description="Recipient user ID")


class NotificationResponse(NotificationBase):
    """Schema for notification response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    tenant_id: int
    is_read: bool
    read_at: Optional[int]
    created_at: str


class NotificationMarkRead(BaseModel):
    """Schema for marking notification as read."""

    notification_id: int = Field(..., description="Notification ID")


class NotificationUnreadCount(BaseModel):
    """Schema for unread count response."""

    count: int

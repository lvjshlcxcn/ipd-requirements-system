"""Notification API endpoints."""
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.schemas.notification import (
    NotificationResponse,
    NotificationUnreadCount,
)
from app.services.notification import NotificationService
from app.api.deps import get_db, get_current_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    unread_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get current user's notifications.

    Args:
        skip: Pagination offset
        limit: Pagination limit
        unread_only: Only return unread notifications

    Returns:
        List of notifications
    """
    service = NotificationService(db)
    notifications = await service.get_user_notifications(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        unread_only=unread_only,
    )
    return notifications


@router.get("/unread-count", response_model=NotificationUnreadCount)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get unread notification count for current user.

    Returns:
        Unread count
    """
    service = NotificationService(db)
    return await service.get_unread_count(current_user.id)


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Mark notification as read.

    Args:
        notification_id: Notification ID

    Returns:
        Updated notification or None
    """
    service = NotificationService(db)
    return await service.mark_as_read(notification_id, current_user.id)


@router.put("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Mark all notifications as read for current user.

    Returns:
        Number of notifications marked as read
    """
    service = NotificationService(db)
    count = await service.mark_all_as_read(current_user.id)
    return {"success": True, "marked_count": count}

"""Notification service for managing user notifications."""
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationUnreadCount,
)
from app.repositories.notification import NotificationRepository


class NotificationService:
    """Service for notification business logic."""

    def __init__(self, session: AsyncSession):
        """Initialize notification service.

        Args:
            session: Database session
        """
        self.session = session
        self.repo = NotificationRepository(Notification, session)

    async def create_notification(
        self,
        user_id: int,
        tenant_id: int,
        notification_type: str,
        title: str,
        message: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
    ) -> NotificationResponse:
        """Create a notification.

        Args:
            user_id: Recipient user ID
            tenant_id: Tenant ID
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            entity_type: Related entity type
            entity_id: Related entity ID

        Returns:
            Created notification
        """
        notification = await self.repo.create(
            user_id=user_id,
            tenant_id=tenant_id,
            notification_type=notification_type,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
            is_read=False,
        )
        return NotificationResponse.model_validate(notification)

    async def get_user_notifications(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        unread_only: bool = False,
    ) -> List[NotificationResponse]:
        """Get notifications for a user.

        Args:
            user_id: User ID
            skip: Pagination offset
            limit: Pagination limit
            unread_only: Only return unread

        Returns:
            List of notifications
        """
        notifications = await self.repo.get_user_notifications(
            user_id, skip=skip, limit=limit, unread_only=unread_only
        )
        return [NotificationResponse.model_validate(n) for n in notifications]

    async def get_unread_count(self, user_id: int) -> NotificationUnreadCount:
        """Get unread notification count.

        Args:
            user_id: User ID

        Returns:
            Unread count
        """
        count = await self.repo.get_unread_count(user_id)
        return NotificationUnreadCount(count=count)

    async def mark_as_read(self, notification_id: int, user_id: int) -> Optional[NotificationResponse]:
        """Mark notification as read.

        Args:
            notification_id: Notification ID
            user_id: User ID (for verification)

        Returns:
            Updated notification or None
        """
        notification = await self.repo.mark_as_read(notification_id, user_id)
        if notification:
            return NotificationResponse.model_validate(notification)
        return None

    async def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user.

        Args:
            user_id: User ID

        Returns:
            Number of notifications marked
        """
        return await self.repo.mark_all_as_read(user_id)

    async def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Delete a notification.

        Args:
            notification_id: Notification ID
            user_id: User ID (for verification)

        Returns:
            True if deleted, False otherwise
        """
        # TODO: Add user verification check
        return await self.repo.delete(notification_id)

    # Notification helpers for common events

    async def notify_requirement_created(
        self, user_id: int, tenant_id: int, requirement_no: str, title: str
    ) -> NotificationResponse:
        """Notify user that a requirement was created.

        Args:
            user_id: Recipient user ID
            tenant_id: Tenant ID
            requirement_no: Requirement number
            title: Requirement title

        Returns:
            Created notification
        """
        return await self.create_notification(
            user_id=user_id,
            tenant_id=tenant_id,
            notification_type="requirement_created",
            title=f"需求已创建: {requirement_no}",
            message=f"新需求 '{title}' 已被创建。",
            entity_type="requirement",
            entity_id=0,  # Will be set after requirement creation
        )

    async def notify_requirement_updated(
        self,
        user_id: int,
        tenant_id: int,
        requirement_no: str,
        title: str,
        changed_fields: List[str],
    ) -> NotificationResponse:
        """Notify user that a requirement was updated.

        Args:
            user_id: Recipient user ID
            tenant_id: Tenant ID
            requirement_no: Requirement number
            title: Requirement title
            changed_fields: List of changed fields

        Returns:
            Created notification
        """
        fields_str = ", ".join(changed_fields)
        return await self.create_notification(
            user_id=user_id,
            tenant_id=tenant_id,
            notification_type="requirement_updated",
            title=f"需求已更新: {requirement_no}",
            message=f"需求 '{title}' 的以下字段已更新: {fields_str}",
            entity_type="requirement",
        )

    async def notify_analysis_completed(
        self, user_id: int, tenant_id: int, requirement_no: str
    ) -> NotificationResponse:
        """Notify user that analysis is completed.

        Args:
            user_id: Recipient user ID
            tenant_id: Tenant ID
            requirement_no: Requirement number

        Returns:
            Created notification
        """
        return await self.create_notification(
            user_id=user_id,
            tenant_id=tenant_id,
            notification_type="analysis_completed",
            title=f"分析完成: {requirement_no}",
            message=f"需求 {requirement_no} 的分析已完成。",
            entity_type="analysis",
        )

    async def notify_verification_completed(
        self, user_id: int, tenant_id: int, requirement_no: str, verification_type: str
    ) -> NotificationResponse:
        """Notify user that verification is completed.

        Args:
            user_id: Recipient user ID
            tenant_id: Tenant ID
            requirement_no: Requirement number
            verification_type: Type of verification

        Returns:
            Created notification
        """
        return await self.create_notification(
            user_id=user_id,
            tenant_id=tenant_id,
            notification_type="verification_completed",
            title=f"验证完成: {requirement_no}",
            message=f"需求 {requirement_no} 的 {verification_type} 验证已完成。",
            entity_type="verification",
        )

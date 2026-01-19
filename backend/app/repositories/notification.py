"""Notification repository."""
from typing import Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    """Repository for notification operations."""

    async def get_user_notifications(
        self, user_id: int, skip: int = 0, limit: int = 100, unread_only: bool = False
    ) -> list[Notification]:
        """Get notifications for a user.

        Args:
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum records to return
            unread_only: Only return unread notifications

        Returns:
            List of notifications
        """
        query = select(Notification).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(Notification.is_read == False)

        query = query.order_by(Notification.created_at.desc())
        query = query.offset(skip).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_unread_count(self, user_id: int) -> int:
        """Get unread notification count for a user.

        Args:
            user_id: User ID

        Returns:
            Unread count
        """
        from sqlalchemy import func

        query = select(func.count()).where(
            and_(Notification.user_id == user_id, Notification.is_read == False)
        )
        result = await self.session.execute(query)
        return result.scalar()

    async def mark_as_read(self, id: int, user_id: int) -> Optional[Notification]:
        """Mark notification as read.

        Args:
            id: Notification ID
            user_id: User ID (for verification)

        Returns:
            Updated notification or None
        """
        from datetime import datetime
        import time

        return await self.update(id, is_read=True, read_at=int(time.time()))

    async def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user.

        Args:
            user_id: User ID

        Returns:
            Number of notifications marked
        """
        query = select(Notification).where(
            and_(Notification.user_id == user_id, Notification.is_read == False)
        )
        result = await self.session.execute(query)
        notifications = list(result.scalars().all())

        import time

        for notification in notifications:
            notification.is_read = True
            notification.read_at = int(time.time())

        await self.session.flush()
        return len(notifications)

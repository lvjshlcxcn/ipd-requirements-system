"""Workflow history repository for data access."""
from typing import List, Optional
from datetime import datetime

from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.models.workflow import WorkflowHistory


class WorkflowHistoryRepository:
    """Repository for WorkflowHistory model."""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        entity_type: str,
        entity_id: int,
        action: str,
        to_status: str,
        from_status: Optional[str] = None,
        action_reason: Optional[str] = None,
        comments: Optional[str] = None,
        performed_by: Optional[int] = None,
        changes_snapshot: Optional[dict] = None,
    ) -> WorkflowHistory:
        """
        Create a workflow history record.

        Args:
            entity_type: Type of entity (e.g., 'requirement', 'charter', 'pcr')
            entity_id: ID of the entity
            action: Action performed (e.g., 'status_changed', 'note_added')
            to_status: New status
            from_status: Previous status (optional)
            action_reason: Reason for the change (optional)
            comments: Additional comments (optional)
            performed_by: User ID who performed the action
            changes_snapshot: Detailed change snapshot (optional)

        Returns:
            Created WorkflowHistory record
        """
        history = WorkflowHistory(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            from_status=from_status,
            to_status=to_status,
            action_reason=action_reason,
            comments=comments,
            performed_by=performed_by,
            performed_at=datetime.utcnow(),
            changes_snapshot=changes_snapshot,
        )
        self.db.add(history)
        self.db.flush()
        self.db.refresh(history)
        return history

    def get_by_entity(
        self, entity_type: str, entity_id: int, limit: int = 50
    ) -> List[WorkflowHistory]:
        """
        Get history records for an entity, ordered by latest first.

        Args:
            entity_type: Type of entity
            entity_id: ID of the entity
            limit: Maximum number of records to return

        Returns:
            List of WorkflowHistory records
        """
        stmt = (
            select(WorkflowHistory)
            .where(
                WorkflowHistory.entity_type == entity_type,
                WorkflowHistory.entity_id == entity_id,
            )
            .order_by(desc(WorkflowHistory.performed_at))
            .limit(limit)
        )
        result = self.db.execute(stmt).scalars().all()
        return list(result)

    def get_latest_status(
        self, entity_type: str, entity_id: int
    ) -> Optional[str]:
        """
        Get the latest status from history.

        Args:
            entity_type: Type of entity
            entity_id: ID of the entity

        Returns:
            Latest status or None
        """
        stmt = (
            select(WorkflowHistory)
            .where(
                WorkflowHistory.entity_type == entity_type,
                WorkflowHistory.entity_id == entity_id,
            )
            .order_by(desc(WorkflowHistory.performed_at))
            .limit(1)
        )
        result = self.db.execute(stmt).scalar_one_or_none()
        return result.to_status if result else None

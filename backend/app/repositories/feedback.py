"""Feedback repository."""
from typing import List, Optional, Tuple
from sqlalchemy import select, and_, or_, desc, func
from sqlalchemy.orm import Session

from app.models.feedback import Feedback


class FeedbackRepository:
    """Repository for Feedback model."""

    def __init__(self, db: Session):
        self.db = db

    # ========================================================================
    # CRUD Operations
    # ========================================================================

    def create(
        self,
        feedback_no: str,
        title: str,
        description: str,
        feedback_type: str,
        source_channel: str,
        tenant_id: int,
        source_contact: Optional[str] = None,
        severity: Optional[str] = None,
        created_by: Optional[int] = None,
    ) -> Feedback:
        """Create a new feedback."""
        feedback = Feedback(
            feedback_no=feedback_no,
            title=title,
            description=description,
            feedback_type=feedback_type,
            source_channel=source_channel,
            source_contact=source_contact,
            severity=severity,
            tenant_id=tenant_id,
            created_by=created_by,
            status="pending",
        )
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def get_by_id(self, feedback_id: int) -> Optional[Feedback]:
        """Get feedback by ID."""
        stmt = select(Feedback).where(Feedback.id == feedback_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_no(self, feedback_no: str, tenant_id: int) -> Optional[Feedback]:
        """Get feedback by feedback number."""
        stmt = select(Feedback).where(
            and_(
                Feedback.feedback_no == feedback_no,
                Feedback.tenant_id == tenant_id,
            )
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        tenant_id: int,
        page: int = 1,
        page_size: int = 20,
        feedback_type: Optional[str] = None,
        status: Optional[str] = None,
        source_channel: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Tuple[List[Feedback], int]:
        """List feedbacks with filters and pagination."""
        # Build query
        stmt = select(Feedback).where(Feedback.tenant_id == tenant_id)

        # Apply filters
        conditions = []
        if feedback_type:
            conditions.append(Feedback.feedback_type == feedback_type)
        if status:
            conditions.append(Feedback.status == status)
        if source_channel:
            conditions.append(Feedback.source_channel == source_channel)
        if search:
            conditions.append(
                or_(
                    Feedback.title.ilike(f"%{search}%"),
                    Feedback.feedback_no.ilike(f"%{search}%"),
                )
            )

        if conditions:
            stmt = stmt.where(and_(*conditions))

        # Get total count
        count_stmt = select(func.count()).select_from(Feedback)
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        count_stmt = count_stmt.where(Feedback.tenant_id == tenant_id)
        total = self.db.execute(count_stmt).scalar()

        # Apply sorting
        sort_column = getattr(Feedback, sort_by, Feedback.created_at)
        if sort_order == "asc":
            stmt = stmt.order_by(sort_column.asc())
        else:
            stmt = stmt.order_by(desc(sort_column))

        # Apply pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        # Execute
        feedbacks = self.db.execute(stmt).scalars().all()
        return list(feedbacks), total

    def update(self, feedback: Feedback, **updates) -> Feedback:
        """Update feedback."""
        for key, value in updates.items():
            if hasattr(feedback, key) and value is not None:
                setattr(feedback, key, value)
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def delete(self, feedback: Feedback) -> None:
        """Delete feedback."""
        self.db.delete(feedback)
        self.db.commit()

    # ========================================================================
    # Specific Operations
    # ========================================================================

    def update_status(
        self, feedback: Feedback, status: str, updated_by: Optional[int] = None
    ) -> Feedback:
        """Update feedback status."""
        feedback.status = status
        feedback.updated_by = updated_by
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def link_to_requirement(
        self, feedback: Feedback, requirement_id: int
    ) -> Feedback:
        """Link feedback to requirement."""
        feedback.requirement_id = requirement_id
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def update_ai_suggestion(
        self, feedback: Feedback, ai_suggestion: dict, confidence: float
    ) -> Feedback:
        """Update AI analysis result."""
        feedback.ai_suggestion = ai_suggestion
        feedback.conversion_confidence = confidence
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def get_stats_by_type(self, tenant_id: int) -> dict:
        """Get feedback statistics by type."""
        stmt = (
            select(Feedback.feedback_type, func.count(Feedback.id))
            .where(Feedback.tenant_id == tenant_id)
            .group_by(Feedback.feedback_type)
        )
        results = self.db.execute(stmt).all()
        return {row[0]: row[1] for row in results}

    def get_stats_by_status(self, tenant_id: int) -> dict:
        """Get feedback statistics by status."""
        stmt = (
            select(Feedback.status, func.count(Feedback.id))
            .where(Feedback.tenant_id == tenant_id)
            .group_by(Feedback.status)
        )
        results = self.db.execute(stmt).all()
        return {row[0]: row[1] for row in results}

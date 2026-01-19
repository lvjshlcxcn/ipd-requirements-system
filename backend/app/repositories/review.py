"""Review repository."""
from typing import List, Optional, Tuple
from sqlalchemy import select, and_, or_, desc, func
from sqlalchemy.orm import Session

from app.models.review import Review


class ReviewRepository:
    """Repository for Review model."""

    def __init__(self, db: Session):
        self.db = db

    # ========================================================================
    # CRUD Operations
    # ========================================================================

    def create(
        self,
        review_no: str,
        requirement_id: int,
        review_type: str,
        tenant_id: int,
        review_data: dict,
        created_by: Optional[int] = None,
    ) -> Review:
        """Create a new review."""
        review = Review(
            review_no=review_no,
            requirement_id=requirement_id,
            review_type=review_type,
            tenant_id=tenant_id,
            review_data=review_data,
            status="draft",
            created_by=created_by,
        )
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def get_by_id(self, review_id: int) -> Optional[Review]:
        """Get review by ID."""
        stmt = select(Review).where(Review.id == review_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_no(self, review_no: str, tenant_id: int) -> Optional[Review]:
        """Get review by review number."""
        stmt = select(Review).where(
            and_(
                Review.review_no == review_no,
                Review.tenant_id == tenant_id,
            )
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_requirement(
        self, requirement_id: int, tenant_id: int
    ) -> Optional[Review]:
        """Get review by requirement ID."""
        stmt = select(Review).where(
            and_(
                Review.requirement_id == requirement_id,
                Review.tenant_id == tenant_id,
            )
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        tenant_id: int,
        page: int = 1,
        page_size: int = 20,
        review_type: Optional[str] = None,
        status: Optional[str] = None,
        requirement_id: Optional[int] = None,
    ) -> Tuple[List[Review], int]:
        """List reviews with filters."""
        stmt = select(Review).where(Review.tenant_id == tenant_id)

        # Apply filters
        conditions = []
        if review_type:
            conditions.append(Review.review_type == review_type)
        if status:
            conditions.append(Review.status == status)
        if requirement_id:
            conditions.append(Review.requirement_id == requirement_id)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        # Get total count
        count_stmt = select(func.count()).select_from(Review)
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        count_stmt = count_stmt.where(Review.tenant_id == tenant_id)
        total = self.db.execute(count_stmt).scalar()

        # Sort by created_at desc
        stmt = stmt.order_by(desc(Review.created_at))

        # Apply pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        # Execute
        reviews = self.db.execute(stmt).scalars().all()
        return list(reviews), total

    def update(self, review: Review, **updates) -> Review:
        """Update review."""
        for key, value in updates.items():
            if hasattr(review, key) and value is not None:
                setattr(review, key, value)
        self.db.commit()
        self.db.refresh(review)
        return review

    def delete(self, review: Review) -> None:
        """Delete review."""
        self.db.delete(review)
        self.db.commit()

    # ========================================================================
    # Specific Operations
    # ========================================================================

    def complete_review(
        self,
        review: Review,
        reviewed_by: Optional[int] = None,
    ) -> Review:
        """Mark review as completed."""
        from datetime import datetime, timezone

        review.status = "completed"
        review.reviewed_by = reviewed_by
        review.reviewed_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(review)
        return review

    def get_pending_reviews(
        self, tenant_id: int, limit: int = 50
    ) -> List[Review]:
        """Get all pending (draft) reviews."""
        stmt = (
            select(Review)
            .where(
                and_(
                    Review.tenant_id == tenant_id,
                    Review.status == "draft",
                )
            )
            .order_by(desc(Review.created_at))
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_reviews_by_type(
        self, tenant_id: int, review_type: str, limit: int = 50
    ) -> List[Review]:
        """Get reviews by type."""
        stmt = (
            select(Review)
            .where(
                and_(
                    Review.tenant_id == tenant_id,
                    Review.review_type == review_type,
                )
            )
            .order_by(desc(Review.created_at))
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

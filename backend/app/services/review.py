"""Review service."""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func
from datetime import datetime, timezone

from app.models.review import Review
from app.models.requirement import Requirement
from app.repositories.review import ReviewRepository
from app.repositories.requirement import RequirementRepository
from app.repositories.workflow_history import WorkflowHistoryRepository
from app.core.tenant import get_current_tenant


class ReviewService:
    """Service for Review (Retrospective) business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = ReviewRepository(db)
        self.requirement_repo = RequirementRepository(db)
        self.history_repo = WorkflowHistoryRepository(db)

    # ========================================================================
    # CRUD Operations
    # ========================================================================

    def create_review(
        self,
        requirement_id: int,
        review_type: str,
        review_data: Dict[str, Any],
        created_by: Optional[int] = None,
    ) -> Review:
        """
        Create a new review.

        Args:
            requirement_id: Requirement ID
            review_type: Type (completion, monthly, quarterly, manual)
            review_data: Review content dict
            created_by: User ID

        Returns:
            Created review
        """
        tenant_id = get_current_tenant()

        # Verify requirement exists
        requirement = self.requirement_repo.get_by_id(requirement_id)
        if not requirement:
            raise ValueError(f"Requirement {requirement_id} not found")

        if requirement.tenant_id != tenant_id:
            raise ValueError("Requirement does not belong to current tenant")

        # Check if review already exists for this requirement
        existing = self.repo.get_by_requirement(requirement_id, tenant_id)
        if existing:
            raise ValueError(f"Review already exists for requirement {requirement_id}")

        # Generate review number
        review_no = self._generate_review_no()

        return self.repo.create(
            review_no=review_no,
            requirement_id=requirement_id,
            review_type=review_type,
            tenant_id=tenant_id,
            review_data=review_data,
            created_by=created_by,
        )

    def get_review(self, review_id: int) -> Optional[Review]:
        """Get review by ID."""
        return self.repo.get_by_id(review_id)

    def get_review_by_requirement(self, requirement_id: int) -> Optional[Review]:
        """Get review by requirement ID."""
        tenant_id = get_current_tenant()
        return self.repo.get_by_requirement(requirement_id, tenant_id)

    def list_reviews(
        self,
        page: int = 1,
        page_size: int = 20,
        review_type: Optional[str] = None,
        status: Optional[str] = None,
        requirement_id: Optional[int] = None,
    ) -> Tuple[List[Review], int]:
        """List reviews with filters."""
        tenant_id = get_current_tenant()
        return self.repo.list(
            tenant_id=tenant_id,
            page=page,
            page_size=page_size,
            review_type=review_type,
            status=status,
            requirement_id=requirement_id,
        )

    def update_review(
        self,
        review_id: int,
        review_data: Optional[Dict[str, Any]] = None,
        status: Optional[str] = None,
    ) -> Optional[Review]:
        """Update review."""
        review = self.repo.get_by_id(review_id)
        if not review:
            return None

        updates = {}
        if review_data is not None:
            updates['review_data'] = review_data
        if status is not None:
            updates['status'] = status

        return self.repo.update(review, **updates)

    def delete_review(self, review_id: int) -> bool:
        """Delete review."""
        review = self.repo.get_by_id(review_id)
        if not review:
            return False

        self.repo.delete(review)
        return True

    # ========================================================================
    # Review Operations
    # ========================================================================

    def complete_review(
        self,
        review_id: int,
        review_data: Optional[Dict[str, Any]] = None,
        reviewed_by: Optional[int] = None,
    ) -> Optional[Review]:
        """
        Mark review as completed.

        Args:
            review_id: Review ID
            review_data: Final review data (can update existing data)
            reviewed_by: User ID

        Returns:
            Updated review
        """
        review = self.repo.get_by_id(review_id)
        if not review:
            return None

        # Update review data if provided
        if review_data:
            review = self.repo.update(review, review_data=review_data)

        # Mark as completed
        review = self.repo.complete_review(review, reviewed_by)

        # Record history
        self.history_repo.create(
            entity_type='review',
            entity_id=review.id,
            action='review_completed',
            to_status='completed',
            comments=f'复盘完成: {review.review_type}',
            performed_by=reviewed_by,
        )

        return review

    def create_auto_review_for_requirement(
        self, requirement_id: int, created_by: Optional[int] = None
    ) -> Optional[Review]:
        """
        Automatically create a review draft when requirement is completed.

        Args:
            requirement_id: Requirement ID
            created_by: User ID (usually system)

        Returns:
            Created review draft
        """
        tenant_id = get_current_tenant()

        # Check if review already exists
        existing = self.repo.get_by_requirement(requirement_id, tenant_id)
        if existing:
            return existing  # Return existing review

        # Create review draft with template
        review_data = {
            'objective': '待填写：目标达成情况',
            'successes': [],
            'challenges': [],
            'lessons_learned': '待填写：经验教训',
            'action_items': [],
            'next_steps': '待填写：后续计划',
        }

        try:
            return self.repo.create(
                review_no=self._generate_review_no(),
                requirement_id=requirement_id,
                review_type='completion',
                tenant_id=tenant_id,
                review_data=review_data,
                created_by=created_by,
            )
        except Exception:
            return None

    def get_pending_reviews(self, limit: int = 50) -> List[Review]:
        """Get all pending (draft) reviews for current tenant."""
        tenant_id = get_current_tenant()
        return self.repo.get_pending_reviews(tenant_id, limit)

    def get_reviews_by_type(
        self, review_type: str, limit: int = 50
    ) -> List[Review]:
        """Get reviews by type for current tenant."""
        tenant_id = get_current_tenant()
        return self.repo.get_reviews_by_type(tenant_id, review_type, limit)

    # ========================================================================
    # Private Methods
    # ========================================================================

    def _generate_review_no(self) -> str:
        """Generate review number: RV-YYYY-XXXX."""
        year = datetime.now().year
        tenant_id = get_current_tenant()

        # Count existing reviews for this year
        stmt = (
            select(func.count(Review.id))
            .where(
                and_(
                    Review.tenant_id == tenant_id,
                    Review.review_no.like(f'RV-{year}-%'),
                )
            )
        )
        count = self.db.execute(stmt).scalar() or 0

        # Format: RV-2026-0001
        return f'RV-{year}-{str(count + 1).zfill(4)}'

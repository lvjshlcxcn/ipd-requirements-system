"""Requirement service for business logic."""
from typing import Optional, List, Dict, Any, Tuple

from sqlalchemy.orm import Session

from app.models.requirement import Requirement, Requirement10QAnswer
from app.repositories.requirement import (
    RequirementRepository,
    Requirement10QRepository,
)
from app.repositories.workflow_history import WorkflowHistoryRepository
from app.schemas.requirement import (
    RequirementCreate,
    RequirementUpdate,
    Requirement10QCreate,
    RequirementResponse,
    RequirementStatsData,
)
from app.core.tenant import get_current_tenant


class RequirementService:
    """Service for Requirement business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = RequirementRepository(db)
        self.repo_10q = Requirement10QRepository(db)
        self.repo_history = WorkflowHistoryRepository(db)

    # ========================================================================
    # CRUD Operations
    # ========================================================================

    def create_requirement(
        self,
        data: RequirementCreate,
        created_by: Optional[int] = None,
    ) -> Requirement:
        """
        Create a new requirement with optional 10 questions.

        Args:
            data: Requirement creation data
            created_by: User ID who created the requirement

        Returns:
            Created requirement
        """
        # Get tenant_id from context
        tenant_id = get_current_tenant()

        # Convert 10q to dict if provided
        ten_q_data = None
        if data.customer_need_10q:
            ten_q_data = data.customer_need_10q.model_dump()

        # Create requirement
        requirement = self.repo.create(
            title=data.title,
            description=data.description,
            source_channel=data.source_channel,
            source_contact=data.source_contact,
            moscow_priority=data.moscow_priority,
            moscow_comment=data.moscow_comment,
            customer_need_10q=ten_q_data,
            estimated_duration_months=data.estimated_duration_months,
            complexity_level=data.complexity_level,
            created_by=created_by,
            tenant_id=tenant_id,
        )

        # Create detailed 10 questions answer if provided
        if data.customer_need_10q:
            self.repo_10q.create(
                requirement_id=requirement.id,
                answers=data.customer_need_10q.model_dump(),
                answered_by=created_by,
                tenant_id=tenant_id,
            )

        return requirement

    def get_requirement(self, requirement_id: int) -> Optional[Requirement]:
        """
        Get requirement by ID.

        Args:
            requirement_id: Requirement ID

        Returns:
            Requirement or None
        """
        return self.repo.get_by_id(requirement_id)

    def list_requirements(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        source_channel: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Tuple[List[Requirement], int]:
        """
        List requirements with filters and pagination.

        Args:
            page: Page number (1-indexed)
            page_size: Number of items per page
            status: Filter by status
            source_channel: Filter by source channel
            search: Search in title and requirement_no
            sort_by: Sort field
            sort_order: Sort order (asc or desc)

        Returns:
            Tuple of (list of requirements, total count)
        """
        return self.repo.list(
            page=page,
            page_size=page_size,
            status=status,
            source_channel=source_channel,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
        )

    def update_requirement(
        self,
        requirement_id: int,
        data: RequirementUpdate,
        updated_by: Optional[int] = None,
    ) -> Optional[Requirement]:
        """
        Update requirement.

        Args:
            requirement_id: Requirement ID
            data: Update data
            updated_by: User ID who updated the requirement

        Returns:
            Updated requirement or None
        """
        requirement = self.repo.get_by_id(requirement_id)
        if not requirement:
            return None

        # Prepare updates
        updates = data.model_dump(exclude_unset=True, exclude={"customer_need_10q"})

        # Handle 10 questions update
        if data.customer_need_10q:
            ten_q_data = data.customer_need_10q.model_dump()
            updates["customer_need_10q"] = ten_q_data

            # Update or create detailed 10 questions answer
            existing_10q = self.repo_10q.get_by_requirement_id(requirement_id)
            if existing_10q:
                self.repo_10q.update(existing_10q, ten_q_data)
            else:
                # Get tenant_id for creating 10q
                tenant_id = get_current_tenant()
                self.repo_10q.create(
                    requirement_id=requirement_id,
                    answers=ten_q_data,
                    answered_by=updated_by,
                    tenant_id=tenant_id,
                )

        # Add updater info
        updates["updated_by"] = updated_by

        return self.repo.update(requirement, **updates)

    def delete_requirement(self, requirement_id: int) -> bool:
        """
        Delete requirement.

        Args:
            requirement_id: Requirement ID

        Returns:
            True if deleted, False if not found
        """
        requirement = self.repo.get_by_id(requirement_id)
        if not requirement:
            return False

        self.repo.delete(requirement)
        return True

    # ========================================================================
    # Status Operations
    # ========================================================================

    def update_status(
        self,
        requirement_id: int,
        new_status: str,
        updated_by: Optional[int] = None,
    ) -> Optional[Requirement]:
        """
        Update requirement status with automatic history tracking.

        Args:
            requirement_id: Requirement ID
            new_status: New status
            updated_by: User ID who updated the status

        Returns:
            Updated requirement or None
        """
        requirement = self.repo.get_by_id(requirement_id)
        if not requirement:
            return None

        # Record old status before updating
        old_status = requirement.status

        # Update status
        requirement = self.repo.update_status(requirement, new_status, updated_by)

        # Automatically record history
        self.repo_history.create(
            entity_type='requirement',
            entity_id=requirement_id,
            action='status_changed',
            from_status=old_status,
            to_status=new_status,
            performed_by=updated_by,
        )

        return requirement

    # ========================================================================
    # Statistics
    # ========================================================================

    def get_statistics(self) -> RequirementStatsData:
        """
        Get requirement statistics.

        Returns:
            Statistics data
        """
        total = self.repo.get_total_count()
        by_status = self.repo.get_stats_by_status()
        by_channel = self.repo.get_stats_by_channel()

        return RequirementStatsData(
            total=total,
            by_status=by_status,
            by_channel=by_channel,
        )

    # ========================================================================
    # 10 Questions
    # ========================================================================

    def get_10_questions(
        self, requirement_id: int
    ) -> Optional[Requirement10QAnswer]:
        """
        Get 10 questions answer by requirement ID.

        Args:
            requirement_id: Requirement ID

        Returns:
            10 questions answer or None
        """
        return self.repo_10q.get_by_requirement_id(requirement_id)

    # ========================================================================
    # History Tracking
    # ========================================================================

    def add_history_note(
        self,
        requirement_id: int,
        comments: str,
        action_reason: Optional[str] = None,
        performed_by: Optional[int] = None,
    ):
        """
        Add a manual note/comment to requirement history.

        Args:
            requirement_id: Requirement ID
            comments: Comment content
            action_reason: Optional reason for the note
            performed_by: User ID who added the note

        Returns:
            Created WorkflowHistory record
        """
        requirement = self.repo.get_by_id(requirement_id)
        if not requirement:
            raise ValueError("Requirement not found")

        return self.repo_history.create(
            entity_type='requirement',
            entity_id=requirement_id,
            action='note_added',
            to_status=requirement.status,
            comments=comments,
            action_reason=action_reason,
            performed_by=performed_by,
        )

    def get_history(
        self, requirement_id: int, limit: int = 50
    ) -> List:
        """
        Get requirement history records.

        Args:
            requirement_id: Requirement ID
            limit: Maximum number of records to return

        Returns:
            List of WorkflowHistory records
        """
        return self.repo_history.get_by_entity('requirement', requirement_id, limit)

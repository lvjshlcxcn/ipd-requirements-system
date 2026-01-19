"""Requirement repository for data access."""
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, or_, and_

from app.models.requirement import Requirement, Requirement10QAnswer, RequirementStatus, SourceChannel


class RequirementRepository:
    """Repository for Requirement model."""

    def __init__(self, db: Session):
        self.db = db

    # ========================================================================
    # CRUD Operations
    # ========================================================================

    def create(
        self,
        title: str,
        description: str,
        source_channel: str,
        source_contact: Optional[str] = None,
        moscow_priority: Optional[str] = None,
        moscow_comment: Optional[str] = None,
        customer_need_10q: Optional[Dict[str, Any]] = None,
        estimated_duration_months: Optional[int] = None,
        complexity_level: Optional[str] = None,
        created_by: Optional[int] = None,
        tenant_id: Optional[int] = None,
    ) -> Requirement:
        """
        Create a new requirement.

        Args:
            title: Requirement title
            description: Requirement description
            source_channel: Source channel
            source_contact: Source contact
            moscow_priority: MoSCoW priority (must/should/could/wont)
            moscow_comment: MoSCoW priority justification
            customer_need_10q: Customer 10 questions data
            estimated_duration_months: Estimated duration in months
            complexity_level: Complexity level
            created_by: User ID who created the requirement
            tenant_id: Tenant ID (required)

        Returns:
            Created requirement
        """
        # Generate requirement number
        requirement_no = self._generate_requirement_no()

        requirement = Requirement(
            requirement_no=requirement_no,
            title=title,
            description=description,
            source_channel=source_channel,
            source_contact=source_contact,
            moscow_priority=moscow_priority,
            moscow_comment=moscow_comment,
            customer_need_10q=customer_need_10q,
            estimated_duration_months=estimated_duration_months,
            complexity_level=complexity_level,
            created_by=created_by,
            updated_by=created_by,
            tenant_id=tenant_id,
        )

        self.db.add(requirement)
        self.db.commit()
        self.db.refresh(requirement)

        return requirement

    def get_by_id(self, requirement_id: int) -> Optional[Requirement]:
        """
        Get requirement by ID.

        Args:
            requirement_id: Requirement ID

        Returns:
            Requirement or None
        """
        stmt = select(Requirement).where(Requirement.id == requirement_id)
        result = self.db.execute(stmt).scalar_one_or_none()
        return result

    def get_by_no(self, requirement_no: str) -> Optional[Requirement]:
        """
        Get requirement by number.

        Args:
            requirement_no: Requirement number

        Returns:
            Requirement or None
        """
        stmt = select(Requirement).where(Requirement.requirement_no == requirement_no)
        result = self.db.execute(stmt).scalar_one_or_none()
        return result

    def list(
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
        # Build query
        stmt = select(Requirement)

        # Apply filters
        conditions = []

        if status:
            conditions.append(Requirement.status == status)

        if source_channel:
            conditions.append(Requirement.source_channel == source_channel)

        if search:
            search_pattern = f"%{search}%"
            conditions.append(
                or_(
                    Requirement.title.ilike(search_pattern),
                    Requirement.requirement_no.ilike(search_pattern),
                )
            )

        if conditions:
            stmt = stmt.where(and_(*conditions))

        # Get total count
        count_stmt = select(func.count()).select_from(Requirement)
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        total = self.db.execute(count_stmt).scalar()

        # Apply sorting
        sort_column = getattr(Requirement, sort_by, Requirement.created_at)
        if sort_order == "asc":
            stmt = stmt.order_by(sort_column.asc())
        else:
            stmt = stmt.order_by(sort_column.desc())

        # Apply pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        # Execute
        requirements = self.db.execute(stmt).scalars().all()

        return list(requirements), total

    def update(
        self,
        requirement: Requirement,
        **updates
    ) -> Requirement:
        """
        Update requirement.

        Args:
            requirement: Requirement to update
            **updates: Fields to update

        Returns:
            Updated requirement
        """
        for key, value in updates.items():
            if hasattr(requirement, key) and value is not None:
                setattr(requirement, key, value)

        requirement.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(requirement)

        return requirement

    def delete(self, requirement: Requirement) -> None:
        """
        Delete requirement.

        Args:
            requirement: Requirement to delete
        """
        self.db.delete(requirement)
        self.db.commit()

    # ========================================================================
    # Status Operations
    # ========================================================================

    def update_status(
        self,
        requirement: Requirement,
        new_status: str,
        updated_by: Optional[int] = None,
    ) -> Requirement:
        """
        Update requirement status.

        Args:
            requirement: Requirement to update
            new_status: New status
            updated_by: User ID who updated the status

        Returns:
            Updated requirement
        """
        requirement.status = new_status
        requirement.updated_by = updated_by
        requirement.updated_at = datetime.utcnow()

        self.db.flush()
        self.db.refresh(requirement)

        return requirement

    # ========================================================================
    # Statistics
    # ========================================================================

    def get_stats_by_status(self) -> Dict[str, int]:
        """
        Get requirement count grouped by status.

        Returns:
            Dictionary with status counts
        """
        stmt = (
            select(Requirement.status, func.count(Requirement.id))
            .group_by(Requirement.status)
        )

        result = self.db.execute(stmt).all()

        # Initialize with all statuses
        stats = {
            "collected": 0,
            "analyzing": 0,
            "analyzed": 0,
            "distributing": 0,
            "distributed": 0,
            "implementing": 0,
            "verifying": 0,
            "completed": 0,
            "rejected": 0,
        }

        for status, count in result:
            if status in stats:
                stats[status] = count

        return stats

    def get_stats_by_channel(self) -> Dict[str, int]:
        """
        Get requirement count grouped by source channel.

        Returns:
            Dictionary with channel counts
        """
        stmt = (
            select(Requirement.source_channel, func.count(Requirement.id))
            .group_by(Requirement.source_channel)
        )

        result = self.db.execute(stmt).all()

        # Initialize with all channels
        stats = {
            "customer": 0,
            "market": 0,
            "competition": 0,
            "sales": 0,
            "after_sales": 0,
            "rd": 0,
        }

        for channel, count in result:
            if channel in stats:
                stats[channel] = count

        return stats

    def get_total_count(self) -> int:
        """
        Get total requirement count.

        Returns:
            Total count
        """
        stmt = select(func.count(Requirement.id))
        return self.db.execute(stmt).scalar()

    # ========================================================================
    # Helper Methods
    # ========================================================================

    def _generate_requirement_no(self) -> str:
        """
        Generate unique requirement number.

        Format: REQ-YYYY-XXXX (4 digit sequential number)

        Returns:
            Requirement number
        """
        year = datetime.utcnow().year

        # Get the last requirement number for this year
        prefix = f"REQ-{year}-"
        stmt = (
            select(Requirement.requirement_no)
            .where(Requirement.requirement_no.like(f"{prefix}%"))
            .order_by(desc(Requirement.requirement_no))
            .limit(1)
        )

        result = self.db.execute(stmt).scalar_one_or_none()

        if result:
            # Extract and increment the sequence number
            last_seq = int(result.split("-")[-1])
            new_seq = last_seq + 1
        else:
            new_seq = 1

        return f"{prefix}{new_seq:04d}"


# ============================================================================
# 10 Questions Repository
# ============================================================================

class Requirement10QRepository:
    """Repository for Requirement10QAnswer model."""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        requirement_id: int,
        answers: Dict[str, Any],
        answered_by: Optional[int] = None,
        tenant_id: Optional[int] = None,
    ) -> Requirement10QAnswer:
        """
        Create 10 questions answer.

        Args:
            requirement_id: Requirement ID
            answers: Answers dict
            answered_by: User ID who answered
            tenant_id: Tenant ID (required)

        Returns:
            Created answer record
        """
        answer = Requirement10QAnswer(
            requirement_id=requirement_id,
            q1_who_cares=answers.get("q1_who_cares"),
            q2_why_care=answers.get("q2_why_care"),
            q3_how_often=answers.get("q3_how_often"),
            q4_current_solution=answers.get("q4_current_solution"),
            q5_pain_points=answers.get("q5_pain_points"),
            q6_expected_outcome=answers.get("q6_expected_outcome"),
            q7_value_impact=answers.get("q7_value_impact"),
            q8_urgency_level=answers.get("q8_urgency_level"),
            q9_budget_willingness=answers.get("q9_budget_willingness"),
            q10_alternative_solutions=answers.get("q10_alternative_solutions"),
            additional_notes=answers.get("additional_notes"),
            answered_by=answered_by,
            tenant_id=tenant_id,
        )

        self.db.add(answer)
        self.db.commit()
        self.db.refresh(answer)

        return answer

    def get_by_requirement_id(
        self, requirement_id: int
    ) -> Optional[Requirement10QAnswer]:
        """
        Get 10 questions answer by requirement ID.

        Args:
            requirement_id: Requirement ID

        Returns:
            Answer record or None
        """
        stmt = select(Requirement10QAnswer).where(
            Requirement10QAnswer.requirement_id == requirement_id
        )
        result = self.db.execute(stmt).scalar_one_or_none()
        return result

    def update(
        self,
        answer: Requirement10QAnswer,
        updates: Dict[str, Any],
    ) -> Requirement10QAnswer:
        """
        Update 10 questions answer.

        Args:
            answer: Answer record to update
            updates: Fields to update

        Returns:
            Updated answer record
        """
        for key, value in updates.items():
            if hasattr(answer, key) and value is not None:
                setattr(answer, key, value)

        self.db.commit()
        self.db.refresh(answer)

        return answer

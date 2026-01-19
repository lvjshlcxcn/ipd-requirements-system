"""Feedback service."""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from app.models.feedback import Feedback
from app.models.requirement import Requirement
from app.repositories.feedback import FeedbackRepository
from app.repositories.requirement import RequirementRepository
from app.repositories.workflow_history import WorkflowHistoryRepository
from app.core.tenant import get_current_tenant


class FeedbackService:
    """Service for Feedback business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = FeedbackRepository(db)
        self.requirement_repo = RequirementRepository(db)
        self.history_repo = WorkflowHistoryRepository(db)

    # ========================================================================
    # CRUD Operations
    # ========================================================================

    def create_feedback(
        self,
        title: str,
        description: str,
        feedback_type: str,
        source_channel: str,
        source_contact: Optional[str] = None,
        severity: Optional[str] = None,
        created_by: Optional[int] = None,
    ) -> Feedback:
        """
        Create a new feedback.

        Args:
            title: Feedback title
            description: Feedback description
            feedback_type: Type (bug, feature_request, improvement, complaint)
            source_channel: Source (customer, support, sales, market, rd)
            source_contact: Contact person
            severity: Severity level (critical, high, medium, low)
            created_by: User ID

        Returns:
            Created feedback
        """
        tenant_id = get_current_tenant()

        # Generate feedback number: FB-YYYY-XXXX
        feedback_no = self._generate_feedback_no()

        feedback = self.repo.create(
            feedback_no=feedback_no,
            title=title,
            description=description,
            feedback_type=feedback_type,
            source_channel=source_channel,
            source_contact=source_contact,
            severity=severity,
            tenant_id=tenant_id,
            created_by=created_by,
        )

        # Record history
        self.history_repo.create(
            entity_type='feedback',
            entity_id=feedback.id,
            action='feedback_created',
            to_status='pending',
            comments=f'反馈来源: {source_channel}',
            performed_by=created_by,
        )

        return feedback

    def get_feedback(self, feedback_id: int) -> Optional[Feedback]:
        """Get feedback by ID."""
        return self.repo.get_by_id(feedback_id)

    def list_feedbacks(
        self,
        page: int = 1,
        page_size: int = 20,
        feedback_type: Optional[str] = None,
        status: Optional[str] = None,
        source_channel: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Tuple[List[Feedback], int]:
        """List feedbacks with filters."""
        tenant_id = get_current_tenant()
        return self.repo.list(
            tenant_id=tenant_id,
            page=page,
            page_size=page_size,
            feedback_type=feedback_type,
            status=status,
            source_channel=source_channel,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
        )

    def update_feedback(
        self,
        feedback_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        updated_by: Optional[int] = None,
    ) -> Optional[Feedback]:
        """Update feedback."""
        feedback = self.repo.get_by_id(feedback_id)
        if not feedback:
            return None

        updates = {}
        if title is not None:
            updates['title'] = title
        if description is not None:
            updates['description'] = description
        if status is not None:
            updates['status'] = status
        if severity is not None:
            updates['severity'] = severity
        updates['updated_by'] = updated_by

        return self.repo.update(feedback, **updates)

    def delete_feedback(self, feedback_id: int) -> bool:
        """Delete feedback."""
        feedback = self.repo.get_by_id(feedback_id)
        if not feedback:
            return False

        self.repo.delete(feedback)
        return True

    # ========================================================================
    # AI Analysis & Conversion
    # ========================================================================

    def analyze_with_ai(self, feedback_id: int) -> Optional[Feedback]:
        """
        Analyze feedback with AI to suggest conversion.

        This is a placeholder for AI integration.
        In production, this would call DeepSeek/Claude API.

        Args:
            feedback_id: Feedback ID

        Returns:
            Updated feedback with AI suggestion
        """
        feedback = self.repo.get_by_id(feedback_id)
        if not feedback:
            return None

        # TODO: Integrate with AI service (DeepSeek/Claude)
        # For now, use rule-based analysis
        suggestion = self._analyze_feedback_rules(feedback)

        return self.repo.update_ai_suggestion(
            feedback,
            ai_suggestion=suggestion['suggestion'],
            confidence=suggestion['confidence'],
        )

    def _analyze_feedback_rules(self, feedback: Feedback) -> Dict[str, Any]:
        """
        Rule-based feedback analysis (temporary solution).

        Returns:
            Dict with suggestion and confidence
        """
        suggestion = {
            'should_convert': False,
            'suggested_type': 'requirement',
            'suggested_priority': 'medium',
            'reasoning': [],
        }

        # Rule 1: Bug reports from customers - high priority
        if feedback.feedback_type == 'bug' and feedback.source_channel == 'customer':
            suggestion['should_convert'] = True
            suggestion['suggested_type'] = 'bug'
            suggestion['suggested_priority'] = 'high'
            suggestion['reasoning'].append('客户报告的Bug，优先级高')

        # Rule 2: Feature requests from sales - medium priority
        elif feedback.feedback_type == 'feature_request' and feedback.source_channel == 'sales':
            suggestion['should_convert'] = True
            suggestion['suggested_type'] = 'requirement'
            suggestion['suggested_priority'] = 'medium'
            suggestion['reasoning'].append('销售团队反馈的功能需求')

        # Rule 3: Critical severity - always convert
        elif feedback.severity == 'critical':
            suggestion['should_convert'] = True
            suggestion['suggested_type'] = 'bug' if feedback.feedback_type == 'bug' else 'requirement'
            suggestion['suggested_priority'] = 'critical'
            suggestion['reasoning'].append('严重程度为紧急')

        # Rule 4: Default - based on feedback type
        else:
            if feedback.feedback_type in ['feature_request', 'improvement']:
                suggestion['should_convert'] = True
                suggestion['suggested_type'] = 'requirement'
                suggestion['suggested_priority'] = 'medium'
                suggestion['reasoning'].append(f'{feedback.feedback_type}类型建议转为需求')

        # Calculate confidence based on rules matched
        reasoning_count = len(suggestion['reasoning'])
        suggestion['confidence'] = min(0.95, 0.6 + (reasoning_count * 0.15))

        return {
            'suggestion': suggestion,
            'confidence': suggestion['confidence'],
        }

    def convert_to_requirement(
        self,
        feedback_id: int,
        confirmed: bool,
        updated_by: Optional[int] = None,
    ) -> Optional[Feedback]:
        """
        Confirm or reject feedback conversion to requirement.

        Args:
            feedback_id: Feedback ID
            confirmed: Whether to confirm conversion
            updated_by: User ID

        Returns:
            Updated feedback
        """
        feedback = self.repo.get_by_id(feedback_id)
        if not feedback:
            return None

        if confirmed:
            # Convert to requirement
            # TODO: Create requirement from feedback
            # For now, just mark as converted
            feedback = self.repo.update_status(feedback, 'converted', updated_by)

            # Record history
            self.history_repo.create(
                entity_type='feedback',
                entity_id=feedback.id,
                action='feedback_converted',
                from_status='pending',
                to_status='converted',
                comments='反馈已转化为需求',
                performed_by=updated_by,
            )

            # TODO: Actually create requirement
            # requirement = self.requirement_repo.create_from_feedback(feedback)

        else:
            # Reject conversion
            feedback = self.repo.update_status(feedback, 'rejected', updated_by)

            # Record history
            self.history_repo.create(
                entity_type='feedback',
                entity_id=feedback.id,
                action='conversion_rejected',
                comments='转化已拒绝',
                performed_by=updated_by,
            )

        return feedback

    # ========================================================================
    # Statistics
    # ========================================================================

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get feedback statistics.

        Returns:
            Statistics dict
        """
        tenant_id = get_current_tenant()

        total_by_type = self.repo.get_stats_by_type(tenant_id)
        total_by_status = self.repo.get_stats_by_status(tenant_id)

        total = sum(total_by_type.values())

        return {
            'total': total,
            'by_type': total_by_type,
            'by_status': total_by_status,
        }

    # ========================================================================
    # Private Methods
    # ========================================================================

    def _generate_feedback_no(self) -> str:
        """Generate feedback number: FB-YYYY-XXXX."""
        from datetime import datetime

        year = datetime.now().year
        tenant_id = get_current_tenant()

        # Count existing feedbacks for this year
        stmt = (
            select(func.count(Feedback.id))
            .where(
                and_(
                    Feedback.tenant_id == tenant_id,
                    Feedback.feedback_no.like(f'FB-{year}-%'),
                )
            )
        )
        count = self.db.execute(stmt).scalar() or 0

        # Format: FB-2026-0001
        return f'FB-{year}-{str(count + 1).zfill(4)}'

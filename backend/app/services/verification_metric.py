"""Verification metric service."""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func

from app.models.verification_metric import VerificationMetric
from app.models.requirement import Requirement
from app.repositories.verification_metric import VerificationMetricRepository
from app.repositories.requirement import RequirementRepository
from app.repositories.workflow_history import WorkflowHistoryRepository
from app.core.tenant import get_current_tenant


class VerificationMetricService:
    """Service for Verification Metric business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = VerificationMetricRepository(db)
        self.requirement_repo = RequirementRepository(db)
        self.history_repo = WorkflowHistoryRepository(db)

    # ========================================================================
    # CRUD Operations
    # ========================================================================

    def create_metrics(
        self,
        requirement_id: int,
        metrics_config: List[Dict[str, Any]],
        created_by: Optional[int] = None,
    ) -> VerificationMetric:
        """
        Create verification metrics for a requirement.

        Args:
            requirement_id: Requirement ID
            metrics_config: List of metric configurations
            created_by: User ID

        Returns:
            Created verification metric
        """
        tenant_id = get_current_tenant()

        # Verify requirement exists
        requirement = self.requirement_repo.get_by_id(requirement_id)
        if not requirement:
            raise ValueError(f"Requirement {requirement_id} not found")

        if requirement.tenant_id != tenant_id:
            raise ValueError("Requirement does not belong to current tenant")

        # Check if metrics already exist
        existing = self.repo.get_by_requirement(requirement_id, tenant_id)
        if existing:
            raise ValueError(f"Metrics already exist for requirement {requirement_id}")

        return self.repo.create(
            requirement_id=requirement_id,
            tenant_id=tenant_id,
            metrics_config=metrics_config,
            created_by=created_by,
        )

    def get_metric(self, metric_id: int) -> Optional[VerificationMetric]:
        """Get metric by ID."""
        return self.repo.get_by_id(metric_id)

    def get_metric_by_requirement(
        self, requirement_id: int
    ) -> Optional[VerificationMetric]:
        """Get metric by requirement ID."""
        tenant_id = get_current_tenant()
        return self.repo.get_by_requirement(requirement_id, tenant_id)

    def list_metrics(
        self,
        page: int = 1,
        page_size: int = 20,
        verification_status: Optional[str] = None,
    ) -> Tuple[List[VerificationMetric], int]:
        """List verification metrics with filters."""
        tenant_id = get_current_tenant()
        return self.repo.list(
            tenant_id=tenant_id,
            page=page,
            page_size=page_size,
            verification_status=verification_status,
        )

    def update_metrics(
        self,
        metric_id: int,
        metrics_config: Optional[List[Dict[str, Any]]] = None,
        actual_metrics: Optional[Dict[str, Any]] = None,
    ) -> Optional[VerificationMetric]:
        """Update verification metrics."""
        metric = self.repo.get_by_id(metric_id)
        if not metric:
            return None

        updates = {}
        if metrics_config is not None:
            updates['metrics_config'] = metrics_config
        if actual_metrics is not None:
            updates['actual_metrics'] = actual_metrics

        return self.repo.update(metric, **updates)

    def delete_metric(self, metric_id: int) -> bool:
        """Delete verification metric."""
        metric = self.repo.get_by_id(metric_id)
        if not metric:
            return False

        self.repo.delete(metric)
        return True

    # ========================================================================
    # Verification Operations
    # ========================================================================

    def submit_verification(
        self,
        metric_id: int,
        verification_status: str,
        actual_metrics: Dict[str, Any],
        verification_notes: Optional[str] = None,
        verified_by: Optional[int] = None,
    ) -> Optional[VerificationMetric]:
        """
        Submit verification results.

        If verification passes, automatically mark requirement as completed.

        Args:
            metric_id: Metric ID
            verification_status: 'passed' or 'failed'
            actual_metrics: Actual metric values
            verification_notes: Verification notes
            verified_by: User ID

        Returns:
            Updated metric
        """
        metric = self.repo.get_by_id(metric_id)
        if not metric:
            return None

        # Update actual metrics
        metric = self.repo.update_actual_metrics(metric, actual_metrics)

        # Submit verification
        metric = self.repo.submit_verification(
            metric,
            verification_status=verification_status,
            verification_notes=verification_notes,
            verified_by=verified_by,
        )

        # If verification passed, mark requirement as completed
        if verification_status == 'passed':
            requirement = self.requirement_repo.get_by_id(metric.requirement_id)
            if requirement:
                old_status = requirement.status
                new_status = 'completed'

                # Update requirement status
                requirement = self.requirement_repo.update_status(
                    requirement, new_status, verified_by
                )

                # Record history
                self.history_repo.create(
                    entity_type='requirement',
                    entity_id=requirement.id,
                    action='verification_passed',
                    from_status=old_status,
                    to_status=new_status,
                    comments=f'验证通过，自动完成需求。备注: {verification_notes or ""}',
                    performed_by=verified_by,
                )

        return metric

    def get_dashboard_data(
        self, limit: int = 20
    ) -> Dict[str, Any]:
        """
        Get data for verification dashboard.

        Args:
            limit: Max items to return

        Returns:
            Dashboard data dict
        """
        tenant_id = get_current_tenant()

        # Get statistics
        stats = self.repo.get_dashboard_data(tenant_id, limit)

        # Get detailed requirements with metrics
        stmt = (
            select(VerificationMetric, Requirement)
            .join(Requirement, VerificationMetric.requirement_id == Requirement.id)
            .where(VerificationMetric.tenant_id == tenant_id)
            .order_by(VerificationMetric.created_at.desc())
            .limit(limit)
        )

        results = self.db.execute(stmt).all()

        requirements_data = []
        for metric, requirement in results:
            requirements_data.append({
                'id': requirement.id,
                'requirement_no': requirement.requirement_no,
                'title': requirement.title,
                'metrics_config': metric.metrics_config,
                'actual_metrics': metric.actual_metrics,
                'verification_status': metric.verification_status,
                'verification_notes': metric.verification_notes,
                'verified_at': metric.verified_at.isoformat() if metric.verified_at else None,
            })

        stats['requirements'] = requirements_data

        return stats

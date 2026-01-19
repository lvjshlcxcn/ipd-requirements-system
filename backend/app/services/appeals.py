"""APPEALS analysis service for business logic."""
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models.appeals import AppealsAnalysis
from app.repositories.appeals import AppealsRepository
from app.schemas.appeals import (
    APPEALSAnalysisCreate,
    APPEALSAnalysisResponse,
    APPEALSSummary,
)
from app.repositories.requirement import RequirementRepository


class AppealsService:
    """Service for APPEALS analysis business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = AppealsRepository(db)
        self.req_repo = RequirementRepository(db)

    def save_appeals_analysis(
        self,
        requirement_id: int,
        analysis_data: APPEALSAnalysisCreate,
        user_id: Optional[int] = None,
    ) -> Optional[APPEALSAnalysisResponse]:
        """
        Save or update APPEALS analysis for a requirement.

        Args:
            requirement_id: Requirement ID
            analysis_data: APPEALS analysis data
            user_id: User performing the analysis

        Returns:
            Saved analysis response or None if requirement not found
        """
        # Verify requirement exists
        requirement = self.req_repo.get_by_id(requirement_id)
        if not requirement:
            return None

        # Calculate total weighted score
        total_score = self.repo.calculate_weighted_score(
            price_score=analysis_data.price.score,
            price_weight=analysis_data.price.weight,
            availability_score=analysis_data.availability.score,
            availability_weight=analysis_data.availability.weight,
            packaging_score=analysis_data.packaging.score,
            packaging_weight=analysis_data.packaging.weight,
            performance_score=analysis_data.performance.score,
            performance_weight=analysis_data.performance.weight,
            ease_of_use_score=analysis_data.ease_of_use.score,
            ease_of_use_weight=analysis_data.ease_of_use.weight,
            assurance_score=analysis_data.assurance.score,
            assurance_weight=analysis_data.assurance.weight,
            lifecycle_cost_score=analysis_data.lifecycle_cost.score,
            lifecycle_cost_weight=analysis_data.lifecycle_cost.weight,
            social_acceptance_score=analysis_data.social_acceptance.score,
            social_acceptance_weight=analysis_data.social_acceptance.weight,
        )

        # Check if analysis exists
        existing = self.repo.get_by_requirement_id(requirement_id)

        if existing:
            # Update existing
            analysis = self.repo.update(
                existing,
                price_score=analysis_data.price.score,
                price_weight=analysis_data.price.weight,
                price_comment=analysis_data.price.comment,
                availability_score=analysis_data.availability.score,
                availability_weight=analysis_data.availability.weight,
                availability_comment=analysis_data.availability.comment,
                packaging_score=analysis_data.packaging.score,
                packaging_weight=analysis_data.packaging.weight,
                packaging_comment=analysis_data.packaging.comment,
                performance_score=analysis_data.performance.score,
                performance_weight=analysis_data.performance.weight,
                performance_comment=analysis_data.performance.comment,
                ease_of_use_score=analysis_data.ease_of_use.score,
                ease_of_use_weight=analysis_data.ease_of_use.weight,
                ease_of_use_comment=analysis_data.ease_of_use.comment,
                assurance_score=analysis_data.assurance.score,
                assurance_weight=analysis_data.assurance.weight,
                assurance_comment=analysis_data.assurance.comment,
                lifecycle_cost_score=analysis_data.lifecycle_cost.score,
                lifecycle_cost_weight=analysis_data.lifecycle_cost.weight,
                lifecycle_cost_comment=analysis_data.lifecycle_cost.comment,
                social_acceptance_score=analysis_data.social_acceptance.score,
                social_acceptance_weight=analysis_data.social_acceptance.weight,
                social_acceptance_comment=analysis_data.social_acceptance.comment,
                total_weighted_score=total_score,
                analyzed_by=user_id,
            )
        else:
            # Create new
            analysis = self.repo.create(
                requirement_id=requirement_id,
                price_score=analysis_data.price.score,
                price_weight=analysis_data.price.weight,
                price_comment=analysis_data.price.comment,
                availability_score=analysis_data.availability.score,
                availability_weight=analysis_data.availability.weight,
                availability_comment=analysis_data.availability.comment,
                packaging_score=analysis_data.packaging.score,
                packaging_weight=analysis_data.packaging.weight,
                packaging_comment=analysis_data.packaging.comment,
                performance_score=analysis_data.performance.score,
                performance_weight=analysis_data.performance.weight,
                performance_comment=analysis_data.performance.comment,
                ease_of_use_score=analysis_data.ease_of_use.score,
                ease_of_use_weight=analysis_data.ease_of_use.weight,
                ease_of_use_comment=analysis_data.ease_of_use.comment,
                assurance_score=analysis_data.assurance.score,
                assurance_weight=analysis_data.assurance.weight,
                assurance_comment=analysis_data.assurance.comment,
                lifecycle_cost_score=analysis_data.lifecycle_cost.score,
                lifecycle_cost_weight=analysis_data.lifecycle_cost.weight,
                lifecycle_cost_comment=analysis_data.lifecycle_cost.comment,
                social_acceptance_score=analysis_data.social_acceptance.score,
                social_acceptance_weight=analysis_data.social_acceptance.weight,
                social_acceptance_comment=analysis_data.social_acceptance.comment,
                total_weighted_score=total_score,
                analyzed_by=user_id,
            )

        return self._to_response(analysis)

    def get_appeals_analysis(
        self, requirement_id: int
    ) -> Optional[APPEALSAnalysisResponse]:
        """
        Get APPEALS analysis for a requirement.

        Args:
            requirement_id: Requirement ID

        Returns:
            Analysis response or None
        """
        analysis = self.repo.get_by_requirement_id(requirement_id)
        if not analysis:
            return None

        return self._to_response(analysis)

    def get_appeals_summary(self, tenant_id: int) -> APPEALSSummary:
        """
        Get APPEALS summary across all requirements.

        Args:
            tenant_id: Tenant ID

        Returns:
            Summary statistics
        """
        # Get all requirements
        requirements, total = self.req_repo.list(
            page=1, page_size=1000
        )

        analyzed_count = 0
        total_scores = {
            "price": 0.0,
            "availability": 0.0,
            "packaging": 0.0,
            "performance": 0.0,
            "ease_of_use": 0.0,
            "assurance": 0.0,
            "lifecycle_cost": 0.0,
            "social_acceptance": 0.0,
        }

        top_requirements = []

        for req in requirements:
            analysis = self.repo.get_by_requirement_id(req.id)
            if analysis and analysis.total_weighted_score:
                analyzed_count += 1
                total_scores["price"] += analysis.price_score or 0
                total_scores["availability"] += analysis.availability_score or 0
                total_scores["packaging"] += analysis.packaging_score or 0
                total_scores["performance"] += analysis.performance_score or 0
                total_scores["ease_of_use"] += analysis.ease_of_use_score or 0
                total_scores["assurance"] += analysis.assurance_score or 0
                total_scores["lifecycle_cost"] += analysis.lifecycle_cost_score or 0
                total_scores["social_acceptance"] += analysis.social_acceptance_score or 0

                top_requirements.append({
                    "requirement_id": req.id,
                    "requirement_no": req.requirement_no,
                    "title": req.title,
                    "total_score": analysis.total_weighted_score,
                })

        # Calculate averages
        average_scores = {}
        if analyzed_count > 0:
            for key in total_scores:
                average_scores[key] = round(
                    total_scores[key] / analyzed_count, 2
                )
        else:
            average_scores = {k: 0.0 for k in total_scores}

        # Sort top requirements
        top_requirements.sort(
            key=lambda x: x["total_score"], reverse=True
        )
        top_requirements = top_requirements[:10]  # Top 10

        return APPEALSSummary(
            total_requirements=total,
            analyzed_requirements=analyzed_count,
            average_scores=average_scores,
            top_requirements=top_requirements,
        )

    def _to_response(
        self, analysis: AppealsAnalysis
    ) -> APPEALSAnalysisResponse:
        """Convert model to response schema."""
        from app.schemas.appeals import APPEALSDimension

        dimensions = {
            "price": APPEALSDimension(
                score=analysis.price_score or 0,
                weight=float(analysis.price_weight or 0),
                comment=analysis.price_comment,
            ),
            "availability": APPEALSDimension(
                score=analysis.availability_score or 0,
                weight=float(analysis.availability_weight or 0),
                comment=analysis.availability_comment,
            ),
            "packaging": APPEALSDimension(
                score=analysis.packaging_score or 0,
                weight=float(analysis.packaging_weight or 0),
                comment=analysis.packaging_comment,
            ),
            "performance": APPEALSDimension(
                score=analysis.performance_score or 0,
                weight=float(analysis.performance_weight or 0),
                comment=analysis.performance_comment,
            ),
            "ease_of_use": APPEALSDimension(
                score=analysis.ease_of_use_score or 0,
                weight=float(analysis.ease_of_use_weight or 0),
                comment=analysis.ease_of_use_comment,
            ),
            "assurance": APPEALSDimension(
                score=analysis.assurance_score or 0,
                weight=float(analysis.assurance_weight or 0),
                comment=analysis.assurance_comment,
            ),
            "lifecycle_cost": APPEALSDimension(
                score=analysis.lifecycle_cost_score or 0,
                weight=float(analysis.lifecycle_cost_weight or 0),
                comment=analysis.lifecycle_cost_comment,
            ),
            "social_acceptance": APPEALSDimension(
                score=analysis.social_acceptance_score or 0,
                weight=float(analysis.social_acceptance_weight or 0),
                comment=analysis.social_acceptance_comment,
            ),
        }

        return APPEALSAnalysisResponse(
            id=analysis.id,
            requirement_id=analysis.requirement_id,
            dimensions=dimensions,
            total_weighted_score=float(analysis.total_weighted_score or 0),
            analyzed_at=analysis.analyzed_at.isoformat(),
            analyzed_by=analysis.analyzed_by,
        )

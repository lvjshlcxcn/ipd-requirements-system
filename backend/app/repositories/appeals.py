"""APPEALS analysis repository for data access."""
from typing import Optional, Dict, Any
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.appeals import AppealsAnalysis


class AppealsRepository:
    """Repository for AppealsAnalysis model."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_requirement_id(
        self, requirement_id: int
    ) -> Optional[AppealsAnalysis]:
        """
        Get APPEALS analysis by requirement ID.

        Args:
            requirement_id: Requirement ID

        Returns:
            AppealsAnalysis or None
        """
        stmt = select(AppealsAnalysis).where(
            AppealsAnalysis.requirement_id == requirement_id
        )
        result = self.db.execute(stmt).scalar_one_or_none()
        return result

    def create(
        self,
        requirement_id: int,
        price_score: int,
        price_weight: float,
        price_comment: Optional[str],
        availability_score: int,
        availability_weight: float,
        availability_comment: Optional[str],
        packaging_score: int,
        packaging_weight: float,
        packaging_comment: Optional[str],
        performance_score: int,
        performance_weight: float,
        performance_comment: Optional[str],
        ease_of_use_score: int,
        ease_of_use_weight: float,
        ease_of_use_comment: Optional[str],
        assurance_score: int,
        assurance_weight: float,
        assurance_comment: Optional[str],
        lifecycle_cost_score: int,
        lifecycle_cost_weight: float,
        lifecycle_cost_comment: Optional[str],
        social_acceptance_score: int,
        social_acceptance_weight: float,
        social_acceptance_comment: Optional[str],
        total_weighted_score: float,
        analyzed_by: Optional[int] = None,
    ) -> AppealsAnalysis:
        """
        Create APPEALS analysis.

        Args:
            requirement_id: Requirement ID
            All 8 dimensions' score, weight, and comment
            total_weighted_score: Calculated total score
            analyzed_by: User ID who performed analysis

        Returns:
            Created AppealsAnalysis
        """
        analysis = AppealsAnalysis(
            requirement_id=requirement_id,
            # Price
            price_score=price_score,
            price_weight=price_weight,
            price_comment=price_comment,
            # Availability
            availability_score=availability_score,
            availability_weight=availability_weight,
            availability_comment=availability_comment,
            # Packaging
            packaging_score=packaging_score,
            packaging_weight=packaging_weight,
            packaging_comment=packaging_comment,
            # Performance
            performance_score=performance_score,
            performance_weight=performance_weight,
            performance_comment=performance_comment,
            # Ease of Use
            ease_of_use_score=ease_of_use_score,
            ease_of_use_weight=ease_of_use_weight,
            ease_of_use_comment=ease_of_use_comment,
            # Assurance
            assurance_score=assurance_score,
            assurance_weight=assurance_weight,
            assurance_comment=assurance_comment,
            # Lifecycle Cost
            lifecycle_cost_score=lifecycle_cost_score,
            lifecycle_cost_weight=lifecycle_cost_weight,
            lifecycle_cost_comment=lifecycle_cost_comment,
            # Social Acceptance
            social_acceptance_score=social_acceptance_score,
            social_acceptance_weight=social_acceptance_weight,
            social_acceptance_comment=social_acceptance_comment,
            # Calculated
            total_weighted_score=total_weighted_score,
            analyzed_by=analyzed_by,
        )

        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)

        return analysis

    def update(
        self,
        analysis: AppealsAnalysis,
        **updates
    ) -> AppealsAnalysis:
        """
        Update APPEALS analysis.

        Args:
            analysis: Analysis to update
            **updates: Fields to update

        Returns:
            Updated AppealsAnalysis
        """
        for key, value in updates.items():
            if hasattr(analysis, key) and value is not None:
                setattr(analysis, key, value)

        self.db.commit()
        self.db.refresh(analysis)

        return analysis

    def calculate_weighted_score(
        self,
        price_score: int,
        price_weight: float,
        availability_score: int,
        availability_weight: float,
        packaging_score: int,
        packaging_weight: float,
        performance_score: int,
        performance_weight: float,
        ease_of_use_score: int,
        ease_of_use_weight: float,
        assurance_score: int,
        assurance_weight: float,
        lifecycle_cost_score: int,
        lifecycle_cost_weight: float,
        social_acceptance_score: int,
        social_acceptance_weight: float,
    ) -> float:
        """
        Calculate weighted score from all dimensions.

        Formula: Σ(dimension_score × dimension_weight × 10)

        Args:
            All 8 dimensions' scores and weights

        Returns:
            Weighted total score
        """
        total = (
            price_score * price_weight
            + availability_score * availability_weight
            + packaging_score * packaging_weight
            + performance_score * performance_weight
            + ease_of_use_score * ease_of_use_weight
            + assurance_score * assurance_weight
            + lifecycle_cost_score * lifecycle_cost_weight
            + social_acceptance_score * social_acceptance_weight
        )

        return round(total * 10, 2)

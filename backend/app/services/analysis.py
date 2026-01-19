"""Analysis service for requirement analysis operations."""
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.requirement import Requirement
from app.schemas.analysis import AnalysisCreate, AnalysisResponse, AnalysisSummary
from app.repositories.base import BaseRepository


class AnalysisService:
    """Service for analysis business logic."""

    def __init__(self, session: AsyncSession):
        """Initialize analysis service.

        Args:
            session: Database session
        """
        self.session = session
        self.req_repo = BaseRepository(Requirement, session)

    async def save_analysis(
        self, requirement_id: int, analysis_data: AnalysisCreate, user_id: int
    ) -> Optional[AnalysisResponse]:
        """Save analysis results for a requirement.

        Args:
            requirement_id: Requirement ID
            analysis_data: Analysis data (INVEST, MoSCoW, Kano, RICE)
            user_id: User performing the analysis

        Returns:
            Updated requirement with analysis
        """
        # Build update data
        update_data = {
            "invest_analysis": analysis_data.invest.model_dump(),
            "moscow_priority": analysis_data.moscow.priority,
            "kano_category": analysis_data.kano_category,
            "rice_score": {
                **analysis_data.rice.model_dump(),
                "score": analysis_data.rice.score,
            },
            "updated_by": user_id,
        }

        # Update requirement
        requirement = await self.req_repo.update(requirement_id, **update_data)

        if requirement is None:
            return None

        # Calculate overall score
        overall_score = self._calculate_overall_score(analysis_data)

        return AnalysisResponse(
            id=requirement.id,
            requirement_id=requirement.id,
            invest_analysis=requirement.invest_analysis,
            moscow_priority=requirement.moscow_priority,
            kano_category=requirement.kano_category,
            rice_score=requirement.rice_score,
            overall_score=overall_score,
            analyzed_by=user_id,
            analyzed_at=requirement.updated_at.isoformat(),
        )

    def _calculate_overall_score(self, analysis_data: AnalysisCreate) -> float:
        """Calculate overall weighted score.

        Weights:
        - INVEST: 30%
        - MoSCoW: 20%
        - Kano: 20%
        - RICE: 30%

        Args:
            analysis_data: Analysis data

        Returns:
            Overall weighted score
        """
        # INVEST score (sum of boolean values)
        invest_score = (
            1
            if analysis_data.invest.independent
            else 0
            if analysis_data.invest.negotiable
            else 0
            if analysis_data.invest.valuable
            else 0
            if analysis_data.invest.estimable
            else 0
            if analysis_data.invest.small
            else 0
            if analysis_data.invest.testable
            else 0
        ) / 6 * 100

        # MoSCoW score
        moscow_scores = {
            "must_have": 100,
            "should_have": 75,
            "could_have": 50,
            "wont_have": 25,
        }
        moscow_value = analysis_data.moscow.priority.replace("_", "_have")
        moscow_score = moscow_scores.get(moscow_value, 0)

        # Kano score
        kano_scores = {
            "excitement": 100,
            "performance": 75,
            "basic": 50,
            "indifferent": 25,
            "reverse": 0,
        }
        kano_score = kano_scores.get(analysis_data.kano_category, 0)

        # RICE score (normalize to 0-100)
        rice_score = min(analysis_data.rice.score * 10, 100)

        # Weighted average
        overall_score = (
            invest_score * 0.30
            + moscow_score * 0.20
            + kano_score * 0.20
            + rice_score * 0.30
        )

        return round(overall_score, 2)

    async def get_requirement_analysis(
        self, requirement_id: int
    ) -> Optional[AnalysisResponse]:
        """Get analysis results for a requirement.

        Args:
            requirement_id: Requirement ID

        Returns:
            Analysis response or None
        """
        requirement = await self.req_repo.get_by_id(requirement_id)

        if requirement is None:
            return None

        overall_score = 0.0

        if (
            requirement.invest_analysis
            and requirement.rice_score
            and requirement.kano_category
        ):
            # Calculate overall score from existing data
            invest_score = (
                sum(1 for v in requirement.invest_analysis.values() if v)
                / 6 * 100
            )

            moscow_scores = {
                "must_have": 100,
                "should_have": 75,
                "could_have": 50,
                "wont_have": 25,
            }
            moscow_score = moscow_scores.get(requirement.moscow_priority, 0)

            kano_scores = {
                "excitement": 100,
                "performance": 75,
                "basic": 50,
                "indifferent": 25,
                "reverse": 0,
            }
            kano_score = kano_scores.get(requirement.kano_category, 0)

            rice_score = min(
                requirement.rice_score.get("score", 0) * 10, 100
            )

            overall_score = (
                invest_score * 0.30
                + moscow_score * 0.20
                + kano_score * 0.20
                + rice_score * 0.30
            )
            overall_score = round(overall_score, 2)

        return AnalysisResponse(
            id=requirement.id,
            requirement_id=requirement.id,
            invest_analysis=requirement.invest_analysis or {},
            moscow_priority=requirement.moscow_priority or "",
            kano_category=requirement.kano_category or "",
            rice_score=requirement.rice_score or {},
            overall_score=overall_score,
            analyzed_by=requirement.updated_by,
            analyzed_at=requirement.updated_at.isoformat(),
        )

    async def get_analysis_summary(self, tenant_id: int) -> Optional[AnalysisSummary]:
        """Get analysis summary across all requirements.

        Args:
            tenant_id: Tenant ID

        Returns:
            Analysis summary or None
        """
        # This would require more complex queries
        # For now, return a placeholder
        return AnalysisSummary(
            total_requirements=0,
            analyzed_requirements=0,
            by_kano={},
            by_moscow={},
            average_rice_score=0.0,
        )

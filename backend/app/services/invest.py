"""INVEST analysis service for business logic."""
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.requirement import Requirement
from app.schemas.invest import INVESTAnalysisCreate, INVESTAnalysisResponse
from app.repositories.base import BaseRepository


class InvestService:
    """Service for INVEST analysis business logic."""

    def __init__(self, session: AsyncSession):
        """Initialize INVEST service.

        Args:
            session: Database session
        """
        self.session = session
        self.req_repo = BaseRepository(Requirement, session)

    async def get_invest_analysis(
        self, requirement_id: int
    ) -> Optional[dict]:
        """Get INVEST analysis for a requirement.

        Args:
            requirement_id: Requirement ID

        Returns:
            INVEST analysis data or None
        """
        requirement = await self.req_repo.get_by_id(requirement_id)
        if not requirement or not requirement.invest_analysis:
            return None
        return requirement.invest_analysis

    async def save_invest_analysis(
        self,
        requirement_id: int,
        invest_data: INVESTAnalysisCreate,
        user_id: int
    ) -> Optional[dict]:
        """Save INVEST analysis for a requirement.

        Args:
            requirement_id: Requirement ID
            invest_data: INVEST analysis data
            user_id: User performing the analysis

        Returns:
            Saved INVEST analysis with calculated passed_count
        """
        # Calculate passed count
        passed_count = sum([
            invest_data.independent,
            invest_data.negotiable,
            invest_data.valuable,
            invest_data.estimable,
            invest_data.small,
            invest_data.testable
        ])

        # Build update data
        update_data = {
            "invest_analysis": {
                "independent": invest_data.independent,
                "negotiable": invest_data.negotiable,
                "valuable": invest_data.valuable,
                "estimable": invest_data.estimable,
                "small": invest_data.small,
                "testable": invest_data.testable,
                "passed_count": passed_count,
                "notes": invest_data.notes
            },
            "updated_by": user_id
        }

        # Update requirement
        requirement = await self.req_repo.update(requirement_id, **update_data)

        if requirement is None:
            return None

        return {
            "requirement_id": requirement.id,
            **update_data["invest_analysis"],
            "analyzed_at": requirement.updated_at.isoformat()
        }

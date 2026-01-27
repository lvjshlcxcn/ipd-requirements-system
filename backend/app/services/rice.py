"""RICE analysis service for business logic."""
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.requirement import Requirement
from app.schemas.rice import RICEAnalysisCreate, RICEAnalysisResponse
from app.repositories.base import BaseRepository


class RiceService:
    """Service for RICE analysis business logic."""

    def __init__(self, session: AsyncSession):
        """Initialize RICE service.

        Args:
            session: Database session
        """
        self.session = session
        self.req_repo = BaseRepository(Requirement, session)

    async def get_rice_analysis(
        self, requirement_id: int
    ) -> Optional[dict]:
        """Get RICE analysis for a requirement.

        Args:
            requirement_id: Requirement ID

        Returns:
            RICE analysis data or None
        """
        requirement = await self.req_repo.get_by_id(requirement_id)
        if not requirement or not requirement.rice_score:
            return None
        return requirement.rice_score

    async def save_rice_analysis(
        self,
        requirement_id: int,
        rice_data: RICEAnalysisCreate,
        user_id: int
    ) -> dict:
        """Save RICE analysis for a requirement.

        Args:
            requirement_id: Requirement ID
            rice_data: RICE analysis data
            user_id: User performing the analysis

        Returns:
            Saved RICE analysis with calculated score
        """
        # Calculate RICE score: (R × I × C) / E
        score = (rice_data.reach * rice_data.impact * rice_data.confidence) / rice_data.effort

        # Build update data
        update_data = {
            "rice_score": {
                "reach": rice_data.reach,
                "impact": rice_data.impact,
                "confidence": rice_data.confidence,
                "effort": rice_data.effort,
                "score": round(score, 2),
                "notes": rice_data.notes
            },
            "updated_by": user_id
        }

        # Update requirement
        requirement = await self.req_repo.update(requirement_id, **update_data)

        if requirement is None:
            return None

        return {
            "requirement_id": requirement.id,
            **update_data["rice_score"],
            "analyzed_at": requirement.updated_at.isoformat()
        }

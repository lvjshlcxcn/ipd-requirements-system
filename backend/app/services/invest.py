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

    def _convert_bool_to_score(self, old_data: dict) -> dict:
        """将布尔格式转换为评分格式

        Args:
            old_data: 旧格式的 INVEST 数据（布尔值）

        Returns:
            新格式的评分数据
        """
        mapping = {True: 85, False: 40}

        scores = {
            'independent': mapping.get(old_data.get('independent'), 50),
            'negotiable': mapping.get(old_data.get('negotiable'), 50),
            'valuable': mapping.get(old_data.get('valuable'), 50),
            'estimable': mapping.get(old_data.get('estimable'), 50),
            'small': mapping.get(old_data.get('small'), 50),
            'testable': mapping.get(old_data.get('testable'), 50),
        }

        total = sum(scores.values())

        return {
            **scores,
            'total_score': total,
            'average_score': round(total / 6, 2),
            'notes': old_data.get('notes', ''),
            '_migrated': True
        }

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

        data = requirement.invest_analysis

        # 检测旧格式（布尔值）并自动转换
        if isinstance(data.get('independent'), bool):
            return self._convert_bool_to_score(data)

        return data

    async def save_invest_analysis(
        self,
        requirement_id: int,
        invest_data: INVESTAnalysisCreate,
        user_id: int
    ) -> Optional[dict]:
        """Save INVEST analysis for a requirement（评分系统）

        Args:
            requirement_id: Requirement ID
            invest_data: INVEST analysis data（评分 0-100）
            user_id: User performing the analysis

        Returns:
            Saved INVEST analysis with calculated total_score and average_score
        """
        # 计算总分
        total_score = (
            invest_data.independent +
            invest_data.negotiable +
            invest_data.valuable +
            invest_data.estimable +
            invest_data.small +
            invest_data.testable
        )

        # 计算平均分
        average_score = round(total_score / 6, 2)

        # 构建 JSONB 数据
        update_data = {
            "invest_analysis": {
                "independent": invest_data.independent,
                "negotiable": invest_data.negotiable,
                "valuable": invest_data.valuable,
                "estimable": invest_data.estimable,
                "small": invest_data.small,
                "testable": invest_data.testable,
                "total_score": total_score,
                "average_score": average_score,
                "notes": invest_data.notes
            },
            "updated_by": user_id
        }

        # 更新需求
        requirement = await self.req_repo.update(requirement_id, **update_data)

        if requirement is None:
            return None

        return {
            "requirement_id": requirement.id,
            **update_data["invest_analysis"],
            "analyzed_at": requirement.updated_at.isoformat()
        }

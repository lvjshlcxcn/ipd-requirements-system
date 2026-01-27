"""INVEST analysis API endpoints."""
from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_user
from app.schemas.invest import INVESTAnalysisCreate
from app.services.invest import InvestService


router = APIRouter(prefix="/requirements/{requirement_id}/invest", tags=["INVEST"])


@router.get("")
async def get_invest_analysis(
    requirement_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(get_current_user),
):
    """Get INVEST analysis for a requirement.

    Args:
        requirement_id: Requirement ID
        db: Database session
        current_user: Authenticated user

    Returns:
        INVEST analysis data or null if not found
    """
    service = InvestService(db)
    data = await service.get_invest_analysis(requirement_id)

    if data is None:
        return {"success": True, "data": None}

    return {
        "success": True,
        "message": "获取INVEST分析成功",
        "data": data
    }


@router.post("")
async def save_invest_analysis(
    requirement_id: int,
    invest_data: INVESTAnalysisCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(get_current_user),
):
    """Save or update INVEST analysis for a requirement.

    Args:
        requirement_id: Requirement ID
        invest_data: INVEST analysis data
        db: Database session
        current_user: Authenticated user

    Returns:
        Saved INVEST analysis with calculated passed_count
    """
    service = InvestService(db)
    result = await service.save_invest_analysis(
        requirement_id, invest_data, current_user.id
    )

    if result is None:
        return {
            "success": False,
            "message": "需求不存在"
        }

    return {
        "success": True,
        "message": "INVEST分析保存成功",
        "data": result
    }

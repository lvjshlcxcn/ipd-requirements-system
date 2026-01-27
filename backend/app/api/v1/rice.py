"""RICE analysis API endpoints."""
from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_user
from app.schemas.rice import RICEAnalysisCreate
from app.services.rice import RiceService


router = APIRouter(prefix="/requirements/{requirement_id}/rice", tags=["RICE"])


@router.get("")
async def get_rice_analysis(
    requirement_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(get_current_user),
):
    """Get RICE analysis for a requirement.

    Args:
        requirement_id: Requirement ID
        db: Database session
        current_user: Authenticated user

    Returns:
        RICE analysis data or null if not found
    """
    service = RiceService(db)
    data = await service.get_rice_analysis(requirement_id)

    if data is None:
        return {"success": True, "data": None}

    return {
        "success": True,
        "message": "获取RICE分析成功",
        "data": data
    }


@router.post("")
async def save_rice_analysis(
    requirement_id: int,
    rice_data: RICEAnalysisCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(get_current_user),
):
    """Save or update RICE analysis for a requirement.

    Args:
        requirement_id: Requirement ID
        rice_data: RICE analysis data
        db: Database session
        current_user: Authenticated user

    Returns:
        Saved RICE analysis with calculated score
    """
    service = RiceService(db)
    result = await service.save_rice_analysis(
        requirement_id, rice_data, current_user.id
    )

    if result is None:
        return {
            "success": False,
            "message": "需求不存在"
        }

    return {
        "success": True,
        "message": "RICE分析保存成功",
        "data": result
    }

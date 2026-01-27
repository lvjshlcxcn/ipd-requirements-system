"""Analysis API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.analysis import AnalysisCreate, AnalysisResponse, AnalysisSummary
from app.services.analysis import AnalysisService
from app.api.deps import get_async_db, get_current_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/requirements/{requirement_id}/analysis", tags=["analysis"])


@router.get("")
async def get_analysis(
    requirement_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(get_current_user),
):
    """Get analysis for a requirement.

    Args:
        requirement_id: Requirement ID

    Returns:
        Analysis data
    """
    service = AnalysisService(db)
    analysis = await service.get_requirement_analysis(requirement_id)

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found",
        )

    # 使用标准响应格式
    analysis_response = AnalysisResponse.model_validate(analysis)
    return {
        "success": True,
        "message": "获取分析成功",
        "data": analysis_response.model_dump()
    }


@router.post("")
async def save_analysis(
    requirement_id: int,
    analysis_data: AnalysisCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(get_current_user),
):
    """Save analysis results for a requirement.

    Args:
        requirement_id: Requirement ID
        analysis_data: Analysis data

    Returns:
        Saved analysis
    """
    # 检查用户认证
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    service = AnalysisService(db)
    analysis = await service.save_analysis(
        requirement_id, analysis_data, current_user.id
    )

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found",
        )

    # 使用与requirements API相同的标准响应格式
    analysis_response = AnalysisResponse.model_validate(analysis)
    return {
        "success": True,
        "message": "分析保存成功",
        "data": analysis_response.model_dump()
    }


@router.get("/summary", response_model=AnalysisSummary)
async def get_analysis_summary(
    db: AsyncSession = Depends(get_async_db),
    current_user=Depends(get_current_user),
):
    """Get analysis summary across all requirements.

    Returns:
        Analysis summary
    """
    service = AnalysisService(db)
    summary = await service.get_analysis_summary(current_user.tenant_id)
    return summary

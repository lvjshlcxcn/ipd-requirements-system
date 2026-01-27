"""APPEALS analysis API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.appeals import AppealsService
from app.schemas.appeals import (
    APPEALSAnalysisCreate,
    APPEALSAnalysisResponse,
    APPEALSSummary,
)

router = APIRouter(prefix="/requirements/{requirement_id}/appeals", tags=["APPEALS"])


@router.get("")
async def get_appeals_analysis(
    requirement_id: int,
    db: Session = Depends(get_db),
):
    """Get APPEALS analysis for a requirement.

    Args:
        requirement_id: Requirement ID
        db: Database session

    Returns:
        APPEALS analysis data

    Raises:
        404: If analysis not found
    """
    service = AppealsService(db)
    analysis = service.get_appeals_analysis(requirement_id)

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="APPEALS analysis not found",
        )

    # 使用标准响应格式
    analysis_response = APPEALSAnalysisResponse.model_validate(analysis)
    return {
        "success": True,
        "message": "获取APPEALS分析成功",
        "data": analysis_response.model_dump()
    }


@router.post("")
async def save_appeals_analysis(
    requirement_id: int,
    analysis_data: APPEALSAnalysisCreate,
    db: Session = Depends(get_db),
):
    """Save or update APPEALS analysis for a requirement.

    Args:
        requirement_id: Requirement ID
        analysis_data: APPEALS analysis data
        db: Database session

    Returns:
        Saved APPEALS analysis

    Raises:
        404: If requirement not found
    """
    service = AppealsService(db)
    analysis = service.save_appeals_analysis(
        requirement_id, analysis_data
    )

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found",
        )

    # 使用标准响应格式
    analysis_response = APPEALSAnalysisResponse.model_validate(analysis)
    return {
        "success": True,
        "message": "APPEALS分析保存成功",
        "data": analysis_response.model_dump()
    }


@router.get("/summary")
async def get_appeals_summary(
    db: Session = Depends(get_db),
):
    """Get APPEALS summary across all requirements.

    Args:
        db: Database session

    Returns:
        APPEALS summary statistics
    """
    service = AppealsService(db)
    # Use tenant_id = 1 for now (should get from auth context)
    summary = service.get_appeals_summary(tenant_id=1)
    return summary

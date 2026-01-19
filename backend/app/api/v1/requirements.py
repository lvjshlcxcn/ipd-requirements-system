"""Requirements API endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user_sync
from app.services.requirement import RequirementService
from app.schemas.requirement import (
    RequirementCreate,
    RequirementUpdate,
    RequirementResponse,
    RequirementListResponse,
    RequirementDetailResponse,
    RequirementStatsResponse,
    RequirementStatsData,
    RequirementStatsByStatus,
    RequirementStatsByChannel,
    Requirement10QResponse,
    MessageResponse,
    PaginatedResponse,
)
from app.schemas.workflow_history import (
    WorkflowHistoryResponse,
    WorkflowHistoryListResponse,
    WorkflowHistoryCreate,
)

router = APIRouter(prefix="/requirements", tags=["Requirements"])


def get_requirement_service(db: Session = Depends(get_db)) -> RequirementService:
    """Get requirement service instance."""
    return RequirementService(db)


# ========================================================================
# CRUD Endpoints
# ========================================================================

@router.get("/", response_model=RequirementListResponse)
async def list_requirements(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    source_channel: Optional[str] = Query(None, description="Filter by source channel"),
    search: Optional[str] = Query(None, description="Search in title and number"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    service: RequirementService = Depends(get_requirement_service),
):
    """
    Get requirements list with filters and pagination.

    - **page**: Page number (starts from 1)
    - **page_size**: Number of items per page (max 100)
    - **status**: Filter by requirement status
    - **source_channel**: Filter by source channel
    - **search**: Search in title and requirement number
    - **sort_by**: Field to sort by
    - **sort_order**: Sort order (asc or desc)
    """
    requirements, total = service.list_requirements(
        page=page,
        page_size=page_size,
        status=status,
        source_channel=source_channel,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    total_pages = (total + page_size - 1) // page_size

    # Convert SQLAlchemy models to Pydantic models
    items_data = [RequirementResponse.model_validate(req) for req in requirements]

    return RequirementListResponse(
        data=PaginatedResponse(
            items=items_data,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.post("/", response_model=RequirementDetailResponse)
async def create_requirement(
    data: RequirementCreate,
    service: RequirementService = Depends(get_requirement_service),
):
    """
    Create a new requirement.

    - **title**: Requirement title (required)
    - **description**: Requirement description (required)
    - **source_channel**: Source channel (required)
    - **source_contact**: Contact person (optional)
    - **customer_need_10q**: Customer 10 questions (optional)
    - **estimated_duration_months**: Estimated duration in months (optional)
    - **complexity_level**: Complexity level (optional)
    """
    requirement = service.create_requirement(data)
    requirement_data = RequirementResponse.model_validate(requirement)

    return RequirementDetailResponse(
        success=True,
        message="需求创建成功",
        data=requirement_data,
    )


@router.get("/{requirement_id}", response_model=RequirementDetailResponse)
async def get_requirement(
    requirement_id: int,
    service: RequirementService = Depends(get_requirement_service),
):
    """
    Get requirement detail by ID.

    - **requirement_id**: Requirement ID
    """
    requirement = service.get_requirement(requirement_id)

    if not requirement:
        raise HTTPException(status_code=404, detail="需求不存在")

    requirement_data = RequirementResponse.model_validate(requirement)
    return RequirementDetailResponse(
        success=True,
        data=requirement_data,
    )


@router.put("/{requirement_id}", response_model=RequirementDetailResponse)
async def update_requirement(
    requirement_id: int,
    data: RequirementUpdate,
    service: RequirementService = Depends(get_requirement_service),
):
    """
    Update requirement.

    - **requirement_id**: Requirement ID
    - All fields are optional
    """
    requirement = service.update_requirement(requirement_id, data)

    if not requirement:
        raise HTTPException(status_code=404, detail="需求不存在")

    requirement_data = RequirementResponse.model_validate(requirement)
    return RequirementDetailResponse(
        success=True,
        message="需求更新成功",
        data=requirement_data,
    )


@router.delete("/{requirement_id}", response_model=MessageResponse)
async def delete_requirement(
    requirement_id: int,
    service: RequirementService = Depends(get_requirement_service),
):
    """
    Delete requirement.

    - **requirement_id**: Requirement ID
    """
    success = service.delete_requirement(requirement_id)

    if not success:
        raise HTTPException(status_code=404, detail="需求不存在")

    return MessageResponse(
        success=True,
        message="需求删除成功",
    )


# ========================================================================
# Status Endpoints
# ========================================================================

@router.post("/{requirement_id}/status", response_model=RequirementDetailResponse)
async def update_requirement_status(
    requirement_id: int,
    status: str,
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementService = Depends(get_requirement_service),
):
    """
    Update requirement status.

    - **requirement_id**: Requirement ID
    - **status**: New status (collected, analyzing, analyzed, distributed, etc.)
    """
    user_id = current_user.id if current_user else None
    requirement = service.update_status(requirement_id, status, user_id)

    if not requirement:
        raise HTTPException(status_code=404, detail="需求不存在")

    requirement_data = RequirementResponse.model_validate(requirement)
    return RequirementDetailResponse(
        success=True,
        message="状态更新成功",
        data=requirement_data,
    )


# ========================================================================
# Statistics Endpoints
# ========================================================================

@router.get("/stats/summary", response_model=RequirementStatsResponse)
async def get_requirement_stats(
    service: RequirementService = Depends(get_requirement_service),
):
    """
    Get requirement statistics summary.

    Returns total count, count by status, and count by source channel.
    """
    stats = service.get_statistics()
    return RequirementStatsResponse(data=stats)


# ========================================================================
# 10 Questions Endpoints
# ========================================================================

@router.get("/{requirement_id}/10q", response_model=RequirementDetailResponse)
async def get_requirement_10q(
    requirement_id: int,
    service: RequirementService = Depends(get_requirement_service),
):
    """
    Get requirement 10 questions detail.

    - **requirement_id**: Requirement ID
    """
    answer = service.get_10_questions(requirement_id)

    if not answer:
        raise HTTPException(status_code=404, detail="十问答案不存在")

    return RequirementDetailResponse(
        success=True,
        data=answer,
    )


# ========================================================================
# History Endpoints
# ========================================================================

@router.get("/{requirement_id}/history", response_model=WorkflowHistoryListResponse)
async def get_requirement_history(
    requirement_id: int,
    limit: int = Query(50, ge=1, le=100, description="返回条数"),
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementService = Depends(get_requirement_service),
):
    """
    获取需求历史记录.

    - **requirement_id**: 需求ID
    - **limit**: 返回记录数（默认50，最大100）
    """
    # 验证需求存在
    requirement = service.get_requirement(requirement_id)
    if not requirement:
        raise HTTPException(status_code=404, detail="需求不存在")

    history = service.get_history(requirement_id, limit)
    history_data = [WorkflowHistoryResponse.model_validate(h) for h in history]

    return WorkflowHistoryListResponse(data=history_data)


@router.post("/{requirement_id}/history", response_model=MessageResponse)
async def add_requirement_history_note(
    requirement_id: int,
    data: WorkflowHistoryCreate,
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementService = Depends(get_requirement_service),
):
    """
    手动添加需求历史备注.

    - **requirement_id**: 需求ID
    - **comments**: 备注内容（必填）
    - **action_reason**: 变更原因（可选）
    - **metadata**: 额外元数据（可选）
    """
    # 验证需求存在
    requirement = service.get_requirement(requirement_id)
    if not requirement:
        raise HTTPException(status_code=404, detail="需求不存在")

    user_id = current_user.id if current_user else None
    service.add_history_note(
        requirement_id=requirement_id,
        comments=data.comments,
        action_reason=data.action_reason,
        performed_by=user_id,
    )

    return MessageResponse(
        success=True,
        message="备注添加成功"
    )

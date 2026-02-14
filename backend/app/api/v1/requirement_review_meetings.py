"""Requirement review meeting API endpoints."""
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.session import get_db
from app.models.user import User
from app.models.requirement_review_meeting_attendee import RequirementReviewMeetingAttendee
from app.api.deps import get_current_user_sync
from app.services.requirement_review_meeting import RequirementReviewMeetingService
from app.repositories.requirement_review_meeting import RequirementReviewMeetingRepository
from app.schemas.requirement_review_meeting import (
    MeetingCreate,
    MeetingUpdate,
    MeetingResponse,
    MeetingData,
    MeetingListResponse,
    AttendeeCreate,
    AttendeeResponse,
    AttendeeData,
    MeetingRequirementCreate,
    MeetingRequirementUpdate,
    MeetingRequirementResponse,
    MeetingRequirementData,
    VoteCreate,
    VoteData,
    VoteResponse,
    VoteStatisticsResponse,
    MessageResponse,
    AssignedVotersUpdate,
    VoterStatusResponse,
    VoteResultData,
    VoteResultResponse,
    VoteResultListResponse,
    EndMeetingRequest,
    PendingVotersResponse,
)

router = APIRouter(prefix="/requirement-review-meetings", tags=["Requirement Review Meetings"])


def get_service(db: Session = Depends(get_db)) -> RequirementReviewMeetingService:
    """Get service instance."""
    return RequirementReviewMeetingService(db)


def get_repository(db: Session = Depends(get_db)) -> RequirementReviewMeetingRepository:
    """Get repository instance."""
    return RequirementReviewMeetingRepository(db)


def get_tenant_id(current_user: Optional[User]) -> int:
    """获取租户 ID，如果用户未认证则使用默认值."""
    if current_user is None:
        # 未认证用户使用默认租户
        return 1
    return current_user.tenant_id


# ========================================================================
# Meeting CRUD Endpoints
# ========================================================================

@router.get("/", response_model=MeetingListResponse)
async def list_meetings(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    date_filter: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementReviewMeetingService = Depends(get_service),
):
    """
    Get review meetings list with filters and pagination.

    - **status**: Filter by meeting status (scheduled/in_progress/completed/cancelled)
    - **date_filter**: Filter by scheduled date
    """
    tenant_id = get_tenant_id(current_user)
    skip = (page - 1) * page_size

    meetings, total = service.repo.get_multi(
        tenant_id=tenant_id,
        skip=skip,
        limit=page_size,
        status=status,
        date_filter=date_filter
    )

    total_pages = (total + page_size - 1) // page_size

    return MeetingListResponse(
        success=True,
        data={
            "items": [MeetingData.model_validate(m) for m in meetings],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
    )


@router.post("/", response_model=MeetingResponse)
async def create_meeting(
    meeting_in: MeetingCreate,
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementReviewMeetingService = Depends(get_service),
):
    """Create a new review meeting."""
    tenant_id = get_tenant_id(current_user)
    meeting = service.create_meeting(
        title=meeting_in.title,
        scheduled_at=meeting_in.scheduled_at,
        moderator_id=meeting_in.moderator_id,
        description=meeting_in.description,
        meeting_settings=meeting_in.meeting_settings,
        created_by=current_user.id if current_user else None,
        tenant_id=tenant_id
    )

    # 转换为Pydantic模型
    meeting_data = MeetingData.model_validate(meeting)

    return MeetingResponse(
        success=True,
        message="会议创建成功",
        data=meeting_data
    )


@router.get("/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(
    meeting_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementReviewMeetingService = Depends(get_service),
):
    """Get meeting details by ID."""
    tenant_id = get_tenant_id(current_user)
    meeting = service.repo.get(meeting_id, tenant_id)

    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    return MeetingResponse(
        success=True,
        data=MeetingData.model_validate(meeting)
    )


@router.put("/{meeting_id}", response_model=MeetingResponse)
async def update_meeting(
    meeting_id: int,
    meeting_in: MeetingUpdate,
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementReviewMeetingService = Depends(get_service),
):
    """Update meeting details."""
    tenant_id = get_tenant_id(current_user)
    meeting = service.repo.get(meeting_id, tenant_id)

    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    update_data = meeting_in.model_dump(exclude_unset=True)
    updated_meeting = service.repo.update(meeting, update_data)

    return MeetingResponse(
        success=True,
        message="会议更新成功",
        data=MeetingData.model_validate(updated_meeting)
    )


@router.delete("/{meeting_id}", response_model=MessageResponse)
async def delete_meeting(
    meeting_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementReviewMeetingService = Depends(get_service),
):
    """Delete a meeting (cascade deletes attendees, requirements, votes)."""
    tenant_id = get_tenant_id(current_user)
    meeting = service.repo.get(meeting_id, tenant_id)

    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    service.repo.delete(meeting)

    return MessageResponse(success=True, message="会议删除成功")


# ========================================================================
# Meeting Control Endpoints
# ========================================================================

@router.post("/{meeting_id}/start", response_model=MeetingResponse)
async def start_meeting(
    meeting_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementReviewMeetingService = Depends(get_service),
):
    """Start a review meeting (only moderator can start)."""
    tenant_id = get_tenant_id(current_user)
    meeting = service.repo.get(meeting_id, tenant_id)

    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    # 验证主持人权限
    if not service.is_moderator(meeting, current_user.id):
        raise HTTPException(status_code=403, detail="只有主持人可以开始会议")

    try:
        updated_meeting = service.start_meeting(meeting)
        return MeetingResponse(
            success=True,
            message="会议已开始",
            data=MeetingData.model_validate(updated_meeting)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{meeting_id}/end", response_model=MeetingResponse)
async def end_meeting(
    meeting_id: int,
    request: EndMeetingRequest = Body(default=EndMeetingRequest()),
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementReviewMeetingService = Depends(get_service),
):
    """结束会议(可选自动弃权投票)."""
    tenant_id = get_tenant_id(current_user)
    meeting = service.repo.get(meeting_id, tenant_id)

    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    if not service.is_moderator(meeting, current_user.id):
        raise HTTPException(status_code=403, detail="只有主持人可以结束会议")

    try:
        updated_meeting = service.end_meeting(
            meeting,
            auto_abstain=request.auto_abstain
        )
        return MeetingResponse(
            success=True,
            message="会议已结束",
            data=MeetingData.model_validate(updated_meeting)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{meeting_id}/pending-voters")
async def get_pending_voters(
    meeting_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
    service: RequirementReviewMeetingService = Depends(get_service),
):
    """获取会议中所有需求的未投票人员统计(仅主持人可访问)."""
    tenant_id = get_tenant_id(current_user)
    meeting = repo.get(meeting_id, tenant_id)

    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    # 验证主持人权限
    if not service.is_moderator(meeting, current_user.id):
        raise HTTPException(status_code=403, detail="只有主持人可以查看未投票人员")

    pending_data = repo.get_all_pending_voters(meeting_id)

    # 直接返回数据,不嵌套在data中
    return {
        "success": True,
        "total_requirements": pending_data["total_requirements"],
        "requirements": pending_data["requirements"]
    }


# ========================================================================
# Attendee Endpoints
# ========================================================================

@router.get("/{meeting_id}/attendees")
async def get_attendees(
    meeting_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Get all attendees for a meeting with user information."""
    attendees = repo.get_attendees(meeting_id)

    # 手动构建包含用户信息的响应
    result = []
    for attendee in attendees:
        # 获取关联的用户信息
        user_info = None
        if hasattr(attendee, 'attendee') and attendee.attendee:
            user_info = {
                "id": attendee.attendee.id,
                "username": attendee.attendee.username,
                "email": attendee.attendee.email,
                "full_name": attendee.attendee.full_name,
            }

        attendee_dict = {
            "id": attendee.id,
            "meeting_id": attendee.meeting_id,
            "attendee_id": attendee.attendee_id,
            "attendance_status": attendee.attendance_status,
            "tenant_id": attendee.tenant_id,
            "created_at": attendee.created_at,
            "updated_at": attendee.updated_at,
            "user": user_info
        }
        result.append(attendee_dict)

    return result


@router.post("/{meeting_id}/attendees", response_model=AttendeeResponse)
async def add_attendee(
    meeting_id: int,
    attendee_in: AttendeeCreate,
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Add an attendee to the meeting."""
    # 暂时使用固定的 tenant_id = 1（方便调试）
    tenant_id = 1

    # 验证会议存在
    meeting = repo.get(meeting_id, tenant_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    # 业务逻辑：只有会议开始后才能添加参会人员
    if meeting.status != "in_progress":
        raise HTTPException(
            status_code=400,
            detail="只有会议开始后才能添加参会人员"
        )

    # 检查参会人员是否已存在
    from sqlalchemy import inspect
    from sqlalchemy.exc import IntegrityError

    # 先检查是否已经添加
    existing_attendee = repo.db.query(RequirementReviewMeetingAttendee).filter(
        RequirementReviewMeetingAttendee.meeting_id == meeting_id,
        RequirementReviewMeetingAttendee.attendee_id == attendee_in.attendee_id
    ).first()

    if existing_attendee:
        raise HTTPException(
            status_code=400,
            detail=f"用户ID {attendee_in.attendee_id} 已经是参会人员"
        )

    try:
        attendee = repo.add_attendee(
            meeting_id=meeting_id,
            attendee_id=attendee_in.attendee_id,
            tenant_id=tenant_id,
            status=attendee_in.attendance_status or "invited"
        )
    except IntegrityError:
        repo.db.rollback()
        raise HTTPException(
            status_code=400,
            detail="添加失败：该用户已经是参会人员"
        )

    return AttendeeResponse(
        success=True,
        message="参会人员添加成功",
        data=AttendeeData.model_validate(attendee)
    )


@router.delete("/{meeting_id}/attendees/{attendee_id}", response_model=MessageResponse)
async def remove_attendee(
    meeting_id: int,
    attendee_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Remove an attendee from the meeting (cascade deletes their votes)."""
    tenant_id = get_tenant_id(current_user)

    # 验证会议存在
    meeting = repo.get(meeting_id, tenant_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    success = repo.remove_attendee(meeting_id, attendee_id)

    if not success:
        raise HTTPException(status_code=404, detail="参会人员不存在")

    return MessageResponse(success=True, message="参会人员已移除（投票记录已删除）")


# ========================================================================
# Meeting Requirement Endpoints
# ========================================================================

@router.get("/{meeting_id}/requirements")
async def get_meeting_requirements(
    meeting_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Get all requirements for a meeting (ordered by review_order)."""
    try:
        requirements = repo.get_requirements(meeting_id)

        # 调试信息
        print(f"\n=== get_meeting_requirements ===")
        print(f"meeting_id: {meeting_id}")
        print(f"Total requirements fetched: {len(requirements)}")

        for idx, req in enumerate(requirements):
            has_req = req.requirement is not None
            print(f"  [{idx}] id={req.id}, requirement_id={req.requirement_id}, has_requirement={has_req}")
            if req.requirement:
                print(f"       -> {req.requirement.requirement_no}")

        # 过滤掉 requirement 为 null 的记录（数据被删除的情况）
        valid_requirements = [r for r in requirements if r.requirement is not None]
        print(f"Valid requirements after filtering: {len(valid_requirements)}")

        result = [MeetingRequirementData.model_validate(r) for r in valid_requirements]
        print(f"Returning {len(result)} requirements\n")

        return result
    except Exception as e:
        import traceback
        print(f"Error getting meeting requirements: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"获取会议需求失败: {str(e)}")


@router.post("/{meeting_id}/requirements", response_model=MeetingRequirementResponse)
async def add_requirement_to_meeting(
    meeting_id: int,
    req_in: MeetingRequirementCreate,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Add a requirement to the meeting."""
    tenant_id = get_tenant_id(current_user)

    # 验证会议存在
    meeting = repo.get(meeting_id, tenant_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    # 业务逻辑：只有会议开始后才能添加需求
    if meeting.status != "in_progress":
        raise HTTPException(
            status_code=400,
            detail="只有会议开始后才能添加评审需求"
        )

    # 检查需求是否已被其他会议关联
    from app.models.requirement_review_meeting_requirement import RequirementReviewMeetingRequirement
    existing_meeting_req = repo.db.query(RequirementReviewMeetingRequirement).filter(
        RequirementReviewMeetingRequirement.requirement_id == req_in.requirement_id,
        RequirementReviewMeetingRequirement.meeting_id != meeting_id
    ).first()

    if existing_meeting_req:
        raise HTTPException(
            status_code=400,
            detail=f"该需求已被其他会议评审 (会议ID: {existing_meeting_req.meeting_id})"
        )

    # 检查需求是否被 Insight Storyboard 关联
    from app.models.insight import UserStoryboard
    storyboard = repo.db.query(UserStoryboard).filter(
        UserStoryboard.linked_requirement_id == req_in.requirement_id
    ).first()

    if storyboard:
        raise HTTPException(
            status_code=400,
            detail=f"该需求已被洞察分析关联 (Storyboard ID: {storyboard.id})"
        )

    # 获取当前最大的order值
    requirements = repo.get_requirements(meeting_id)
    max_order = max([r.review_order for r in requirements], default=0)

    try:
        meeting_req = repo.add_requirement(
            meeting_id=meeting_id,
            requirement_id=req_in.requirement_id,
            tenant_id=tenant_id,
            order=max_order + 1,
            notes=req_in.meeting_notes
        )
    except Exception as e:
        # 处理唯一约束冲突（需求已添加）
        if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="该需求已添加到会议")
        raise

    return MeetingRequirementResponse(
        success=True,
        message="需求已添加到会议",
        data=MeetingRequirementData.model_validate(meeting_req)
    )


@router.put("/{meeting_id}/requirements/{requirement_id}", response_model=MessageResponse)
async def update_meeting_requirement(
    meeting_id: int,
    requirement_id: int,
    req_in: MeetingRequirementUpdate,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Update requirement review order or notes."""
    tenant_id = get_tenant_id(current_user)

    # 验证会议存在
    meeting = repo.get(meeting_id, tenant_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    if req_in.review_order is not None:
        success = repo.update_requirement_order(meeting_id, requirement_id, req_in.review_order)
        if not success:
            raise HTTPException(status_code=404, detail="会议需求不存在")

    # TODO: 更新meeting_notes（需要直接操作模型）
    return MessageResponse(success=True, message="会议需求更新成功")


@router.delete("/{meeting_id}/requirements/{requirement_id}", response_model=MessageResponse)
async def remove_requirement_from_meeting(
    meeting_id: int,
    requirement_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Remove a requirement from the meeting (cascade deletes related votes)."""
    tenant_id = get_tenant_id(current_user)

    # 验证会议存在
    meeting = repo.get(meeting_id, tenant_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    success = repo.remove_requirement(meeting_id, requirement_id)

    if not success:
        raise HTTPException(status_code=404, detail="会议需求不存在")

    return MessageResponse(success=True, message="需求已从会议中移除（投票记录已删除）")


# ========================================================================
# Vote Endpoints
# ========================================================================

@router.post("/{meeting_id}/requirements/{requirement_id}/vote", response_model=VoteResponse)
async def cast_vote(
    meeting_id: int,
    requirement_id: int,
    vote_in: VoteCreate,
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementReviewMeetingService = Depends(get_service),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """
    Cast a vote (no update allowed).

    **Permission**: Only assigned voters can vote.
    **Meeting Status**: Only in-progress meetings accept votes.
    **Restriction**: Each user can only vote once per requirement.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="需要登录才能投票")

    tenant_id = get_tenant_id(current_user)

    # 按优先级检查权限，返回明确的错误消息
    # 1. 首先检查是否已投过票（最优先）
    existing_vote = repo.get_user_vote(meeting_id, requirement_id, current_user.id)
    if existing_vote:
        raise HTTPException(
            status_code=400,
            detail="您已经投过票了，不能修改投票选项"
        )

    # 2. 然后检查其他权限（会议状态、参会人员、指定投票人）
    if not service.can_vote(meeting_id, current_user.id, requirement_id):
        raise HTTPException(
            status_code=403,
            detail="您没有投票权限（非指定投票人员或会议未进行中）"
        )

    vote = repo.cast_vote(
        meeting_id=meeting_id,
        requirement_id=requirement_id,
        voter_id=current_user.id,
        tenant_id=tenant_id,
        vote_option=vote_in.vote_option,
        comment=vote_in.comment
    )

    return VoteResponse(
        success=True,
        message="投票成功",
        data=VoteData.model_validate(vote)
    )


@router.get("/{meeting_id}/requirements/{requirement_id}/votes", response_model=VoteStatisticsResponse)
async def get_vote_statistics(
    meeting_id: int,
    requirement_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementReviewMeetingService = Depends(get_service),
):
    """Get vote statistics for a meeting requirement."""
    stats = service.get_vote_statistics(meeting_id, requirement_id)

    return VoteStatisticsResponse(
        success=True,
        data=stats
    )


@router.get("/{meeting_id}/requirements/{requirement_id}/my-vote", response_model=VoteResponse)
async def get_my_vote(
    meeting_id: int,
    requirement_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Get current user's vote for a requirement."""
    if not current_user:
        raise HTTPException(status_code=401, detail="需要登录")

    vote = repo.get_user_vote(meeting_id, requirement_id, current_user.id)

    if not vote:
        raise HTTPException(status_code=404, detail="您尚未投票")

    return VoteResponse(
        success=True,
        data=VoteData.model_validate(vote)
    )


# ========================================================================
# Assigned Voters Endpoints
# ========================================================================

@router.patch(
    "/{meeting_id}/requirements/{requirement_id}/voters",
    response_model=MeetingRequirementResponse
)
async def update_assigned_voters(
    meeting_id: int,
    requirement_id: int,
    voters_in: AssignedVotersUpdate,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Update the list of assigned voters for a meeting requirement."""
    tenant_id = get_tenant_id(current_user)

    # 验证会议存在
    meeting = repo.get(meeting_id, tenant_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    # 更新指定的投票人员列表
    meeting_req = repo.update_assigned_voters(
        meeting_id=meeting_id,
        requirement_id=requirement_id,
        voter_ids=voters_in.assigned_voter_ids
    )

    if not meeting_req:
        raise HTTPException(status_code=404, detail="会议需求不存在")

    return MeetingRequirementResponse(
        success=True,
        message="投票人员设置成功",
        data=MeetingRequirementData.model_validate(meeting_req)
    )


@router.get(
    "/{meeting_id}/requirements/{requirement_id}/voters",
    response_model=VoterStatusResponse
)
async def get_voter_status(
    meeting_id: int,
    requirement_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Get voting status for all assigned voters of a requirement."""
    tenant_id = get_tenant_id(current_user)

    # 验证会议存在
    meeting = repo.get(meeting_id, tenant_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    # 获取投票状态
    status_data = repo.get_voter_status(meeting_id, requirement_id)

    return VoterStatusResponse(
        success=True,
        data=status_data
    )


@router.get(
    "/{meeting_id}/requirements/{requirement_id}/current-voter"
)
async def get_current_voter(
    meeting_id: int,
    requirement_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """
    Get the current voter for a requirement.

    Returns the first assigned voter who hasn't voted yet.
    Returns null if all assigned voters have voted.
    """
    tenant_id = get_tenant_id(current_user)

    # 验证会议存在
    meeting = repo.get(meeting_id, tenant_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    # 获取投票状态（包含 current_voter 信息）
    status_data = repo.get_voter_status(meeting_id, requirement_id)

    return {
        "success": True,
        "data": status_data["current_voter"]
    }


@router.post(
    "/{meeting_id}/requirements/{requirement_id}/next-voter"
)
async def move_to_next_voter(
    meeting_id: int,
    requirement_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
):
    """
    Deprecated: Parallel voting mode enabled.

    This endpoint is deprecated. All assigned voters can now vote independently.
    """
    raise HTTPException(
        status_code=400,
        detail="并行投票模式已启用，所有指定投票人可独立投票，无需切换投票人"
    )


# ========================================================================
# Vote Results Archive Endpoints
# ========================================================================

@router.get("/archive/vote-results", response_model=VoteResultListResponse)
async def list_vote_results(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    meeting_id: Optional[int] = Query(None, description="Filter by meeting ID"),
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Get archived vote results with pagination."""
    tenant_id = get_tenant_id(current_user)
    skip = (page - 1) * page_size

    results, total = repo.get_vote_results(
        tenant_id=tenant_id,
        meeting_id=meeting_id,
        skip=skip,
        limit=page_size
    )

    total_pages = (total + page_size - 1) // page_size

    return VoteResultListResponse(
        success=True,
        data={
            "items": [VoteResultData.model_validate(r) for r in results],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
    )


@router.get("/archive/vote-results/{result_id}", response_model=VoteResultResponse)
async def get_vote_result(
    result_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Get a specific archived vote result."""
    tenant_id = get_tenant_id(current_user)

    result = repo.get_vote_result(result_id, tenant_id)
    if not result:
        raise HTTPException(status_code=404, detail="投票结果不存在")

    return VoteResultResponse(
        success=True,
        data=VoteResultData.model_validate(result)
    )


@router.get("/{meeting_id}/archive/vote-results", response_model=VoteResultListResponse)
async def list_meeting_vote_results(
    meeting_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Get all archived vote results for a specific meeting."""
    tenant_id = get_tenant_id(current_user)

    # 验证会议存在
    meeting = repo.get(meeting_id, tenant_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    results, total = repo.get_vote_results(
        tenant_id=tenant_id,
        meeting_id=meeting_id,
        skip=0,
        limit=1000  # 获取所有结果
    )

    return VoteResultListResponse(
        success=True,
        data={
            "items": [VoteResultData.model_validate(r) for r in results],
            "total": total,
        }
    )

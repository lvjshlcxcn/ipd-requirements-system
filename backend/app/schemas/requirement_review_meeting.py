"""Requirement review meeting schemas."""
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


# ============================================================================
# Meeting Schemas
# ============================================================================

class MeetingBase(BaseModel):
    """Base meeting schema."""

    title: str = Field(..., min_length=1, max_length=200, description="会议标题")
    description: Optional[str] = Field(None, description="会议描述")
    scheduled_at: datetime = Field(..., description="会议时间")
    moderator_id: int = Field(..., description="主持人ID")
    meeting_settings: Optional[Dict[str, Any]] = Field(default_factory=dict, description="会议设置")


class MeetingCreate(MeetingBase):
    """Schema for creating a meeting."""

    pass


class MeetingUpdate(BaseModel):
    """Schema for updating a meeting."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    moderator_id: Optional[int] = None
    status: Optional[str] = Field(None, description="会议状态")
    meeting_settings: Optional[Dict[str, Any]] = None


class MeetingData(BaseModel):
    """Meeting data schema."""

    id: int
    meeting_no: str
    title: str
    description: Optional[str] = None
    scheduled_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    moderator_id: int
    status: str
    meeting_settings: Optional[Dict[str, Any]] = None
    created_by: Optional[int] = None
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MeetingResponse(BaseModel):
    """Schema for meeting response."""

    success: bool = True
    message: Optional[str] = None
    data: MeetingData


class MeetingListResponse(BaseModel):
    """Schema for meeting list response."""

    success: bool
    data: Dict[str, Any]


# ============================================================================
# Attendee Schemas
# ============================================================================

class AttendeeBase(BaseModel):
    """Base attendee schema."""

    attendee_id: int = Field(..., description="参会人员ID")
    attendance_status: Optional[str] = Field(
        "invited",
        description="出席状态: invited/accepted/declined/attended"
    )


class AttendeeCreate(AttendeeBase):
    """Schema for adding an attendee."""

    pass


class AttendeeResponse(BaseModel):
    """Schema for attendee response."""

    success: bool
    message: Optional[str] = None
    data: Optional["AttendeeData"] = None


class AttendeeData(BaseModel):
    """Attendee data schema."""

    id: int
    meeting_id: int
    attendee_id: int
    attendance_status: str
    tenant_id: int
    created_at: datetime
    updated_at: datetime
    # 用户信息（关联查询）
    user: Optional[Dict[str, Any]] = Field(None, description="用户详细信息")

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Requirement Basic Data Schema (for nested display)
# ============================================================================

class RequirementBasicData(BaseModel):
    """Basic requirement information for nested display."""

    id: int
    requirement_no: str
    title: str
    description: Optional[str] = None
    target_type: Optional[str] = None  # Maps to frontend 'type' field
    moscow_priority: Optional[str] = None  # Maps to frontend 'priority' field

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Meeting Requirement Schemas
# ============================================================================

class MeetingRequirementBase(BaseModel):
    """Base meeting requirement schema."""

    requirement_id: int = Field(..., description="需求ID")
    meeting_notes: Optional[str] = Field(None, description="会议备注")


class MeetingRequirementCreate(MeetingRequirementBase):
    """Schema for adding a requirement to meeting."""

    pass


class MeetingRequirementUpdate(BaseModel):
    """Schema for updating meeting requirement."""

    review_order: Optional[int] = Field(None, description="评审顺序")
    meeting_notes: Optional[str] = Field(None, description="会议备注")


class AssignedVotersUpdate(BaseModel):
    """Schema for updating assigned voters."""

    assigned_voter_ids: List[int] = Field(..., description="指定的投票人员ID列表")


class VoterStatus(BaseModel):
    """Voter status schema."""

    attendee_id: int
    username: str
    full_name: Optional[str] = None
    has_voted: bool = Field(description="是否已投票")
    vote_option: Optional[str] = Field(None, description="投票选项（如果已投票）")
    voted_at: Optional[datetime] = Field(None, description="投票时间")


class VoterStatusResponse(BaseModel):
    """Schema for voter status response."""

    success: bool
    data: "VoterStatusData"


class VoterStatusData(BaseModel):
    """Voter status data schema."""

    requirement_id: int
    assigned_voter_ids: List[int]  # 被指定投票的人员ID列表
    voters: List[VoterStatus]  # 投票人员状态列表
    total_assigned: int = Field(description="总指定投票人数")
    total_voted: int = Field(description="已投票人数")
    is_complete: bool = Field(description="是否所有指定人员都已投票")


class MeetingRequirementResponse(BaseModel):
    """Schema for meeting requirement response."""

    success: bool
    message: Optional[str] = None
    data: Optional["MeetingRequirementData"] = None


class MeetingRequirementData(BaseModel):
    """Meeting requirement data schema."""

    id: int
    meeting_id: int
    requirement_id: int
    review_order: int
    meeting_notes: Optional[str] = None
    assigned_voter_ids: Optional[List[int]] = None  # 指定的投票人员ID列表
    tenant_id: int
    created_at: datetime
    updated_at: datetime
    # 嵌套的需求信息（通过joinedload预加载）
    requirement: Optional[RequirementBasicData] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Vote Schemas
# ============================================================================

class VoteBase(BaseModel):
    """Base vote schema."""

    vote_option: str = Field(..., description="投票选项: approve/reject/abstain")
    comment: Optional[str] = Field(None, description="评审意见")


class VoteCreate(VoteBase):
    """Schema for casting a vote."""

    pass


class VoteResponse(BaseModel):
    """Schema for vote response."""

    success: bool
    message: Optional[str] = None
    data: Optional["VoteData"] = None


class VoteData(BaseModel):
    """Vote data schema."""

    id: int
    meeting_id: int
    requirement_id: int
    voter_id: int
    vote_option: str
    comment: Optional[str] = None
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Vote Statistics Schemas
# ============================================================================

class VoteInfo(BaseModel):
    """Vote information schema."""

    voter_id: int
    comment: Optional[str] = None


class VoteOptionStats(BaseModel):
    """Vote option statistics schema."""

    count: int
    percentage: float
    votes: List[VoteInfo] = Field(default_factory=list)


class VoteItem(BaseModel):
    """单个投票记录"""

    voter_id: int
    voter_name: str
    vote_option: str
    comment: Optional[str] = None
    voted_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VoteStatisticsData(BaseModel):
    """Vote statistics data schema (匹配前端期望的格式)."""

    requirement_id: int
    total_votes: int
    approve_count: int
    approve_percentage: float
    reject_count: int
    reject_percentage: float
    abstain_count: int
    abstain_percentage: float
    votes: List[VoteItem]
    # 投票完成状态字段
    total_assigned_voters: int = Field(default=0, description="指定的投票人员总数")
    voted_count: int = Field(default=0, description="已投票人数")
    is_voting_complete: bool = Field(default=False, description="投票是否完成（所有指定人员已投票）")

    model_config = ConfigDict(from_attributes=True)


class VoteStatisticsResponse(BaseModel):
    """Schema for vote statistics response."""

    success: bool
    data: VoteStatisticsData


# ============================================================================
# Vote Result Archive Schemas
# ============================================================================

class VoteResultData(BaseModel):
    """Vote result archive data schema."""

    id: int
    meeting_id: int
    meeting_no: Optional[str] = None  # 会议编号
    requirement_id: int
    requirement_no: Optional[str] = None  # 需求业务编号
    requirement_title: Optional[str] = None
    vote_statistics: Dict[str, Any]
    archived_at: datetime
    tenant_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VoteResultResponse(BaseModel):
    """Schema for vote result response."""

    success: bool
    data: VoteResultData


class VoteResultListResponse(BaseModel):
    """Schema for vote result list response."""

    success: bool
    data: Dict[str, Any]


# ============================================================================
# Common Response Schemas
# ============================================================================

class MessageResponse(BaseModel):
    """Generic message response schema."""

    success: bool
    message: str


# Forward references resolution
AttendeeResponse.model_rebuild()
MeetingRequirementResponse.model_rebuild()
VoterStatusResponse.model_rebuild()
VoteResponse.model_rebuild()

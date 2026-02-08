"""Requirement review meeting service for business logic."""
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session

from app.models.requirement_review_meeting import RequirementReviewMeeting
from app.models.requirement_review_meeting_attendee import RequirementReviewMeetingAttendee
from app.models.user import User
from app.repositories.requirement_review_meeting import RequirementReviewMeetingRepository
from app.core.tenant import get_current_tenant


class RequirementReviewMeetingService:
    """Service for Requirement Review Meeting business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = RequirementReviewMeetingRepository(db)

    # ========================================================================
    # Meeting Management
    # ========================================================================

    def create_meeting(
        self,
        title: str,
        scheduled_at: datetime,
        moderator_id: int,
        tenant_id: int,
        description: Optional[str] = None,
        meeting_settings: Optional[Dict[str, Any]] = None,
        created_by: Optional[int] = None
    ) -> RequirementReviewMeeting:
        """Create a new review meeting with auto-generated meeting number."""
        # 生成会议编号
        meeting_no = self.generate_meeting_no(tenant_id)

        meeting_data = {
            "meeting_no": meeting_no,
            "title": title,
            "description": description,
            "scheduled_at": scheduled_at,
            "moderator_id": moderator_id,
            "status": "scheduled",
            "meeting_settings": meeting_settings or {},
            "created_by": created_by,
            "tenant_id": tenant_id,
        }

        return self.repo.create(meeting_data)

    def generate_meeting_no(self, tenant_id: int) -> str:
        """Generate meeting number: RM-YYYYMMDD-001."""
        today = datetime.now().strftime("%Y%m%d")
        prefix = f"RM-{today}"

        # 查询今天最大的编号
        max_no = self.repo.get_max_meeting_no(tenant_id, prefix)
        next_number = (max_no or 0) + 1
        return f"{prefix}-{next_number:03d}"

    def start_meeting(self, meeting: RequirementReviewMeeting) -> RequirementReviewMeeting:
        """Start a review meeting."""
        if meeting.status != "scheduled":
            raise ValueError("Only scheduled meetings can be started")

        return self.repo.update(meeting, {
            "status": "in_progress",
            "started_at": datetime.now()
        })

    def end_meeting(self, meeting: RequirementReviewMeeting) -> RequirementReviewMeeting:
        """End a review meeting and archive vote results."""
        if meeting.status != "in_progress":
            raise ValueError("Only in-progress meetings can be ended")

        # 更新会议状态
        updated_meeting = self.repo.update(meeting, {
            "status": "completed",
            "ended_at": datetime.now()
        })

        # 存档所有投票结果
        self.repo.archive_meeting_results(meeting.id, meeting.tenant_id)

        return updated_meeting

    # ========================================================================
    # Permission Validation
    # ========================================================================

    def can_vote(self, meeting_id: int, user_id: int, requirement_id: Optional[int] = None) -> bool:
        """Check if user can vote in the meeting.

        规则：
        1. 会议必须进行中
        2. 用户必须是参会人员
        3. 所有参会人员都可以投票（不再限制 assigned_voter_ids）

        注意：已投票检查在API层处理，返回明确的错误消息
        """
        # 检查会议状态（所有用户都必须满足）
        meeting = self.repo.get(meeting_id, get_current_tenant())
        if not meeting or meeting.status != "in_progress":
            return False

        # 获取用户信息
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        # 所有用户（包括 admin）都必须是参会人员
        attendee = self.repo.is_attendee(meeting_id, user_id)
        if not attendee:
            return False

        # 不再检查 assigned_voter_ids，所有参会人员都可以投票
        return True

    def is_moderator(self, meeting: RequirementReviewMeeting, user_id: int) -> bool:
        """Check if user is the meeting moderator."""
        return meeting.moderator_id == user_id

    # ========================================================================
    # Vote Statistics
    # ========================================================================

    def get_vote_statistics(self, meeting_id: int, requirement_id: int) -> Dict[str, Any]:
        """Get vote statistics with percentages (using SQL aggregation)."""
        return self.repo.get_vote_statistics(meeting_id, requirement_id)

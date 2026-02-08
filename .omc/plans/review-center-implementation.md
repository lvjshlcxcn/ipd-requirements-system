# 需求评审中心功能实现计划

## 项目概述

在IPD需求管理系统中增加"需求评审中心"功能，支持评审会议管理、实时投票决策和评审意见记录。

**用户决策**:
- 投票规则：主持人决定权（投票仅供参考）
- 创建权限：所有认证用户都可创建
- 表名：`requirement_review_meetings`（避免与现有Review模型冲突）
- 人员移除：删除该人员的所有投票

**参考设计**: `/Users/kingsun/Desktop/index.html`

**重要架构决策**（基于代码库分析）:
- 后端使用**同步数据库模式**（`Session`，非`AsyncSession`），参考`RequirementRepository`
- 前端路径使用**`pages/`**（非`features/`），保持与现有`ReviewCenterPage`一致
- 认证依赖使用**`get_current_user_sync`**（非`get_current_user`），参考`requirements.py`
- 用户模型**无avatar字段**，头像需通过其他方式处理（如使用username首字母）

---

## 需求总结

### 核心功能
1. **评审会议管理**：创建、编辑、删除、开始/结束会议
2. **参会人员管理**：添加/移除参会人员、指定主持人
3. **待评审需求管理**：添加需求、调整顺序、会议备注
4. **投票决策功能**：支持/反对/弃权三选项、评审意见、允许修改
5. **投票统计展示**：可视化进度条、头像展示、5秒轮询刷新

### 技术约束
- **后端**：Python + FastAPI + SQLAlchemy + PostgreSQL
- **前端**：React + TypeScript + Ant Design + TanStack Query
- **实时方案**：轮询（每5秒）- 第一阶段
- **权限验证**：后端强制验证（不依赖前端）

---

## 验收标准

### 功能验收

- [ ] **会议管理**：
  - 创建会议时自动生成编号 `RM-YYYYMMDD-001`
  - 会议状态流转：scheduled → in_progress → completed/cancelled
  - 仅主持人可以开始/结束会议

- [ ] **参会人员**：
  - 仅参会人员可以投票
  - 移除参会人员时级联删除其投票记录
  - 支持指定/更换主持人

- [ ] **投票功能**：
  - 三种选项：approve/reject/abstain
  - 支持修改已有投票（UPDATE而非INSERT）
  - 投票API幂等性保障

- [ ] **投票统计**：
  - 实时统计支持/反对/弃权的数量和百分比
  - 显示投票人员头像和意见
  - 每5秒自动刷新

- [ ] **权限控制**：
  - 非参会人员投票返回403
  - 租户隔离：只能访问本租户的会议
  - completed状态的会议不可投票

### 性能验收

- [ ] 投票统计查询响应时间 < 500ms（100参会人员 × 50需求）
- [ ] 轮询请求支持HTTP 304缓存
- [ ] 数据库索引覆盖所有高频查询路径

### 安全验收

- [ ] 渗透测试：无法绕过前端权限验证
- [ ] 租户隔离测试：无法跨租户访问会议
- [ ] 并发测试：50人同时投票数据一致性

---

## 实现步骤

### 阶段1：数据库设计（1-2天）

#### 1.1 创建数据模型文件

**文件**：`backend/app/models/requirement_review_meeting.py`
```python
"""Requirement review meeting model."""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey, Text, DateTime, JSON, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.requirement import Requirement


class RequirementReviewMeeting(Base, TimestampMixin, TenantMixin):
    """Requirement review meeting model."""

    __tablename__ = "requirement_review_meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    moderator_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="scheduled", index=True
    )  # scheduled/in_progress/completed/cancelled
    meeting_settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    moderator: Mapped["User"] = relationship("User", foreign_keys=[moderator_id])
    creator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        Index('ix_review_meetings_tenant_status', 'tenant_id', 'status', 'scheduled_at'),
        Index('ix_review_meetings_tenant_moderator', 'tenant_id', 'moderator_id'),
    )
```

**文件**：`backend/app/models/requirement_review_meeting_attendee.py`
```python
"""Requirement review meeting attendee model."""
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.requirement_review_meeting import RequirementReviewMeeting


class RequirementReviewMeetingAttendee(Base, TimestampMixin, TenantMixin):
    """Meeting attendee model."""

    __tablename__ = "requirement_review_meeting_attendees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirement_review_meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attendee_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attendance_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="invited"
    )  # invited/accepted/declined/attended

    # Relationships
    meeting: Mapped["RequirementReviewMeeting"] = relationship("RequirementReviewMeeting", back_populates="attendees")
    attendee: Mapped["User"] = relationship("User")

    __table_args__ = (
        UniqueConstraint('meeting_id', 'attendee_id', name='uq_meeting_attendee'),
        Index('ix_meeting_attendees_tenant_meeting', 'tenant_id', 'meeting_id'),
        Index('ix_meeting_attendees_tenant_user', 'tenant_id', 'attendee_id'),
    )
```

**文件**：`backend/app/models/requirement_review_meeting_requirement.py`
```python
"""Requirement review meeting requirement association model."""
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Integer, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.requirement import Requirement
    from app.models.requirement_review_meeting import RequirementReviewMeeting


class RequirementReviewMeetingRequirement(Base, TimestampMixin, TenantMixin):
    """Meeting to requirement association model."""

    __tablename__ = "requirement_review_meeting_requirements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirement_review_meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requirement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    review_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    meeting_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    meeting: Mapped["RequirementReviewMeeting"] = relationship("RequirementReviewMeeting")
    requirement: Mapped["Requirement"] = relationship("Requirement")

    __table_args__ = (
        UniqueConstraint('meeting_id', 'requirement_id', name='uq_meeting_requirement'),
        Index('ix_meeting_reqs_tenant_meeting', 'tenant_id', 'meeting_id', 'review_order'),
    )
```

**文件**：`backend/app/models/requirement_review_vote.py`
```python
"""Requirement review vote model."""
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.requirement import Requirement
    from app.models.requirement_review_meeting import RequirementReviewMeeting


class RequirementReviewVote(Base, TimestampMixin, TenantMixin):
    """Review vote model."""

    __tablename__ = "requirement_review_votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirement_review_meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requirement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    voter_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vote_option: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # approve/reject/abstain
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    meeting: Mapped["RequirementReviewMeeting"] = relationship("RequirementReviewMeeting")
    requirement: Mapped["Requirement"] = relationship("Requirement")
    voter: Mapped["User"] = relationship("User")

    __table_args__ = (
        UniqueConstraint('meeting_id', 'requirement_id', 'voter_id', name='uq_meeting_requirement_voter'),
        # 关键索引：优化投票统计查询
        Index('ix_review_votes_meeting_req_option', 'meeting_id', 'requirement_id', 'vote_option'),
        Index('ix_review_votes_tenant_meeting', 'tenant_id', 'meeting_id'),
    )
```

**验证**：
```bash
cd backend
alembic revision --autogenerate -m "Add requirement review meeting tables"
alembic upgrade head
psql -d ipd_dev -c "\d requirement_review_meetings"
```

#### 1.2 创建Pydantic Schemas

**文件**：`backend/app/schemas/requirement_review_meeting.py`

定义所有请求/响应模型：
- `RequirementReviewMeetingCreate`
- `RequirementReviewMeetingUpdate`
- `RequirementReviewMeetingResponse`
- `AttendeeCreate`, `AttendeeResponse`
- `MeetingRequirementCreate`, `MeetingRequirementUpdate`, `MeetingRequirementResponse`
- `VoteCreate`, `VoteUpdate`, `VoteResponse`
- `VoteStatisticsResponse`

---

### 阶段2：后端API开发（2-3天）

#### 2.1 创建Repository层

**文件**：`backend/app/repositories/requirement_review_meeting_repository.py`

**重要**：使用**同步数据库模式**（参考`RequirementRepository`）

```python
"""Requirement review meeting repository for data access."""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, and_, or_
from sqlalchemy.exc import IntegrityError

from app.models.requirement_review_meeting import RequirementReviewMeeting
from app.models.requirement_review_meeting_attendee import RequirementReviewMeetingAttendee
from app.models.requirement_review_meeting_requirement import RequirementReviewMeetingRequirement
from app.models.requirement_review_vote import RequirementReviewVote


class RequirementReviewMeetingRepository:
    """Repository for Requirement Review Meeting models."""

    def __init__(self, db: Session):
        self.db = db

    # ========================================================================
    # Meeting CRUD Operations
    # ========================================================================

    def create(self, meeting_data: Dict[str, Any]) -> RequirementReviewMeeting:
        """Create a new review meeting."""
        meeting = RequirementReviewMeeting(**meeting_data)
        self.db.add(meeting)
        self.db.commit()
        self.db.refresh(meeting)
        return meeting

    def get(self, meeting_id: int, tenant_id: int) -> Optional[RequirementReviewMeeting]:
        """Get meeting by ID (tenant-isolated)."""
        return self.db.query(RequirementReviewMeeting).filter(
            RequirementReviewMeeting.id == meeting_id,
            RequirementReviewMeeting.tenant_id == tenant_id
        ).first()

    def get_multi(
        self,
        tenant_id: int,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        date_filter: Optional[str] = None
    ) -> tuple[List[RequirementReviewMeeting], int]:
        """Get meetings with filters (tenant-isolated)."""
        query = self.db.query(RequirementReviewMeeting).filter(
            RequirementReviewMeeting.tenant_id == tenant_id
        )

        if status:
            query = query.filter(RequirementReviewMeeting.status == status)

        if date_filter:
            # Format: "2026-02-03"
            filter_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
            next_day = filter_date + timedelta(days=1)
            query = query.filter(
                RequirementReviewMeeting.scheduled_at >= filter_date,
                RequirementReviewMeeting.scheduled_at < next_day
            )

        total = query.count()
        meetings = query.order_by(desc(RequirementReviewMeeting.scheduled_at)).offset(skip).limit(limit).all()

        return meetings, total

    def update(self, meeting: RequirementReviewMeeting, update_data: Dict[str, Any]) -> RequirementReviewMeeting:
        """Update meeting."""
        for key, value in update_data.items():
            if hasattr(meeting, key):
                setattr(meeting, key, value)
        self.db.commit()
        self.db.refresh(meeting)
        return meeting

    def delete(self, meeting: RequirementReviewMeeting) -> None:
        """Delete meeting (cascade will handle related records)."""
        self.db.delete(meeting)
        self.db.commit()

    def count_by_date(self, tenant_id: int, date_str: str) -> int:
        """Count meetings created on a specific date."""
        filter_date = datetime.strptime(date_str, "%Y%m%d").date()
        next_day = filter_date + timedelta(days=1)
        return self.db.query(RequirementReviewMeeting).filter(
            RequirementReviewMeeting.tenant_id == tenant_id,
            RequirementReviewMeeting.created_at >= filter_date,
            RequirementReviewMeeting.created_at < next_day
        ).count()

    # ========================================================================
    # Attendee Operations
    # ========================================================================

    def add_attendee(
        self,
        meeting_id: int,
        attendee_id: int,
        tenant_id: int,
        status: str = "invited"
    ) -> RequirementReviewMeetingAttendee:
        """Add attendee to meeting."""
        attendee = RequirementReviewMeetingAttendee(
            meeting_id=meeting_id,
            attendee_id=attendee_id,
            tenant_id=tenant_id,
            attendance_status=status
        )
        self.db.add(attendee)
        self.db.commit()
        self.db.refresh(attendee)
        return attendee

    def remove_attendee(self, meeting_id: int, attendee_id: int) -> bool:
        """Remove attendee from meeting (cascade deletes their votes)."""
        attendee = self.db.query(RequirementReviewMeetingAttendee).filter(
            RequirementReviewMeetingAttendee.meeting_id == meeting_id,
            RequirementReviewMeetingAttendee.attendee_id == attendee_id
        ).first()

        if attendee:
            # 先删除该参会人员的投票记录
            self.db.query(RequirementReviewVote).filter(
                RequirementReviewVote.meeting_id == meeting_id,
                RequirementReviewVote.voter_id == attendee_id
            ).delete()

            # 再删除参会人员
            self.db.delete(attendee)
            self.db.commit()
            return True
        return False

    def get_attendees(self, meeting_id: int) -> List[RequirementReviewMeetingAttendee]:
        """Get all attendees for a meeting."""
        return self.db.query(RequirementReviewMeetingAttendee).filter(
            RequirementReviewMeetingAttendee.meeting_id == meeting_id
        ).all()

    def is_attendee(self, meeting_id: int, user_id: int) -> Optional[RequirementReviewMeetingAttendee]:
        """Check if user is an attendee of the meeting."""
        return self.db.query(RequirementReviewMeetingAttendee).filter(
            RequirementReviewMeetingAttendee.meeting_id == meeting_id,
            RequirementReviewMeetingAttendee.attendee_id == user_id,
            RequirementReviewMeetingAttendee.attendance_status.in_(["accepted", "attended"])
        ).first()

    # ========================================================================
    # Meeting Requirement Operations
    # ========================================================================

    def add_requirement(
        self,
        meeting_id: int,
        requirement_id: int,
        tenant_id: int,
        order: int = 0,
        notes: Optional[str] = None
    ) -> RequirementReviewMeetingRequirement:
        """Add requirement to meeting."""
        meeting_req = RequirementReviewMeetingRequirement(
            meeting_id=meeting_id,
            requirement_id=requirement_id,
            tenant_id=tenant_id,
            review_order=order,
            meeting_notes=notes
        )
        self.db.add(meeting_req)
        self.db.commit()
        self.db.refresh(meeting_req)
        return meeting_req

    def remove_requirement(self, meeting_id: int, requirement_id: int) -> bool:
        """Remove requirement from meeting (cascade deletes related votes)."""
        meeting_req = self.db.query(RequirementReviewMeetingRequirement).filter(
            RequirementReviewMeetingRequirement.meeting_id == meeting_id,
            RequirementReviewMeetingRequirement.requirement_id == requirement_id
        ).first()

        if meeting_req:
            # 投票记录会通过数据库级联删除自动处理
            self.db.delete(meeting_req)
            self.db.commit()
            return True
        return False

    def update_requirement_order(
        self,
        meeting_id: int,
        requirement_id: int,
        new_order: int
    ) -> bool:
        """Update requirement review order."""
        meeting_req = self.db.query(RequirementReviewMeetingRequirement).filter(
            RequirementReviewMeetingRequirement.meeting_id == meeting_id,
            RequirementReviewMeetingRequirement.requirement_id == requirement_id
        ).first()

        if meeting_req:
            meeting_req.review_order = new_order
            self.db.commit()
            return True
        return False

    def get_requirements(self, meeting_id: int) -> List[RequirementReviewMeetingRequirement]:
        """Get all requirements for a meeting (ordered by review_order)."""
        return self.db.query(RequirementReviewMeetingRequirement).filter(
            RequirementReviewMeetingRequirement.meeting_id == meeting_id
        ).order_by(RequirementReviewMeetingRequirement.review_order).all()

    # ========================================================================
    # Vote Operations (with Upsert)
    # ========================================================================

    def cast_vote(
        self,
        meeting_id: int,
        requirement_id: int,
        voter_id: int,
        tenant_id: int,
        vote_option: str,
        comment: Optional[str] = None
    ) -> RequirementReviewVote:
        """Cast or update a vote (upsert using database constraint)."""

        # 使用原生SQL实现ON CONFLICT DO UPDATE（PostgreSQL语法）
        from sqlalchemy import text

        sql = text("""
            INSERT INTO requirement_review_votes
                (meeting_id, requirement_id, voter_id, tenant_id, vote_option, comment, created_at, updated_at)
            VALUES
                (:meeting_id, :requirement_id, :voter_id, :tenant_id, :vote_option, :comment, NOW(), NOW())
            ON CONFLICT (meeting_id, requirement_id, voter_id)
            DO UPDATE SET
                vote_option = EXCLUDED.vote_option,
                comment = EXCLUDED.comment,
                updated_at = NOW()
            RETURNING *
        """)

        result = self.db.execute(sql, {
            "meeting_id": meeting_id,
            "requirement_id": requirement_id,
            "voter_id": voter_id,
            "tenant_id": tenant_id,
            "vote_option": vote_option,
            "comment": comment
        })

        self.db.commit()

        # 获取插入/更新的记录
        row = result.fetchone()
        vote = RequirementReviewVote(
            id=row[0],
            meeting_id=row[1],
            requirement_id=row[2],
            voter_id=row[3],
            tenant_id=row[4],
            vote_option=row[5],
            comment=row[6],
            created_at=row[7],
            updated_at=row[8]
        )

        return vote

    def get_votes(self, meeting_id: int, requirement_id: int) -> List[RequirementReviewVote]:
        """Get all votes for a specific meeting requirement."""
        return self.db.query(RequirementReviewVote).filter(
            RequirementReviewVote.meeting_id == meeting_id,
            RequirementReviewVote.requirement_id == requirement_id
        ).all()

    def get_vote_statistics(
        self,
        meeting_id: int,
        requirement_id: int
    ) -> Dict[str, Any]:
        """Get aggregated vote statistics using SQL GROUP BY."""

        # 使用SQL聚合查询（避免N+1问题）
        from sqlalchemy import text

        sql = text("""
            SELECT
                vote_option,
                COUNT(*) as count,
                json_agg(json_build_object(
                    'voter_id', voter_id,
                    'comment', comment
                )) as votes
            FROM requirement_review_votes
            WHERE meeting_id = :meeting_id AND requirement_id = :requirement_id
            GROUP BY vote_option
        """)

        result = self.db.execute(sql, {
            "meeting_id": meeting_id,
            "requirement_id": requirement_id
        })

        stats = {
            "approve": {"count": 0, "percentage": 0.0, "votes": []},
            "reject": {"count": 0, "percentage": 0.0, "votes": []},
            "abstain": {"count": 0, "percentage": 0.0, "votes": []},
        }

        total_votes = 0
        for row in result:
            vote_option = row[0]
            count = row[1]
            votes_data = row[2]  # JSON array

            total_votes += count
            stats[vote_option]["count"] = count
            stats[vote_option]["votes"] = votes_data if votes_data else []

        # 计算百分比
        if total_votes > 0:
            for option in stats.values():
                option["percentage"] = round(option["count"] * 100.0 / total_votes, 1)

        return stats

    def get_user_vote(
        self,
        meeting_id: int,
        requirement_id: int,
        user_id: int
    ) -> Optional[RequirementReviewVote]:
        """Get a specific user's vote for a requirement."""
        return self.db.query(RequirementReviewVote).filter(
            RequirementReviewVote.meeting_id == meeting_id,
            RequirementReviewVote.requirement_id == requirement_id,
            RequirementReviewVote.voter_id == user_id
        ).first()
```

#### 2.2 创建Service层

**文件**：`backend/app/services/requirement_review_meeting_service.py`

**重要**：使用**同步Service模式**（参考`RequirementService`）

```python
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
        description: Optional[str] = None,
        meeting_settings: Optional[Dict[str, Any]] = None,
        created_by: Optional[int] = None
    ) -> RequirementReviewMeeting:
        """Create a new review meeting with auto-generated meeting number."""
        tenant_id = get_current_tenant()

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

        # 使用数据库锁确保原子性
        count = self.repo.count_by_date(tenant_id, today)
        return f"{prefix}-{count + 1:03d}"

    def start_meeting(self, meeting: RequirementReviewMeeting) -> RequirementReviewMeeting:
        """Start a review meeting."""
        if meeting.status != "scheduled":
            raise ValueError("Only scheduled meetings can be started")

        return self.repo.update(meeting, {
            "status": "in_progress",
            "started_at": datetime.now()
        })

    def end_meeting(self, meeting: RequirementReviewMeeting) -> RequirementReviewMeeting:
        """End a review meeting."""
        if meeting.status != "in_progress":
            raise ValueError("Only in-progress meetings can be ended")

        return self.repo.update(meeting, {
            "status": "completed",
            "ended_at": datetime.now()
        })

    # ========================================================================
    # Permission Validation
    # ========================================================================

    def can_vote(self, meeting_id: int, user_id: int) -> bool:
        """Check if user can vote in the meeting."""
        # 检查是否是参会人员
        attendee = self.repo.is_attendee(meeting_id, user_id)
        if not attendee:
            return False

        # 检查会议状态
        meeting = self.repo.get(meeting_id, get_current_tenant())
        if not meeting or meeting.status != "in_progress":
            return False

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
```

#### 2.3 创建API路由

**文件**：`backend/app/api/v1/requirement_review_meetings.py`

**重要**：
- 使用**同步数据库Session**（参考`requirements.py`）
- 使用**`get_current_user_sync`**认证依赖（参考`requirements.py`）
- 路由处理器使用**`async def`**（FastAPI要求）

```python
"""Requirement review meeting API endpoints."""
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user_sync, get_tenant_id
from app.services.requirement_review_meeting import RequirementReviewMeetingService
from app.repositories.requirement_review_meeting import RequirementReviewMeetingRepository
from app.schemas.requirement_review_meeting import (
    MeetingCreate,
    MeetingUpdate,
    MeetingResponse,
    MeetingListResponse,
    AttendeeCreate,
    AttendeeResponse,
    MeetingRequirementCreate,
    MeetingRequirementUpdate,
    MeetingRequirementResponse,
    VoteCreate,
    VoteResponse,
    VoteStatisticsResponse,
    MessageResponse,
)

router = APIRouter(prefix="/requirement-review-meetings", tags=["Requirement Review Meetings"])


def get_service(db: Session = Depends(get_db)) -> RequirementReviewMeetingService:
    """Get service instance."""
    return RequirementReviewMeetingService(db)


def get_repository(db: Session = Depends(get_db)) -> RequirementReviewMeetingRepository:
    """Get repository instance."""
    return RequirementReviewMeetingRepository(db)


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
            "items": [MeetingResponse.model_validate(m) for m in meetings],
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
    meeting = service.create_meeting(
        title=meeting_in.title,
        scheduled_at=meeting_in.scheduled_at,
        moderator_id=meeting_in.moderator_id,
        description=meeting_in.description,
        meeting_settings=meeting_in.meeting_settings,
        created_by=current_user.id if current_user else None
    )

    return MeetingResponse(
        success=True,
        message="会议创建成功",
        data=MeetingResponse.model_validate(meeting)
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
        data=MeetingResponse.model_validate(meeting)
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
        data=MeetingResponse.model_validate(updated_meeting)
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
            data=MeetingResponse.model_validate(updated_meeting)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{meeting_id}/end", response_model=MeetingResponse)
async def end_meeting(
    meeting_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    service: RequirementReviewMeetingService = Depends(get_service),
):
    """End a review meeting (only moderator can end)."""
    tenant_id = get_tenant_id(current_user)
    meeting = service.repo.get(meeting_id, tenant_id)

    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    if not service.is_moderator(meeting, current_user.id):
        raise HTTPException(status_code=403, detail="只有主持人可以结束会议")

    try:
        updated_meeting = service.end_meeting(meeting)
        return MeetingResponse(
            success=True,
            message="会议已结束",
            data=MeetingResponse.model_validate(updated_meeting)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ========================================================================
# Attendee Endpoints
# ========================================================================

@router.get("/{meeting_id}/attendees", response_model=List[AttendeeResponse])
async def get_attendees(
    meeting_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Get all attendees for a meeting."""
    attendees = repo.get_attendees(meeting_id)
    return [AttendeeResponse.model_validate(a) for a in attendees]


@router.post("/{meeting_id}/attendees", response_model=AttendeeResponse)
async def add_attendee(
    meeting_id: int,
    attendee_in: AttendeeCreate,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Add an attendee to the meeting."""
    tenant_id = get_tenant_id(current_user)

    # 验证会议存在
    meeting = repo.get(meeting_id, tenant_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="会议不存在")

    attendee = repo.add_attendee(
        meeting_id=meeting_id,
        attendee_id=attendee_in.attendee_id,
        tenant_id=tenant_id,
        status=attendee_in.attendance_status or "invited"
    )

    return AttendeeResponse(
        success=True,
        message="参会人员添加成功",
        data=AttendeeResponse.model_validate(attendee)
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

@router.get("/{meeting_id}/requirements", response_model=List[MeetingRequirementResponse])
async def get_meeting_requirements(
    meeting_id: int,
    current_user: Optional[User] = Depends(get_current_user_sync),
    repo: RequirementReviewMeetingRepository = Depends(get_repository),
):
    """Get all requirements for a meeting (ordered by review_order)."""
    requirements = repo.get_requirements(meeting_id)
    return [MeetingRequirementResponse.model_validate(r) for r in requirements]


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

    # 获取当前最大的order值
    requirements = repo.get_requirements(meeting_id)
    max_order = max([r.review_order for r in requirements], default=0)

    meeting_req = repo.add_requirement(
        meeting_id=meeting_id,
        requirement_id=req_in.requirement_id,
        tenant_id=tenant_id,
        order=max_order + 1,
        notes=req_in.meeting_notes
    )

    return MeetingRequirementResponse(
        success=True,
        message="需求已添加到会议",
        data=MeetingRequirementResponse.model_validate(meeting_req)
    )


@router.put("/{meeting_id}/requirements/{requirement_id}", response_model=MeetingRequirementResponse)
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
    Cast or update a vote (upsert).

    **Permission**: Only attendees can vote.
    **Meeting Status**: Only in-progress meetings accept votes.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="需要登录才能投票")

    # 权限验证
    if not service.can_vote(meeting_id, current_user.id):
        raise HTTPException(status_code=403, detail="您没有投票权限（非参会人员或会议未进行中）")

    # 投票（使用UPSERT，自动处理新增或修改）
    tenant_id = get_tenant_id(current_user)
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
        data=VoteResponse.model_validate(vote)
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
        data=VoteResponse.model_validate(vote)
    )
```

#### 2.4 注册路由

**文件**：`backend/app/main.py`

**步骤1**：添加import
```python
# 在现有的from app.api.v1 import ... 导入列表中添加：
from app.api.v1 import (
    auth, requirements, notifications, analysis, tenant, import_export,
    verification, appeals, distribution, rtm, attachments, insights,
    prompt_templates, rice, invest, ipd_story, hello,
    requirement_review_meetings,  # 新增
)
```

**步骤2**：注册路由
```python
# 在现有的app.include_router()调用后添加：
app.include_router(
    requirement_review_meetings.router,
    prefix=settings.API_V1_PREFIX,
)
```

**验证**：
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# 访问 http://localhost:8000/docs 测试所有端点
# 应该看到 "Requirement Review Meetings" 标签组
```

---

### 阶段3：前端基础（1天）

#### 3.1 创建类型定义

**文件**：`frontend/src/types/requirement-review-meeting.ts`
```typescript
/** 需求评审会议相关类型定义 */

export interface RequirementReviewMeeting {
  id: number;
  meeting_no: string;
  title: string;
  description?: string;
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  moderator_id: number;
  moderator?: User;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meeting_settings: Record<string, any>;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface MeetingAttendee {
  id: number;
  meeting_id: number;
  attendee_id: number;
  attendance_status: 'invited' | 'accepted' | 'declined' | 'attended';
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface MeetingRequirement {
  id: number;
  meeting_id: number;
  requirement_id: number;
  review_order: number;
  meeting_notes?: string;
  requirement?: Requirement;
  created_at: string;
  updated_at: string;
}

export interface ReviewVote {
  id: number;
  meeting_id: number;
  requirement_id: number;
  voter_id: number;
  vote_option: 'approve' | 'reject' | 'abstain';
  comment?: string;
  voter?: User;
  created_at: string;
  updated_at: string;
}

export interface VoteStatistics {
  approve: VoteOptionStats;
  reject: VoteOptionStats;
  abstain: VoteOptionStats;
}

export interface VoteOptionStats {
  count: number;
  percentage: number;
  votes: VoteInfo[];
}

export interface VoteInfo {
  voter_id: number;
  comment?: string;
}

// 简化的User接口（后端User模型无avatar字段）
export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
}

// 简化的Requirement接口
export interface Requirement {
  id: number;
  requirement_no: string;
  title: string;
  description?: string;
  status: string;
}

// API请求/响应类型
export interface MeetingCreate {
  title: string;
  description?: string;
  scheduled_at: string;
  moderator_id: number;
  meeting_settings?: Record<string, any>;
}

export interface MeetingUpdate {
  title?: string;
  description?: string;
  scheduled_at?: string;
  moderator_id?: number;
  status?: string;
  meeting_settings?: Record<string, any>;
}

export interface AttendeeCreate {
  attendee_id: number;
  attendance_status?: 'invited' | 'accepted' | 'declined' | 'attended';
}

export interface MeetingRequirementCreate {
  requirement_id: number;
  meeting_notes?: string;
}

export interface VoteCreate {
  vote_option: 'approve' | 'reject' | 'abstain';
  comment?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
```

#### 3.2 创建API服务

**文件**：`frontend/src/services/requirementReviewMeeting.service.ts`

```typescript
/**
 * Requirement Review Meeting API Service
 *
 * 所有API调用返回 ApiResponse<T> 格式
 * api instance 会自动解包 axios response，直接返回 response.data
 */
import api from './api'
import type {
  RequirementReviewMeeting,
  MeetingAttendee,
  MeetingRequirement,
  ReviewVote,
  VoteStatistics,
  MeetingCreate,
  MeetingUpdate,
  AttendeeCreate,
  MeetingRequirementCreate,
  VoteCreate,
  PaginatedResponse,
  ApiResponse,
} from '@/types/requirement-review-meeting'

export const requirementReviewMeetingService = {
  // ========================================================================
  // 会议管理
  // ========================================================================

  getMeetings(params?: {
    page?: number
    page_size?: number
    status?: string
    date_filter?: string
  }) {
    return api.get<ApiResponse<{ items: RequirementReviewMeeting[] } & PaginatedResponse<RequirementReviewMeeting>>>(
      '/requirement-review-meetings',
      { params }
    )
  },

  getMeeting(id: number) {
    return api.get<ApiResponse<RequirementReviewMeeting>>(`/requirement-review-meetings/${id}`)
  },

  createMeeting(data: MeetingCreate) {
    return api.post<ApiResponse<RequirementReviewMeeting>>('/requirement-review-meetings', data)
  },

  updateMeeting(id: number, data: MeetingUpdate) {
    return api.put<ApiResponse<RequirementReviewMeeting>>(`/requirement-review-meetings/${id}`, data)
  },

  deleteMeeting(id: number) {
    return api.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/requirement-review-meetings/${id}`
    )
  },

  // ========================================================================
  // 会议控制
  // ========================================================================

  startMeeting(id: number) {
    return api.post<ApiResponse<RequirementReviewMeeting>>(
      `/requirement-review-meetings/${id}/start`
    )
  },

  endMeeting(id: number) {
    return api.post<ApiResponse<RequirementReviewMeeting>>(
      `/requirement-review-meetings/${id}/end`
    )
  },

  // ========================================================================
  // 参会人员
  // ========================================================================

  getAttendees(meetingId: number) {
    return api.get<MeetingAttendee[]>(
      `/requirement-review-meetings/${meetingId}/attendees`
    )
  },

  addAttendee(meetingId: number, data: AttendeeCreate) {
    return api.post<ApiResponse<MeetingAttendee>>(
      `/requirement-review-meetings/${meetingId}/attendees`,
      data
    )
  },

  removeAttendee(meetingId: number, attendeeId: number) {
    return api.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/requirement-review-meetings/${meetingId}/attendees/${attendeeId}`
    )
  },

  // ========================================================================
  // 会议需求
  // ========================================================================

  getRequirements(meetingId: number) {
    return api.get<MeetingRequirement[]>(
      `/requirement-review-meetings/${meetingId}/requirements`
    )
  },

  addRequirement(meetingId: number, data: MeetingRequirementCreate) {
    return api.post<ApiResponse<MeetingRequirement>>(
      `/requirement-review-meetings/${meetingId}/requirements`,
      data
    )
  },

  updateRequirement(meetingId: number, requirementId: number, data: { review_order?: number; meeting_notes?: string }) {
    return api.put<ApiResponse<MeetingRequirement>>(
      `/requirement-review-meetings/${meetingId}/requirements/${requirementId}`,
      data
    )
  },

  removeRequirement(meetingId: number, requirementId: number) {
    return api.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/requirement-review-meetings/${meetingId}/requirements/${requirementId}`
    )
  },

  // ========================================================================
  // 投票功能
  // ========================================================================

  castVote(meetingId: number, requirementId: number, data: VoteCreate) {
    return api.post<ApiResponse<ReviewVote>>(
      `/requirement-review-meetings/${meetingId}/requirements/${requirementId}/vote`,
      data
    )
  },

  getVotes(meetingId: number, requirementId: number) {
    return api.get<ApiResponse<VoteStatistics>>(
      `/requirement-review-meetings/${meetingId}/requirements/${requirementId}/votes`
    )
  },

  getMyVote(meetingId: number, requirementId: number) {
    return api.get<ApiResponse<ReviewVote>>(
      `/requirement-review-meetings/${meetingId}/requirements/${requirementId}/my-vote`
    )
  },
}
```

#### 3.3 添加路由配置

**文件**：`frontend/src/router/routes.ts`

**重要**：
- 使用**`@/pages/`**路径（与现有ReviewCenterPage一致）
- ReviewCenterPage已存在，只需添加详情页路由

```typescript
// 在现有的lazy imports中添加（ReviewCenterPage已存在，只需添加详情页）
const ReviewMeetingDetailPage = lazy(() =>
  import('@/pages/review-center/ReviewMeetingDetailPage').then(m => ({
    default: m.ReviewMeetingDetailPage
  }))
)

// 在routeConfigs数组中添加详情页路由
// ReviewCenterPage路由已存在（line ~20），只需在其后添加：
{
  path: '/review-center/:id',
  element: ReviewMeetingDetailPage,
  title: '会议详情',
  requireAuth: true,
}
```

**验证**：
```bash
cd frontend
npm run type-check
# 应该无TypeScript错误
```

---

### 阶段4：前端页面开发（3-4天）

#### 4.1 创建目录结构

**重要**：使用**`pages/`**而非`features/`（与现有ReviewCenterPage一致）

```bash
frontend/src/pages/review-center/
├── ReviewCenterPage.tsx          # 已存在，需要修改
├── ReviewMeetingDetailPage.tsx   # 新建
├── components/                   # 新建目录
│   ├── MeetingInfoCard.tsx
│   ├── RequirementListPanel.tsx
│   ├── VotePanel.tsx
│   └── VoteStatisticsPanel.tsx
└── CreateMeetingModal.tsx        # 新建（创建会议弹窗）
```

#### 4.2 评审中心列表页

**文件**：`frontend/src/pages/review-center/ReviewCenterPage.tsx`

**注意**：该文件已存在（占位页面），需要完整重写

**功能**：
- 显示所有会议卡片
- 状态筛选（全部/进行中/已完成/已取消）
- 创建新会议按钮
- 点击卡片进入详情

**关键代码**：
```tsx
export const ReviewCenterPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: meetings, isLoading } = useQuery({
    queryKey: ['review-meetings', statusFilter],
    queryFn: () => requirementReviewMeetingService.getMeetings({
      status: statusFilter === 'all' ? undefined : statusFilter
    }),
    refetchInterval: 5000 // 5秒轮询
  });

  return (
    <div className="review-center-page">
      <div className="page-header">
        <h2>需求评审中心</h2>
        <Button type="primary" icon={<PlusOutlined />}>
          创建会议
        </Button>
      </div>
      <Segmented
        options={['全部', '进行中', '已完成', '已取消']}
        value={statusFilter}
        onChange={setStatusFilter}
      />
      <Row gutter={[16, 16]}>
        {meetings?.data.map(meeting => (
          <Col key={meeting.id} xs={24} sm={12} md={8} lg={6}>
            <MeetingCard meeting={meeting} />
          </Col>
        ))}
      </Row>
    </div>
  );
};
```

#### 4.3 会议详情页

**文件**：`frontend/src/features/review-center/pages/ReviewMeetingDetailPage.tsx`

**布局结构**：
```
┌─────────────────────────────────────────────────────────┐
│                    MeetingInfoCard                       │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│  RequirementList     │       VotePanel                  │
│      Panel           │                                  │
│                      │       VoteStatistics             │
│                      │          Panel                   │
└──────────────────────┴──────────────────────────────────┘
```

**关键代码**：
```tsx
export const ReviewMeetingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedRequirementId, setSelectedRequirementId] = useState<number>();

  const { data: meeting } = useQuery({
    queryKey: ['review-meeting', id],
    queryFn: () => requirementReviewMeetingService.getMeeting(Number(id))
  });

  const { data: requirements } = useQuery({
    queryKey: ['meeting-requirements', id],
    queryFn: () => requirementReviewMeetingService.getRequirements(Number(id)),
    refetchInterval: 5000
  });

  return (
    <div className="meeting-detail-page">
      <MeetingInfoCard meeting={meeting} />
      <Row gutter={16}>
        <Col span={12}>
          <RequirementListPanel
            requirements={requirements}
            selectedId={selectedRequirementId}
            onSelect={setSelectedRequirementId}
          />
        </Col>
        <Col span={12}>
          {selectedRequirementId && (
            <>
              <VotePanel
                meetingId={Number(id)}
                requirementId={selectedRequirementId}
              />
              <VoteStatisticsPanel
                meetingId={Number(id)}
                requirementId={selectedRequirementId}
              />
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};
```

#### 4.4 会议信息卡片

**文件**：`frontend/src/features/review-center/components/MeetingInfoCard.tsx`

**UI**：
```tsx
<Card>
  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    <div className="meeting-header">
      <Tag color={statusColor}>{meeting.status}</Tag>
      <Title level={4}>{meeting.title}</Title>
    </div>
    <Descriptions column={2} size="small">
      <Descriptions.Item label="会议编号">{meeting.meeting_no}</Descriptions.Item>
      <Descriptions.Item label="主持人">{moderator?.name}</Descriptions.Item>
      <Descriptions.Item label="会议时间">
        {dayjs(meeting.scheduled_at).format('YYYY-MM-DD HH:mm')}
      </Descriptions.Item>
      <Descriptions.Item label="参会人数">
        {attendees?.length}人
      </Descriptions.Item>
    </Descriptions>
    <Avatar.Group>
      {attendees?.map(attendee => (
        <Tooltip key={attendee.id} title={attendee.user?.name}>
          <Avatar src={attendee.user?.avatar} />
        </Tooltip>
      ))}
    </Avatar.Group>
    {meeting.status === 'in_progress' && (
      <Button type="primary" danger onClick={handleEndMeeting}>
        结束会议
      </Button>
    )}
  </Space>
</Card>
```

#### 4.5 需求列表面板

**文件**：`frontend/src/features/review-center/components/RequirementListPanel.tsx`

**功能**：
- 显示待评审需求列表
- 高亮选中需求
- 显示投票状态标记
- 支持拖拽排序（可选）

#### 4.6 投票面板

**文件**：`frontend/src/features/review-center/components/VotePanel.tsx`

**功能**：
- 三个投票按钮
- 评审意见输入框
- 提交/修改投票
- 投票成功Toast提示

**关键代码**：
```tsx
const VotePanel: React.FC<VotePanelProps> = ({ meetingId, requirementId }) => {
  const [voteOption, setVoteOption] = useState<'approve' | 'reject' | 'abstain'>();
  const [comment, setComment] = useState('');

  const { data: myVote } = useQuery({
    queryKey: ['my-vote', meetingId, requirementId],
    queryFn: () => requirementReviewMeetingService.getMyVote(meetingId, requirementId)
  });

  const castVoteMutation = useMutation({
    mutationFn: () =>
      requirementReviewMeetingService.castVote(meetingId, requirementId, voteOption!, comment),
    onSuccess: () => {
      message.success('投票成功');
      queryClient.invalidateQueries(['vote-stats', meetingId, requirementId]);
    }
  });

  useEffect(() => {
    if (myVote) {
      setVoteOption(myVote.vote_option);
      setComment(myVote.comment || '');
    }
  }, [myVote]);

  return (
    <Card title="投票决策">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button.Group size="large">
          <Button
            type={voteOption === 'approve' ? 'primary' : 'default'}
            icon={<CheckCircleOutlined />}
            onClick={() => setVoteOption('approve')}
          >
            支持通过
          </Button>
          <Button
            type={voteOption === 'reject' ? 'primary' : 'default'}
            icon={<CloseCircleOutlined />}
            danger
            onClick={() => setVoteOption('reject')}
          >
            反对拒绝
          </Button>
          <Button
            type={voteOption === 'abstain' ? 'primary' : 'default'}
            icon={<MinusCircleOutlined />}
            onClick={() => setVoteOption('abstain')}
          >
            弃权
          </Button>
        </Button.Group>
        <TextArea
          placeholder="请输入评审意见..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
        />
        <Button
          type="primary"
          size="large"
          block
          onClick={() => castVoteMutation.mutate()}
          loading={castVoteMutation.isLoading}
        >
          {myVote ? '修改投票' : '提交投票'}
        </Button>
      </Space>
    </Card>
  );
};
```

#### 4.7 投票统计面板

**文件**：`frontend/src/pages/review-center/components/VoteStatisticsPanel.tsx`

**功能**：
- 可视化进度条（支持/反对/弃权百分比）
- 投票人员头像和意见展示
- 5秒自动刷新

**重要**：User模型无avatar字段，使用username首字母作为头像

**关键代码**：
```tsx
import { Card, Space, Typography, Progress, Avatar, Tooltip, Row, Col } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { requirementReviewMeetingService } from '@/services/requirementReviewMeeting.service'
import type { VoteStatisticsPanelProps } from '../types'

const { Text } = Typography

// 辅助函数：从username生成头像（首字母）
const getUserAvatar = (username?: string, fullName?: string): string => {
  const name = fullName || username || 'U'
  return name.charAt(0).toUpperCase()
}

// 辅助函数：生成头像颜色（基于用户名hash）
const getAvatarColor = (username?: string): string => {
  if (!username) return '#d9d9d9'
  const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#1890ff']
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export const VoteStatisticsPanel: React.FC<VoteStatisticsPanelProps> = ({ meetingId, requirementId }) => {
  const { data: response, isLoading } = useQuery({
    queryKey: ['vote-stats', meetingId, requirementId],
    queryFn: () => requirementReviewMeetingService.getVotes(meetingId, requirementId),
    refetchInterval: 5000, // 5秒轮询
  })

  const stats = response?.data

  if (isLoading) {
    return <Card loading title="投票统计" />
  }

  if (!stats) {
    return <Card title="投票统计"><Text type="secondary">暂无投票数据</Text></Card>
  }

  return (
    <Card title="投票统计">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 支持 */}
        <VoteSection
          title="支持"
          count={stats.approve.count}
          percentage={stats.approve.percentage}
          votes={stats.approve.votes}
          color="#52c41a"
        />

        {/* 反对 */}
        <VoteSection
          title="反对"
          count={stats.reject.count}
          percentage={stats.reject.percentage}
          votes={stats.reject.votes}
          color="#ff4d4f"
        />

        {/* 弃权 */}
        <VoteSection
          title="弃权"
          count={stats.abstain.count}
          percentage={stats.abstain.percentage}
          votes={stats.abstain.votes}
          color="#d9d9d9"
        />
      </Space>
    </Card>
  )
}

// 子组件：投票选项展示
interface VoteSectionProps {
  title: string
  count: number
  percentage: number
  votes: Array<{ voter_id: number; comment?: string }>
  color: string
}

const VoteSection: React.FC<VoteSectionProps> = ({ title, count, percentage, votes, color }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text strong>{title} ({count})</Text>
        <Text type="secondary">{percentage}%</Text>
      </div>
      <Progress
        percent={percentage}
        strokeColor={color}
        showInfo={false}
        size="small"
      />
      {votes.length > 0 && (
        <Avatar.Group maxCount={5} size="small" style={{ marginTop: 8 }}>
          {votes.map((vote, index) => (
            <Tooltip key={`${vote.voter_id}-${index}`} title={vote.comment || '无意见'}>
              <Avatar
                style={{ backgroundColor: getAvatarColor(vote.voter_id?.toString()) }}
              >
                {getUserAvatar(vote.voter_id?.toString())}
              </Avatar>
            </Tooltip>
          ))}
        </Avatar.Group>
      )}
    </div>
  )
}
```

**types文件**：`frontend/src/pages/review-center/types.ts`
```typescript
export interface VoteStatisticsPanelProps {
  meetingId: number
  requirementId: number
}

export interface VotePanelProps {
  meetingId: number
  requirementId: number
}
```

#### 4.8 创建会议弹窗

**文件**：`frontend/src/pages/review-center/CreateMeetingModal.tsx`

**重要**：这是实现"创建会议"功能的关键组件

**功能**：
- 表单：标题、描述、会议时间、主持人选择
- 参会人员多选
- 待评审需求多选
- 表单验证

**关键代码**：
```tsx
import { Modal, Form, Input, DatePicker, Select, Button, message, Row, Col } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { requirementReviewMeetingService } from '@/services/requirementReviewMeeting.service'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

interface CreateMeetingModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
  users: Array<{ id: number; username: string; full_name?: string }>
  requirements: Array<{ id: number; requirement_no: string; title: string }>
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  users,
  requirements,
}) => {
  const [form] = Form.useForm()

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      requirementReviewMeetingService.createMeeting({
        title: data.title,
        description: data.description,
        scheduled_at: data.scheduled_at.toISOString(),
        moderator_id: data.moderator_id,
        meeting_settings: {},
      }),
    onSuccess: () => {
      message.success('会议创建成功')
      form.resetFields()
      onSuccess()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '创建失败')
    },
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      createMutation.mutate(values)
    } catch (error) {
      // 表单验证失败
    }
  }

  return (
    <Modal
      title="创建评审会议"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={createMutation.isLoading}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="会议标题"
          name="title"
          rules={[{ required: true, message: '请输入会议标题' }]}
        >
          <Input placeholder="例如：2026年2月需求评审会议" />
        </Form.Item>

        <Form.Item
          label="会议描述"
          name="description"
        >
          <TextArea rows={3} placeholder="会议主题、目标等（可选）" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="会议时间"
              name="scheduled_at"
              rules={[{ required: true, message: '请选择会议时间' }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: '100%' }}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="主持人"
              name="moderator_id"
              rules={[{ required: true, message: '请选择主持人' }]}
            >
              <Select placeholder="选择主持人">
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.full_name || user.username}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* TODO: 参会人员选择（需要单独的API调用来添加） */}
        {/* TODO: 待评审需求选择（需要单独的API调用来添加） */}
      </Form>
    </Modal>
  )
}
```

**注意**：参会人员和需求的添加可以在创建会议后通过详情页进行，或者在此Modal中添加多选器并在创建成功后批量调用添加API。

---

### 阶段5：集成和优化（1-2天）

#### 5.1 权限验证集成

**前端验证**：
```typescript
// 在VotePanel中添加
const { data: currentUser } = useQuery({
  queryKey: ['current-user'],
  queryFn: () => userService.getProfile()
});

const { data: attendees } = useQuery({
  queryKey: ['meeting-attendees', meetingId],
  queryFn: () => requirementReviewMeetingService.getAttendees(meetingId)
});

const canVote = useMemo(() => {
  if (!currentUser || !attendees) return false;
  return attendees.some(a => a.attendee_id === currentUser.id);
}, [currentUser, attendees]);

if (!canVote) {
  return <Alert message="您不是参会人员，无法投票" type="warning" />;
}
```

**后端验证（强制）**：
```python
# 所有投票相关端点都添加
@router.post("/{id}/requirements/{rid}/vote")
async def cast_vote(...):
    # 验证用户是否在参会人员列表
    attendee = await repository.is_attendee(db, id, current_user.id)
    if not attendee:
        raise HTTPException(status_code=403, detail="Not an attendee")

    # 验证会议状态
    meeting = await repository.get(db, id)
    if meeting.status != "in_progress":
        raise HTTPException(status_code=400, detail="Meeting not in progress")
```

#### 5.2 错误处理优化

**统一错误处理**：
```typescript
// frontend/src/services/requirementReviewMeeting.service.ts
export const requirementReviewMeetingService = {
  castVote: async (meetingId, requirementId, voteOption, comment) => {
    try {
      const response = await api.post(`/requirement-review-meetings/${meetingId}/requirements/${requirementId}/vote`, {
        vote_option: voteOption,
        comment
      });
      message.success('投票成功');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          message.error('您没有投票权限');
        } else if (error.response?.status === 400) {
          message.error(error.response.data.detail);
        }
      }
      throw error;
    }
  }
};
```

#### 5.3 性能优化

**数据库索引**：
```python
# 在迁移文件中添加
op.create_index(
    'ix_review_votes_meeting_req',
    'requirement_review_votes',
    ['meeting_id', 'requirement_id', 'vote_option']
)
```

**HTTP缓存优化**：
```python
from fastapi.responses import Response

@router.get("/{id}/requirements/{rid}/votes")
async def get_votes(id: int, rid: int, db: AsyncSession = Depends(get_db)):
    stats = await service.get_vote_statistics(db, id, rid)
    # 生成ETag用于HTTP缓存
    etag = hashlib.md5(json.dumps(stats).encode()).hexdigest()
    return Response(
        content=json.dumps(stats),
        media_type="application/json",
        headers={"ETag": etag}
    )
```

#### 5.4 样式优化

**确保UI一致性**：
- 使用Ant Design主题变量
- 遵循现有设计规范
- 响应式布局（移动端适配）

---

### 阶段6：测试和文档（1天）

#### 6.1 后端单元测试

**文件**：`backend/tests/test_requirement_review_meeting.py`

```python
def test_generate_meeting_no(db):
    # 测试会议编号生成
    meeting_no = service.generate_meeting_no(db, tenant_id=1)
    assert meeting_no.startswith("RM-")
    assert len(meeting_no) == 15  # RM-20260203-001

def test_cast_vote(db):
    # 测试投票功能
    vote = service.cast_vote(db, meeting_id=1, requirement_id=1, voter_id=1, vote_option="approve")
    assert vote.vote_option == "approve"

def test_can_vote_permission(db):
    # 测试权限验证
    result = service.can_vote(db, meeting_id=1, user_id=999)  # 非参会人员
    assert result == False

def test_vote_statistics(db):
    # 测试投票统计
    stats = service.get_vote_statistics(db, meeting_id=1, requirement_id=1)
    assert stats['approve']['count'] + stats['reject']['count'] + stats['abstain']['count'] > 0
    assert abs(stats['approve']['percentage'] + stats['reject']['percentage'] + stats['abstain']['percentage'] - 100) < 0.1
```

#### 6.2 前端组件测试

**文件**：`frontend/src/features/review-center/components/__tests__/VotePanel.test.tsx`

```typescript
describe('VotePanel', () => {
  it('renders vote buttons', () => {
    render(<VotePanel meetingId={1} requirementId={1} />);
    expect(screen.getByText('支持通过')).toBeInTheDocument();
    expect(screen.getByText('反对拒绝')).toBeInTheDocument();
    expect(screen.getByText('弃权')).toBeInTheDocument();
  });

  it('submits vote on button click', async () => {
    const mockCastVote = jest.fn();
    render(<VotePanel meetingId={1} requirementId={1} />);
    await userEvent.click(screen.getByText('支持通过'));
    await userEvent.click(screen.getByText('提交投票'));
    expect(mockCastVote).toHaveBeenCalled();
  });
});
```

#### 6.3 端到端测试

**测试场景**：
1. 创建会议 → 添加参会人员 → 添加需求
2. 开始会议 → 参会人员投票 → 查看统计
3. 修改投票 → 统计更新
4. 移除参会人员 → 投票被删除
5. 结束会议 → 不可再投票

#### 6.4 文档更新

**API文档**：Swagger自动生成（`/docs`）

**用户指南**：`docs/requirement-review-center.md`
```markdown
# 需求评审中心使用指南

## 创建评审会议
1. 进入评审中心页面
2. 点击"创建会议"按钮
3. 填写会议信息（标题、时间、主持人）
4. 选择参会人员
5. 添加待评审需求
6. 保存

## 进行投票
1. 进入会议详情页
2. 在需求列表中选择要评审的需求
3. 在投票面板选择"支持通过"/"反对拒绝"/"弃权"
4. 输入评审意见（可选）
5. 点击"提交投票"
6. 查看投票统计（每5秒自动刷新）
```

---

## 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 | 状态 |
|------|------|------|---------|------|
| **会议编号并发冲突** | 高 | 中 | 使用数据库原子操作和唯一索引约束 | ✅ 已缓解 |
| **投票并发冲突** | 高 | 中 | 使用PostgreSQL ON CONFLICT DO UPDATE实现UPSERT | ✅ 已缓解 |
| **轮询性能问题** | 高 | 中 | 1. 最小5秒间隔限制 2. 使用SQL聚合查询 3. 后续升级WebSocket | ✅ 已缓解 |
| **权限绕过** | 高 | 低 | 1. 后端强制验证参会人员 2. 验证会议状态 3. 不依赖前端验证 | ✅ 已缓解 |
| **数据库查询性能** | 中 | 中 | 1. 添加复合索引 2. 使用GROUP BY聚合 3. 避免N+1查询 | ✅ 已缓解 |
| **命名混淆** | 低 | 低 | 已解决：使用`requirement_review_meetings` | ✅ 已解决 |
| **头像字段缺失** | 低 | 低 | 使用username首字母生成头像，参考现有模式 | ✅ 已解决 |
| **租户隔离** | 高 | 低 | 所有模型继承TenantMixin，所有查询过滤tenant_id | ✅ 已解决 |

### 已解决的关键问题

1. **同步vs异步数据库模式**：采用同步模式（Session），与现有RequirementRepository保持一致
2. **认证依赖选择**：使用get_current_user_sync（同步版本），参考requirements.py
3. **前端目录结构**：使用pages/而非features/，与现有ReviewCenterPage一致
4. **投票并发控制**：使用原生SQL的ON CONFLICT DO UPDATE实现幂等投票
5. **头像显示**：User模型无avatar字段，使用username首字母作为fallback
6. **数据库索引**：添加关键复合索引优化投票统计查询
7. **参会人员移除**：Repository层实现级联删除投票记录

### 剩余风险监控

- **大量并发场景**：100+参会人员同时投票，需在生产环境监控
- **轮询服务器负载**：大规模使用时需考虑升级WebSocket
- **会议编号唯一性**：分布式环境下可能需要分布式锁（当前单租户单库已足够）

---

## 验证步骤

### 阶段1验证
```bash
cd backend
alembic upgrade head
psql -d ipd_dev -c "\d requirement_review_meetings"
psql -d ipd_dev -c "\d requirement_review_meeting_attendees"
psql -d ipd_dev -c "\d requirement_review_meeting_requirements"
psql -d ipd_dev -c "\d requirement_review_votes"
```

### 阶段2验证
```bash
cd backend
uvicorn app.main:app --reload
# 访问 http://localhost:8000/docs
# 测试所有20个端点
```

### 阶段3验证
```bash
cd frontend
npm run type-check
npm run build
```

### 阶段4验证
```bash
cd frontend
npm run dev
# 访问 http://localhost:5173/review-center
# 手动测试所有UI交互
```

### 阶段5验证

**权限验证测试**：
```bash
# 获取token（非参会人员）
TOKEN_NON_ATTENDEE="..."
TOKEN_ATTENDEE="..."

# 测试非参会人员投票（应返回403）
curl -X POST http://localhost:8000/api/v1/requirement-review-meetings/1/requirements/1/vote \
  -H "Authorization: Bearer $TOKEN_NON_ATTENDEE" \
  -H "Content-Type: application/json" \
  -d '{"vote_option": "approve", "comment": "测试"}'
# 预期：{"detail": "您没有投票权限（非参会人员或会议未进行中）"}

# 测试参会人员投票（应成功）
curl -X POST http://localhost:8000/api/v1/requirement-review-meetings/1/requirements/1/vote \
  -H "Authorization: Bearer $TOKEN_ATTENDEE" \
  -H "Content-Type: application/json" \
  -d '{"vote_option": "approve", "comment": "测试"}'
# 预期：{"success": true, "message": "投票成功", "data": {...}}

# 测试重复投票（应更新已有投票）
curl -X POST http://localhost:8000/api/v1/requirement-review-meetings/1/requirements/1/vote \
  -H "Authorization: Bearer $TOKEN_ATTENDEE" \
  -H "Content-Type: application/json" \
  -d '{"vote_option": "reject", "comment": "修改意见"}'
# 预期：返回更新后的投票数据
```

**主持人权限测试**：
```bash
# 测试非主持人开始会议（应返回403）
curl -X POST http://localhost:8000/api/v1/requirement-review-meetings/1/start \
  -H "Authorization: Bearer $TOKEN_NON_ATTENDEE"
# 预期：{"detail": "只有主持人可以开始会议"}

# 测试主持人开始会议（应成功）
curl -X POST http://localhost:8000/api/v1/requirement-review-meetings/1/start \
  -H "Authorization: Bearer $TOKEN_MODERATOR"
# 预期：{"success": true, "message": "会议已开始", "data": {...}}
```

**参会人员移除级联删除测试**：
```bash
# 1. 用户A投票
# 2. 移除用户A
# 3. 检查投票统计（用户A的投票应消失）
curl -X GET http://localhost:8000/api/v1/requirement-review-meetings/1/requirements/1/votes
# 预期：统计中不包含用户A的投票
```

**前端类型检查**：
```bash
cd frontend
npm run type-check
# 应该无TypeScript错误（特别是头像相关）
```

### 阶段6验证
```bash
cd backend
pytest tests/test_requirement_review_meeting.py -v

cd frontend
npm test -- --watchAll=false
```

---

## 后续优化方向

1. **WebSocket升级**：替代轮询，实现真正的实时推送
2. **会议模板**：预设常用会议类型和参会人员
3. **投票历史**：记录投票变更审计日志
4. **会议纪要**：自动生成会议纪要文档
5. **移动端适配**：响应式布局优化
6. **性能监控**：添加APM监控（如Sentry）

---

## 关键架构决策总结

基于对现有代码库的分析，以下架构决策已确定：

### 1. 数据库访问模式

**决策**：使用**同步数据库Session**模式
- **理由**：现有`RequirementRepository`使用同步模式
- **实现**：
  ```python
  from sqlalchemy.orm import Session
  class RequirementReviewMeetingRepository:
      def __init__(self, db: Session):
          self.db = db
  ```
- **对比**：不使用AsyncSession（虽然存在但不是主要模式）

### 2. 认证依赖选择

**决策**：使用**`get_current_user_sync`**
- **理由**：requirements.py使用该依赖，保持一致性
- **实现**：
  ```python
  from app.api.deps import get_current_user_sync
  @router.get("/")
  async def list_meetings(
      current_user: Optional[User] = Depends(get_current_user_sync)
  ):
      ...
  ```
- **对比**：不使用`get_current_user`（async版本）

### 3. 前端目录结构

**决策**：使用**`pages/`**而非`features/`
- **理由**：ReviewCenterPage已存在于`pages/review-center/`
- **实现**：
  ```
  frontend/src/pages/review-center/
  ├── ReviewCenterPage.tsx          # 已存在，需修改
  ├── ReviewMeetingDetailPage.tsx   # 新建
  ├── components/                   # 新建
  └── CreateMeetingModal.tsx        # 新建
  ```

### 4. 投票并发控制

**决策**：使用**PostgreSQL ON CONFLICT DO UPDATE**
- **理由**：避免应用层race condition
- **实现**：
  ```python
  INSERT INTO requirement_review_votes (...)
  VALUES (...)
  ON CONFLICT (meeting_id, requirement_id, voter_id)
  DO UPDATE SET vote_option = EXCLUDED.vote_option, ...
  ```
- **对比**：不使用"先查询再INSERT/UPDATE"的应用层逻辑

### 5. 数据库索引策略

**决策**：添加**复合索引**优化高频查询
- **实现**：
  ```python
  # 投票统计查询优化
  Index('ix_review_votes_meeting_req_option',
        'meeting_id', 'requirement_id', 'vote_option')
  # 参会人员查询优化
  Index('ix_meeting_attendees_tenant_user', 'tenant_id', 'attendee_id')
  ```
- **对比**：不只有单列索引

### 6. 用户头像处理

**决策**：使用**username首字母**作为头像fallback
- **理由**：User模型无avatar字段
- **实现**：
  ```typescript
  const getUserAvatar = (username?: string): string => {
    return (username || 'U').charAt(0).toUpperCase()
  }
  <Avatar style={{ backgroundColor: getAvatarColor(username) }}>
    {getUserAvatar(username)}
  </Avatar>
  ```

### 7. 级联删除策略

**决策**：移除参会人员时**同步删除投票**
- **理由**：用户明确选择"删除该人员的所有投票"
- **实现**：
  ```python
  def remove_attendee(self, meeting_id: int, attendee_id: int):
      # 先删除投票
      self.db.query(RequirementReviewVote).filter(...).delete()
      # 再删除参会人员
      self.db.delete(attendee)
      self.db.commit()
  ```

### 8. 投票统计查询优化

**决策**：使用**SQL GROUP BY**聚合，避免应用层循环
- **理由**：减少数据传输和应用层计算
- **实现**：
  ```sql
  SELECT vote_option, COUNT(*),
         json_agg(json_build_object('voter_id', voter_id, 'comment', comment))
  FROM requirement_review_votes
  WHERE meeting_id = ? AND requirement_id = ?
  GROUP BY vote_option
  ```
- **对比**：不在Python中循环统计

---

## 工时预估

| 阶段 | 预估工时 | 说明 |
|------|---------|------|
| 阶段1：数据库设计 | 1-2天 | 4个模型 + schemas + 迁移 |
| 阶段2：后端API开发 | 2-3天 | Service + Repository + 20个端点 |
| 阶段3：前端基础 | 1天 | 类型定义 + API服务 + 路由 |
| 阶段4：前端页面开发 | 3-4天 | 2个页面 + 4个组件 |
| 阶段5：集成和优化 | 1-2天 | 权限 + 错误处理 + 性能 |
| 阶段6：测试和文档 | 1天 | 单元测试 + E2E测试 + 文档 |
| **总计** | **9-13天** | 约2-3周 |

---

## 关键技术点总结

1. **会议编号生成**：`RM-YYYYMMDD-001` 格式，每日自增
2. **投票统计**：SQL GROUP BY + 窗口函数计算百分比
3. **权限验证**：后端检查 `review_meeting_attendees` 表
4. **级联删除**：移除参会人员时同步删除投票记录
5. **轮询优化**：5秒间隔 + HTTP ETag缓存
6. **幂等投票**：使用 UNIQUE 约束防止重复投票
7. **租户隔离**：所有表继承 `TenantMixin`，所有查询过滤 `tenant_id`

---

**计划生成时间**：2026-02-03
**计划版本**：v1.0
**基于用户决策**：
- ✅ 投票规则：主持人决定权
- ✅ 创建权限：所有认证用户
- ✅ 表名：requirement_review_meetings
- ✅ 人员移除：删除投票

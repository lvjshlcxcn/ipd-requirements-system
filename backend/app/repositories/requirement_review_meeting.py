"""Requirement review meeting repository for data access."""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, and_, or_, Integer
from sqlalchemy.exc import IntegrityError

from app.models.requirement_review_meeting import RequirementReviewMeeting
from app.models.requirement_review_meeting_attendee import RequirementReviewMeetingAttendee
from app.models.requirement_review_meeting_requirement import RequirementReviewMeetingRequirement
from app.models.requirement_review_vote import RequirementReviewVote
from app.models.vote_result import VoteResult
from app.models.requirement import Requirement


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
        """Delete meeting with explicit cleanup of related records (double protection).

        This method implements a "double protection" strategy:
        1. Explicitly delete all related records in code
        2. Rely on database CASCADE as a safety net

        Args:
            meeting: The meeting to delete

        Raises:
            SQLAlchemyError: If deletion fails (transaction will be rolled back)
        """
        import logging
        logger = logging.getLogger(__name__)

        try:
            # Step 1: Explicitly delete related records
            deletion_counts = {}

            # 1.1 Delete vote results (archived voting statistics)
            vote_results_count = self.db.query(VoteResult).filter(
                VoteResult.meeting_id == meeting.id
            ).delete(synchronize_session=False)
            deletion_counts['vote_results'] = vote_results_count

            # 1.2 Delete meeting-requirement associations
            meeting_reqs_count = self.db.query(RequirementReviewMeetingRequirement).filter(
                RequirementReviewMeetingRequirement.meeting_id == meeting.id
            ).delete(synchronize_session=False)
            deletion_counts['meeting_requirements'] = meeting_reqs_count

            # 1.3 Delete votes (should already be deleted by CASCADE from requirements)
            votes_count = self.db.query(RequirementReviewVote).filter(
                RequirementReviewVote.meeting_id == meeting.id
            ).delete(synchronize_session=False)
            deletion_counts['votes'] = votes_count

            # 1.4 Delete attendees (should already be deleted by CASCADE)
            attendees_count = self.db.query(RequirementReviewMeetingAttendee).filter(
                RequirementReviewMeetingAttendee.meeting_id == meeting.id
            ).delete(synchronize_session=False)
            deletion_counts['attendees'] = attendees_count

            # Step 2: Delete the meeting itself
            # Database CASCADE will handle any remaining related records
            self.db.delete(meeting)

            # Step 3: Commit transaction
            self.db.commit()

            # Step 4: Log deletion summary
            total_deleted = sum(deletion_counts.values())
            logger.info(
                f"Deleted meeting {meeting.meeting_no} (ID: {meeting.id}) - "
                f"Explicitly deleted: {total_deleted} related records "
                f"({deletion_counts}), plus meeting record via CASCADE"
            )

        except Exception as e:
            # Rollback on any error
            self.db.rollback()
            logger.error(
                f"Failed to delete meeting {meeting.meeting_no} (ID: {meeting.id}): {str(e)}"
            )
            raise

    def count_by_date(self, tenant_id: int, date_str: str) -> int:
        """Count meetings created on a specific date."""
        filter_date = datetime.strptime(date_str, "%Y%m%d").date()
        next_day = filter_date + timedelta(days=1)
        return self.db.query(RequirementReviewMeeting).filter(
            RequirementReviewMeeting.tenant_id == tenant_id,
            RequirementReviewMeeting.created_at >= filter_date,
            RequirementReviewMeeting.created_at < next_day
        ).count()

    def get_max_meeting_no(self, tenant_id: int, prefix: str) -> Optional[int]:
        """Get the maximum meeting number for a given date prefix.

        Compatible with both SQLite and PostgreSQL.
        """
        # Query all meetings with the given prefix
        meetings = self.db.query(RequirementReviewMeeting).filter(
            RequirementReviewMeeting.tenant_id == tenant_id,
            RequirementReviewMeeting.meeting_no.like(f"{prefix}-%")
        ).all()

        max_no = 0
        for meeting in meetings:
            if meeting.meeting_no:
                # Parse meeting_no format: "RM-20260204-002"
                parts = meeting.meeting_no.split('-')
                if len(parts) >= 3:
                    try:
                        no = int(parts[2])
                        max_no = max(max_no, no)
                    except (ValueError, IndexError):
                        continue

        return max_no

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
        from sqlalchemy.orm import joinedload

        return self.db.query(RequirementReviewMeetingAttendee).options(
            joinedload(RequirementReviewMeetingAttendee.attendee)  # 修复：模型中是 attendee 不是 user
        ).filter(
            RequirementReviewMeetingAttendee.meeting_id == meeting_id
        ).all()

    def is_attendee(self, meeting_id: int, user_id: int) -> Optional[RequirementReviewMeetingAttendee]:
        """Check if user is an attendee of the meeting.

        注意：不过滤 attendance_status，允许所有参会人员投票（包括 declined）。
        只要用户在参会人员列表中，就可以投票。
        """
        return self.db.query(RequirementReviewMeetingAttendee).filter(
            RequirementReviewMeetingAttendee.meeting_id == meeting_id,
            RequirementReviewMeetingAttendee.attendee_id == user_id
            # 移除 attendance_status 过滤条件
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
        from sqlalchemy.orm import joinedload
        from sqlalchemy.exc import SQLAlchemyError

        try:
            result = self.db.query(RequirementReviewMeetingRequirement).options(
                joinedload(RequirementReviewMeetingRequirement.requirement)
            ).filter(
                RequirementReviewMeetingRequirement.meeting_id == meeting_id
            ).order_by(RequirementReviewMeetingRequirement.review_order).all()

            # 打印调试信息
            for req in result:
                print(f"MeetingRequirement: id={req.id}, requirement_id={req.requirement_id}, has_requirement={req.requirement is not None}")
                if req.requirement:
                    print(f"  -> requirement: {req.requirement.requirement_no}")

            return result
        except SQLAlchemyError as e:
            print(f"SQLAlchemy Error in get_requirements: {e}")
            # 重新抛出，让API层处理
            raise
        except Exception as e:
            print(f"Unexpected Error in get_requirements: {e}")
            raise

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

        # 使用 ORM 实现兼容 SQLite 和 PostgreSQL 的 upsert
        from sqlalchemy import text

        # 先尝试查询现有投票
        existing_vote = self.db.query(RequirementReviewVote).filter(
            RequirementReviewVote.meeting_id == meeting_id,
            RequirementReviewVote.requirement_id == requirement_id,
            RequirementReviewVote.voter_id == voter_id
        ).first()

        now = datetime.utcnow()

        if existing_vote:
            # 更新现有投票
            existing_vote.vote_option = vote_option
            existing_vote.comment = comment
            existing_vote.updated_at = now
            self.db.commit()
            self.db.refresh(existing_vote)
            return existing_vote
        else:
            # 创建新投票
            vote = RequirementReviewVote(
                meeting_id=meeting_id,
                requirement_id=requirement_id,
                voter_id=voter_id,
                tenant_id=tenant_id,
                vote_option=vote_option,
                comment=comment,
                created_at=now,
                updated_at=now
            )
            self.db.add(vote)
            self.db.commit()
            self.db.refresh(vote)
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
        """Get aggregated vote statistics with user information and completion status."""

        from sqlalchemy import text
        from app.models.user import User
        from app.models.requirement_review_meeting_requirement import RequirementReviewMeetingRequirement

        # 获取会议需求关联记录（用于计算投票完成度）
        meeting_req = self.db.query(RequirementReviewMeetingRequirement).filter(
            RequirementReviewMeetingRequirement.meeting_id == meeting_id,
            RequirementReviewMeetingRequirement.requirement_id == requirement_id
        ).first()

        # 获取指定投票人员列表
        assigned_voter_ids = meeting_req.assigned_voter_ids if meeting_req else []

        # 获取所有投票，并 JOIN 用户表获取用户信息
        sql = text("""
            SELECT
                v.vote_option,
                v.voter_id,
                u.username as voter_name,
                v.comment,
                v.created_at as voted_at
            FROM requirement_review_votes v
            LEFT JOIN users u ON v.voter_id = u.id
            WHERE v.meeting_id = :meeting_id AND v.requirement_id = :requirement_id
            ORDER BY v.created_at DESC
        """)

        result = self.db.execute(sql, {
            "meeting_id": meeting_id,
            "requirement_id": requirement_id
        })

        # 初始化统计
        stats = {
            "requirement_id": requirement_id,
            "total_votes": 0,
            "approve_count": 0,
            "approve_percentage": 0.0,
            "reject_count": 0,
            "reject_percentage": 0.0,
            "abstain_count": 0,
            "abstain_percentage": 0.0,
            "votes": [],
            # 投票完成状态字段
            "total_assigned_voters": len(assigned_voter_ids) if assigned_voter_ids else 0,
            "voted_count": 0,
            "is_voting_complete": False
        }

        votes_list = []
        voted_voter_ids = set()

        for row in result:
            vote_option = row[0]
            voter_id = row[1]
            voter_name = row[2]
            comment = row[3]
            voted_at = row[4]

            stats["total_votes"] += 1
            stats[f"{vote_option}_count"] += 1

            # 记录已投票的用户ID
            voted_voter_ids.add(voter_id)

            # Handle datetime serialization (SQLite returns strings, PostgreSQL returns datetime)
            voted_at_str = None
            if voted_at:
                if isinstance(voted_at, str):
                    voted_at_str = voted_at
                else:
                    voted_at_str = voted_at.isoformat()

            votes_list.append({
                "voter_id": voter_id,
                "voter_name": voter_name or f"User{voter_id}",
                "vote_option": vote_option,
                "comment": comment,
                "voted_at": voted_at_str
            })

        # 计算百分比
        if stats["total_votes"] > 0:
            stats["approve_percentage"] = round(stats["approve_count"] * 100.0 / stats["total_votes"], 1)
            stats["reject_percentage"] = round(stats["reject_count"] * 100.0 / stats["total_votes"], 1)
            stats["abstain_percentage"] = round(stats["abstain_count"] * 100.0 / stats["total_votes"], 1)

        # 计算投票完成状态
        stats["voted_count"] = len(voted_voter_ids)
        if assigned_voter_ids:
            stats["is_voting_complete"] = stats["voted_count"] >= len(assigned_voter_ids)

        stats["votes"] = votes_list

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

    # ========================================================================
    # Assigned Voters Management
    # ========================================================================

    def update_assigned_voters(
        self,
        meeting_id: int,
        requirement_id: int,
        voter_ids: List[int]
    ) -> Optional[RequirementReviewMeetingRequirement]:
        """Update the list of assigned voters for a meeting requirement."""
        meeting_req = self.db.query(RequirementReviewMeetingRequirement).filter(
            RequirementReviewMeetingRequirement.meeting_id == meeting_id,
            RequirementReviewMeetingRequirement.requirement_id == requirement_id
        ).first()

        if meeting_req:
            meeting_req.assigned_voter_ids = voter_ids
            self.db.commit()
            self.db.refresh(meeting_req)
            return meeting_req
        return None

    def get_voter_status(
        self,
        meeting_id: int,
        requirement_id: int
    ) -> Dict[str, Any]:
        """Get voting status for all assigned voters of a requirement."""
        # 获取会议需求关联记录
        meeting_req = self.db.query(RequirementReviewMeetingRequirement).filter(
            RequirementReviewMeetingRequirement.meeting_id == meeting_id,
            RequirementReviewMeetingRequirement.requirement_id == requirement_id
        ).first()

        if not meeting_req or not meeting_req.assigned_voter_ids:
            return {
                "requirement_id": requirement_id,
                "assigned_voter_ids": [],
                "voters": [],
                "total_assigned": 0,
                "total_voted": 0,
                "is_complete": False
            }

        # 获取所有投票记录
        votes = self.db.query(RequirementReviewVote).filter(
            RequirementReviewVote.meeting_id == meeting_id,
            RequirementReviewVote.requirement_id == requirement_id,
            RequirementReviewVote.voter_id.in_(meeting_req.assigned_voter_ids)
        ).all()

        # 创建投票映射
        vote_map = {vote.voter_id: vote for vote in votes}

        # 获取参会人员信息
        from app.models.user import User
        attendees = self.db.query(User).filter(
            User.id.in_(meeting_req.assigned_voter_ids)
        ).all()

        # 构建投票人员状态列表
        user_map = {user.id: user for user in attendees}
        voters = []
        voted_count = 0

        for voter_id in meeting_req.assigned_voter_ids:
            user = user_map.get(voter_id)
            vote = vote_map.get(voter_id)

            if user:
                has_voted = vote is not None
                if has_voted:
                    voted_count += 1

                voters.append({
                    "attendee_id": voter_id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "has_voted": has_voted,
                    "vote_option": vote.vote_option if vote else None,
                    "voted_at": vote.updated_at if vote else None
                })

        # 修复: 判断所有指定的投票人是否都已投票
        # 不仅仅比较数量,而是检查每个指定人员是否都有投票记录
        # 这样可以避免部分人员投票时误判为完成
        all_voted = all(
            vote_map.get(voter_id) is not None
            for voter_id in meeting_req.assigned_voter_ids
        )

        return {
            "requirement_id": requirement_id,
            "assigned_voter_ids": meeting_req.assigned_voter_ids,
            "voters": voters,
            "total_assigned": len(meeting_req.assigned_voter_ids),
            "total_voted": voted_count,
            "is_complete": all_voted
        }

    # ========================================================================
    # Vote Result Archiving
    # ========================================================================

    def archive_vote_result(
        self,
        meeting_id: int,
        requirement_id: int,
        requirement_title: Optional[str],
        vote_statistics: Dict[str, Any],
        tenant_id: int
    ) -> None:
        """Archive a vote result for a meeting requirement."""
        from app.models.vote_result import VoteResult

        vote_result = VoteResult(
            meeting_id=meeting_id,
            requirement_id=requirement_id,
            requirement_title=requirement_title,
            vote_statistics=vote_statistics,
            tenant_id=tenant_id
        )

        self.db.add(vote_result)
        self.db.commit()

    def archive_meeting_results(self, meeting_id: int, tenant_id: int) -> None:
        """Archive all vote results for a meeting."""
        # 获取会议的所有需求
        requirements = self.get_requirements(meeting_id)

        for req in requirements:
            if req.requirement:  # 确保需求存在
                # 获取投票统计
                stats = self.get_vote_statistics(meeting_id, req.requirement_id)

                # 存档投票结果
                self.archive_vote_result(
                    meeting_id=meeting_id,
                    requirement_id=req.requirement_id,
                    requirement_title=req.requirement.title,
                    vote_statistics=stats,
                    tenant_id=tenant_id
                )

    def get_vote_results(
        self,
        tenant_id: int,
        meeting_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[VoteResult], int]:
        """Get archived vote results (optionally filtered by meeting)."""
        # JOIN with requirements and meetings tables to get requirement_no and meeting_no
        query = self.db.query(
            VoteResult,
            Requirement.requirement_no,
            RequirementReviewMeeting.meeting_no
        ).join(
            Requirement,
            VoteResult.requirement_id == Requirement.id
        ).join(
            RequirementReviewMeeting,
            VoteResult.meeting_id == RequirementReviewMeeting.id
        ).filter(
            VoteResult.tenant_id == tenant_id
        )

        if meeting_id:
            query = query.filter(VoteResult.meeting_id == meeting_id)

        # Get total count before pagination
        total = query.count()

        # Execute query with pagination
        results_with_data = query.order_by(
            VoteResult.archived_at.desc()
        ).offset(skip).limit(limit).all()

        # Attach requirement_no and meeting_no to each VoteResult object
        results = []
        for vote_result, requirement_no, meeting_no in results_with_data:
            # Add fields as dynamic attributes
            vote_result.requirement_no = requirement_no
            vote_result.meeting_no = meeting_no
            results.append(vote_result)

        return results, total

    def get_vote_result(self, result_id: int, tenant_id: int) -> Optional[VoteResult]:
        """Get a specific vote result by ID."""
        # JOIN with requirements and meetings tables to get requirement_no and meeting_no
        result = self.db.query(
            VoteResult,
            Requirement.requirement_no,
            RequirementReviewMeeting.meeting_no
        ).join(
            Requirement,
            VoteResult.requirement_id == Requirement.id
        ).join(
            RequirementReviewMeeting,
            VoteResult.meeting_id == RequirementReviewMeeting.id
        ).filter(
            VoteResult.id == result_id,
            VoteResult.tenant_id == tenant_id
        ).first()

        if result:
            vote_result, requirement_no, meeting_no = result
            # Add fields as dynamic attributes
            vote_result.requirement_no = requirement_no
            vote_result.meeting_no = meeting_no
            return vote_result

        return None

    # ========================================================================
    # Pending Voters Management (Auto Abstain)
    # ========================================================================

    def get_all_pending_voters(self, meeting_id: int) -> Dict[str, Any]:
        """获取会议中所有需求的未投票人员统计.

        Returns:
            {
                "total_requirements": 3,
                "requirements": [
                    {
                        "requirement_id": 123,
                        "requirement_title": "需求标题",
                        "total_assigned": 5,
                        "voted_count": 3,
                        "pending_voters": [
                            {
                                "voter_id": 4,
                                "voter_name": "张三",
                                "full_name": "张三"
                            }
                        ]
                    }
                ]
            }
        """
        requirements = self.get_requirements(meeting_id)

        # 获取会议的所有参会者ID和信息
        from app.models.requirement_review_meeting import RequirementReviewMeeting
        from app.models.user import User
        from app.models.requirement_review_vote import RequirementReviewVote

        meeting = self.db.query(RequirementReviewMeeting).filter(
            RequirementReviewMeeting.id == meeting_id
        ).first()

        if not meeting:
            return {
                "total_requirements": 0,
                "requirements": []
            }

        # 获取所有参会者ID和用户信息
        all_attendee_ids = [attendee.attendee_id for attendee in meeting.attendees]
        attendee_users = {
            attendee.attendee_id: attendee.attendee
            for attendee in meeting.attendees
        }

        result = {
            "total_requirements": 0,
            "requirements": []
        }

        for req in requirements:
            if not req.requirement:
                continue

            result["total_requirements"] += 1

            # 确定投票人员：如果未设置指定投票人，则所有参会者都是投票人
            voter_ids = req.assigned_voter_ids if req.assigned_voter_ids else all_attendee_ids

            # 如果没有投票人，跳过该需求
            if not voter_ids:
                continue

            # 获取该需求的投票记录
            votes = self.db.query(RequirementReviewVote).filter(
                RequirementReviewVote.meeting_id == meeting_id,
                RequirementReviewVote.requirement_id == req.requirement_id
            ).all()

            # 创建投票映射
            vote_map = {vote.voter_id: vote for vote in votes}

            # 构建投票人员状态列表（只包含voter_ids范围内的）
            voters = []
            for voter_id in voter_ids:
                user = attendee_users.get(voter_id)
                if not user:
                    continue

                vote = vote_map.get(voter_id)
                has_voted = vote is not None

                voters.append({
                    "attendee_id": voter_id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "has_voted": has_voted,
                    "vote_option": vote.vote_option if vote else None,
                    "voted_at": vote.updated_at if vote else None
                })

            # 找出未投票人员
            pending_voters = [
                {
                    "voter_id": v["attendee_id"],
                    "voter_name": v["username"],
                    "full_name": v.get("full_name")
                }
                for v in voters
                if not v["has_voted"]
            ]

            # 计算投票统计
            voted_count = sum(1 for v in voters if v["has_voted"])

            result["requirements"].append({
                "requirement_id": req.requirement_id,
                "requirement_title": req.requirement.title,
                "total_assigned": len(voters),
                "voted_count": voted_count,
                "pending_voters": pending_voters
            })

        return result

    def create_abstain_votes_for_pending_voters(
        self,
        meeting_id: int,
        tenant_id: int
    ) -> Dict[str, int]:
        """为所有未投票人员自动创建弃权票.

        Returns:
            {
                "total_votes_created": 10,
                "by_requirement": {
                    123: 3,  # requirement_id: 创建的弃权票数量
                    456: 4
                }
            }
        """
        requirements = self.get_requirements(meeting_id)

        # 获取会议的所有参会者ID和信息
        from app.models.requirement_review_meeting import RequirementReviewMeeting
        from app.models.requirement_review_vote import RequirementReviewVote

        meeting = self.db.query(RequirementReviewMeeting).filter(
            RequirementReviewMeeting.id == meeting_id
        ).first()

        if not meeting:
            return {"total_votes_created": 0, "by_requirement": {}}

        # 获取所有参会者ID和用户信息
        all_attendee_ids = [attendee.attendee_id for attendee in meeting.attendees]
        attendee_users = {
            attendee.attendee_id: attendee.attendee
            for attendee in meeting.attendees
        }

        stats = {"total_votes_created": 0, "by_requirement": {}}

        for req in requirements:
            if not req.requirement:
                continue

            # 确定投票人员：如果未设置指定投票人，则所有参会者都是投票人
            voter_ids = req.assigned_voter_ids if req.assigned_voter_ids else all_attendee_ids

            # 如果没有投票人，跳过该需求
            if not voter_ids:
                continue

            # 获取该需求的投票记录
            votes = self.db.query(RequirementReviewVote).filter(
                RequirementReviewVote.meeting_id == meeting_id,
                RequirementReviewVote.requirement_id == req.requirement_id
            ).all()

            # 创建投票映射
            vote_map = {vote.voter_id: vote for vote in votes}

            # 找出未投票人员（仅统计投票人范围内的）
            pending_voters = []
            for voter_id in voter_ids:
                user = attendee_users.get(voter_id)
                if not user:
                    continue

                # 如果该投票人没有投票记录，则是未投票人员
                if voter_id not in vote_map:
                    pending_voters.append({
                        "attendee_id": voter_id,
                        "username": user.username,
                        "full_name": user.full_name
                    })

            if not pending_voters:
                continue

            # 为每个未投票人员创建弃权票
            votes_created = 0
            for voter in pending_voters:
                try:
                    self.cast_vote(
                        meeting_id=meeting_id,
                        requirement_id=req.requirement_id,
                        voter_id=voter["attendee_id"],
                        tenant_id=tenant_id,
                        vote_option="abstain",
                        comment="会议结束时自动弃权"
                    )
                    votes_created += 1
                except Exception as e:
                    # 记录错误但继续处理其他人员
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(
                        f"创建弃权票失败 (meeting_id={meeting_id}, "
                        f"requirement_id={req.requirement_id}, "
                        f"voter_id={voter['attendee_id']}): {str(e)}"
                    )

            stats["by_requirement"][req.requirement_id] = votes_created
            stats["total_votes_created"] += votes_created

        return stats


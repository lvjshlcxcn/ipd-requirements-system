#!/usr/bin/env python3
"""
投票权限调试脚本
用于诊断为什么用户收到403错误
"""
import os
import sys
import django

# 添加项目路径
sys.path.insert(0, os.path.dirname(__file__))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.config')
# os.environ.setdefault('DATABASE_URL', 'postgresql://...)

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 数据库连接
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ipd_db"

def debug_vote_permission(meeting_id: int, requirement_id: int, user_id: int):
    """调试投票权限问题"""

    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    print(f"\n{'='*60}")
    print(f"投票权限调试报告")
    print(f"{'='*60}")
    print(f"会议ID: {meeting_id}")
    print(f"需求ID: {requirement_id}")
    print(f"用户ID: {user_id}")
    print(f"{'='*60}\n")

    # 1. 检查会议状态
    print("📋 步骤1: 检查会议状态")
    print("-" * 60)

    meeting_query = text("""
        SELECT id, title, status, moderator_id
        FROM requirement_review_meetings
        WHERE id = :meeting_id
    """)
    meeting = session.execute(meeting_query, {"meeting_id": meeting_id}).fetchone()

    if meeting:
        print(f"✅ 会议存在")
        print(f"   - 标题: {meeting[1]}")
        print(f"   - 状态: {meeting[2]}")
        print(f"   - 主持人ID: {meeting[3]}")

        if meeting[2] != "in_progress":
            print(f"❌ 问题1: 会议状态不是 'in_progress'")
            print(f"   当前状态: '{meeting[2]}'")
            print(f"   解决方案: 点击'开始会议'按钮开始会议\n")
        else:
            print(f"✅ 会议状态正确: 'in_progress'\n")
    else:
        print(f"❌ 会议不存在 (ID={meeting_id})\n")
        return

    # 2. 检查用户信息
    print("👤 步骤2: 检查用户信息")
    print("-" * 60)

    user_query = text("""
        SELECT id, username, full_name, role
        FROM users
        WHERE id = :user_id
    """)
    user = session.execute(user_query, {"user_id": user_id}).fetchone()

    if user:
        print(f"✅ 用户存在")
        print(f"   - 用户名: {user[1]}")
        print(f"   - 全名: {user[2]}")
        print(f"   - 角色: {user[3]}\n")
    else:
        print(f"❌ 用户不存在 (ID={user_id})\n")
        return

    # 3. 检查参会人员
    print("👥 步骤3: 检查参会人员")
    print("-" * 60)

    attendee_query = text("""
        SELECT a.id, a.attendee_id, a.attendance_status, u.username, u.full_name
        FROM requirement_review_meeting_attendees a
        JOIN users u ON a.attendee_id = u.id
        WHERE a.meeting_id = :meeting_id
        ORDER BY u.id
    """)
    attendees = session.execute(attendee_query, {"meeting_id": meeting_id}).fetchall()

    if attendees:
        print(f"✅ 参会人员列表 ({len(attendees)}人):")
        is_attendee = False
        for attendee in attendees:
            prefix = "   👈 " if attendee[1] == user_id else "      "
            status = f" ({attendee[2]})" if attendee[2] else ""
            print(f"{prefix}ID={attendee[1]} | {attendee[3]} | {attendee[4]}{status}")
            if attendee[1] == user_id:
                is_attendee = True

        if not is_attendee:
            print(f"\n❌ 问题2: 用户不在参会人员列表中")
            print(f"   用户ID {user_id} 不在会议 {meeting_id} 的参会人员中")
            print(f"   解决方案: 添加该用户到参会人员列表\n")
        else:
            print(f"\n✅ 用户在参会人员列表中\n")
    else:
        print(f"⚠️  没有参会人员记录\n")

    # 4. 检查指定投票人员
    print("🗳️  步骤4: 检查指定投票人员列表")
    print("-" * 60)

    voter_query = text("""
        SELECT meeting_id, requirement_id, assigned_voter_ids
        FROM requirement_review_meeting_requirements
        WHERE meeting_id = :meeting_id AND requirement_id = :requirement_id
    """)
    meeting_req = session.execute(voter_query, {
        "meeting_id": meeting_id,
        "requirement_id": requirement_id
    }).fetchone()

    if meeting_req:
        voter_ids = meeting_req[2] if meeting_req[2] else []
        print(f"✅ 会议需求关联记录存在")
        print(f"   - 指定投票人员ID列表: {voter_ids}")
        print(f"   - 总人数: {len(voter_ids)}人")

        if not voter_ids:
            print(f"\n❌ 问题3: 未设置指定投票人员")
            print(f"   assigned_voter_ids 为空")
            print(f"   解决方案: 在前端选择投票人员\n")
        elif user_id not in voter_ids:
            print(f"\n❌ 问题3: 用户不在指定投票人员列表中")
            print(f"   用户ID {user_id} 不在列表 {voter_ids} 中")
            print(f"   解决方案: 将该用户添加到投票人员列表\n")
        else:
            print(f"\n✅ 用户在指定投票人员列表中 ✅\n")
    else:
        print(f"❌ 会议需求关联记录不存在")
        print(f"   meeting_id={meeting_id}, requirement_id={requirement_id}\n")

    # 5. 检查是否已投票
    print("✅ 步骤5: 检查是否已投票")
    print("-" * 60)

    vote_query = text("""
        SELECT id, voter_id, vote_option, comment, created_at
        FROM requirement_review_votes
        WHERE meeting_id = :meeting_id
          AND requirement_id = :requirement_id
          AND voter_id = :user_id
    """)
    existing_vote = session.execute(vote_query, {
        "meeting_id": meeting_id,
        "requirement_id": requirement_id,
        "user_id": user_id
    }).fetchone()

    if existing_vote:
        print(f"⚠️  用户已投票:")
        print(f"   - 投票ID: {existing_vote[0]}")
        print(f"   - 投票选项: {existing_vote[2]}")
        print(f"   - 备注: {existing_vote[3]}")
        print(f"   - 投票时间: {existing_vote[4]}")
        print(f"\nℹ️  这不是错误,用户不能重复投票\n")
    else:
        print(f"✅ 用户尚未投票,可以投票\n")

    # 6. 总结
    print("="*60)
    print("📊 权限检查总结")
    print("="*60)

    can_vote = True
    reasons = []

    if not meeting or meeting[2] != "in_progress":
        can_vote = False
        reasons.append("❌ 会议状态不是 in_progress")

    if not any(a[1] == user_id for a in attendees):
        can_vote = False
        reasons.append("❌ 用户不在参会人员列表中")

    if not meeting_req or not meeting_req[2] or user_id not in meeting_req[2]:
        can_vote = False
        reasons.append("❌ 用户不在指定投票人员列表中")

    if can_vote:
        print("✅ 用户有投票权限\n")
    else:
        print("❌ 用户无投票权限:")
        for reason in reasons:
            print(f"   {reason}")
        print()

    session.close()

if __name__ == "__main__":
    # 会议54, 需求16
    # 请将USER_ID替换为实际测试的用户ID
    import sys

    if len(sys.argv) > 1:
        user_id = int(sys.argv[1])
    else:
        print("用法: python debug_vote_permission.py <user_id>")
        print("示例: python debug_vote_permission.py 2")
        print("\n如果没有提供user_id,将使用默认值2")
        user_id = 2

    debug_vote_permission(meeting_id=54, requirement_id=16, user_id=user_id)

"""诊断 rd_pm 用户投票失败问题"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://ipd_user:ipd_pass@localhost:5432/ipd_req_db"

async def diagnose_vote_issue():
    """诊断 rd_pm 用户投票权限问题"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        print("\n" + "="*120)
        print("rd_pm 用户投票权限诊断报告")
        print("="*120)

        # 1. 获取 rd_pm 用户信息
        result = await session.execute(
            text("SELECT id, username, email, full_name, role, department FROM users WHERE username = 'rd_pm'")
        )
        rd_pm_user = result.fetchone()

        if not rd_pm_user:
            print("❌ rd_pm 用户不存在！")
            return

        user_id, username, email, full_name, role, department = rd_pm_user
        print(f"\n📋 用户信息：")
        print(f"   ID: {user_id}")
        print(f"   用户名: {username}")
        print(f"   邮箱: {email}")
        print(f"   姓名: {full_name}")
        print(f"   角色: {role}")
        print(f"   部门: {department}")

        # 2. 获取所有会议
        result = await session.execute(
            text("""
                SELECT id, title, status, moderator_id, scheduled_at
                FROM requirement_review_meetings
                ORDER BY id DESC
            """)
        )
        meetings = result.fetchall()

        if not meetings:
            print("\n⚠️  数据库中没有会议")
            return

        print(f"\n📊 会议列表（共 {len(meetings)} 个）：")
        print("-" * 120)
        print(f"{'会议ID':<10} {'标题':<40} {'状态':<15} {'主持人ID':<10} {'计划时间':<20}")
        print("-" * 120)

        for meeting in meetings:
            meeting_id, title, status, moderator_id, scheduled_at = meeting
            status_str = status
            if status == "in_progress":
                status_str = "✅ 进行中"
            elif status == "scheduled":
                status_str = "📅 已计划"
            elif status == "completed":
                status_str = "✓ 已完成"
            elif status == "cancelled":
                status_str = "✗ 已取消"

            print(f"{meeting_id:<10} {title:<40} {status_str:<15} {moderator_id:<10} {str(scheduled_at):<20}")

        # 3. 检查每个会议的参会人员和投票权限
        print("\n" + "="*120)
        print("🔍 逐个会议检查 rd_pm 的投票权限：")
        print("="*120)

        for meeting in meetings:
            meeting_id, title, status, moderator_id, scheduled_at = meeting

            print(f"\n{'─'*120}")
            print(f"会议 ID: {meeting_id} | 标题: {title} | 状态: {status}")
            print(f"{'─'*120}")

            # 3.1 检查是否是参会人员
            result = await session.execute(
                text("""
                    SELECT id, attendee_id, attendance_status
                    FROM requirement_review_meeting_attendees
                    WHERE meeting_id = :meeting_id AND attendee_id = :user_id
                """),
                {"meeting_id": meeting_id, "user_id": user_id}
            )
            attendee = result.fetchone()

            if attendee:
                attendee_id, attendee_user_id, attendance_status = attendee
                print(f"✅ 参会人员状态: 已添加 (状态: {attendance_status})")
            else:
                print(f"❌ 参会人员状态: 未添加到会议！")
                print(f"   → 这导致投票失败！")
                continue

            # 3.2 检查会议需求
            result = await session.execute(
                text("""
                    SELECT id, requirement_id, review_order, assigned_voter_ids
                    FROM requirement_review_meeting_requirements
                    WHERE meeting_id = :meeting_id
                    ORDER BY review_order
                """),
                {"meeting_id": meeting_id}
            )
            meeting_reqs = result.fetchall()

            if not meeting_reqs:
                print(f"⚠️  会议需求: 该会议还没有添加需求")
                continue

            print(f"\n📝 会议需求（{len(meeting_reqs)} 个）：")
            print(f"{'需求ID':<10} {'关联需求ID':<15} {'评审顺序':<10} {'指定投票人员':<50}")
            print("-" * 120)

            has_voting_permission = False
            for req in meeting_reqs:
                req_id, requirement_id, review_order, assigned_voter_ids = req
                voter_ids_str = str(assigned_voter_ids) if assigned_voter_ids else "未设置"

                # 检查是否在投票人员列表中
                in_voter_list = "✅ 是" if assigned_voter_ids and user_id in assigned_voter_ids else "❌ 否"

                if assigned_voter_ids and user_id in assigned_voter_ids:
                    has_voting_permission = True
                    voter_ids_str = f"🎯 {voter_ids_str}"
                else:
                    voter_ids_str = f"   {voter_ids_str}"

                print(f"{req_id:<10} {requirement_id:<15} {review_order:<10} {voter_ids_str:<50} {in_voter_list}")

            # 3.3 总结投票权限
            print(f"\n📊 投票权限总结：")
            if status != "in_progress":
                print(f"   ❌ 会议状态: {status} (必须是 'in_progress' 才能投票)")
                print(f"   → 建议操作: 先开始会议")
            elif not has_voting_permission:
                print(f"   ❌ 投票权限: 未在任何一个需求的投票人员列表中")
                print(f"   → 建议操作: 添加 rd_pm 到指定需求的 assigned_voter_ids")
            else:
                print(f"   ✅ 投票权限: 有权限对部分需求投票")

        # 4. 检查历史投票记录
        result = await session.execute(
            text("""
                SELECT v.id, v.meeting_id, v.requirement_id, v.vote_option, v.comment, v.created_at,
                       m.title as meeting_title
                FROM requirement_review_votes v
                JOIN requirement_review_meetings m ON v.meeting_id = m.id
                WHERE v.voter_id = :user_id
                ORDER BY v.created_at DESC
            """),
            {"user_id": user_id}
        )
        votes = result.fetchall()

        print(f"\n{'='*120}")
        print(f"📜 rd_pm 的历史投票记录（共 {len(votes)} 条）：")
        print("-" * 120)

        if votes:
            print(f"{'投票ID':<10} {'会议':<30} {'需求ID':<10} {'投票选项':<10} {'评论':<20} {'投票时间':<20}")
            print("-" * 120)

            for vote in votes:
                vote_id, meeting_id, requirement_id, vote_option, comment, created_at, meeting_title = vote
                comment_str = (comment[:17] + "...") if comment and len(comment) > 20 else (comment or "")
                print(f"{vote_id:<10} {meeting_title[:28]:<30} {requirement_id:<10} {vote_option:<10} {comment_str:<20} {str(created_at):<20}")
        else:
            print("⚠️  没有投票记录")

        print("\n" + "="*120)

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(diagnose_vote_issue())

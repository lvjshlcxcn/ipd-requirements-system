"""检查所有用户的投票记录和失败原因"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://ipd_user:ipd_pass@localhost:5432/ipd_req_db"

async def check_all_votes():
    """检查所有投票记录"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        print("\n" + "="*120)
        print("📊 所有用户投票记录检查")
        print("="*120)

        # 1. 检查会议ID 59的所有投票
        meeting_id = 59

        result = await session.execute(
            text("""
                SELECT
                    v.id,
                    v.voter_id,
                    u.username,
                    u.full_name,
                    v.requirement_id,
                    v.vote_option,
                    v.comment,
                    v.created_at
                FROM requirement_review_votes v
                JOIN users u ON v.voter_id = u.id
                WHERE v.meeting_id = :meeting_id
                ORDER BY v.requirement_id, v.voter_id
            """),
            {"meeting_id": meeting_id}
        )
        votes = result.fetchall()

        print(f"\n📋 会议 {meeting_id} 的所有投票记录（共 {len(votes)} 条）：")
        print("-" * 120)
        print(f"{'投票ID':<10} {'用户':<20} {'姓名':<20} {'需求ID':<10} {'投票选项':<15} {'评论':<30} {'时间':<20}")
        print("-" * 120)

        if votes:
            for vote in votes:
                vote_id, voter_id, username, full_name, req_id, vote_option, comment, created_at = vote
                comment_str = (comment[:27] + "...") if comment and len(comment) > 30 else (comment or "N/A")
                print(f"{vote_id:<10} {username:<20} {full_name:<20} {req_id:<10} {vote_option:<15} {comment_str:<30} {str(created_at):<20}")
        else:
            print("⚠️  没有任何投票记录！")

        # 2. 检查指定投票人员列表
        result = await session.execute(
            text("""
                SELECT
                    req.id,
                    req.requirement_id,
                    req.review_order,
                    req.assigned_voter_ids,
                    r.requirement_no
                FROM requirement_review_meeting_requirements req
                LEFT JOIN requirements r ON req.requirement_id = r.id
                WHERE req.meeting_id = :meeting_id
                ORDER BY req.review_order
            """),
            {"meeting_id": meeting_id}
        )
        meeting_reqs = result.fetchall()

        print(f"\n📝 会议需求及指定投票人员：")
        print("-" * 120)

        for req in meeting_reqs:
            req_id, requirement_id, review_order, voter_ids, req_no = req
            print(f"\n需求 ID: {req_id} | 需求编号: {req_no or requirement_id} | 评审顺序: {review_order}")
            print(f"指定投票人员 IDs: {voter_ids if voter_ids else '未设置'}")

            # 检查每个指定人员是否已投票
            if voter_ids:
                for voter_id in voter_ids:
                    result = await session.execute(
                        text("""
                            SELECT u.username, v.id
                            FROM users u
                            LEFT JOIN requirement_review_votes v ON
                                v.meeting_id = :meeting_id AND
                                v.requirement_id = :requirement_id AND
                                v.voter_id = :voter_id
                            WHERE u.id = :voter_id
                        """),
                        {"meeting_id": meeting_id, "requirement_id": requirement_id, "voter_id": voter_id}
                    )
                    user_vote = result.fetchone()

                    if user_vote:
                        username, vote_id = user_vote
                        status = f"✅ 已投票 (投票ID: {vote_id})" if vote_id else "❌ 未投票"
                        print(f"  - {username} (ID: {voter_id}): {status}")
                    else:
                        print(f"  - 用户ID {voter_id}: ⚠️ 用户不存在")

        # 3. 统计各用户投票情况
        result = await session.execute(
            text("""
                SELECT
                    u.id,
                    u.username,
                    u.full_name,
                    u.role,
                    COUNT(v.id) as vote_count
                FROM users u
                LEFT JOIN requirement_review_meeting_attendees a ON a.attendee_id = u.id AND a.meeting_id = :meeting_id
                LEFT JOIN requirement_review_votes v ON v.meeting_id = :meeting_id AND v.voter_id = u.id
                WHERE a.id IS NOT NULL
                GROUP BY u.id, u.username, u.full_name, u.role
                ORDER BY vote_count DESC, u.username
            """),
            {"meeting_id": meeting_id}
        )
        user_stats = result.fetchall()

        print(f"\n👥 参会人员投票统计：")
        print("-" * 120)
        print(f"{'用户名':<20} {'姓名':<20} {'角色':<25} {'投票数':<10} {'状态':<30}")
        print("-" * 120)

        for stat in user_stats:
            user_id, username, full_name, role, vote_count = stat
            status = "✅ 已投票" if vote_count > 0 else "❌ 未投票"
            print(f"{username:<20} {full_name:<20} {role:<25} {vote_count:<10} {status:<30}")

        # 4. 检查所有可能的错误日志（最近创建的投票记录）
        result = await session.execute(
            text("""
                SELECT
                    v.id,
                    v.voter_id,
                    u.username,
                    v.requirement_id,
                    v.vote_option,
                    v.created_at
                FROM requirement_review_votes v
                JOIN users u ON v.voter_id = u.id
                ORDER BY v.created_at DESC
                LIMIT 10
            """)
        )
        recent_votes = result.fetchall()

        print(f"\n🕐 最近10条投票记录（全局）：")
        print("-" * 120)
        print(f"{'投票ID':<10} {'用户':<20} {'需求ID':<10} {'投票选项':<15} {'时间':<30}")
        print("-" * 120)

        if recent_votes:
            for vote in recent_votes:
                vote_id, voter_id, username, req_id, vote_option, created_at = vote
                print(f"{vote_id:<10} {username:<20} {req_id:<10} {vote_option:<15} {str(created_at):<30}")
        else:
            print("⚠️  数据库中没有任何投票记录")

        print("\n" + "="*120)

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_all_votes())

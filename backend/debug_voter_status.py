"""调试 get_voter_status 方法"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://ipd_user:ipd_pass@localhost:5432/ipd_req_db"

async def debug_voter_status():
    """调试投票人员状态"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        meeting_id = 59
        requirement_id = 20

        # 1. 获取会议需求关联记录
        result = await session.execute(
            text("""
                SELECT id, requirement_id, assigned_voter_ids
                FROM requirement_review_meeting_requirements
                WHERE meeting_id = :meeting_id AND requirement_id = :requirement_id
            """),
            {"meeting_id": meeting_id, "requirement_id": requirement_id}
        )
        meeting_req = result.fetchone()

        if not meeting_req:
            print("❌ 会议需求不存在")
            return

        req_id, req_id2, assigned_voter_ids = meeting_req
        print(f"✅ 会议需求 ID: {req_id}")
        print(f"✅ 指定投票人 IDs: {assigned_voter_ids}")

        # 2. 获取所有投票记录
        result = await session.execute(
            text("""
                SELECT id, voter_id, vote_option
                FROM requirement_review_votes
                WHERE meeting_id = :meeting_id
                  AND requirement_id = :requirement_id
                  AND voter_id = ANY(:voter_ids)
            """),
            {"meeting_id": meeting_id, "requirement_id": requirement_id, "voter_ids": list(assigned_voter_ids)}
        )
        votes = result.fetchall()

        print(f"\n📊 投票记录（{len(votes)} 条）：")
        vote_map = {}
        for vote in votes:
            vote_id, voter_id, vote_option = vote
            print(f"   投票ID: {vote_id}, 投票人ID: {voter_id}, 选项: {vote_option}")
            vote_map[voter_id] = vote

        # 3. 获取用户信息
        result = await session.execute(
            text("""
                SELECT id, username, full_name
                FROM users
                WHERE id = ANY(:voter_ids)
            """),
            {"voter_ids": list(assigned_voter_ids)}
        )
        users = result.fetchall()

        print(f"\n👥 用户信息（{len(users)} 条）：")
        user_map = {}
        for user in users:
            user_id, username, full_name = user
            print(f"   用户ID: {user_id}, 用户名: {username}, 姓名: {full_name}")
            user_map[user_id] = user

        # 4. 模拟 current_voter_id 逻辑
        print(f"\n🔍 计算 current_voter_id：")
        current_voter_id = None

        for voter_id in assigned_voter_ids:
            user = user_map.get(voter_id)
            vote = vote_map.get(voter_id)

            print(f"\n   检查投票人 ID: {voter_id}")
            print(f"   - 用户存在: {'是' if user else '否'}")
            print(f"   - 已投票: {'是' if vote else '否'}")

            if user:
                has_voted = vote is not None
                if has_voted:
                    print(f"   - 已投票，跳过")
                elif current_voter_id is None:
                    print(f"   - ✓ 设为当前投票人！")
                    current_voter_id = voter_id
                else:
                    print(f"   - 未投票，但已有其他当前投票人")

        print(f"\n📌 最终 current_voter_id: {current_voter_id}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(debug_voter_status())

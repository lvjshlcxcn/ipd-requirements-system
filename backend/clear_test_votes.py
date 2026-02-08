"""清除测试投票记录"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://ipd_user:ipd_pass@localhost:5432/ipd_req_db"

async def clear_votes():
    """清除会议59的投票记录"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        meeting_id = 59
        requirement_id = 20

        # 删除该会议该需求的所有投票
        result = await session.execute(
            text("""
                DELETE FROM requirement_review_votes
                WHERE meeting_id = :meeting_id AND requirement_id = :requirement_id
                RETURNING id, voter_id, vote_option
            """),
            {"meeting_id": meeting_id, "requirement_id": requirement_id}
        )

        deleted_votes = result.fetchall()

        await session.commit()

        print(f"\n✅ 已清除 {len(deleted_votes)} 条投票记录：")
        for vote in deleted_votes:
            print(f"   投票ID: {vote[0]}, 投票人ID: {vote[1]}, 选项: {vote[2]}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(clear_votes())

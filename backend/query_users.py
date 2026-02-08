"""查询数据库中的用户"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

DATABASE_URL = "postgresql+asyncpg://ipd_user:ipd_pass@localhost:5432/ipd_req_db"

async def query_users():
    """查询所有用户"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # 查询所有用户
        result = await session.execute(
            text("SELECT id, username, email, full_name, role, department, is_active FROM users ORDER BY username")
        )
        users = result.fetchall()

        print("\n数据库中的所有用户：")
        print("-" * 120)
        print(f"{'ID':<5} {'用户名':<20} {'邮箱':<35} {'姓名':<20} {'角色':<20} {'状态':<8} {'部门':<15}")
        print("-" * 120)

        for user in users:
            id, username, email, full_name, role, is_active, department = user
            status = "激活" if is_active else "禁用"
            print(f"{id:<5} {username:<20} {email:<35} {full_name or 'N/A':<20} {role:<20} {status:<8} {department or 'N/A':<15}")

        print("-" * 100)
        print(f"总计：{len(users)} 个用户\n")

        # 检查特定用户
        print("\n检查您询问的用户：")
        print("-" * 60)

        target_usernames = ["market_director", "rd_director"]
        for username in target_usernames:
            result = await session.execute(
                text("SELECT * FROM users WHERE username = :username"),
                {"username": username}
            )
            user = result.fetchone()
            if user:
                print(f"✅ {username}: 存在")
            else:
                print(f"❌ {username}: 不存在")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(query_users())

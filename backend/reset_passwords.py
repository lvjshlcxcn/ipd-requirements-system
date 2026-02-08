"""用户密码管理工具 - 重置所有用户为简单密码"""
import asyncio
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://ipd_user:ipd_pass@localhost:5432/ipd_req_db"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 默认简单密码映射
DEFAULT_PASSWORDS = {
    "admin": "admin123",
    "market_director": "market123",
    "rd_director": "rd123",
    "rd_pm": "rdpm123",
    "market_pm": "marketpm123",
    "sales_manager1": "sales123",
    "pm_user1": "pm123",
    "test_user1": "test123",
    "test_user2": "test123",
    "stakeholder1": "stakeholder123",
}

async def reset_passwords():
    """重置所有用户密码为默认密码"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # 查询所有用户
        result = await session.execute(
            text("SELECT id, username, email, full_name FROM users ORDER BY username")
        )
        users = result.fetchall()

        print("\n📝 用户账号信息（默认密码）：")
        print("=" * 100)
        print(f"{'用户名':<20} {'邮箱':<35} {'姓名':<20} {'默认密码':<15}")
        print("-" * 100)

        for user in users:
            id, username, email, full_name = user
            default_password = DEFAULT_PASSWORDS.get(username, "password123")

            # 生成密码哈希
            hashed_password = pwd_context.hash(default_password)

            # 更新数据库
            await session.execute(
                text("UPDATE users SET hashed_password = :hash WHERE id = :id"),
                {"hash": hashed_password, "id": id}
            )

            print(f"{username:<20} {email:<35} {full_name or 'N/A':<20} {default_password:<15}")

        print("-" * 100)
        print(f"✅ 已重置 {len(users)} 个用户的密码")
        print("\n⚠️  注意：这是测试用的简单密码，生产环境请使用强密码！\n")

        await session.commit()

    await engine.dispose()

if __name__ == "__main__":
    print("⚠️  警告：即将重置所有用户密码为默认简单密码")
    response = input("确认执行？(yes/no): ")
    if response.lower() == "yes":
        asyncio.run(reset_passwords())
    else:
        print("已取消操作")

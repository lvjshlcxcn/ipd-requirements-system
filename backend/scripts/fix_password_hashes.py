"""Fix password hashes in database - convert to bcrypt format."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from app.config import get_settings
from app.core.security import get_password_hash


def fix_password_hashes():
    """Update all user password hashes to bcrypt format."""
    settings = get_settings()

    # 创建同步引擎
    sync_engine = create_engine(settings.DATABASE_URL.replace('+asyncpg', ''))

    # 定义用户密码映射
    users_passwords = {
        "admin": "admin123",
        "pm": "pm123",
        "engineer": "eng123",
    }

    with sync_engine.connect() as conn:
        print("=== 修复用户密码哈希 ===\n")

        for username, password in users_passwords.items():
            # 生成新的 bcrypt 哈希
            new_hash = get_password_hash(password)

            print(f"用户: {username}")
            print(f"密码: {password}")
            print(f"新哈希: {new_hash[:60]}...")
            print(f"哈希长度: {len(new_hash)}")

            # 更新数据库
            result = conn.execute(
                text("UPDATE users SET hashed_password = :hash WHERE username = :username"),
                {"hash": new_hash, "username": username}
            )

            if result.rowcount > 0:
                print(f"✅ 成功更新用户 {username}")
            else:
                print(f"⚠️  用户 {username} 不存在")

            print("---")

        # 提交事务
        conn.commit()
        print("\n所有密码哈希已更新为 bcrypt 格式！")
        print("\n测试账号：")
        print("  - admin / admin123")
        print("  - pm / pm123")
        print("  - engineer / eng123")


if __name__ == "__main__":
    fix_password_hashes()

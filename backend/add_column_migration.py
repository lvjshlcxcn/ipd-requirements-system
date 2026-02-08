#!/usr/bin/env python3
"""添加 assigned_voter_ids 列到数据库"""
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from app.config import get_settings

settings = get_settings()
database_url = settings.DATABASE_URL

print(f"连接数据库: {database_url.split('@')[1] if '@' in database_url else 'local'}")

# 创建引擎
engine = create_engine(database_url)

try:
    with engine.begin() as conn:
        # 添加列
        sql = text("""
            ALTER TABLE requirement_review_meeting_requirements
            ADD COLUMN IF NOT EXISTS assigned_voter_ids JSONB
        """)
        conn.execute(sql)
        print("✅ 成功添加 assigned_voter_ids 列")

        # 验证列是否添加成功
        verify_sql = text("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'requirement_review_meeting_requirements'
            AND column_name = 'assigned_voter_ids'
        """)
        result = conn.execute(verify_sql)
        rows = result.fetchall()

        if rows:
            print("\n✅ 验证成功，列信息:")
            for row in rows:
                print(f"  - {row[0]}: {row[1]}")
        else:
            print("\n⚠️  警告: 未找到列")

    print("\n✅ 迁移完成！")

except Exception as e:
    print(f"\n❌ 错误: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

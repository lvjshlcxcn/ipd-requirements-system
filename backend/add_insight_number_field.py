"""直接添加 insight_number 字段到数据库"""
import sys
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from app.config import get_settings

def add_insight_number_field():
    """添加 insight_number 字段并生成编号"""
    settings = get_settings()
    # 将 asyncpg 替换为 psycopg2 以支持同步操作
    db_url = settings.DATABASE_URL.replace("+asyncpg", "+psycopg2")
    engine = create_engine(db_url)

    with engine.begin() as conn:
        # 1. 检查字段是否已存在
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'insight_analyses'
            AND column_name = 'insight_number'
        """))

        if result.fetchone():
            print("✅ insight_number 字段已存在，跳过创建")
            return

        # 2. 添加字段 (可为 NULL)
        print("📝 添加 insight_number 字段...")
        conn.execute(text("""
            ALTER TABLE insight_analyses
            ADD COLUMN insight_number VARCHAR(50)
        """))

        # 3. 获取所有记录并生成编号
        print("🔢 为现有记录生成编号...")
        result = conn.execute(text("""
            SELECT id FROM insight_analyses ORDER BY id
        """))
        rows = result.fetchall()

        for idx, (row_id,) in enumerate(rows, start=1):
            insight_number = f"Ai-insight-{idx:05d}"
            conn.execute(text("""
                UPDATE insight_analyses
                SET insight_number = :number
                WHERE id = :id
            """), {"number": insight_number, "id": row_id})
            print(f"  ✅ ID {row_id} -> {insight_number}")

        # 4. 设置为 NOT NULL
        print("⚙️ 设置字段为 NOT NULL...")
        conn.execute(text("""
            ALTER TABLE insight_analyses
            ALTER COLUMN insight_number SET NOT NULL
        """))

        # 5. 添加唯一约束
        print("🔒 添加唯一约束...")
        conn.execute(text("""
            ALTER TABLE insight_analyses
            ADD CONSTRAINT uq_insight_analyses_insight_number
            UNIQUE (insight_number)
        """))

        print("✅ 完成！共处理 {} 条记录".format(len(rows)))

if __name__ == "__main__":
    add_insight_number_field()

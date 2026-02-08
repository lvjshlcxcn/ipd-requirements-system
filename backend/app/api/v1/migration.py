"""临时数据库迁移 API（仅用于开发环境）"""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter(tags=["migration"])

@router.post("/migration/add-assigned-voter-ids-column")
async def add_assigned_voter_ids_column():
    """
    添加 assigned_voter_ids 列到 requirement_review_meeting_requirements 表

    注意：此端点仅用于开发环境快速修复数据库结构问题。
    生产环境应该使用 alembic 迁移。
    """
    try:
        from app.config import get_settings
        from sqlalchemy import create_engine

        settings = get_settings()
        engine = create_engine(settings.DATABASE_URL)

        with engine.begin() as conn:
            # 添加列
            sql = text("""
                ALTER TABLE requirement_review_meeting_requirements
                ADD COLUMN IF NOT EXISTS assigned_voter_ids JSONB
            """)
            conn.execute(sql)

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
                return {
                    "success": True,
                    "message": "成功添加 assigned_voter_ids 列",
                    "column_info": [{"name": row[0], "type": row[1]} for row in rows]
                }
            else:
                return {
                    "success": False,
                    "message": "列添加失败或未找到"
                }

    except Exception as e:
        return {
            "success": False,
            "message": f"迁移失败: {str(e)}"
        }

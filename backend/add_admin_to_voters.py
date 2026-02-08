#!/usr/bin/env python3
"""
快速修复：将admin添加到会议54的投票人员列表
"""
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
import json

DATABASE_URL = "postgresql://ipd_user:ipd_pass@localhost:5432/ipd_req_db"
engine = create_engine(DATABASE_URL)

def add_admin_to_voters(meeting_id: int, requirement_id: int):
    """将admin添加到投票人员列表"""

    with engine.connect() as conn:
        print("\n" + "="*60)
        print("添加admin到投票人员列表")
        print("="*60 + "\n")

        # 1. 查询当前状态
        print("📋 当前状态:")
        meeting_req = conn.execute(text("""
            SELECT meeting_id, requirement_id, assigned_voter_ids
            FROM requirement_review_meeting_requirements
            WHERE meeting_id = :meeting_id AND requirement_id = :requirement_id
        """), {"meeting_id": meeting_id, "requirement_id": requirement_id}).fetchone()

        if not meeting_req:
            print(f"❌ 未找到会议 {meeting_id} 和需求 {requirement_id} 的关联记录")
            return

        current_voters = meeting_req[2] or []
        print(f"   当前投票人员: {current_voters}")

        # 2. 查询admin用户ID
        admin = conn.execute(text("""
            SELECT id, username, full_name
            FROM users
            WHERE username = 'admin'
        """)).fetchone()

        if not admin:
            print("❌ 未找到admin用户")
            return

        admin_id = admin[0]
        print(f"   Admin用户: ID={admin_id}, 用户名={admin[1]}")
        print()

        # 3. 检查admin是否已在列表中
        if admin_id in current_voters:
            print(f"✅ Admin (ID={admin_id}) 已经在投票人员列表中")
            return

        # 4. 添加admin到投票列表
        print(f"🔧 正在添加admin到投票人员列表...")

        new_voters = current_voters + [admin_id]
        # 转换为JSON字符串
        new_voters_json = json.dumps(new_voters)

        # 使用cast函数转换类型
        result = conn.execute(text("""
            UPDATE requirement_review_meeting_requirements
            SET assigned_voter_ids = CAST(:voter_ids AS jsonb)
            WHERE meeting_id = :meeting_id AND requirement_id = :requirement_id
            RETURNING assigned_voter_ids
        """), {
            "voter_ids": new_voters_json,
            "meeting_id": meeting_id,
            "requirement_id": requirement_id
        })

        conn.commit()

        updated_voters = result.fetchone()[0]
        print(f"✅ 成功！更新后的投票人员: {updated_voters}")
        print()

        # 5. 验证
        print("🔍 验证更新:")
        verification = conn.execute(text("""
            SELECT assigned_voter_ids
            FROM requirement_review_meeting_requirements
            WHERE meeting_id = :meeting_id AND requirement_id = :requirement_id
        """), {"meeting_id": meeting_id, "requirement_id": requirement_id}).fetchone()

        final_voters = verification[0]
        voter_details = conn.execute(text("""
            SELECT id, username, full_name
            FROM users
            WHERE id = ANY(:voter_ids)
            ORDER BY id
        """), {"voter_ids": final_voters}).fetchall()

        print(f"   最终投票人员列表 ({len(voter_details)}人):")
        for v in voter_details:
            is_admin = " 👈 Admin" if v[0] == admin_id else ""
            print(f"      - ID={v[0]} | {v[1]} | {v[2]}{is_admin}")

        print()
        print("="*60)
        print("✅ 完成！现在admin可以投票了")
        print("="*60)
        print()

if __name__ == "__main__":
    # 会议54, 需求16
    add_admin_to_voters(meeting_id=54, requirement_id=16)

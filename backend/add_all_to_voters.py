#!/usr/bin/env python3
"""
将所有参会人员添加到会议55的投票人员列表
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://ipd_user:ipd_pass@localhost:5432/ipd_req_db"
engine = create_engine(DATABASE_URL)

def add_all_attendees_as_voters(meeting_id: int, requirement_id: int):
    """将所有参会人员添加到投票人员列表"""

    with engine.connect() as conn:
        print("\n" + "="*70)
        print(f"将会议{meeting_id}的所有参会人员添加到投票列表")
        print("="*70 + "\n")

        # 1. 获取所有参会人员
        print("👥 步骤1: 获取参会人员")
        attendees = conn.execute(text("""
            SELECT a.attendee_id, u.username, u.full_name
            FROM requirement_review_meeting_attendees a
            JOIN users u ON a.attendee_id = u.id
            WHERE a.meeting_id = :meeting_id
            ORDER BY a.attendee_id
        """), {"meeting_id": meeting_id}).fetchall()

        attendee_ids = [a[0] for a in attendees]

        print(f"   参会人员 ({len(attendees)}人):")
        for a in attendees:
            print(f"      - ID={a[0]} | {a[1]} | {a[2]}")
        print()

        # 2. 获取当前投票人员
        print("🗳️  步骤2: 查询当前投票人员")
        meeting_req = conn.execute(text("""
            SELECT requirement_id, assigned_voter_ids
            FROM requirement_review_meeting_requirements
            WHERE meeting_id = :meeting_id AND requirement_id = :requirement_id
        """), {"meeting_id": meeting_id, "requirement_id": requirement_id}).fetchone()

        if not meeting_req:
            print(f"   ❌ 未找到会议 {meeting_id} 和需求 {requirement_id} 的关联记录")
            return

        current_voters = meeting_req[1] if meeting_req[1] else []
        print(f"   当前投票人员: {current_voters}")
        print()

        # 3. 更新投票人员列表
        print("🔧 步骤3: 更新投票人员列表")
        print(f"   添加: {set(attendee_ids) - set(current_voters)}")

        # 合并列表（去重）
        new_voters = list(set(current_voters + attendee_ids))
        new_voters.sort()  # 按ID排序
        new_voters_json = json.dumps(new_voters)

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

        print(f"   ✅ 成功！")
        print()

        # 4. 验证结果
        print("✅ 步骤4: 验证结果")
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
            is_new = " 🆕 新添加" if v[0] not in current_voters else ""
            print(f"      - ID={v[0]} | {v[1]} | {v[2]}{is_new}")

        print()
        print("="*70)
        print("🎉 完成！现在所有参会人员都可以投票了")
        print("="*70)
        print()

if __name__ == "__main__":
    # 会议55, 需求20
    add_all_attendees_as_voters(meeting_id=55, requirement_id=20)

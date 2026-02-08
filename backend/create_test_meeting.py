#!/usr/bin/env python3
"""
创建测试会议数据 - 用于测试投票功能
"""
import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from datetime import datetime

DATABASE_URL = "postgresql://ipd_user:ipd_pass@localhost:5432/ipd_req_db"
engine = create_engine(DATABASE_URL)

def create_test_meeting():
    """创建完整的测试会议数据"""

    with engine.connect() as conn:
        print("\n" + "="*70)
        print("创建测试会议 - 投票功能测试")
        print("="*70 + "\n")

        # 使用事务
        trans = conn.begin()

        try:
            # 1. 创建会议
            print("📋 步骤1: 创建会议")

            # 生成会议编号和时间
            meeting_no = f"RM-{datetime.now().strftime('%Y%m%d')}-001"
            now = datetime.now()

            meeting_result = conn.execute(text("""
                INSERT INTO requirement_review_meetings (
                    meeting_no, title, description, scheduled_at, started_at,
                    status, moderator_id, created_by, tenant_id, created_at, updated_at
                )
                VALUES (
                    :meeting_no, :title, :description, :scheduled_at, :started_at,
                    :status, :moderator_id, :created_by, :tenant_id, NOW(), NOW()
                )
                RETURNING id, meeting_no, title, status
            """), {
                "meeting_no": meeting_no,
                "title": "投票功能测试会议",
                "description": "用于测试投票功能的会议",
                "scheduled_at": now,
                "started_at": now,
                "status": "in_progress",
                "moderator_id": 1,
                "created_by": 1,
                "tenant_id": 1
            })

            meeting = meeting_result.fetchone()
            meeting_id = meeting[0]
            print(f"   ✅ 会议创建成功")
            print(f"   - 会议ID: {meeting_id}")
            print(f"   - 会议编号: {meeting[1]}")
            print(f"   - 标题: {meeting[2]}")
            print(f"   - 状态: {meeting[3]} (进行中)")
            print()

            # 2. 添加参会人员
            print("👥 步骤2: 添加参会人员")
            attendees = [
                {"user_id": 1, "name": "admin (系统管理员)"},
                {"user_id": 2, "name": "market_pm (市场产品经理)"},
                {"user_id": 3, "name": "rd_pm (研发产品经理)"}
            ]

            for attendee in attendees:
                conn.execute(text("""
                    INSERT INTO requirement_review_meeting_attendees (meeting_id, attendee_id, tenant_id, created_at, updated_at)
                    VALUES (:meeting_id, :attendee_id, :tenant_id, NOW(), NOW())
                """), {
                    "meeting_id": meeting_id,
                    "attendee_id": attendee["user_id"],
                    "tenant_id": 1
                })
                print(f"   - {attendee['name']} (ID={attendee['user_id']})")

            print(f"   ✅ 添加了 {len(attendees)} 名参会人员")
            print()

            # 3. 获取一个需求ID（使用已存在的需求）
            print("📝 步骤3: 关联需求")
            req = conn.execute(text("""
                SELECT id, requirement_no, title
                FROM requirements
                LIMIT 1
            """)).fetchone()

            if not req:
                print("   ⚠️  数据库中没有需求，创建测试需求...")
                req_result = conn.execute(text("""
                    INSERT INTO requirements (requirement_no, title, description, status, tenant_id, created_by, created_at, updated_at)
                    VALUES (:requirement_no, :title, :description, :status, :tenant_id, :created_by, NOW(), NOW())
                    RETURNING id, requirement_no, title
                """), {
                    "requirement_no": f"REQ-{datetime.now().strftime('%Y%m%d')}-001",
                    "title": "测试需求",
                    "description": "用于测试投票功能的需求",
                    "status": "pending",
                    "tenant_id": 1,
                    "created_by": 1
                })
                req = req_result.fetchone()

            requirement_id = req[0]
            print(f"   ✅ 关联需求:")
            print(f"   - 需求ID: {requirement_id}")
            print(f"   - 编号: {req[1]}")
            print(f"   - 标题: {req[2]}")
            print()

            # 4. 关联会议和需求，并设置投票人员
            print("🗳️  步骤4: 设置投票人员")
            voter_ids = [1, 2, 3]  # admin, market_pm, rd_pm 都可以投票

            conn.execute(text("""
                INSERT INTO requirement_review_meeting_requirements (meeting_id, requirement_id, assigned_voter_ids, tenant_id, created_at, updated_at)
                VALUES (:meeting_id, :requirement_id, CAST(:voter_ids AS jsonb), :tenant_id, NOW(), NOW())
                RETURNING assigned_voter_ids
            """), {
                "meeting_id": meeting_id,
                "requirement_id": requirement_id,
                "voter_ids": json.dumps(voter_ids),
                "tenant_id": 1
            })

            print(f"   ✅ 投票人员设置成功:")
            print(f"   - 可投票人数: {len(voter_ids)}")
            print(f"   - 投票人员IDs: {voter_ids}")

            # 查询投票人员详情
            voters = conn.execute(text("""
                SELECT id, username, full_name
                FROM users
                WHERE id = ANY(:ids)
                ORDER BY id
            """), {"ids": voter_ids}).fetchall()

            for v in voters:
                print(f"      - ID={v[0]} | {v[1]} | {v[2]}")

            print()

            # 提交事务
            trans.commit()

            print("="*70)
            print("🎉 测试会议创建成功！")
            print("="*70)
            print()
            print("📋 会议信息:")
            print(f"   - 会议ID: {meeting_id}")
            print(f"   - 标题: 投票功能测试会议")
            print(f"   - 状态: in_progress (进行中)")
            print()
            print("👥 参会人员 (3人):")
            print(f"   - admin (ID=1)")
            print(f"   - market_pm (ID=2)")
            print(f"   - rd_pm (ID=3)")
            print()
            print("🗳️  投票人员:")
            print(f"   - 所有参会人员都可以投票")
            print()
            print("📝 关联需求:")
            print(f"   - 需求ID: {requirement_id}")
            print(f"   - 需求编号: {req[1]}")
            print(f"   - 需求标题: {req[2]}")
            print()
            print("="*70)
            print("✅ 现在可以使用以下账号测试投票:")
            print("   1. admin / admin123")
            print("   2. market_pm / (您的密码)")
            print("   3. rd_pm / (您的密码)")
            print("="*70)
            print()

            return meeting_id, requirement_id

        except Exception as e:
            trans.rollback()
            print(f"❌ 创建失败: {e}")
            raise

if __name__ == "__main__":
    try:
        meeting_id, requirement_id = create_test_meeting()
        print(f"\n✅ 成功！会议ID={meeting_id}, 需求ID={requirement_id}")
        print("\n💡 请刷新浏览器，进入评审中心查看新创建的会议")
    except Exception as e:
        print(f"\n❌ 创建失败: {e}")
        import traceback
        traceback.print_exc()

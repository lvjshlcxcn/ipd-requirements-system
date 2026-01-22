#!/usr/bin/env python3
"""
查看洞察分析结果的脚本

使用方法：
1. 确保后端服务正在运行
2. 运行：python view_insight_results.py
"""

import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import SessionLocal
from app.models.insight import InsightAnalysis
import json

def view_recent_insights(limit=5):
    """查看最近的洞察分析记录"""
    db = SessionLocal()

    try:
        print("=" * 80)
        print("📊 最近的洞察分析记录")
        print("=" * 80)

        # 查询最近的记录
        insights = db.query(InsightAnalysis).order_by(
            InsightAnalysis.created_at.desc()
        ).limit(limit).all()

        if not insights:
            print("\n❌ 没有找到洞察分析记录")
            print("\n提示：请先通过前端界面进行洞察分析")
            return

        print(f"\n找到 {len(insights)} 条记录\n")

        for insight in insights:
            print("-" * 80)
            print(f"🆔 ID: {insight.id}")
            print(f"⏰ 创建时间: {insight.created_at}")
            print(f"📝 输入文本: {insight.input_text[:100]}...")
            print(f"📏 文本长度: {insight.text_length} 字符")
            print(f"🎯 分析模式: {insight.analysis_mode}")
            print(f"⏱️  分析时长: {insight.analysis_duration} 秒")
            print(f"📊 状态: {insight.status}")

            # IPD十问
            print("\n【IPD需求十问】")
            questions = [
                ("q1_who", "谁提出的需求"),
                ("q2_why", "为什么提出"),
                ("q3_what_problem", "什么问题"),
                ("q4_current_solution", "当前解决方案"),
                ("q5_current_issues", "当前存在的问题"),
                ("q6_ideal_solution", "理想解决方案"),
                ("q7_priority", "优先级"),
                ("q8_frequency", "频率"),
                ("q9_impact_scope", "影响范围"),
                ("q10_value", "价值"),
            ]

            for field, label in questions:
                value = getattr(insight, field, None)
                if value:
                    # 截断过长的值
                    display_value = value[:200] + "..." if len(str(value)) > 200 else value
                    print(f"  {label}:\n    {display_value}")

            # 扩展信息
            print("\n【扩展分析】")

            if insight.user_persona:
                print(f"  👤 用户画像:")
                user_persona = insight.user_persona if isinstance(insight.user_persona, dict) else json.loads(insight.user_persona)
                for key, value in user_persona.items():
                    print(f"    {key}: {value}")

            if insight.scenario:
                print(f"  🎯 场景:")
                scenario = insight.scenario if isinstance(insight.scenario, dict) else json.loads(insight.scenario)
                for key, value in scenario.items():
                    print(f"    {key}: {value}")

            if insight.emotional_tags:
                print(f"  💭 情感标签:")
                emotional_tags = insight.emotional_tags if isinstance(insight.emotional_tags, dict) else json.loads(insight.emotional_tags)
                for key, value in emotional_tags.items():
                    print(f"    {key}: {value}")

            print("\n" + "=" * 80 + "\n")

    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def view_insight_detail(insight_id: int):
    """查看某个洞察的完整详情"""
    db = SessionLocal()

    try:
        print("=" * 80)
        print(f"📊 洞察分析详情 - ID: {insight_id}")
        print("=" * 80)

        insight = db.query(InsightAnalysis).filter(
            InsightAnalysis.id == insight_id
        ).first()

        if not insight:
            print(f"\n❌ 未找到ID为 {insight_id} 的洞察记录")
            return

        print(f"\n🆔 ID: {insight.id}")
        print(f"⏰ 创建时间: {insight.created_at}")
        print(f"📝 输入来源: {insight.input_source}")
        print(f"🎯 分析模式: {insight.analysis_mode}")
        print(f"⏱️  分析时长: {insight.analysis_duration} 秒")
        print(f"📊 状态: {insight.status}")
        print(f"👤 创建者ID: {insight.created_by}")

        print("\n【输入文本】")
        print(insight.input_text)

        print("\n【完整分析结果】")
        if isinstance(insight.analysis_result, dict):
            print(json.dumps(insight.analysis_result, ensure_ascii=False, indent=2))
        else:
            print(insight.analysis_result)

        print("\n" + "=" * 80)

    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="查看洞察分析结果")
    parser.add_argument("--id", type=int, help="查看特定ID的洞察详情")
    parser.add_argument("--limit", type=int, default=5, help="显示最近的N条记录")

    args = parser.parse_args()

    if args.id:
        view_insight_detail(args.id)
    else:
        view_recent_insights(args.limit)

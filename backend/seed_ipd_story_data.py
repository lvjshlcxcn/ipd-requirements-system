"""
插入10条用户故事卡片模拟数据

使用方法：
    cd backend
    python seed_ipd_story_data.py
"""
import asyncio
import sys
import os
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# 添加项目路径到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models.ipd_story import IPDTenQuestionsModel, UserStoryModel, INVESTAnalysisModel
from app.config import get_settings

settings = get_settings()


# 模拟数据
MOCK_DATA = [
    {
        "title": "电商卖家快速上架商品",
        "role": "电商卖家",
        "action": "快速录入商品信息并一键上架到多个销售平台",
        "benefit": "节省时间，提高商品曝光率和销售机会",
        "ipd": {
            "q1_who": "电商平台的中小卖家",
            "q2_why": "需要同时在多个平台销售商品，手动重复录入效率低",
            "q3_what_problem": "每次上架新商品需要在淘宝、京东、拼多多等多个平台分别录入，耗时耗力",
            "q4_current_solution": "手动在每个平台后台分别录入商品信息",
            "q5_current_issues": "重复工作量大，容易出错，无法统一管理库存",
            "q6_ideal_solution": "一个界面录入一次，自动同步到所有平台",
            "q7_priority": "high",
            "q8_frequency": "daily",
            "q9_expected_value": "每天节省2-3小时，提高3倍上架效率",
            "q10_success_metrics": "上架时间从30分钟减少到5分钟"
        },
        "invest": {
            "independent": 85,
            "negotiable": 75,
            "valuable": 90,
            "estimable": 80,
            "small": 70,
            "testable": 85
        },
        "acceptance_criteria": [
            "支持至少5个主流电商平台",
            "商品信息一次录入自动同步",
            "支持批量编辑和上架",
            "库存实时同步更新",
            "上架成功率99%以上"
        ]
    },
    {
        "title": "采购经理智能审批采购单",
        "role": "采购经理",
        "action": "自动审批符合规则的采购申请，异常申请转人工审核",
        "benefit": "提高审批效率，减少人工工作量，确保合规性",
        "ipd": {
            "q1_who": "企业的采购部门经理",
            "q2_why": "采购申请数量多，人工审批耗时，影响采购效率",
            "q3_what_problem": "每月数百笔采购申请需要逐一审批，重复性高",
            "q4_current_solution": "人工线下审批，使用Excel表格记录",
            "q5_current_issues": "审批流程不透明，周期长，难以追踪",
            "q6_ideal_solution": "系统根据预设规则自动审批，异常申请预警",
            "q7_priority": "high",
            "q8_frequency": "daily",
            "q9_expected_value": "审批效率提升80%，降低人工错误",
            "q10_success_metrics": "平均审批时间从2天缩短到2小时"
        },
        "invest": {
            "independent": 90,
            "negotiable": 70,
            "valuable": 85,
            "estimable": 85,
            "small": 75,
            "testable": 90
        },
        "acceptance_criteria": [
            "支持自定义审批规则",
            "自动识别异常申请并预警",
            "审批流程全流程可追溯",
            "支持移动端审批",
            "与财务系统无缝对接"
        ]
    },
    {
        "title": "系统管理员一键部署应用",
        "role": "系统管理员",
        "action": "通过可视化界面一键部署应用到生产环境",
        "benefit": "简化部署流程，降低出错风险，提高发布频率",
        "ipd": {
            "q1_who": "IT运维团队和系统管理员",
            "q2_why": "传统部署方式复杂，容易出错，回滚困难",
            "q3_what_problem": "手动部署步骤多，需要SSH到服务器，命令行操作",
            "q4_current_solution": "使用脚本半自动化部署",
            "q5_current_issues": "仍然需要人工干预，环境配置容易不一致",
            "q6_ideal_solution": "Web界面点击部署，自动处理配置和环境",
            "q7_priority": "medium",
            "q8_frequency": "weekly",
            "q9_expected_value": "部署时间从1小时减少到5分钟",
            "q10_success_metrics": "部署成功率提升到99%，回滚时间减少50%"
        },
        "invest": {
            "independent": 75,
            "negotiable": 80,
            "valuable": 88,
            "estimable": 75,
            "small": 65,
            "testable": 80
        },
        "acceptance_criteria": [
            "支持一键部署和回滚",
            "自动检查环境依赖",
            "部署日志完整记录",
            "支持多环境配置",
            "部署失败自动回滚"
        ]
    },
    {
        "title": "财务人员自动生成报表",
        "role": "财务人员",
        "action": "选择报表模板后自动从数据库提取数据生成财务报表",
        "benefit": "减少手工制表时间，提高数据准确性，实时查看财务状况",
        "ipd": {
            "q1_who": "公司财务部门会计和财务分析师",
            "q2_why": "每月手工制作Excel报表耗时，容易公式错误",
            "q3_what_problem": "需要从多个系统导出数据，再手工汇总计算",
            "q4_current_solution": "Excel手工制作，使用VLOOKUP等函数",
            "q5_current_issues": "数据更新不及时，公式容易出错，难以协作",
            "q6_ideal_solution": "系统自动从数据库提取数据生成标准报表",
            "q7_priority": "high",
            "q8_frequency": "monthly",
            "q9_expected_value": "报表制作时间从2天缩短到30分钟",
            "q10_success_metrics": "报表准确率100%，支持实时查看"
        },
        "invest": {
            "independent": 88,
            "negotiable": 72,
            "valuable": 92,
            "estimable": 85,
            "small": 78,
            "testable": 88
        },
        "acceptance_criteria": [
            "预设常用财务报表模板",
            "支持自定义报表字段",
            "数据实时更新",
            "支持导出Excel和PDF",
            "报表权限分级管理"
        ]
    },
    {
        "title": "产品经理查看用户反馈",
        "role": "产品经理",
        "action": "在一个界面查看所有渠道的用户反馈并进行分类处理",
        "benefit": "全面了解用户需求，快速响应问题，优化产品体验",
        "ipd": {
            "q1_who": "互联网产品经理",
            "q2_why": "用户反馈分散在多个渠道，难以统一管理和跟进",
            "q3_what_problem": "反馈在App评论、客服系统、邮件、社交媒体等多个地方",
            "q4_current_solution": "人工登录各个平台查看并手工记录",
            "q5_current_issues": "容易遗漏反馈，无法统计趋势，跟进不及时",
            "q6_ideal_solution": "系统自动聚合所有渠道反馈，支持分类和跟进",
            "q7_priority": "medium",
            "q8_frequency": "daily",
            "q9_expected_value": "用户问题响应时间缩短70%，提升满意度",
            "q10_success_metrics": "反馈处理率提升50%，用户满意度提升20%"
        },
        "invest": {
            "independent": 80,
            "negotiable": 78,
            "valuable": 85,
            "estimable": 80,
            "small": 72,
            "testable": 82
        },
        "acceptance_criteria": [
            "支持至少5个反馈渠道",
            "自动分类和标签",
            "反馈趋势统计图表",
            "支持指派处理人",
            "处理进度提醒通知"
        ]
    },
    {
        "title": "销售人员快速查询库存",
        "role": "销售人员",
        "action": "通过手机随时查询各地仓库的实时库存",
        "benefit": "准确答复客户库存情况，提高成交率，避免超卖",
        "ipd": {
            "q1_who": "一线销售人员和销售代表",
            "q2_why": "客户咨询时需要快速确认库存，避免承诺无法交付",
            "q3_what_problem": "库存分散在多个仓库，无法实时查询",
            "q4_current_solution": "打电话回公司询问库存人员",
            "q5_current_issues": "响应慢，信息不准确，影响客户体验",
            "q6_ideal_solution": "手机App实时查询所有仓库库存",
            "q7_priority": "high",
            "q8_frequency": "daily",
            "q9_expected_value": "客户询盘转化率提升15%",
            "q10_success_metrics": "库存查询响应时间<3秒，准确率99%"
        },
        "invest": {
            "independent": 92,
            "negotiable": 70,
            "valuable": 90,
            "estimable": 88,
            "small": 85,
            "testable": 90
        },
        "acceptance_criteria": [
            "支持扫码查询商品",
            "显示所有仓库库存",
            "在途库存也一并显示",
            "支持离线缓存",
            "库存预警提醒"
        ]
    },
    {
        "title": "客服人员快速检索知识库",
        "role": "客服人员",
        "action": "通过关键词快速搜索解决方案，准确回复客户问题",
        "benefit": "提高首次解决率，减少查询时间，提升客户满意度",
        "ipd": {
            "q1_who": "客户服务团队",
            "q2_why": "客户问题种类多，需要快速找到标准答案",
            "q3_what_problem": "知识库文档多，查找困难，新人上手慢",
            "q4_current_solution": "在Word文档或Wiki中手工搜索",
            "q5_current_issues": "搜索不准确，文档更新不及时",
            "q6_ideal_solution": "智能搜索引擎，支持自然语言查询",
            "q7_priority": "medium",
            "q8_frequency": "daily",
            "q9_expected_value": "平均问题处理时间缩短40%",
            "q10_success_metrics": "首次解决率提升到85%"
        },
        "invest": {
            "independent": 85,
            "negotiable": 75,
            "valuable": 82,
            "estimable": 78,
            "small": 70,
            "testable": 80
        },
        "acceptance_criteria": [
            "支持模糊搜索",
            "搜索结果按相关性排序",
            "支持标签分类浏览",
            "知识库文章可一键复制",
            "支持收藏常用解决方案"
        ]
    },
    {
        "title": "HR专员自动筛选简历",
        "role": "HR专员",
        "action": "根据职位要求自动筛选和评分简历，推荐最佳候选人",
        "benefit": "减少简历筛选时间，提高招聘质量，标准化筛选流程",
        "ipd": {
            "q1_who": "人力资源招聘团队",
            "q2_why": "收到的简历数量大，手工筛选效率低且容易漏掉优秀候选人",
            "q3_what_problem": "每个职位收到上百份简历，需要逐一查看",
            "q4_current_solution": "人工下载简历逐一阅读",
            "q5_current_issues": "标准不一致，优秀简历可能被漏掉",
            "q6_ideal_solution": "AI自动解析简历，匹配职位要求并打分",
            "q7_priority": "medium",
            "q8_frequency": "weekly",
            "q9_expected_value": "简历筛选时间减少70%",
            "q10_success_metrics": "推荐候选人准确率达到80%以上"
        },
        "invest": {
            "independent": 78,
            "negotiable": 70,
            "valuable": 88,
            "estimable": 72,
            "small": 68,
            "testable": 75
        },
        "acceptance_criteria": [
            "支持解析主流简历格式",
            "自动提取关键信息",
            "智能匹配职位要求",
            "生成候选人评分报告",
            "支持批量导入简历"
        ]
    },
    {
        "title": "运营人员创建营销活动",
        "role": "运营人员",
        "action": "通过拖拽方式快速创建营销落地页，无需编程",
        "benefit": "快速上线营销活动，降低技术依赖，提高转化率",
        "ipd": {
            "q1_who": "市场运营团队",
            "q2_why": "营销活动需要快速响应市场，等待开发排期太长",
            "q3_what_problem": "每次创建落地页都需要找设计和开发，周期长",
            "q4_current_solution": "找技术开发静态HTML页面",
            "q5_current_issues": "沟通成本高，修改不便，错过营销时机",
            "q6_ideal_solution": "可视化编辑器，拖拽组件生成页面",
            "q7_priority": "high",
            "q8_frequency": "weekly",
            "q9_expected_value": "落地页上线时间从1周缩短到1小时",
            "q10_success_metrics": "营销活动数量提升3倍"
        },
        "invest": {
            "independent": 70,
            "negotiable": 85,
            "valuable": 90,
            "estimable": 75,
            "small": 65,
            "testable": 78
        },
        "acceptance_criteria": [
            "提供丰富的组件库",
            "支持移动端预览",
            "支持A/B测试",
            "表单数据自动收集",
            "页面性能自动优化"
        ]
    },
    {
        "title": "数据分析师自助查询数据",
        "role": "数据分析师",
        "action": "通过自然语言查询数据库，自动生成可视化报表",
        "benefit": "降低数据分析门槛，提高查询效率，赋能业务人员",
        "ipd": {
            "q1_who": "数据分析师和业务人员",
            "q2_why": "每次数据查询都需要依赖技术人员，响应慢",
            "q3_what_problem": "不会写SQL，需要向数据工程师提需求排期",
            "q4_current_solution": "向技术团队提交数据需求单",
            "q5_current_issues": "周期长，无法快速迭代分析",
            "q6_ideal_solution": "用自然语言提问，系统自动生成SQL和图表",
            "q7_priority": "medium",
            "q8_frequency": "daily",
            "q9_expected_value": "数据查询时间从2天缩短到5分钟",
            "q10_success_metrics": "业务人员自助查询率提升到70%"
        },
        "invest": {
            "independent": 72,
            "negotiable": 80,
            "valuable": 85,
            "estimable": 70,
            "small": 60,
            "testable": 72
        },
        "acceptance_criteria": [
            "支持自然语言提问",
            "自动生成SQL并优化",
            "多种可视化图表",
            "支持导出和分享",
            "查询历史记录"
        ]
    }
]


async def seed_data():
    """插入模拟数据到数据库"""
    # 创建数据库引擎
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session_maker() as session:
        try:
            for i, data in enumerate(MOCK_DATA, 1):
                print(f"\n{'='*60}")
                print(f"正在插入第 {i} 条数据: {data['title']}")
                print(f"{'='*60}")

                # 1. 创建 IPD 十问记录
                ipd = IPDTenQuestionsModel(
                    tenant_id=1,
                    created_by=1,
                    **data['ipd']
                )
                session.add(ipd)
                await session.flush()
                print(f"✓ IPD 十问已创建 (ID: {ipd.id})")

                # 2. 创建用户故事
                user_story = UserStoryModel(
                    tenant_id=1,
                    created_by=1,
                    title=data['title'],
                    role=data['role'],
                    action=data['action'],
                    benefit=data['benefit'],
                    priority=data['ipd']['q7_priority'],
                    frequency=data['ipd']['q8_frequency'],
                    acceptance_criteria=data['acceptance_criteria'],
                    ipd_question_id=ipd.id
                )
                session.add(user_story)
                await session.flush()
                print(f"✓ 用户故事已创建 (ID: {user_story.id})")

                # 3. 创建 INVEST 分析
                scores = data['invest']
                total_score = sum(scores.values())
                average_score = total_score / 6

                invest = INVESTAnalysisModel(
                    tenant_id=1,
                    created_by=1,
                    story_id=user_story.id,
                    scores=scores,
                    total_score=total_score,
                    average_score=average_score,
                    suggestions=[]
                )
                session.add(invest)
                await session.flush()
                print(f"✓ INVEST 分析已创建 (ID: {invest.id}, 平均分: {average_score:.1f})")

                print(f"✅ 第 {i} 条数据插入完成！")

            # 提交所有更改
            await session.commit()
            print(f"\n{'='*60}")
            print(f"🎉 成功插入 {len(MOCK_DATA)} 条用户故事卡片数据！")
            print(f"{'='*60}")

        except Exception as e:
            await session.rollback()
            print(f"\n❌ 插入数据时出错: {str(e)}")
            raise

    await engine.dispose()


if __name__ == "__main__":
    print("\n开始插入用户故事卡片模拟数据...")
    print("="*60)
    asyncio.run(seed_data())
    print("\n脚本执行完成！")

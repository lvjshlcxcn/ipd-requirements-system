"""
IPD 需求十问 → 用户故事 → INVEST 分析服务
"""
from datetime import datetime
from typing import List, Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas.ipd_story import (
    IPDTenQuestionsCreate,
    IPDTenQuestionsResponse,
    UserStoryCreate,
    UserStoryResponse,
    INVESTAnalysisCreate,
    INVESTAnalysisResponse,
    INVESTScoreData,
    INVESTSuggestion,
    IPDStoryFlowCreate,
    IPDStoryFlowResponse,
)
from app.models.ipd_story import (
    IPDTenQuestionsModel,
    UserStoryModel,
    INVESTAnalysisModel,
)
from app.core.exceptions import AppException


class IPDStoryService:
    """IPD 故事服务"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ==================== IPD 十问 ====================
    async def create_ipd_questions(
        self,
        data: IPDTenQuestionsCreate,
        tenant_id: int,
        created_by: int,
    ) -> IPDTenQuestionsResponse:
        """创建 IPD 十问记录"""
        db_obj = IPDTenQuestionsModel(
            **data.model_dump(),
            tenant_id=tenant_id,
            created_by=created_by,
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return IPDTenQuestionsResponse.model_validate(db_obj)

    async def get_ipd_questions(
        self,
        question_id: int,
        tenant_id: int,
    ) -> Optional[IPDTenQuestionsResponse]:
        """获取 IPD 十问记录"""
        result = await self.db.execute(
            select(IPDTenQuestionsModel).where(
                IPDTenQuestionsModel.id == question_id,
                IPDTenQuestionsModel.tenant_id == tenant_id,
            )
        )
        db_obj = result.scalar_one_or_none()
        if not db_obj:
            return None
        return IPDTenQuestionsResponse.model_validate(db_obj)

    # ==================== 用户故事生成 ====================
    async def generate_user_story(
        self,
        data: IPDTenQuestionsCreate,
        tenant_id: int,
        created_by: int,
    ) -> UserStoryResponse:
        """
        基于 IPD 十问生成用户故事
        使用规则引擎提取角色、行动、价值，并生成验收标准
        """
        # 1. 先保存 IPD 十问
        ipd_questions = await self.create_ipd_questions(data, tenant_id, created_by)

        # 2. 提取用户角色
        role = self._extract_role(data.q1_who)

        # 3. 提取期望行动
        action = self._extract_action(data.q6_ideal_solution)

        # 4. 提取预期价值
        benefit = self._extract_benefit(data.q2_why, data.q10_success_metrics)

        # 5. 生成验收标准
        acceptance_criteria = self._generate_acceptance_criteria(data)

        # 6. 创建用户故事
        story_data = UserStoryCreate(
            title=f"作为{role}，我希望{action}",
            role=role,
            action=action,
            benefit=benefit,
            priority=data.q7_priority,
            frequency=data.q8_frequency,
            acceptance_criteria=acceptance_criteria,
            ipd_question_id=ipd_questions.id,
        )

        story_obj = UserStoryModel(
            **story_data.model_dump(exclude={'acceptance_criteria'}),
            tenant_id=tenant_id,
            created_by=created_by,
        )

        # 保存验收标准（JSON 格式）
        story_obj.acceptance_criteria = acceptance_criteria

        self.db.add(story_obj)
        await self.db.commit()
        await self.db.refresh(story_obj)

        return UserStoryResponse.model_validate(story_obj)

    def _extract_role(self, who_text: str) -> str:
        """从文本中提取用户角色"""
        role_map = {
            '产品经理': '产品经理',
            '销售': '销售人员',
            '客服': '客服人员',
            '运营': '运营人员',
            '用户': '用户',
            '客户': '客户',
            '管理员': '系统管理员',
        }

        for key, value in role_map.items():
            if key in who_text:
                return value

        # 如果没有匹配，返回第一个词
        return who_text.split('、')[0] if '、' in who_text else who_text or '相关人员'

    def _extract_action(self, solution_text: str) -> str:
        """从理想方案中提取期望行动"""
        if '自动' in solution_text:
            return '系统能够自动处理相关流程'
        elif any(keyword in solution_text for keyword in ['导出', '报表']):
            return '能够导出并查看数据报表'
        elif any(keyword in solution_text for keyword in ['搜索', '查找']):
            return '能够快速搜索并找到所需信息'
        elif any(keyword in solution_text for keyword in ['通知', '提醒']):
            return '能够及时接收相关通知'

        # 截取前 30 个字符
        return solution_text[:30] + '...' if len(solution_text) > 30 else solution_text

    def _extract_benefit(self, why_text: str, value_text: Optional[str]) -> str:
        """提取预期价值"""
        if value_text and len(value_text) > 10:
            return value_text
        return why_text

    def _generate_acceptance_criteria(self, data: IPDTenQuestionsCreate) -> List[str]:
        """生成验收标准"""
        criteria = []

        # 基于理想方案生成
        if data.q6_ideal_solution:
            criteria.append(f"能够实现：{data.q6_ideal_solution[:50]}...")

        # 基于问题生成
        if data.q3_what_problem:
            criteria.append(f"解决以下问题：{data.q3_what_problem[:50]}...")

        # 基于频次生成
        frequency_map = {
            'daily': '功能需要在每日高频使用场景下稳定运行',
            'weekly': '功能需要在每周常规使用场景下正常运行',
            'monthly': '功能需要在月度使用场景下正常工作',
            'occasional': '功能在偶尔使用时能够正常响应',
        }
        if data.q8_frequency in frequency_map:
            criteria.append(frequency_map[data.q8_frequency])

        # 确保至少有 3 条
        if len(criteria) < 3:
            criteria.append('功能符合预期用户体验标准')
            criteria.append('通过系统测试验证')

        return criteria[:5]

    # ==================== INVEST 分析 ====================
    async def analyze_invest(
        self,
        story_id: Optional[int],
        scores: INVESTScoreData,
        tenant_id: int,
        created_by: int,
    ) -> INVESTAnalysisResponse:
        """
        执行 INVEST 分析
        计算总分、平均分，并生成改进建议
        """
        # 计算总分（6个维度之和，范围 0-600）
        total_score = (
            scores.independent +
            scores.negotiable +
            scores.valuable +
            scores.estimable +
            scores.small +
            scores.testable
        )

        # 计算平均分（范围 0-100）
        average_score = round(total_score / 6, 2)

        # 生成改进建议
        suggestions = self._generate_invest_suggestions(scores)

        # 创建分析记录
        analysis_data = INVESTAnalysisCreate(
            scores=scores,
            total_score=total_score,
            average_score=average_score,
            story_id=story_id,
        )

        analysis_obj = INVESTAnalysisModel(
            **analysis_data.model_dump(exclude={'suggestions'}),
            suggestions=[s.model_dump() for s in suggestions],
            tenant_id=tenant_id,
            created_by=created_by,
            analyzed_at=datetime.utcnow(),
        )

        self.db.add(analysis_obj)
        await self.db.commit()
        await self.db.refresh(analysis_obj)

        # 构建响应
        return INVESTAnalysisResponse(
            id=analysis_obj.id,
            tenant_id=analysis_obj.tenant_id,
            created_by=analysis_obj.created_by,
            story_id=analysis_obj.story_id,
            scores=analysis_obj.scores,
            total_score=analysis_obj.total_score,
            average_score=analysis_obj.average_score,
            suggestions=suggestions,
            analyzed_at=analysis_obj.analyzed_at,
        )

    def _generate_invest_suggestions(self, scores: INVESTScoreData) -> List[INVESTSuggestion]:
        """生成 INVEST 改进建议"""
        suggestions = []

        if scores.independent < 70:
            suggestions.append(INVESTSuggestion(
                dimension='独立性',
                priority='high',
                content='用户故事应该尽可能独立，不依赖于其他功能。建议检查是否有外部依赖。',
            ))

        if scores.negotiable < 70:
            suggestions.append(INVESTSuggestion(
                dimension='可协商性',
                priority='medium',
                content='用户故事的细节应该是可协商的。避免过于固化的实现方案，保留灵活性。',
            ))

        if scores.valuable < 70:
            suggestions.append(INVESTSuggestion(
                dimension='价值性',
                priority='high',
                content='用户故事必须对用户或业务产生明确价值。建议重新审视故事的价值主张。',
            ))

        if scores.estimable < 70:
            suggestions.append(INVESTSuggestion(
                dimension='可估算性',
                priority='high',
                content='团队应该能够估算完成工作所需的工作量。建议补充技术细节或拆分故事。',
            ))

        if scores.small < 70:
            suggestions.append(INVESTSuggestion(
                dimension='小型',
                priority='medium',
                content='故事要足够小，能在一个迭代周期内完成。建议将大型故事拆分成多个小故事。',
            ))

        if scores.testable < 70:
            suggestions.append(INVESTSuggestion(
                dimension='可测试性',
                priority='high',
                content='故事必须有明确的验收标准。建议完善验收标准，确保可以通过测试验证。',
            ))

        return suggestions

    # ==================== 工作流 ====================
    async def create_workflow(
        self,
        data: IPDStoryFlowCreate,
        tenant_id: int,
        created_by: int,
    ) -> IPDStoryFlowResponse:
        """创建完整工作流"""
        # 1. 生成用户故事（会自动保存 IPD 十问）
        # 处理 dict 或 Pydantic 模型
        if isinstance(data.ipd_data, dict):
            ipd_data = IPDTenQuestionsCreate(**data.ipd_data)
        else:
            ipd_data = IPDTenQuestionsCreate(**data.ipd_data.model_dump())

        user_story = await self.generate_user_story(ipd_data, tenant_id, created_by)

        # 2. 如果有 INVEST 分析，执行分析
        invest_analysis = None
        if data.invest_analysis:
            invest_analysis = await self.analyze_invest(
                story_id=user_story.id,
                scores=data.invest_analysis.scores,
                tenant_id=tenant_id,
                created_by=created_by,
            )

        # 3. 获取 IPD 十问响应
        ipd_response = await self.get_ipd_questions(user_story.ipd_question_id, tenant_id)

        # 4. 生成工作流 ID（使用 user_story.id 以便查询）
        workflow_id = str(user_story.id)

        return IPDStoryFlowResponse(
            workflow_id=workflow_id,
            ipd_data=ipd_response,  # type: ignore
            user_story=user_story,
            invest_analysis=invest_analysis,
            created_at=datetime.utcnow(),
        )

    async def get_workflow(
        self,
        workflow_id: str,
        tenant_id: int,
    ) -> Optional[IPDStoryFlowResponse]:
        """获取工作流 - 通过 story_id 查询"""
        # workflow_id 实际上是 user_story 的 id
        try:
            story_id = int(workflow_id)
        except ValueError:
            return None

        # 查询用户故事
        result = await self.db.execute(
            select(UserStoryModel).where(
                UserStoryModel.id == story_id,
                UserStoryModel.tenant_id == tenant_id,
            )
        )
        story = result.scalar_one_or_none()
        if not story:
            return None

        # 查询 IPD 十问
        ipd_data = await self.get_ipd_questions(story.ipd_question_id, tenant_id)
        if not ipd_data:
            return None

        # 查询 INVEST 分析
        invest_result = await self.db.execute(
            select(INVESTAnalysisModel).where(
                INVESTAnalysisModel.story_id == story_id,
                INVESTAnalysisModel.tenant_id == tenant_id,
            )
        )
        invest = invest_result.scalar_one_or_none()

        invest_analysis = None
        if invest:
            invest_analysis = INVESTAnalysisResponse(
                id=invest.id,
                tenant_id=invest.tenant_id,
                created_by=invest.created_by,
                story_id=invest.story_id,
                scores=invest.scores,
                total_score=invest.total_score,
                average_score=getattr(invest, 'average_score', invest.total_score),
                suggestions=[INVESTSuggestion(**s) if isinstance(s, dict) else s for s in (invest.suggestions or [])],
                analyzed_at=getattr(invest, 'analyzed_at', invest.created_at),
            )

        # 构建用户故事响应
        user_story = UserStoryResponse(
            id=story.id,
            tenant_id=story.tenant_id,
            created_by=story.created_by,
            ipd_question_id=story.ipd_question_id,
            title=story.title,
            role=story.role,
            action=story.action,
            benefit=story.benefit,
            acceptance_criteria=story.acceptance_criteria or [],
            priority=story.priority,
            frequency=getattr(story, 'frequency', None),
            created_at=story.created_at,
        )

        return IPDStoryFlowResponse(
            workflow_id=workflow_id,
            ipd_data=ipd_data,
            user_story=user_story,
            invest_analysis=invest_analysis,
            created_at=story.created_at,
        )

    async def list_workflows(
        self,
        tenant_id: int,
        skip: int = 0,
        limit: int = 10,
        search: str = None,
        order_by_invest: bool = False,
    ) -> List[IPDStoryFlowResponse]:
        """列出工作流 - 查询所有用户故事，支持搜索和按INVEST分数排序"""
        from sqlalchemy import func
        from sqlalchemy.orm import selectinload

        if order_by_invest:
            # 使用 LEFT JOIN 连接 INVEST 分析表，按分数降序排序
            query = (
                select(UserStoryModel, INVESTAnalysisModel)
                .outerjoin(
                    INVESTAnalysisModel,
                    (INVESTAnalysisModel.story_id == UserStoryModel.id) &
                    (INVESTAnalysisModel.tenant_id == UserStoryModel.tenant_id)
                )
                .where(UserStoryModel.tenant_id == tenant_id)
            )

            # 添加搜索条件
            if search:
                search_pattern = f"%{search}%"
                query = query.where(
                    (UserStoryModel.title.ilike(search_pattern)) |
                    (UserStoryModel.role.ilike(search_pattern))
                )

            # 按 INVEST 平均分降序排序（没有分数的排最后）
            query = query.order_by(
                func.coalesce(INVESTAnalysisModel.average_score, 0).desc(),
                UserStoryModel.created_at.desc()
            )

            query = query.offset(skip).limit(limit)

            result = await self.db.execute(query)
            rows = result.all()

            workflows = []
            for story, invest in rows:
                # 查询 IPD 十问
                ipd_data = await self.get_ipd_questions(story.ipd_question_id, tenant_id)

                # 构建 INVEST 分析响应
                invest_analysis = None
                if invest:
                    invest_analysis = INVESTAnalysisResponse(
                        id=invest.id,
                        tenant_id=invest.tenant_id,
                        created_by=invest.created_by,
                        story_id=invest.story_id,
                        scores=invest.scores,
                        total_score=invest.total_score,
                        average_score=getattr(invest, 'average_score', invest.total_score),
                        suggestions=[INVESTSuggestion(**s) if isinstance(s, dict) else s for s in (invest.suggestions or [])],
                        analyzed_at=getattr(invest, 'analyzed_at', invest.created_at),
                    )

                # 构建用户故事响应
                user_story = UserStoryResponse(
                    id=story.id,
                    tenant_id=story.tenant_id,
                    created_by=story.created_by,
                    ipd_question_id=story.ipd_question_id,
                    title=story.title,
                    role=story.role,
                    action=story.action,
                    benefit=story.benefit,
                    acceptance_criteria=story.acceptance_criteria or [],
                    priority=story.priority,
                    frequency=getattr(story, 'frequency', None),
                    created_at=story.created_at,
                )

                workflows.append(IPDStoryFlowResponse(
                    workflow_id=str(story.id),
                    ipd_data=ipd_data,  # type: ignore
                    user_story=user_story,
                    invest_analysis=invest_analysis,
                    created_at=story.created_at,
                ))

            return workflows

        else:
            # 原有的查询逻辑（按创建时间排序）
            query = select(UserStoryModel).where(UserStoryModel.tenant_id == tenant_id)

            # 添加搜索条件
            if search:
                search_pattern = f"%{search}%"
                query = query.where(
                    (UserStoryModel.title.ilike(search_pattern)) |
                    (UserStoryModel.role.ilike(search_pattern))
                )

            query = query.order_by(UserStoryModel.created_at.desc()).offset(skip).limit(limit)

        result = await self.db.execute(query)
        stories = result.scalars().all()

        workflows = []
        for story in stories:
            # 查询 IPD 十问
            ipd_data = await self.get_ipd_questions(story.ipd_question_id, tenant_id)

            # 查询 INVEST 分析
            invest_result = await self.db.execute(
                select(INVESTAnalysisModel).where(
                    INVESTAnalysisModel.story_id == story.id,
                    INVESTAnalysisModel.tenant_id == tenant_id,
                )
            )
            invest = invest_result.scalar_one_or_none()

            invest_analysis = None
            if invest:
                invest_analysis = INVESTAnalysisResponse(
                    id=invest.id,
                    tenant_id=invest.tenant_id,
                    created_by=invest.created_by,
                    story_id=invest.story_id,
                    scores=invest.scores,
                    total_score=invest.total_score,
                    average_score=getattr(invest, 'average_score', invest.total_score),
                    suggestions=[INVESTSuggestion(**s) if isinstance(s, dict) else s for s in (invest.suggestions or [])],
                    analyzed_at=getattr(invest, 'analyzed_at', invest.created_at),
                )

            # 构建用户故事响应
            user_story = UserStoryResponse(
                id=story.id,
                tenant_id=story.tenant_id,
                created_by=story.created_by,
                ipd_question_id=story.ipd_question_id,
                title=story.title,
                role=story.role,
                action=story.action,
                benefit=story.benefit,
                acceptance_criteria=story.acceptance_criteria or [],
                priority=story.priority,
                frequency=getattr(story, 'frequency', None),
                created_at=story.created_at,
            )

            workflows.append(IPDStoryFlowResponse(
                workflow_id=str(story.id),
                ipd_data=ipd_data,  # type: ignore
                user_story=user_story,
                invest_analysis=invest_analysis,
                created_at=story.created_at,
            ))

        return workflows

    async def delete_workflow(
        self,
        workflow_id: str,
        tenant_id: int,
    ) -> bool:
        """
        删除工作流

        根据 workflow_id（实际是 user_story.id）删除整个工作流
        包括 INVEST 分析、用户故事和 IPD 十问
        """
        from sqlalchemy import delete as sqlalchemy_delete

        try:
            # 将 workflow_id 转换为整数（user_story.id）
            story_id = int(workflow_id)
        except ValueError:
            return False

        # 1. 查询用户故事
        story_result = await self.db.execute(
            select(UserStoryModel).where(
                UserStoryModel.id == story_id,
                UserStoryModel.tenant_id == tenant_id,
            )
        )
        story = story_result.scalar_one_or_none()

        if not story:
            return False

        # 2. 删除 INVEST 分析（如果有）
        try:
            await self.db.execute(
                sqlalchemy_delete(INVESTAnalysisModel).where(
                    INVESTAnalysisModel.story_id == story_id,
                    INVESTAnalysisModel.tenant_id == tenant_id,
                )
            )
        except Exception as e:
            # INVEST 删除失败不影响整体删除流程，记录日志继续
            pass

        # 3. 删除用户故事
        await self.db.execute(
            sqlalchemy_delete(UserStoryModel).where(
                UserStoryModel.id == story_id,
                UserStoryModel.tenant_id == tenant_id,
            )
        )

        # 4. 删除 IPD 十问（如果有）
        if story.ipd_question_id:
            try:
                await self.db.execute(
                    sqlalchemy_delete(IPDTenQuestionsModel).where(
                        IPDTenQuestionsModel.id == story.ipd_question_id,
                        IPDTenQuestionsModel.tenant_id == tenant_id,
                    )
                )
            except Exception as e:
                # IPD 删除失败不影响整体删除流程，记录日志继续
                pass

        await self.db.commit()
        return True

"""Insight analysis API endpoints."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_db as get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.models.insight import InsightAnalysis, UserStoryboard
from app.schemas.insight import (
    InsightCreate,
    InsightResponse,
    StoryboardCreate,
    StoryboardResponse,
    InsightAnalysisResult,
)
from app.services.llm_service import llm_service
from app.prompts import get_prompt_template

router = APIRouter(prefix="/insights", tags=["Insights"])


async def get_prompt_with_fallback(
    db: AsyncSession,
    template_key: str,
    tenant_id: int
) -> str:
    """
    获取 prompt 模板，优先从数据库读取，回退到硬编码模板

    Args:
        db: 数据库会话
        template_key: 模板标识符 (ipd_ten_questions, quick_insight)
        tenant_id: 租户ID

    Returns:
        Prompt 模板内容
    """
    # 第一步：尝试从数据库获取模板
    try:
        from app.models.prompt_template import PromptTemplate
        from sqlalchemy import select, and_, desc

        stmt = select(PromptTemplate).where(
            and_(
                PromptTemplate.template_key == template_key,
                PromptTemplate.tenant_id == tenant_id,
                PromptTemplate.is_active == True
            )
        ).order_by(desc(PromptTemplate.created_at)).limit(1)

        result = await db.execute(stmt)
        template = result.scalar_one_or_none()

        if template and template.content:
            print(f"✓ 从数据库加载模板 {template_key} (ID: {template.id}, 版本: {template.version})")
            return template.content
        else:
            print(f"⚠️  数据库中未找到模板 {template_key}，使用硬编码模板")
    except Exception as e:
        print(f"✗ 数据库查询失败: {e}，使用硬编码模板")

    # 第二步：回退到硬编码模板（使用 try-except 保护）
    try:
        from app.prompts import get_prompt_template
        prompt_template = get_prompt_template(template_key)
        if prompt_template:
            print(f"✓ 使用硬编码模板 {template_key}")
            return prompt_template
        else:
            print(f"✗ get_prompt_template 返回 None")
    except Exception as e:
        print(f"✗ 加载硬编码模板失败: {e}")

    # 第三步：最终回退 - 内联硬编码模板（永远不会失败）
    print(f"⚠️  使用内联硬编码模板作为最终回退")
    if template_key == "quick_insight":
        return '''
请快速从以下文本中提取核心需求信息(仅前3个问题):

{text}

返回JSON:
{{
  "q1_who": "用户角色",
  "q3_what_problem": "核心问题",
  "q6_ideal_solution": "期望方案",
  "summary": "一句话总结"
}}
'''
    else:  # ipd_ten_questions
        return '''
你是一个专业的产品需求分析师。请从以下客户访谈录音转写文本中,
提取IPD需求十问的信息,并返回JSON格式。

## IPD需求十问说明:
1. 谁关心这个需求?(用户角色、部门、职位)
2. 为什么关心?(动机、背景、KPI压力)
3. 什么问题?(具体痛点、困扰)
4. 当前怎么解决的?(现有方案、工作流程)
5. 有什么问题?(现有方案的不足)
6. 理想方案是什么?(期望的解决方案)
7. 优先级?(紧急程度、重要性)
8. 频次?(问题出现的频率)
9. 影响范围?(涉及多少人、多少业务)
10. 价值衡量?(可量化的收益)

## 客户访谈文本:
{text}

## 请返回JSON格式(严格遵守):
{{
  "q1_who": "用户角色描述",
  "q2_why": "关心原因",
  "q3_what_problem": "具体问题",
  "q4_current_solution": "当前解决方案",
  "q5_current_issues": "当前方案的问题",
  "q6_ideal_solution": "理想方案",
  "q7_priority": "high/medium/low",
  "q8_frequency": "daily/weekly/monthly/occasional",
  "q9_impact_scope": "影响范围描述",
  "q10_value": "可量化的价值",

  "user_persona": {{
    "role": "用户角色",
    "department": "部门",
    "demographics": "人口统计特征",
    "pain_points": ["痛点1", "痛点2", "痛点3"],
    "goals": ["目标1", "目标2"]
  }},

  "scenario": {{
    "context": "场景背景",
    "environment": "环境描述",
    "trigger": "触发条件",
    "frequency": "发生频率"
  }},

  "emotional_tags": {{
    "urgency": "high/medium/low",
    "importance": "high/medium/low",
    "sentiment": "frustrated/neutral/satisfied",
    "emotional_keywords": ["关键词1", "关键词2"]
  }},

  "summary": "一句话总结这个需求洞察"
}}
'''


async def generate_insight_number(db: AsyncSession, tenant_id: int) -> str:
    """
    生成洞察分析编号

    格式: Ai-insight-00001, Ai-insight-00002, ...
    在同一租户下递增
    """
    from sqlalchemy import select, func

    # 获取当前租户下的所有洞察
    stmt = select(InsightAnalysis.insight_number).where(
        InsightAnalysis.tenant_id == tenant_id
    )
    result = await db.execute(stmt)
    insights = result.all()

    if insights:
        # 提取所有编号中的数字部分，找出最大值
        max_number = 0
        for (insight_number,) in insights:
            if insight_number and insight_number.startswith("Ai-insight-"):
                try:
                    number = int(insight_number.split("-")[-1])
                    max_number = max(max_number, number)
                except (ValueError, IndexError):
                    continue
        next_number = max_number + 1
    else:
        # 第一条记录
        next_number = 1

    return f"Ai-insight-{next_number:05d}"


# ========================================================================
# Analysis Endpoints
# ========================================================================

@router.post("/analyze", response_model=InsightResponse)
async def analyze_text_insight(
    request: InsightCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    分析文本洞察

    - **input_text**: 待分析的文本(最长20000字)
    - **input_source**: 输入来源(manual/upload/voice)
    - **analysis_mode**: 分析模式(full/quick)
    """
    try:
        # 确保用户已认证
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="未认证，请先登录",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 1. 验证文本长度
        text_length = len(request.input_text)
        if text_length > 20000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="文本长度超过20000字限制"
            )

        # 2. 获取Prompt模板（优先从数据库，回退到硬编码）
        template_key = "quick_insight" if request.analysis_mode == "quick" else "ipd_ten_questions"
        print(f"DEBUG: 正在获取模板 {template_key}")
        prompt_template = await get_prompt_with_fallback(db, template_key, current_user.tenant_id)
        print(f"DEBUG: 模板长度: {len(prompt_template)}")

        # 3. 调用LLM分析
        start_time = datetime.utcnow()
        try:
            analysis_result_dict = await llm_service.analyze_insight(
                text=request.input_text,
                prompt_template=prompt_template
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI分析失败: {str(e)}"
            )
        end_time = datetime.utcnow()
        duration = int((end_time - start_time).total_seconds())

        # 4. 生成业务编号
        insight_number = await generate_insight_number(db, current_user.tenant_id)

        # 5. 保存分析结果到数据库
        insight = InsightAnalysis(
            tenant_id=current_user.tenant_id,
            insight_number=insight_number,
            input_text=request.input_text,
            text_length=text_length,
            input_source=request.input_source,
            analysis_mode=request.analysis_mode,
            analysis_result=analysis_result_dict,

            # 冗余存储十问字段
            q1_who=analysis_result_dict.get("q1_who"),
            q2_why=analysis_result_dict.get("q2_why"),
            q3_what_problem=analysis_result_dict.get("q3_what_problem"),
            q4_current_solution=analysis_result_dict.get("q4_current_solution"),
            q5_current_issues=analysis_result_dict.get("q5_current_issues"),
            q6_ideal_solution=analysis_result_dict.get("q6_ideal_solution"),
            q7_priority=analysis_result_dict.get("q7_priority"),
            q8_frequency=analysis_result_dict.get("q8_frequency"),
            q9_impact_scope=analysis_result_dict.get("q9_impact_scope"),
            q10_value=analysis_result_dict.get("q10_value"),

            # 扩展信息
            user_persona=analysis_result_dict.get("user_persona"),
            scenario=analysis_result_dict.get("scenario"),
            emotional_tags=analysis_result_dict.get("emotional_tags"),

            # 元数据
            status="draft",
            created_by=current_user.id,
            analysis_duration=duration
        )

        db.add(insight)
        await db.commit()
        await db.refresh(insight)

        return insight

    except HTTPException:
        raise
    except Exception as e:
        # 记录详细错误
        import traceback
        error_detail = f"分析失败: {str(e)}\n{traceback.format_exc()}"
        print(f"ERROR: {error_detail}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI分析失败: {str(e)}"
        )


@router.get("/", response_model=list[InsightResponse])
async def list_insights(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回的记录数"),
    status_filter: Optional[str] = Query(None, description="状态过滤"),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取洞察分析列表"""
    # 确保用户已认证
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未认证，请先登录",
        )

    from sqlalchemy import select

    query = select(InsightAnalysis).where(
        InsightAnalysis.tenant_id == current_user.tenant_id
    )

    if status_filter:
        query = query.where(InsightAnalysis.status == status_filter)

    query = query.order_by(InsightAnalysis.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    insights = result.scalars().all()

    return insights


@router.get("/{insight_id}", response_model=InsightResponse)
async def get_insight(
    insight_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取洞察分析详情"""
    # 确保用户已认证
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未认证，请先登录",
        )

    from sqlalchemy import select

    result = await db.execute(
        select(InsightAnalysis).where(
            InsightAnalysis.id == insight_id,
            InsightAnalysis.tenant_id == current_user.tenant_id
        )
    )
    insight = result.scalar_one_or_none()

    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="洞察分析不存在"
        )

    return insight


@router.put("/{insight_id}", response_model=InsightResponse)
async def update_insight(
    insight_id: int,
    analysis_result: dict,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新洞察分析结果(人工编辑后)"""
    # 确保用户已认证
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未认证，请先登录",
        )

    from sqlalchemy import select

    result = await db.execute(
        select(InsightAnalysis).where(
            InsightAnalysis.id == insight_id,
            InsightAnalysis.tenant_id == current_user.tenant_id
        )
    )
    insight = result.scalar_one_or_none()

    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="洞察分析不存在"
        )

    # 更新分析结果
    insight.analysis_result = analysis_result
    insight.q1_who = analysis_result.get("q1_who")
    insight.q2_why = analysis_result.get("q2_why")
    insight.q3_what_problem = analysis_result.get("q3_what_problem")
    insight.q4_current_solution = analysis_result.get("q4_current_solution")
    insight.q5_current_issues = analysis_result.get("q5_current_issues")
    insight.q6_ideal_solution = analysis_result.get("q6_ideal_solution")
    insight.q7_priority = analysis_result.get("q7_priority")
    insight.q8_frequency = analysis_result.get("q8_frequency")
    insight.q9_impact_scope = analysis_result.get("q9_impact_scope")
    insight.q10_value = analysis_result.get("q10_value")
    insight.user_persona = analysis_result.get("user_persona")
    insight.scenario = analysis_result.get("scenario")
    insight.emotional_tags = analysis_result.get("emotional_tags")
    insight.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(insight)

    return insight


@router.post("/{insight_id}/link-requirement")
async def link_to_requirement(
    insight_id: int,
    requirement_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """关联到需求"""
    # 确保用户已认证
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未认证，请先登录",
        )

    from sqlalchemy import select

    result = await db.execute(
        select(InsightAnalysis).where(
            InsightAnalysis.id == insight_id,
            InsightAnalysis.tenant_id == current_user.tenant_id
        )
    )
    insight = result.scalar_one_or_none()

    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="洞察分析不存在"
        )

    insight.status = "linked"

    # 如果已有故事板,也关联
    for storyboard in insight.storyboards:
        storyboard.linked_requirement_id = requirement_id

    await db.commit()

    return {"message": "已成功关联到需求"}


@router.delete("/{insight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_insight(
    insight_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除洞察分析（级联删除关联的故事板）"""
    # 确保用户已认证
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未认证，请先登录",
        )

    from sqlalchemy import select

    result = await db.execute(
        select(InsightAnalysis).where(
            InsightAnalysis.id == insight_id,
            InsightAnalysis.tenant_id == current_user.tenant_id
        )
    )
    insight = result.scalar_one_or_none()

    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="洞察分析不存在"
        )

    # 级联删除会自动处理关联的 storyboards
    await db.delete(insight)
    await db.commit()

    return None


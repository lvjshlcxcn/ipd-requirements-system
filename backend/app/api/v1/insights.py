"""Insight analysis API endpoints."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user_sync
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


def generate_insight_number(db: Session, tenant_id: int) -> str:
    """
    生成洞察分析编号

    格式: Ai-insight-00001, Ai-insight-00002, ...
    在同一租户下递增
    """
    # 获取当前租户下的所有洞察
    insights = db.query(InsightAnalysis.insight_number).filter(
        InsightAnalysis.tenant_id == tenant_id
    ).all()

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
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db),
):
    """
    分析文本洞察

    - **input_text**: 待分析的文本(最长20000字)
    - **input_source**: 输入来源(manual/upload/voice)
    - **analysis_mode**: 分析模式(full/quick)
    """
    # 1. 验证文本长度
    text_length = len(request.input_text)
    if text_length > 20000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文本长度超过20000字限制"
        )

    # 2. 获取Prompt模板
    prompt_template = get_prompt_template(
        "quick_insight" if request.analysis_mode == "quick" else "ipd_ten_questions"
    )

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
    insight_number = generate_insight_number(db, current_user.tenant_id)

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
    db.commit()
    db.refresh(insight)

    return insight


@router.get("/", response_model=list[InsightResponse])
async def list_insights(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回的记录数"),
    status_filter: Optional[str] = Query(None, description="状态过滤"),
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db),
):
    """获取洞察分析列表"""
    query = db.query(InsightAnalysis).filter(
        InsightAnalysis.tenant_id == current_user.tenant_id
    )

    if status_filter:
        query = query.filter(InsightAnalysis.status == status_filter)

    insights = query.order_by(
        InsightAnalysis.created_at.desc()
    ).offset(skip).limit(limit).all()

    return insights


@router.get("/{insight_id}", response_model=InsightResponse)
async def get_insight(
    insight_id: int,
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db),
):
    """获取洞察分析详情"""
    insight = db.query(InsightAnalysis).filter(
        InsightAnalysis.id == insight_id,
        InsightAnalysis.tenant_id == current_user.tenant_id
    ).first()

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
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db),
):
    """更新洞察分析结果(人工编辑后)"""
    insight = db.query(InsightAnalysis).filter(
        InsightAnalysis.id == insight_id,
        InsightAnalysis.tenant_id == current_user.tenant_id
    ).first()

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

    db.commit()
    db.refresh(insight)

    return insight


@router.post("/{insight_id}/link-requirement")
async def link_to_requirement(
    insight_id: int,
    requirement_id: int,
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db),
):
    """关联到需求"""
    insight = db.query(InsightAnalysis).filter(
        InsightAnalysis.id == insight_id,
        InsightAnalysis.tenant_id == current_user.tenant_id
    ).first()

    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="洞察分析不存在"
        )

    insight.status = "linked"

    # 如果已有故事板,也关联
    for storyboard in insight.storyboards:
        storyboard.linked_requirement_id = requirement_id

    db.commit()

    return {"message": "已成功关联到需求"}


@router.delete("/{insight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_insight(
    insight_id: int,
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db),
):
    """删除洞察分析（级联删除关联的故事板）"""
    insight = db.query(InsightAnalysis).filter(
        InsightAnalysis.id == insight_id,
        InsightAnalysis.tenant_id == current_user.tenant_id
    ).first()

    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="洞察分析不存在"
        )

    # 级联删除会自动处理关联的 storyboards
    db.delete(insight)
    db.commit()

    return None


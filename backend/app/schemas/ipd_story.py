"""
IPD 需求十问 → 用户故事 → INVEST 分析相关 Schemas
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ==================== IPD 需求十问 ====================
class IPDTenQuestionsBase(BaseModel):
    """IPD 需求十问基础模型"""
    q1_who: str = Field(..., description="谁关心这个需求")
    q2_why: str = Field(..., description="为什么关心")
    q3_what_problem: str = Field(..., description="什么问题")
    q4_current_solution: Optional[str] = Field(None, description="当前怎么解决的")
    q5_current_issues: Optional[str] = Field(None, description="有什么问题")
    q6_ideal_solution: str = Field(..., description="理想方案是什么")
    q7_priority: str = Field(..., description="优先级: high/medium/low")
    q8_frequency: str = Field(..., description="频次: daily/weekly/monthly/occasional")
    q9_expected_value: Optional[str] = Field(None, description="预期价值")
    q10_success_metrics: Optional[str] = Field(None, description="成功指标")


class IPDTenQuestionsCreate(IPDTenQuestionsBase):
    """创建 IPD 十问"""
    pass


class IPDTenQuestionsResponse(IPDTenQuestionsBase):
    """IPD 十问响应"""
    id: int
    tenant_id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== 用户故事 ====================
class AcceptanceCriterion(BaseModel):
    """验收标准"""
    content: str = Field(..., description="验收标准内容")
    order: int = Field(..., description="顺序")


class UserStoryBase(BaseModel):
    """用户故事基础模型"""
    title: str = Field(..., description="故事标题")
    role: str = Field(..., description="用户角色")
    action: str = Field(..., description="期望行动")
    benefit: str = Field(..., description="预期价值")
    priority: str = Field(..., description="优先级: high/medium/low")
    frequency: str = Field(..., description="频次: daily/weekly/monthly/occasional")


class UserStoryCreate(UserStoryBase):
    """创建用户故事"""
    acceptance_criteria: List[str] = Field(default_factory=list, description="验收标准列表")
    ipd_question_id: Optional[int] = Field(None, description="关联的 IPD 十问 ID")


class UserStoryResponse(UserStoryBase):
    """用户故事响应"""
    id: int
    tenant_id: int
    created_by: int
    acceptance_criteria: List[str]
    ipd_question_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== INVEST 评分 ====================
class INVESTScoreData(BaseModel):
    """INVEST 评分数据"""
    independent: int = Field(..., ge=0, le=100, description="独立性评分 0-100")
    negotiable: int = Field(..., ge=0, le=100, description="可协商性评分 0-100")
    valuable: int = Field(..., ge=0, le=100, description="价值性评分 0-100")
    estimable: int = Field(..., ge=0, le=100, description="可估算性评分 0-100")
    small: int = Field(..., ge=0, le=100, description="小型评分 0-100")
    testable: int = Field(..., ge=0, le=100, description="可测试性评分 0-100")


class INVESTSuggestion(BaseModel):
    """INVEST 改进建议"""
    dimension: str = Field(..., description="INVEST 维度名称")
    priority: str = Field(..., description="优先级: high/medium/low")
    content: str = Field(..., description="建议内容")
    example: Optional[str] = Field(None, description="示例")


class INVESTAnalysisBase(BaseModel):
    """INVEST 分析基础模型"""
    scores: INVESTScoreData
    total_score: int = Field(..., ge=0, le=600, description="总分（6个维度之和，范围 0-600）")
    average_score: float = Field(..., ge=0, le=100, description="平均分（范围 0-100）")


class INVESTAnalysisCreate(INVESTAnalysisBase):
    """创建 INVEST 分析"""
    story_id: Optional[int] = Field(None, description="关联的用户故事 ID")


class INVESTAnalysisResponse(INVESTAnalysisBase):
    """INVEST 分析响应"""
    id: int
    tenant_id: int
    created_by: int
    story_id: Optional[int]
    suggestions: List[INVESTSuggestion]
    analyzed_at: datetime

    class Config:
        from_attributes = True


# ==================== 工作流 ====================
class IPDStoryFlowCreate(BaseModel):
    """创建工作流"""
    ipd_data: IPDTenQuestionsCreate
    user_story: UserStoryCreate
    invest_analysis: Optional[INVESTAnalysisCreate] = None


class IPDStoryFlowResponse(BaseModel):
    """工作流响应"""
    workflow_id: str
    ipd_data: IPDTenQuestionsResponse
    user_story: UserStoryResponse
    invest_analysis: Optional[INVESTAnalysisResponse]
    created_at: datetime


# ==================== 生成请求 ====================
class GenerateStoryRequest(BaseModel):
    """生成用户故事请求"""
    q1_who: str = Field(..., description="谁关心这个需求")
    q2_why: str = Field(..., description="为什么关心")
    q3_what_problem: str = Field(..., description="什么问题")
    q4_current_solution: Optional[str] = Field(None, description="当前怎么解决的")
    q5_current_issues: Optional[str] = Field(None, description="有什么问题")
    q6_ideal_solution: str = Field(..., description="理想方案是什么")
    q7_priority: str = Field(..., description="优先级")
    q8_frequency: str = Field(..., description="频次")
    q9_impact_scope: Optional[str] = Field(None, description="影响范围")
    q10_value: Optional[str] = Field(None, description="价值衡量")


class AnalyzeINVESTRequest(BaseModel):
    """INVEST 分析请求"""
    story_id: Optional[int] = Field(None, description="用户故事 ID")
    scores: INVESTScoreData

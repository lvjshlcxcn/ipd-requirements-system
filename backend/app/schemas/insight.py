"""Insight analysis schemas."""
from datetime import datetime
from typing import Optional, Dict, Any, List

from pydantic import BaseModel, Field, field_validator, ConfigDict


class InsightCreate(BaseModel):
    """创建洞察分析请求"""

    input_text: str = Field(..., min_length=10, max_length=20000, description="输入文本,最长20000字")
    input_source: str = Field(default="manual", description="输入来源")
    analysis_mode: str = Field(default="full", description="分析模式: full/quick")

    @field_validator('input_source')
    @classmethod
    def validate_input_source(cls, v: str) -> str:
        """验证输入来源"""
        if v not in ['manual', 'upload', 'voice']:
            raise ValueError('input_source must be one of: manual, upload, voice')
        return v

    @field_validator('analysis_mode')
    @classmethod
    def validate_analysis_mode(cls, v: str) -> str:
        """验证分析模式"""
        if v not in ['full', 'quick']:
            raise ValueError('analysis_mode must be either full or quick')
        return v


class UserPersona(BaseModel):
    """用户画像"""

    role: str
    department: str = ""
    demographics: str = ""
    pain_points: List[str] = []
    goals: List[str] = []


class Scenario(BaseModel):
    """场景"""

    context: str
    environment: str = ""
    trigger: str = ""
    frequency: str = ""


class EmotionalTags(BaseModel):
    """情感标签"""

    urgency: str = "medium"
    importance: str = "medium"
    sentiment: str = "neutral"
    emotional_keywords: List[str] = []


class InsightAnalysisResult(BaseModel):
    """AI分析结果"""

    q1_who: str
    q2_why: str
    q3_what_problem: str
    q4_current_solution: str
    q5_current_issues: str
    q6_ideal_solution: str
    q7_priority: str
    q8_frequency: str
    q9_impact_scope: str
    q10_value: str

    user_persona: UserPersona
    scenario: Scenario
    emotional_tags: EmotionalTags
    summary: str


class InsightResponse(BaseModel):
    """洞察分析响应"""

    id: int
    input_text: str
    text_length: int
    analysis_result: InsightAnalysisResult
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StoryboardCreate(BaseModel):
    """创建故事板请求"""

    insight_id: int
    title: str
    description: Optional[str] = None
    card_style: str = "modern"


class StoryboardResponse(BaseModel):
    """故事板响应"""

    id: int
    title: str
    card_data: Dict[str, Any]
    export_image_path: Optional[str]
    linked_requirement_id: Optional[int]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

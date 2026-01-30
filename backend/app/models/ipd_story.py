"""
IPD 需求十问 → 用户故事 → INVEST 分析相关数据库模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship

from app.db.base import Base


class IPDTenQuestionsModel(Base):
    """IPD 需求十问表"""
    __tablename__ = "ipd_ten_questions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False, index=True, comment="租户ID")
    created_by = Column(Integer, nullable=False, comment="创建者ID")

    # 十问字段
    q1_who = Column(String(500), nullable=False, comment="谁关心这个需求")
    q2_why = Column(String(500), nullable=False, comment="为什么关心")
    q3_what_problem = Column(Text, nullable=False, comment="什么问题")
    q4_current_solution = Column(Text, nullable=True, comment="当前怎么解决的")
    q5_current_issues = Column(Text, nullable=True, comment="有什么问题")
    q6_ideal_solution = Column(Text, nullable=False, comment="理想方案是什么")
    q7_priority = Column(String(20), nullable=False, comment="优先级: high/medium/low")
    q8_frequency = Column(String(20), nullable=False, comment="频次: daily/weekly/monthly/occasional")
    q9_expected_value = Column(Text, nullable=True, comment="预期价值")
    q10_success_metrics = Column(Text, nullable=True, comment="成功指标")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, nullable=True)

    # 关系
    user_stories = relationship("UserStoryModel", back_populates="ipd_question")


class UserStoryModel(Base):
    """用户故事表"""
    __tablename__ = "user_stories"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False, index=True, comment="租户ID")
    created_by = Column(Integer, nullable=False, comment="创建者ID")

    # 故事基本信息
    title = Column(String(500), nullable=False, comment="故事标题")
    role = Column(String(200), nullable=False, comment="用户角色")
    action = Column(String(500), nullable=False, comment="期望行动")
    benefit = Column(Text, nullable=False, comment="预期价值")
    priority = Column(String(20), nullable=False, comment="优先级: high/medium/low")
    frequency = Column(String(20), nullable=False, comment="频次: daily/weekly/monthly/occasional")

    # 验收标准（JSON 格式存储）
    acceptance_criteria = Column(JSON, nullable=False, default=list, comment="验收标准列表")

    # 关联
    ipd_question_id = Column(Integer, ForeignKey("ipd_ten_questions.id"), nullable=True)
    ipd_question = relationship("IPDTenQuestionsModel", back_populates="user_stories")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, nullable=True)

    # 关系
    invest_analyses = relationship("INVESTAnalysisModel", back_populates="user_story")


class INVESTAnalysisModel(Base):
    """INVEST 分析表"""
    __tablename__ = "invest_analyses"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False, index=True, comment="租户ID")
    created_by = Column(Integer, nullable=False, comment="创建者ID")

    # 关联用户故事
    story_id = Column(Integer, ForeignKey("user_stories.id"), nullable=True)
    user_story = relationship("UserStoryModel", back_populates="invest_analyses")

    # INVEST 评分（JSON 格式存储）
    scores = Column(JSON, nullable=False, comment="INVEST 六个维度评分")
    total_score = Column(Integer, nullable=False, comment="总分")
    average_score = Column(Float, nullable=False, comment="平均分")

    # 改进建议（JSON 格式存储）
    suggestions = Column(JSON, nullable=False, default=list, comment="改进建议列表")

    # 备注
    notes = Column(Text, nullable=True, comment="备注")

    analyzed_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="分析时间")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

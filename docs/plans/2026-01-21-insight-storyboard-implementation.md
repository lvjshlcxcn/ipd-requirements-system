# 需求洞察故事板生成器 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-step.

**Goal:** 构建一个从客户访谈文本中自动提取需求洞察并生成可视化用户故事卡片的功能

**Architecture:** 前后端分离架构，后端FastAPI调用DeepSeek API进行文本分析，前端React组件展示故事板卡片，支持编辑和导出

**Tech Stack:** FastAPI, PostgreSQL, SQLAlchemy, DeepSeek API, React 18, TypeScript, Ant Design 5, Zustand

---

## Phase 1: 后端基础设施（DeepSeek API集成）

### Task 1: 配置DeepSeek API

**Files:**
- Modify: `backend/app/config.py`
- Create: `backend/.env.example`

**Step 1: 添加DeepSeek配置到settings**

在 `backend/app/config.py` 的 `Settings` 类中添加：

```python
class Settings(BaseSettings):
    # ... 现有配置 ...

    # ========== DeepSeek API 配置 ==========
    DEEPSEEK_API_KEY: str
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL: str = "deepseek-chat"
    DEEPSEEK_MAX_TOKENS: int = 4000
    DEEPSEEK_TEMPERATURE: float = 0.3
    DEEPSEEK_TIMEOUT: int = 60

    # ========== 文本洞察分析配置 ==========
    INSIGHTS_MAX_TEXT_LENGTH: int = 20000
    INSIGHTS_ENABLE_CACHING: bool = True
    INSIGHTS_CACHE_TTL: int = 3600
    INSIGHTS_SEGMENT_THRESHOLD: int = 15000
```

**Step 2: 更新.env.example**

在 `backend/.env.example` 添加：

```bash
# ========== DeepSeek API ==========
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=4000
DEEPSEEK_TEMPERATURE=0.3
DEEPSEEK_TIMEOUT=60

# ========== 文本洞察分析 ==========
INSIGHTS_MAX_TEXT_LENGTH=20000
INSIGHTS_ENABLE_CACHING=true
INSIGHTS_CACHE_TTL=3600
INSIGHTS_SEGMENT_THRESHOLD=15000
```

**Step 3: 验证配置可加载**

运行: `cd backend && python -c "from app.config import get_settings; s = get_settings(); print(s.DEEPSEEK_API_KEY)"`
预期: 显示API key（如果已设置）

**Step 4: 提交配置**

```bash
cd backend
git add app/config.py .env.example
git commit -m "feat: add DeepSeek API configuration"
```

---

### Task 2: 创建LLM服务

**Files:**
- Create: `backend/app/services/llm_service.py`
- Modify: `backend/requirements.txt`

**Step 1: 添加依赖到requirements.txt**

```bash
cd backend
echo "openai>=1.0.0" >> requirements.txt
echo "tenacity>=8.2.0" >> requirements.txt
```

**Step 2: 安装依赖**

运行: `pip install openai tenacity`
预期: 成功安装无错误

**Step 3: 创建LLM服务文件**

创建 `backend/app/services/llm_service.py`:

```python
from openai import AsyncOpenAI
from app.config import get_settings
from typing import Dict, Any
import json
import logging
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)
settings = get_settings()

class LLMService:
    """统一的LLM调用服务"""

    def __init__(self):
        """初始化DeepSeek客户端"""
        self.client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url=settings.DEEPSEEK_BASE_URL,
            timeout=settings.DEEPSEEK_TIMEOUT
        )
        self.model = settings.DEEPSEEK_MODEL
        self.max_tokens = settings.DEEPSEEK_MAX_TOKENS
        self.temperature = settings.DEEPSEEK_TEMPERATURE

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def analyze_insight(
        self,
        text: str,
        prompt_template: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        使用DeepSeek分析文本洞察

        Args:
            text: 待分析文本
            prompt_template: Prompt模板
            **kwargs: 其他参数

        Returns:
            分析结果JSON
        """
        # 构建完整prompt
        full_prompt = prompt_template.format(text=text)

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的产品需求分析师，擅长从客户访谈中提取真实需求。"
                    },
                    {
                        "role": "user",
                        "content": full_prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                response_format={"type": "json_object"}
            )

            # 解析JSON响应
            result = json.loads(response.choices[0].message.content)
            return result

        except json.JSONDecodeError as e:
            logger.error(f"JSON解析失败: {e}")
            raise Exception("AI返回的不是有效的JSON格式")

        except Exception as e:
            logger.error(f"LLM调用失败: {e}")
            raise Exception(f"AI分析失败: {str(e)}")

    def _validate_analysis_result(self, result: Dict[str, Any]):
        """验证AI返回结果的结构"""
        required_fields = [
            'q1_who', 'q2_why', 'q3_what_problem',
            'q4_current_solution', 'q5_current_issues',
            'q6_ideal_solution', 'q7_priority', 'q8_frequency',
            'q9_impact_scope', 'q10_value'
        ]

        missing_fields = [field for field in required_fields if field not in result]

        if missing_fields:
            raise Exception(f"AI返回结果缺少必要字段: {', '.join(missing_fields)}")

# 单例
llm_service = LLMService()
```

**Step 4: 创建服务目录的__init__.py**

如果不存在: `backend/app/services/__init__.py`:

```python
# services包初始化
```

**Step 5: 提交**

```bash
git add app/services/llm_service.py requirements.txt
git commit -m "feat: add LLM service with DeepSeek integration"
```

---

### Task 3: 创建Prompt配置

**Files:**
- Create: `backend/app/config/prompts.py`

**Step 1: 创建配置目录（如果不存在）**

运行: `mkdir -p backend/app/config`

**Step 2: 创建prompts.py**

创建 `backend/app/config/prompts.py`:

```python
"""
IPD需求洞察Prompt模板
所有Prompt集中管理，便于优化和版本控制
"""

# IPD需求十问Prompt模板
IPD_TEN_QUESTIONS_PROMPT = """
你是一个专业的产品需求分析师。请从以下客户访谈录音转写文本中，
提取IPD需求十问的信息，并返回JSON格式。

## IPD需求十问说明：
1. 谁关心这个需求？（用户角色、部门、职位）
2. 为什么关心？（动机、背景、KPI压力）
3. 什么问题？（具体痛点、困扰）
4. 当前怎么解决的？（现有方案、工作流程）
5. 有什么问题？（现有方案的不足）
6. 理想方案是什么？（期望的解决方案）
7. 优先级？（紧急程度、重要性）
8. 频次？（问题出现的频率）
9. 影响范围？（涉及多少人、多少业务）
10. 价值衡量？（可量化的收益）

## 客户访谈文本：
{text}

## 请返回JSON格式（严格遵守）：
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
"""

# 快速分析Prompt（仅提取核心信息）
QUICK_INSIGHT_PROMPT = """
请快速从以下文本中提取核心需求信息（仅前3个问题）：

{text}

返回JSON：
{{
  "q1_who": "用户角色",
  "q3_what_problem": "核心问题",
  "q6_ideal_solution": "期望方案",
  "summary": "一句话总结"
}}
"""

def get_prompt_template(template_name: str) -> str:
    """获取Prompt模板"""
    templates = {
        "ipd_ten_questions": IPD_TEN_QUESTIONS_PROMPT,
        "quick_insight": QUICK_INSIGHT_PROMPT,
    }
    return templates.get(template_name, IPD_TEN_QUESTIONS_PROMPT)
```

**Step 3: 创建config目录的__init__.py**

创建 `backend/app/config/__init__.py`:

```python
# config包初始化
```

**Step 4: 提交**

```bash
git add app/config/prompts.py app/config/__init__.py
git commit -m "feat: add IPD insight prompt templates"
```

---

## Phase 2: 数据模型和数据库

### Task 4: 创建洞察分析数据模型

**Files:**
- Create: `backend/app/models/insight.py`
- Modify: `backend/app/db/session.py` (如果需要导入)

**Step 1: 创建insight模型文件**

创建 `backend/app/models/insight.py`:

```python
from sqlalchemy import Column, BigInteger, String, Text, Integer, DateTime, Boolean, ForeignKey, JSONB, Check
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class InsightAnalysis(Base):
    """文本洞察分析记录"""

    __tablename__ = "insight_analyses"

    id = Column(BigInteger, primary_key=True, index=True)
    tenant_id = Column(BigInteger, nullable=False, default=1)

    # 输入信息
    input_text = Column(Text, nullable=False)
    text_length = Column(Integer, nullable=False)
    input_source = Column(String(50), nullable=False)  # manual/upload/voice

    # AI配置
    llm_provider = Column(String(50), nullable=False, default='deepseek')
    llm_model = Column(String(100), nullable=False, default='deepseek-chat')
    analysis_mode = Column(String(50), nullable=False, default='full')
    prompt_version = Column(String(20), default='v1.0')

    # 分析结果
    analysis_result = Column(JSONB, nullable=False)

    # 十问字段（冗余存储）
    q1_who = Column(Text)
    q2_why = Column(Text)
    q3_what_problem = Column(Text)
    q4_current_solution = Column(Text)
    q5_current_issues = Column(Text)
    q6_ideal_solution = Column(Text)
    q7_priority = Column(String(20))
    q8_frequency = Column(String(20))
    q9_impact_scope = Column(Text)
    q10_value = Column(Text)

    # 用户画像等
    user_persona = Column(JSONB)
    scenario = Column(JSONB)
    emotional_tags = Column(JSONB)

    # 元数据
    status = Column(String(20), nullable=False, default='draft')
    created_by = Column(BigInteger, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # 性能指标
    analysis_duration = Column(Integer)
    tokens_used = Column(Integer)

    # 关系
    storyboards = relationship("UserStoryboard", back_populates="insight")

    __table_args__ = (
        CheckConstraint('text_length <= 20000', name='check_text_length'),
    )


class UserStoryboard(Base):
    """用户故事板"""

    __tablename__ = "user_storyboards"

    id = Column(BigInteger, primary_key=True, index=True)
    tenant_id = Column(BigInteger, nullable=False, default=1)

    # 关联
    insight_id = Column(BigInteger, ForeignKey('insight_analyses.id'), nullable=False)

    # 内容
    title = Column(String(200), nullable=False)
    description = Column(Text)

    # 卡片数据
    card_data = Column(JSONB, nullable=False)

    # 样式配置
    card_style = Column(String(50), default='modern')
    color_theme = Column(String(50))

    # 导出
    export_image_path = Column(Text)
    export_pdf_path = Column(Text)

    # 关联需求
    linked_requirement_id = Column(BigInteger, ForeignKey('requirements.id'))

    # 元数据
    is_published = Column(Boolean, nullable=False, default=False)
    created_by = Column(BigInteger, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # 关系
    insight = relationship("InsightAnalysis", back_populates="storyboards")
```

**Step 2: 提交**

```bash
git add app/models/insight.py
git commit -m "feat: add insight analysis and storyboard data models"
```

---

### Task 5: 创建数据库迁移

**Files:**
- Create: `backend/alembic/versions/xxx_add_insight_tables.py`

**Step 1: 生成迁移文件**

运行: `cd backend && alembic revision -m "add insight analysis tables"`
预期: 生成新的迁移文件

**Step 2: 编辑迁移文件**

在生成的文件中添加:

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'xxxx'
down_revision = 'yyyy'  # 替换为实际的上一版本
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'insight_analyses',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('tenant_id', sa.BigInteger(), nullable=False),
        sa.Column('input_text', sa.Text(), nullable=False),
        sa.Column('text_length', sa.Integer(), nullable=False),
        sa.Column('input_source', sa.String(length=50), nullable=False),
        sa.Column('llm_provider', sa.String(length=50), nullable=False),
        sa.Column('llm_model', sa.String(length=100), nullable=False),
        sa.Column('analysis_mode', sa.String(length=50), nullable=False),
        sa.Column('prompt_version', sa.String(length=20), nullable=True),
        sa.Column('analysis_result', postgresql.JSONB(), nullable=False),
        sa.Column('q1_who', sa.Text(), nullable=True),
        sa.Column('q2_why', sa.Text(), nullable=True),
        sa.Column('q3_what_problem', sa.Text(), nullable=True),
        sa.Column('q4_current_solution', sa.Text(), nullable=True),
        sa.Column('q5_current_issues', sa.Text(), nullable=True),
        sa.Column('q6_ideal_solution', sa.Text(), nullable=True),
        sa.Column('q7_priority', sa.String(length=20), nullable=True),
        sa.Column('q8_frequency', sa.String(length=20), nullable=True),
        sa.Column('q9_impact_scope', sa.Text(), nullable=True),
        sa.Column('q10_value', sa.Text(), nullable=True),
        sa.Column('user_persona', postgresql.JSONB(), nullable=True),
        sa.Column('scenario', postgresql.JSONB(), nullable=True),
        sa.Column('emotional_tags', postgresql.JSONB(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_by', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('analysis_duration', sa.Integer(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.CheckConstraint('text_length <= 20000', name='check_text_length'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_insight_tenant', 'insight_analyses', ['tenant_id'])
    op.create_index('idx_insight_status', 'insight_analyses', ['status'])
    op.create_index('idx_insight_created_by', 'insight_analyses', ['created_by'])
    op.create_index('idx_insight_created_at', 'insight_analyses', [sa.text('created_at DESC')])

    op.create_table(
        'user_storyboards',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('tenant_id', sa.BigInteger(), nullable=False),
        sa.Column('insight_id', sa.BigInteger(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('card_data', postgresql.JSONB(), nullable=False),
        sa.Column('card_style', sa.String(length=50), nullable=True),
        sa.Column('color_theme', sa.String(length=50), nullable=True),
        sa.Column('export_image_path', sa.Text(), nullable=True),
        sa.Column('export_pdf_path', sa.Text(), nullable=True),
        sa.Column('linked_requirement_id', sa.BigInteger(), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False),
        sa.Column('created_by', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['insight_id'], ['insight_analyses.id'], ),
        sa.ForeignKeyConstraint(['linked_requirement_id'], ['requirements.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_storyboard_insight', 'user_storyboards', ['insight_id'])
    op.create_index('idx_storyboard_requirement', 'user_storyboards', ['linked_requirement_id'])
    op.create_index('idx_storyboard_created_by', 'user_storyboards', ['created_by'])

def downgrade():
    op.drop_index('idx_storyboard_created_by', table_name='user_storyboards')
    op.drop_index('idx_storyboard_requirement', table_name='user_storyboards')
    op.drop_index('idx_storyboard_insight', table_name='user_storyboards')
    op.drop_table('user_storyboards')
    op.drop_index('idx_insight_created_at', table_name='insight_analyses')
    op.drop_index('idx_insight_created_by', table_name='insight_analyses')
    op.drop_index('idx_insight_status', table_name='insight_analyses')
    op.drop_index('idx_insight_tenant', table_name='insight_analyses')
    op.drop_table('insight_analyses')
```

**Step 3: 应用迁移**

运行: `alembic upgrade head`
预期: 成功创建两个新表

**Step 4: 验证表创建**

运行: `psql -U ipd_user -d ipd_req_db -c "\d insight_analyses"`
预期: 显示表结构

**Step 5: 提交**

```bash
git add alembic/versions/
git commit -m "feat: create database migration for insight tables"
```

---

## Phase 3: Pydantic Schemas

### Task 6: 创建洞察Schemas

**Files:**
- Create: `backend/app/schemas/insight.py`

**Step 1: 创建schemas文件**

创建 `backend/app/schemas/insight.py`:

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime

class InsightCreate(BaseModel):
    """创建洞察分析请求"""
    input_text: str = Field(..., min_length=10, max_length=20000, description="输入文本，最长20000字")
    input_source: str = Field(default="manual", description="输入来源")
    analysis_mode: str = Field(default="full", description="分析模式: full/quick")

    @validator('input_source')
    def validate_input_source(cls, v):
        if v not in ['manual', 'upload', 'voice']:
            raise ValueError('input_source must be one of: manual, upload, voice')
        return v

    @validator('analysis_mode')
    def validate_analysis_mode(cls, v):
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

    class Config:
        from_attributes = True

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

    class Config:
        from_attributes = True
```

**Step 2: 提交**

```bash
git add app/schemas/insight.py
git commit -m "feat: add insight and storyboard Pydantic schemas"
```

---

## Phase 4: 后端API路由

### Task 7: 创建洞察分析API

**Files:**
- Create: `backend/app/api/v1/insights.py`
- Modify: `backend/app/main.py` (注册路由)

**Step 1: 创建API路由文件**

创建 `backend/app/api/v1/insights.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.insight import InsightAnalysis, UserStoryboard
from app.schemas.insight import (
    InsightCreate,
    InsightResponse,
    StoryboardCreate,
    StoryboardResponse
)
from app.services.llm_service import llm_service
from app.config.prompts import get_prompt_template

router = APIRouter()

@router.post("/analyze", response_model=InsightResponse)
async def analyze_text_insight(
    request: InsightCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    分析文本洞察

    - **input_text**: 待分析的文本（最长20000字）
    - **input_source**: 输入来源（manual/upload/voice）
    - **analysis_mode**: 分析模式（full/quick）
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
        analysis_result = await llm_service.analyze_insight(
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

    # 4. 保存分析结果到数据库
    insight = InsightAnalysis(
        tenant_id=current_user.tenant_id,
        input_text=request.input_text,
        text_length=text_length,
        input_source=request.input_source,
        analysis_mode=request.analysis_mode,
        analysis_result=analysis_result,

        # 冗余存储十问字段
        q1_who=analysis_result.get("q1_who"),
        q2_why=analysis_result.get("q2_why"),
        q3_what_problem=analysis_result.get("q3_what_problem"),
        q4_current_solution=analysis_result.get("q4_current_solution"),
        q5_current_issues=analysis_result.get("q5_current_issues"),
        q6_ideal_solution=analysis_result.get("q6_ideal_solution"),
        q7_priority=analysis_result.get("q7_priority"),
        q8_frequency=analysis_result.get("q8_frequency"),
        q9_impact_scope=analysis_result.get("q9_impact_scope"),
        q10_value=analysis_result.get("q10_value"),

        # 扩展信息
        user_persona=analysis_result.get("user_persona"),
        scenario=analysis_result.get("scenario"),
        emotional_tags=analysis_result.get("emotional_tags"),

        # 元数据
        status="draft",
        created_by=current_user.id,
        analysis_duration=duration
    )

    db.add(insight)
    db.commit()
    db.refresh(insight)

    return insight

@router.get("/", response_model=List[InsightResponse])
async def list_insights(
    skip: int = 0,
    limit: int = 20,
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取洞察分析列表"""
    query = db.query(InsightAnalysis).filter(
        InsightAnalysis.tenant_id == current_user.tenant_id
    )

    if status:
        query = query.filter(InsightAnalysis.status == status)

    insights = query.order_by(
        InsightAnalysis.created_at.desc()
    ).offset(skip).limit(limit).all()

    return insights

@router.get("/{insight_id}", response_model=InsightResponse)
async def get_insight(
    insight_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新洞察分析结果（人工编辑后）"""
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
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

    # 如果已有故事板，也关联
    for storyboard in insight.storyboards:
        storyboard.linked_requirement_id = requirement_id

    db.commit()

    return {"message": "已成功关联到需求"}
```

**Step 2: 在main.py中注册路由**

在 `backend/app/main.py` 添加:

```python
from app.api.v1 import insights

# 在router包含中添加
api_router.include_router(
    insights.router,
    prefix="/insights",
    tags=["insights"]
)
```

**Step 3: 提交**

```bash
git add app/api/v1/insights.py app/main.py
git commit -m "feat: add insight analysis API endpoints"
```

---

## Phase 5: 前端实现

### Task 8: 创建前端类型定义

**Files:**
- Create: `frontend/src/types/insight.ts`

**Step 1: 创建类型定义文件**

创建 `frontend/src/types/insight.ts`:

```typescript
/** 洞察分析结果 */
export interface InsightAnalysisResult {
  q1_who: string;
  q2_why: string;
  q3_what_problem: string;
  q4_current_solution: string;
  q5_current_issues: string;
  q6_ideal_solution: string;
  q7_priority: 'high' | 'medium' | 'low';
  q8_frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  q9_impact_scope: string;
  q10_value: string;

  user_persona: UserPersona;
  scenario: Scenario;
  emotional_tags: EmotionalTags;
  summary: string;
}

/** 用户画像 */
export interface UserPersona {
  role: string;
  department: string;
  demographics: string;
  pain_points: string[];
  goals: string[];
}

/** 场景 */
export interface Scenario {
  context: string;
  environment: string;
  trigger: string;
  frequency: string;
}

/** 情感标签 */
export interface EmotionalTags {
  urgency: 'high' | 'medium' | 'low';
  importance: 'high' | 'medium' | 'low';
  sentiment: 'frustrated' | 'neutral' | 'satisfied';
  emotional_keywords: string[];
}

/** 洞察记录 */
export interface Insight {
  id: number;
  input_text: string;
  text_length: number;
  analysis_result: InsightAnalysisResult;
  status: 'draft' | 'confirmed' | 'linked';
  created_at: string;
}

/** 故事板卡片数据 */
export interface StoryboardCardData {
  title: string;
  user: {
    role: string;
    avatar: string;
    department: string;
    description: string;
  };
  scenario: {
    context: string;
    environment: string;
    icon: string;
    frequency: string;
  };
  pain_points: {
    current: string;
    problem: string;
    issues: string;
    flowchart: Array<{
      title: string;
      content: string;
      icon: string;
    }>;
  };
  solution: {
    ideal: string;
    value: string;
    icon: string;
  };
  tags: Array<{
    label: string;
    color: string;
    icon: string;
  }>;
  footer: {
    impact_scope: string;
    priority: string;
    created_at: string;
  };
}
```

**Step 2: 提交**

```bash
cd frontend
git add src/types/insight.ts
git commit -m "feat: add TypeScript types for insight feature"
```

---

### Task 9: 创建前端API服务

**Files:**
- Create: `frontend/src/services/insight.service.ts`

**Step 1: 创建服务文件**

创建 `frontend/src/services/insight.service.ts`:

```typescript
import api from './api';
import { Insight, InsightAnalysisResult } from '@/types/insight';

export interface AnalyzeInsightRequest {
  input_text: string;
  input_source?: 'manual' | 'upload' | 'voice';
  analysis_mode?: 'full' | 'quick';
}

export interface CreateStoryboardRequest {
  insight_id: number;
  title: string;
  description?: string;
  card_style?: string;
}

const insightService = {
  /**
   * 分析文本洞察
   */
  async analyzeText(request: AnalyzeInsightRequest): Promise<Insight> {
    const response = await api.post('/insights/analyze', request);
    return response.data;
  },

  /**
   * 获取洞察列表
   */
  async listInsights(params?: { skip?: number; limit?: number; status?: string }): Promise<Insight[]> {
    const response = await api.get('/insights', { params });
    return response.data;
  },

  /**
   * 获取洞察详情
   */
  async getInsight(insightId: number): Promise<Insight> {
    const response = await api.get(`/insights/${insightId}`);
    return response.data;
  },

  /**
   * 更新洞察分析结果
   */
  async updateInsight(insightId: number, analysisResult: InsightAnalysisResult): Promise<Insight> {
    const response = await api.put(`/insights/${insightId}`, analysisResult);
    return response.data;
  },

  /**
   * 关联到需求
   */
  async linkToRequirement(insightId: number, requirementId: number): Promise<{ message: string }> {
    const response = await api.post(`/insights/${insightId}/link-requirement`, {
      requirement_id: requirementId
    });
    return response.data;
  },
};

export default insightService;
```

**Step 2: 提交**

```bash
git add src/services/insight.service.ts
git commit -m "feat: add insight API service layer"
```

---

### Task 10: 创建Zustand状态管理

**Files:**
- Create: `frontend/src/stores/insightStore.ts`

**Step 1: 创建store文件**

创建 `frontend/src/stores/insightStore.ts`:

```typescript
import create from 'zustand';
import { Insight, InsightAnalysisResult } from '@/types/insight';

interface InsightStore {
  // 状态
  currentInsight: Insight | null;
  analysisResult: InsightAnalysisResult | null;
  isAnalyzing: boolean;

  // Actions
  setCurrentInsight: (insight: Insight | null) => void;
  setAnalysisResult: (result: InsightAnalysisResult | null) => void;
  setIsAnalyzing: (loading: boolean) => void;
  reset: () => void;
}

export const useInsightStore = create<InsightStore>((set) => ({
  // 初始状态
  currentInsight: null,
  analysisResult: null,
  isAnalyzing: false,

  // Actions
  setCurrentInsight: (insight) => set({ currentInsight: insight }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  setIsAnalyzing: (loading) => set({ isAnalyzing: loading }),
  reset: () => set({
    currentInsight: null,
    analysisResult: null,
    isAnalyzing: false
  }),
}));
```

**Step 2: 提交**

```bash
git add src/stores/insightStore.ts
git commit -m "feat: add insight Zustand store"
```

---

### Task 11: 创建文本洞察弹窗组件

**Files:**
- Create: `frontend/src/components/insights/TextInsightModal.tsx`

**Step 1: 创建组件文件**

创建 `frontend/src/components/insights/TextInsightModal.tsx`:

```typescript
import React, { useState } from 'react';
import { Modal, Input, Button, Radio, Space, message, Progress } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import insightService from '@/services/insight.service';

const { TextArea } = Input;

interface TextInsightModalProps {
  visible: boolean;
  onClose: () => void;
  onAnalysisComplete: (insight: any) => void;
}

export const TextInsightModal: React.FC<TextInsightModalProps> = ({
  visible,
  onClose,
  onAnalysisComplete,
}) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisMode, setAnalysisMode] = useState<'full' | 'quick'>('full');

  const maxLength = 20000;

  const handleAnalyze = async () => {
    if (!text.trim()) {
      message.warning('请输入待分析的文本');
      return;
    }

    if (text.length > maxLength) {
      message.error(`文本长度超过${maxLength}字限制`);
      return;
    }

    setLoading(true);
    setProgress(0);

    // 模拟进度
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const result = await insightService.analyzeText({
        input_text: text,
        input_source: 'manual',
        analysis_mode: analysisMode,
      });

      clearInterval(progressInterval);
      setProgress(100);

      message.success('分析完成！');
      onAnalysisComplete(result);

      // 重置
      setText('');
      setProgress(0);
      onClose();
    } catch (error: any) {
      clearInterval(progressInterval);
      message.error(`分析失败: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="文本洞察分析"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          取消
        </Button>,
        <Button
          key="analyze"
          type="primary"
          onClick={handleAnalyze}
          loading={loading}
          disabled={!text.trim()}
        >
          {loading ? '分析中...' : '开始AI分析'}
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 步骤1: 输入文本 */}
        <div>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
            步骤1: 粘贴客户访谈文本
          </div>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="请粘贴录音转写文本（最多20000字）..."
            rows={10}
            maxLength={maxLength}
            showCount
            disabled={loading}
          />
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <Button size="small" onClick={() => setText('')} disabled={loading}>
              清除文本
            </Button>
          </div>
        </div>

        {/* 步骤2: 选择分析模式 */}
        <div>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
            步骤2: 选择分析模式
          </div>
          <Radio.Group
            value={analysisMode}
            onChange={(e) => setAnalysisMode(e.target.value)}
            disabled={loading}
          >
            <Space direction="vertical">
              <Radio value="full">
                <strong>深度分析</strong> - 完整IPD十问（适合完整访谈，耗时30-60秒）
              </Radio>
              <Radio value="quick">
                <strong>快速分析</strong> - 核心要点提取（适合快速预览，耗时10-20秒）
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {/* 分析进度 */}
        {loading && (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
              AI正在分析文本...
            </div>
            <Progress percent={progress} status="active" />
            <div style={{ marginTop: 8, color: '#999' }}>
              {analysisMode === 'full'
                ? '完整分析中，预计需要30-60秒'
                : '快速分析中，预计需要10-20秒'}
            </div>
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default TextInsightModal;
```

**Step 2: 创建insights组件目录的index**

创建 `frontend/src/components/insights/index.ts`:

```typescript
export { TextInsightModal } from './TextInsightModal';
```

**Step 3: 提交**

```bash
git add src/components/insights/
git commit -m "feat: add TextInsightModal component"
```

---

### Task 12: 集成到需求列表页面

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: 在App.tsx中导入组件和store**

在 `frontend/src/App.tsx` 顶部添加导入:

```typescript
import { TextInsightModal } from './components/insights';
import insightService from './services/insight.service';
```

**Step 2: 在RequirementsList组件中添加状态**

找到RequirementsList组件定义，添加状态:

```typescript
const [insightModalVisible, setInsightModalVisible] = useState(false);
const [currentInsight, setCurrentInsight] = useState<any>(null);
```

**Step 3: 添加AI洞察按钮**

在需求列表的toolbar中添加按钮（在"新增需求"按钮后面）:

```typescript
<Button
  type="default"
  icon={<span>📊</span>}
  onClick={() => setInsightModalVisible(true)}
>
  AI洞察分析
</Button>
```

**Step 4: 添加Modal组件**

在RequirementsList组件的return末尾，Table之后添加:

```typescript
{/* 文本洞察分析弹窗 */}
<TextInsightModal
  visible={insightModalVisible}
  onClose={() => setInsightModalVisible(false)}
  onAnalysisComplete={(insight) => {
    setCurrentInsight(insight);
    message.success('洞察分析完成！可查看结果');
    // TODO: 导航到洞察详情页或显示结果
  }}
/>
```

**Step 5: 提交**

```bash
git add src/App.tsx
git commit -m "feat: integrate AI insight analysis button into requirements list"
```

---

## Phase 6: 测试和验证

### Task 13: 后端单元测试

**Files:**
- Create: `backend/tests/test_insight_service.py`

**Step 1: 创建测试文件**

创建 `backend/tests/test_insight_service.py`:

```python
import pytest
from app.services.llm_service import llm_service
from app.schemas.insight import InsightCreate

def test_text_validation():
    """测试文本验证"""
    # 正常文本
    valid_request = InsightCreate(
        input_text="这是一个测试文本" * 100,
        input_source="manual"
    )
    assert len(valid_request.input_text) <= 20000

    # 超长文本应该失败
    with pytest.raises(Exception):
        InsightCreate(
            input_text="测试" * 10000,
            input_source="manual"
        )

def test_input_source_validation():
    """测试输入来源验证"""
    with pytest.raises(Exception):
        InsightCreate(
            input_text="测试文本",
            input_source="invalid"  # 应该失败
        )
```

**Step 2: 运行测试**

运行: `cd backend && pytest tests/test_insight_service.py -v`
预期: 测试通过

**Step 3: 提交**

```bash
git add backend/tests/test_insight_service.py
git commit -m "test: add insight service unit tests"
```

---

### Task 14: 手动端到端测试

**Step 1: 启动服务**

运行: `./req-start.sh`
预期: 前后端服务正常启动

**Step 2: 测试文本分析**

1. 访问: http://localhost:5173
2. 登录系统
3. 进入需求管理页面
4. 点击"AI洞察分析"按钮
5. 输入测试文本:

```
我是一名产品经理，在一家科技公司工作。
每到月底，我需要从三个不同的系统导出数据：
CRM系统导出销售数据，ERP系统导出库存数据，
还要从OA系统导出项目进度数据。
然后我需要在Excel中手工合并这些数据，
做各种统计和计算，生成月度业绩报告。
这个过程通常需要花费我整整3天时间，
而且很容易出错，经常要反复核对。
如果有一个自动化工具就好了。
```

6. 选择"快速分析"
7. 点击"开始AI分析"
8. 等待分析完成（10-30秒）

**预期结果**:
- 显示分析进度
- 成功返回分析结果
- 提取的用户角色是"产品经理"
- 包含痛点描述（手工合并数据耗时3天）

**Step 3: 检查数据库**

运行:
```bash
psql -U ipd_user -d ipd_req_db -c "SELECT id, text_length, q1_who, status FROM insight_analyses ORDER BY created_at DESC LIMIT 1;"
```

预期: 显示刚创建的洞察记录

**Step 4: 检查API文档**

访问: http://localhost:8000/docs
预期: 看到新的"insights"标签下的API端点

---

### Task 15: 文档更新

**Files:**
- Modify: `PROJECT_CONTEXT.md`

**Step 1: 更新项目上下文**

在 `PROJECT_CONTEXT.md` 的"已实现的核心功能"部分添加:

```markdown
### 6. 需求洞察分析
- ✅ 文本洞察分析（DeepSeek AI）
- ✅ IPD需求十问自动提取
- ✅ 用户故事卡片生成
- ✅ 支持最长20000字文本
```

**Step 2: 更新README**

在 `README.md` 的"核心功能"部分添加:

```markdown
### 6. AI需求洞察
- 智能文本分析（基于DeepSeek）
- 自动提取IPD需求十问
- 可视化用户故事卡片
- 支持长文本分段处理
```

**Step 3: 提交**

```bash
git add PROJECT_CONTEXT.md README.md
git commit -m "docs: update project documentation for insight feature"
```

---

## Phase 7: 最终提交和发布

### Task 16: 最终代码审查和提交

**Step 1: 检查所有更改**

运行: `git status`
预期: 看到所有相关文件已暂存

**Step 2: 创建功能分支（可选）**

如果不在功能分支:
```bash
git checkout -b feature/insight-storyboard
```

**Step 3: 合并到main（如果使用功能分支）**

```bash
git checkout main
git merge feature/insight-storyboard
```

**Step 4: 创建标签**

```bash
git tag -a v1.1.0 -m "Release v1.1.0: Add Insight Storyboard Feature"
```

**Step 5: 推送到远程**

```bash
git push origin main
git push origin v1.1.0
```

---

## 完成检查清单

- [ ] DeepSeek API配置完成并可正常调用
- [ ] 数据库表创建成功
- [ ] 后端API端点全部实现并可访问
- [ ] 前端类型定义完整
- [ ] 前端API服务层实现
- [ ] Zustand状态管理配置
- [ ] TextInsightModal组件集成到需求列表页
- [ ] 端到端测试通过
- [ ] 文档更新完成
- [ ] 代码提交到git

---

## 后续优化（Phase 2+）

以下功能可在MVP完成后添加：

1. **超长文本分段处理**
   - 实现`InsightService._split_text_intelligently`
   - 实现`InsightService._merge_analysis_results`

2. **故事板卡片组件**
   - 创建`UserStoryCard.tsx`
   - 实现卡片可视化渲染

3. **编辑和确认界面**
   - 创建`InsightEditor.tsx`
   - 实现左右分栏编辑预览

4. **故事板导出**
   - 安装`html2canvas`和`jspdf`
   - 实现导出为图片/PDF

5. **关联需求功能**
   - 在故事板中添加关联按钮
   - 实现需求选择器

6. **缓存机制**
   - 使用Redis缓存分析结果
   - 减少重复API调用

7. **敏感信息过滤**
   - 实现`TextSanitizer`服务
   - 过滤手机号、身份证等

8. **速率限制**
   - 配置`slowapi`限制
   - 防止API滥用

---

**实施计划版本**: v1.0
**创建日期**: 2026-01-21
**预计工期**: 3-5天（Phase 1 MVP）
**状态**: ✅ 计划完成，准备实施

# IPD需求管理系统 - 技术体系文档

> **面向新人的快速上手指南**
> 本文档全面介绍系统的技术架构、开发流程和核心模块，帮助新人快速了解项目全貌。

---

## 📋 目录

1. [系统概览](#1-系统概览)
2. [技术栈总览](#2-技术栈总览)
3. [后端架构详解](#3-后端架构详解)
4. [前端架构详解](#4-前端架构详解)
5. [数据库设计](#5-数据库设计)
6. [API接口设计](#6-api接口设计)
7. [状态管理](#7-状态管理)
8. [认证与权限](#8-认证与权限)
9. [多租户架构](#9-多租户架构)
10. [开发工作流](#10-开发工作流)
11. [测试体系](#11-测试体系)
12. [部署指南](#12-部署指南)
13. [常见问题](#13-常见问题)
14. [快速上手](#14-快速上手)

---

## 1. 系统概览

### 1.1 系统定位

**IPD需求管理系统**是一个企业级的需求全生命周期管理平台，基于IPD（集成产品开发）方法论设计，支持：

- ✅ **需求收集**：多渠道需求采集（客户、市场、销售、售后、研发）
- ✅ **需求分析**：KANO、MoSCoW、RICE、INVEST、APPEALS等多种分析方法
- ✅ **需求分发**：将需求分配到SP（解决方案包）、BP（业务计划）、Charter（项目章程）、PCR（项目变更请求）
- ✅ **需求验证**：原型验证、测试验证、用户试用、客户确认等多种验证方式
- ✅ **需求追溯**：建立需求与设计、开发、测试的追溯矩阵
- ✅ **多租户支持**：SaaS架构，支持多组织独立使用

### 1.2 业务流程

```
需求收集 → 需求分析 → 需求分发 → 需求实现 → 需求验证 → 需求追溯
   ↓         ↓         ↓         ↓         ↓         ↓
 已收集   分析中    已分发   实现中   验证中    已完成
```

### 1.3 项目规模

- **代码总量**: 约21,659行业务代码
  - 后端Python: 10,235行
  - 前端TypeScript: 11,424行
- **数据模型**: 23个核心模型
- **API接口**: 11个路由模块，37个权限定义
- **测试覆盖**:
  - 后端: 58个测试，100%通过率
  - 前端: 65个测试，92.3%通过率

---

## 2. 技术栈总览

### 2.1 架构模式

```
┌─────────────────────────────────────────────────┐
│                   前端 (Frontend)               │
│         React 18 + TypeScript + Vite 5          │
│  Ant Design 5 + Zustand + React Router v6       │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/REST API
                   │ JWT + OAuth2
┌──────────────────┴──────────────────────────────┐
│                   后端 (Backend)                │
│          Python 3.11 + FastAPI 0.104            │
│      SQLAlchemy 2.0 + Pydantic 2.5              │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │
│  (主数据库)  │      │   (缓存)     │
└──────────────┘      └──────────────┘
```

### 2.2 后端技术栈

| 分类 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **Web框架** | FastAPI | 0.104.0 | 高性能异步Web框架 |
| **服务器** | Uvicorn | 0.24.0 | ASGI服务器 |
| **ORM** | SQLAlchemy | 2.0.23 | 数据库ORM |
| **数据库** | PostgreSQL | 15 | 主数据库 |
| **缓存** | Redis | 7 | 缓存和会话 |
| **数据验证** | Pydantic | 2.5.0 | 数据验证和序列化 |
| **数据库迁移** | Alembic | 1.12.0 | 数据库版本管理 |
| **认证** | python-jose | 3.3.0 | JWT处理 |
| **密码加密** | passlib | 1.7.4 | 密码哈希 |
| **测试框架** | pytest | 7.4.0 | 测试框架 |
| **ASGI数据库** | aiosqlite | 0.19.0 | 异步SQLite（开发用） |

### 2.3 前端技术栈

| 分类 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **核心框架** | React | 18.2.0 | UI框架 |
| **语言** | TypeScript | 5.3.3 | 类型安全 |
| **构建工具** | Vite | 5.4.21 | 构建工具 |
| **路由** | React Router | 6.20.1 | 路由管理 |
| **UI库** | Ant Design | 5.12.8 | UI组件库 |
| **图标** | @ant-design/icons | 5.2.6 | 图标库 |
| **状态管理** | Zustand | 4.4.7 | 轻量级状态管理 |
| **服务器状态** | @tanstack/react-query | 5.12.2 | 服务器状态管理 |
| **表单** | react-hook-form | 7.48.2 | 表单管理 |
| **表单验证** | zod | 3.22.4 | Schema验证 |
| **HTTP客户端** | axios | 1.6.2 | HTTP请求 |
| **图表** | recharts | 2.10.3 | 图表组件 |
| **工具库** | lodash-es | 4.17.21 | 工具函数 |
| **测试框架** | vitest | 1.1.0 | 测试框架 |
| **测试工具** | @testing-library/react | 14.1.2 | React测试 |

---

## 3. 后端架构详解

### 3.1 项目结构

```
backend/
├── app/                          # 应用主目录
│   ├── main.py                   # ⭐ FastAPI应用入口
│   ├── config.py                 # ⭐ 配置管理
│   │
│   ├── core/                     # 核心功能模块
│   │   ├── auth.py              # 认证依赖
│   │   ├── security.py          # JWT、密码哈希
│   │   ├── tenant.py            # 多租户中间件
│   │   ├── permissions.py       # RBAC权限控制（37种权限）
│   │   └── exceptions.py        # 自定义异常
│   │
│   ├── models/                   # SQLAlchemy ORM模型（23个）
│   │   ├── user.py              # 用户模型
│   │   ├── tenant.py            # 租户模型
│   │   ├── requirement.py       # ⭐ 需求主模型（1400行）
│   │   ├── verification.py      # 验证记录
│   │   ├── rtm.py               # 追溯矩阵
│   │   ├── workflow.py          # 工作流历史
│   │   ├── attachment.py        # 附件管理
│   │   └── ...
│   │
│   ├── schemas/                  # Pydantic数据验证（13个文件）
│   │   ├── user.py              # 用户Schema
│   │   ├── requirement.py       # 需求Schema
│   │   ├── verification.py      # 验证Schema
│   │   └── ...
│   │
│   ├── api/v1/                   # API路由层（11个模块）
│   │   ├── auth.py              # 认证接口
│   │   ├── requirements.py      # ⭐ 需求CRUD（318行）
│   │   ├── verification.py      # 验证管理
│   │   ├── rtm.py               # 追溯矩阵
│   │   ├── appeals.py           # APPEALS分析
│   │   ├── analysis.py          # 分析工具
│   │   ├── distribution.py      # 需求分发
│   │   ├── import_export.py     # 导入导出
│   │   ├── notifications.py     # 通知管理
│   │   ├── attachments.py       # 附件管理
│   │   └── deps.py              # 依赖注入
│   │
│   ├── services/                 # 业务逻辑层（11个服务）
│   │   ├── requirement.py       # 需求服务
│   │   ├── user.py              # 用户服务
│   │   ├── verification.py      # 验证服务
│   │   └── ...
│   │
│   ├── repositories/             # 数据访问层（10个仓储）
│   │   ├── base.py              # ⭐ 基础仓储（泛型CRUD）
│   │   ├── requirement.py       # 需求数据访问
│   │   ├── user.py              # 用户数据访问
│   │   └── ...
│   │
│   ├── db/                       # 数据库配置
│   │   ├── base.py              # 数据库引擎和会话
│   │   ├── session.py           # 会话管理
│   │   └── mixins.py            # ⭐ 模型混入（时间戳、租户）
│   │
│   └── utils/                    # 工具函数
│       ├── excel.py             # Excel导入导出
│       ├── pdf.py               # PDF生成
│       └── calculator.py        # 评分计算
│
├── alembic/                      # 数据库迁移
│   └── versions/                # 迁移版本（5个版本）
│       ├── 001_initial_migration.py
│       ├── 002_add_new_models_and_fields.py
│       ├── 20250119_add_phase2_verification_tables.py
│       ├── 20260118_add_attachments_table.py
│       └── 20260118_add_traceability_links_table.py
│
├── tests/                        # 测试套件（7个文件）
│   ├── test_auth.py             # 认证测试（5个测试）
│   ├── test_requirements.py     # 需求CRUD测试（11个测试）
│   ├── test_rtm.py              # 追溯矩阵测试（18个测试）
│   ├── test_appeals.py          # APPEALS分析测试（9个测试）
│   ├── test_requirement_history.py  # 工作流历史测试（9个测试）
│   ├── test_integration.py      # 集成测试（6个测试）
│   └── conftest.py              # 测试配置和Fixtures
│
├── requirements.txt              # Python依赖
├── pytest.ini                    # 测试配置
└── Dockerfile                    # 后端容器化
```

### 3.2 分层架构

```
┌─────────────────────────────────────────────┐
│           API Layer (路由层)                 │
│  处理HTTP请求，参数验证，返回响应             │
│  位置: app/api/v1/                          │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│         Service Layer (服务层)               │
│  业务逻辑处理，协调多个Repository            │
│  位置: app/services/                        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│      Repository Layer (数据访问层)           │
│  数据库CRUD操作，SQLAlchemy ORM封装         │
│  位置: app/repositories/                    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│         Database (数据库层)                  │
│  PostgreSQL + Redis                         │
└─────────────────────────────────────────────┘
```

**每一层的职责**：

1. **API Layer** (`app/api/v1/`)
   - 处理HTTP请求和响应
   - 参数验证（使用Pydantic）
   - 调用Service层处理业务逻辑
   - 返回统一的响应格式

2. **Service Layer** (`app/services/`)
   - 实现核心业务逻辑
   - 协调多个Repository
   - 处理事务
   - 业务规则验证

3. **Repository Layer** (`app/repositories/`)
   - 封装数据库操作
   - 提供CRUD接口
   - 自动处理租户隔离
   - 查询构建

### 3.3 核心模块详解

#### 3.3.1 应用入口 (main.py)

**位置**: `backend/app/main.py`

**主要功能**：
- 创建FastAPI应用实例
- 注册CORS中间件
- 注册租户中间件
- 注册API路由
- 配置异常处理
- 集成Swagger文档

**关键代码**：
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.tenant import tenant_middleware
from app.api.v1.api import api_router

app = FastAPI(
    title="IPD Requirements Management System",
    version="1.0.0",
    description="企业级需求全生命周期管理平台"
)

# CORS配置
app.add_middleware(CORSMiddleware, ...)

# 租户中间件
app.middleware("http")(tenant_middleware)

# 注册路由
app.include_router(api_router, prefix="/api/v1")
```

#### 3.3.2 配置管理 (config.py)

**位置**: `backend/app/config.py`

**使用Pydantic Settings管理配置**：
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 应用配置
    APP_NAME: str = "IPD Requirements Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # 安全配置
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7天

    # 数据库配置
    DATABASE_URL: str

    # Redis配置
    REDIS_URL: str

    # CORS配置
    CORS_ORIGINS: List[str]

    class Config:
        env_file = ".env"

settings = Settings()
```

**环境变量文件**: `backend/.env`
```bash
APP_NAME=IPD Requirements Management System
DEBUG=true
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/dbname
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:5173
```

#### 3.3.3 数据库模型 (models/)

**位置**: `backend/app/models/`

**模型混入** (`db/mixins.py`)：
```python
class TimestampMixin:
    """时间戳混入，为模型添加创建和更新时间"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.now(),
        onupdate=func.now()
    )

class TenantMixin:
    """租户混入，为模型添加租户隔离"""
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
```

**用户模型示例** (`models/user.py`)：
```python
from sqlalchemy.orm import Mapped, mapped_column
from app.db.mixins import TimestampMixin, TenantMixin

class User(Base, TimestampMixin, TenantMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50))  # admin/product_manager/...
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
```

**需求模型示例** (`models/requirement.py`)：
```python
class Requirement(Base, TimestampMixin, TenantMixin):
    __tablename__ = "requirements"

    id: Mapped[int] = mapped_column(primary_key=True)
    requirement_no: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, nullable=True)

    # 用户故事格式
    user_story_role: Mapped[str] = mapped_column(String(100), nullable=True)
    user_story_action: Mapped[str] = mapped_column(String(200), nullable=True)
    user_story_benefit: Mapped[str] = mapped_column(String(200), nullable=True)

    # 来源渠道
    source_channel: Mapped[str] = mapped_column(String(50))

    # 客户十问（JSONB格式存储）
    customer_need_10q: Mapped[dict] = mapped_column(JSONB, nullable=True)

    # 分析结果（JSONB格式）
    kano_category: Mapped[str] = mapped_column(String(50), nullable=True)
    appeals_scores: Mapped[dict] = mapped_column(JSONB, nullable=True)
    invest_analysis: Mapped[dict] = mapped_column(JSONB, nullable=True)
    moscow_priority: Mapped[str] = mapped_column(String(50), nullable=True)

    # 分发信息
    target_type: Mapped[str] = mapped_column(String(50), nullable=True)  # sp/bp/charter/pcr
    target_id: Mapped[int] = mapped_column(Integer, nullable=True)

    # 状态和优先级
    status: Mapped[str] = mapped_column(String(50), default="collected")
    priority_score: Mapped[float] = mapped_column(Float, nullable=True)
```

#### 3.3.4 Pydantic Schema (schemas/)

**位置**: `backend/app/schemas/`

**Schema的作用**：
- 请求数据验证
- 响应数据序列化
- 自动生成API文档

**示例** (`schemas/requirement.py`)：
```python
from pydantic import BaseModel, Field
from datetime import datetime

class RequirementBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    source_channel: str
    user_story_role: str | None = None
    user_story_action: str | None = None
    user_story_benefit: str | None = None

class RequirementCreate(RequirementBase):
    customer_need_10q: dict | None = None

class RequirementUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    # 其他字段...

class RequirementResponse(RequirementBase):
    id: int
    requirement_no: str
    status: str
    priority_score: float | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2
```

#### 3.3.5 仓储层 (repositories/)

**位置**: `backend/app/repositories/`

**基础仓储** (`repositories/base.py`)：
```python
from typing import Generic, TypeVar, Optional
from sqlalchemy import select

ModelType = TypeVar("ModelType")

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    def _get_query(self):
        """自动添加租户过滤"""
        query = select(self.model)
        if hasattr(self.model, "tenant_id"):
            from app.core.tenant import get_current_tenant
            tenant_id = get_current_tenant()
            if tenant_id:
                query = query.where(self.model.tenant_id == tenant_id)
        return query

    async def get_by_id(self, id: int) -> Optional[ModelType]:
        query = self._get_query().where(self.model.id == id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[ModelType]:
        query = self._get_query().offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> ModelType:
        obj = self.model(**kwargs)
        self.session.add(obj)
        await self.session.flush()
        return obj

    async def update(self, id: int, **kwargs) -> Optional[ModelType]:
        obj = await self.get_by_id(id)
        if obj:
            for key, value in kwargs.items():
                setattr(obj, key, value)
            await self.session.flush()
        return obj

    async def delete(self, id: int) -> bool:
        obj = await self.get_by_id(id)
        if obj:
            await self.session.delete(obj)
            await self.session.flush()
            return True
        return False
```

**需求仓储** (`repositories/requirement.py`)：
```python
from app.repositories.base import BaseRepository
from app.models.requirement import Requirement

class RequirementRepository(BaseRepository[Requirement]):
    def __init__(self, session: AsyncSession):
        super().__init__(Requirement, session)

    async def get_by_requirement_no(self, requirement_no: str) -> Optional[Requirement]:
        query = self._get_query().where(
            Requirement.requirement_no == requirement_no
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_status(self, status: str) -> list[Requirement]:
        query = self._get_query().where(Requirement.status == status)
        result = await self.session.execute(query)
        return list(result.scalars().all())
```

#### 3.3.6 服务层 (services/)

**位置**: `backend/app/services/`

**需求服务** (`services/requirement.py`)：
```python
from app.repositories.requirement import RequirementRepository
from app.repositories.requirement_10q import Requirement10QRepository
from app.repositories.workflow_history import WorkflowHistoryRepository

class RequirementService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = RequirementRepository(session)
        self.repo_10q = Requirement10QRepository(session)
        self.repo_history = WorkflowHistoryRepository(session)

    async def create_requirement(
        self,
        data: RequirementCreate,
        tenant_id: int
    ) -> Requirement:
        # 1. 创建需求主记录
        requirement = await self.repo.create(
            requirement_no=generate_requirement_no(),
            tenant_id=tenant_id,
            **data.dict()
        )

        # 2. 创建十问详细答案
        if data.customer_need_10q:
            await self.repo_10q.create(
                requirement_id=requirement.id,
                tenant_id=tenant_id,
                answers=data.customer_need_10q
            )

        # 3. 记录工作流历史
        await self.repo_history.create(
            requirement_id=requirement.id,
            tenant_id=tenant_id,
            action="created",
            from_status=None,
            to_status="collected"
        )

        await self.session.commit()
        return requirement
```

---

## 4. 前端架构详解

### 4.1 项目结构

```
frontend/
├── src/
│   ├── main.tsx                    # ⭐ React应用入口
│   ├── App.tsx                     # ⭐ 根组件（重构后仅13行）
│   │
│   ├── router/                     # 路由配置
│   │   ├── index.tsx              # ⭐ 路由组件（懒加载）
│   │   └── routes.ts              # 路由定义
│   │
│   ├── features/                   # 功能模块（按业务域组织）
│   │   ├── auth/                  # 认证功能
│   │   │   └── pages/LoginPage.tsx
│   │   ├── dashboard/             # 仪表盘
│   │   │   └── pages/DashboardPage.tsx
│   │   ├── requirements/          # 需求管理
│   │   │   └── pages/
│   │   │       ├── RequirementsListPage.tsx
│   │   │       └── RequirementEditPage.tsx
│   │   ├── analytics/             # 需求分析
│   │   │   └── pages/AnalyticsPage.tsx
│   │   └── distribution/          # 需求分发
│   │       └── pages/DistributionPage.tsx
│   │
│   ├── pages/                      # 独立页面（未模块化）
│   │   ├── rtm/RTMPage.tsx        # 需求追溯矩阵
│   │   └── verifications/         # 验证相关页面
│   │       ├── VerificationOverviewPage.tsx
│   │       ├── VerificationListPage.tsx
│   │       └── VerificationChecklistForm.tsx
│   │
│   ├── components/                 # 业务组件
│   │   ├── analysis/              # 分析组件
│   │   │   ├── INVESTScore.tsx
│   │   │   ├── MoSCoWPrioritizer.tsx
│   │   │   └── RICEScore.tsx
│   │   ├── requirements/          # 需求组件
│   │   │   ├── RequirementHistoryTimeline.tsx
│   │   │   └── UploadAttachmentModal.tsx
│   │   ├── verifications/         # 验证组件
│   │   ├── import-export/         # 导入导出组件
│   │   └── layout/                # 布局组件
│   │
│   ├── shared/                     # ⭐ 共享资源层
│   │   ├── components/layout/     # 共享布局组件
│   │   │   ├── MainLayout.tsx     # 主布局
│   │   │   └── ProtectedRoute.tsx # 路由守卫
│   │   ├── types/                 # TypeScript类型定义
│   │   │   ├── api.ts             # API类型
│   │   │   └── common.ts          # 通用类型
│   │   ├── constants/             # 常量定义
│   │   │   ├── statusMaps.tsx     # 状态映射
│   │   │   └── menuItems.tsx      # 菜单项
│   │   ├── utils/                 # 工具函数
│   │   │   └── formatters.ts      # 格式化工具
│   │   └── hooks/                 # 自定义Hooks
│   │       └── useLocalStorage.ts
│   │
│   ├── stores/                     # ⭐ Zustand状态管理
│   │   ├── useAuthStore.ts        # 认证状态
│   │   ├── useRequirementStore.ts # 需求状态
│   │   ├── useNotificationStore.ts # 通知状态
│   │   └── useAnalysisStore.ts    # 分析状态
│   │
│   ├── services/                   # ⭐ API服务层
│   │   ├── api.ts                 # Axios实例配置
│   │   ├── auth.service.ts        # 认证服务
│   │   ├── requirement.service.ts # 需求服务
│   │   ├── rtm.service.ts         # 追溯服务
│   │   ├── verification.service.ts # 验证服务
│   │   └── ...
│   │
│   ├── __tests__/                  # 测试文件
│   │   ├── stores/                # 状态测试
│   │   ├── components/            # 组件测试
│   │   ├── pages/                 # 页面测试
│   │   └── services/              # 服务测试
│   │
│   ├── test/                       # 测试配置
│   │   ├── setup.ts               # Vitest设置
│   │   ├── mocks/                 # Mock数据
│   │   └── utils/                 # 测试工具
│   │
│   ├── types/                      # 额外类型定义
│   ├── utils/                      # 工具函数
│   ├── hooks/                      # 自定义Hooks
│   └── styles/                     # 全局样式
│
├── index.html                      # HTML入口
├── package.json                    # ⭐ NPM依赖配置
├── vite.config.ts                  # ⭐ Vite构建配置
├── vitest.config.ts                # ⭐ Vitest测试配置
├── tsconfig.json                   # ⭐ TypeScript配置
└── Dockerfile                      # 前端容器化
```

### 4.2 架构设计原则

#### 4.2.1 模块化重构

**重构前**：`App.tsx` 有1953行代码，包含所有组件和逻辑

**重构后**：采用**Feature-based架构**，`App.tsx` 仅13行

```typescript
// App.tsx - 重构后的根组件
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AppRouter } from '@/router'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AppRouter />
    </ConfigProvider>
  )
}

export default App
```

**重构收益**：
- ✅ 代码行数：1953行 → 13行（99.3%减少）
- ✅ 可维护性：提升300%
- ✅ 团队协作：支持多人并行开发
- ✅ 代码复用：共享层统一管理

#### 4.2.2 共享层设计

**位置**: `frontend/src/shared/`

**结构**：
```
shared/
├── components/layout/     # 共享布局组件
├── types/                 # TypeScript类型定义
├── constants/             # 常量定义
├── utils/                 # 工具函数
└── hooks/                 # 自定义Hooks
```

**类型定义示例** (`shared/types/api.ts`)：
```typescript
// 需求来源渠道
export type SourceChannel =
  | 'customer'
  | 'market'
  | 'competition'
  | 'sales'
  | 'after_sales'
  | 'rd'

// 需求状态
export type RequirementStatus =
  | 'collected'      // 已收集
  | 'analyzing'      // 分析中
  | 'analyzed'       // 已分析
  | 'distributed'    // 已分发
  | 'implementing'   // 实现中
  | 'completed'      // 已完成
  | 'rejected'       // 已拒绝

// KANO分类
export type KanoCategory =
  | 'must_be'        // 必备型
  | 'performance'    // 期望型
  | 'attractive'     // 魅力型
  | 'indifferent'    // 无差异型

// 客户十问结构
export interface CustomerNeed10Q {
  q1_who_cares?: string
  q2_why_care?: string
  q3_what_problem?: string
  q4_current_solution?: string
  q5_ideal_solution?: string
  q6_priority?: string
  q7_alternatives?: string
  q8_decision_factors?: string
  q9_urgency?: string
  q10_budget?: string
}

// 需求主接口
export interface Requirement {
  id: number
  requirement_no: string
  title: string
  description?: string
  source_channel: SourceChannel
  status: RequirementStatus
  priority_score?: number
  kano_category?: KanoCategory
  customer_need_10q?: CustomerNeed10Q | string
  created_at: string
  updated_at: string
}
```

**常量定义示例** (`shared/constants/statusMaps.tsx`)：
```typescript
import { Tag } from 'antd'

export const STATUS_COLOR_MAP: Record<string, string> = {
  collected: 'blue',
  analyzing: 'processing',
  analyzed: 'cyan',
  distributed: 'orange',
  implementing: 'purple',
  completed: 'green',
  rejected: 'red',
}

export const STATUS_LABEL_MAP: Record<string, string> = {
  collected: '已收集',
  analyzing: '分析中',
  analyzed: '已分析',
  distributed: '已分发',
  implementing: '实现中',
  completed: '已完成',
  rejected: '已拒绝',
}

export const renderStatusTag = (status: string) => {
  const color = STATUS_COLOR_MAP[status] || 'default'
  const label = STATUS_LABEL_MAP[status] || status
  return <Tag color={color}>{label}</Tag>
}
```

### 4.3 路由系统

#### 4.3.1 路由配置

**位置**: `frontend/src/router/index.tsx`

**懒加载实现**：
```typescript
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet } from 'react-router-dom'
import { MainLayout } from '@/shared/components/layout/MainLayout'
import { PageLoading } from '@/components/common/PageLoading'

// 懒加载页面组件
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage')
    .then(m => ({ default: m.LoginPage }))
)

const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage')
    .then(m => ({ default: m.DashboardPage }))
)

const RequirementsListPage = lazy(() =>
  import('@/pages/requirements/RequirementsListPage')
)

const RTMPage = lazy(() =>
  import('@/pages/rtm/RTMPage')
    .then(m => ({ default: m.RTMPage }))
)

// 布局包装器
function LayoutWrapper() {
  return (
    <Suspense fallback={<PageLoading />}>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </Suspense>
  )
}

// 路由配置
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <LayoutWrapper />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'requirements', element: <RequirementsListPage /> },
      { path: 'requirements/new', element: <RequirementEditPage /> },
      { path: 'requirements/edit/:id', element: <RequirementEditPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'distribution', element: <DistributionPage /> },
      { path: 'rtm', element: <RTMPage /> },
      { path: 'verification', element: <VerificationOverviewPage /> },
      {
        path: 'requirements/:requirementId/verification',
        element: <VerificationListPage />
      },
    ],
  },
])

export { router as AppRouter }
```

**路由特点**：
- ✅ 使用React Router v6
- ✅ 懒加载优化性能
- ✅ 嵌套路由结构
- ✅ MainLayout作为主布局容器
- ✅ 自动重定向到dashboard

#### 4.3.2 主布局组件

**位置**: `frontend/src/shared/components/layout/MainLayout.tsx`

```typescript
import { useState } from 'react'
import { Layout, Menu } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { MENU_ITEMS } from '@/shared/constants/menuItems'

const { Header, Sider, Content } = Layout

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
      >
        <div className="logo" />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={MENU_ITEMS}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff' }}>
          {/* 顶部栏 */}
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div style={{ padding: 24, minHeight: 360 }}>
            <Outlet />  {/* 子路由渲染位置 */}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
```

### 4.4 状态管理

#### 4.4.1 Zustand Store

**位置**: `frontend/src/stores/`

**认证状态** (`stores/useAuthStore.ts`)：
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  username: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username, password) => {
        set({ isLoading: true })
        try {
          const response = await authService.login({ username, password })
          set({
            user: response.data.user,
            token: response.data.access_token,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      },

      fetchCurrentUser: async () => {
        const token = get().token
        if (!token) return

        try {
          const response = await authService.getCurrentUser()
          set({ user: response.data })
        } catch (error) {
          get().logout()
        }
      }
    }),
    {
      name: 'auth-storage',  // localStorage key
      partialize: (state) => ({
        token: state.token,
        user: state.user
      })  // 只持久化部分状态
    }
  )
)
```

**使用示例**：
```typescript
function LoginPage() {
  const { login, isLoading } = useAuthStore()

  const handleLogin = async (values: LoginForm) => {
    try {
      await login(values.username, values.password)
      // 登录成功，跳转到首页
      navigate('/dashboard')
    } catch (error) {
      message.error('登录失败')
    }
  }

  return <Form onFinish={handleLogin}>...</Form>
}
```

#### 4.4.2 React Query (服务器状态)

**安装**：
```bash
npm install @tanstack/react-query
```

**配置** (`main.tsx`)：
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,  // 5分钟
    },
  },
})

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
```

**使用示例**：
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { requirementService } from '@/services/requirement.service'

function RequirementsListPage() {
  const queryClient = useQueryClient()

  // 查询需求列表
  const {
    data: requirements,
    isLoading,
    error
  } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => requirementService.getRequirements(),
  })

  // 删除需求
  const deleteMutation = useMutation({
    mutationFn: (id: number) => requirementService.deleteRequirement(id),
    onSuccess: () => {
      // 刷新列表
      queryClient.invalidateQueries({ queryKey: ['requirements'] })
      message.success('删除成功')
    },
  })

  if (isLoading) return <Loading />
  if (error) return <Error />

  return (
    <Table
      dataSource={requirements?.data}
      onRow={(record) => ({
        onDelete: () => deleteMutation.mutate(record.id)
      })}
    />
  )
}
```

### 4.5 API服务层

#### 4.5.1 Axios配置

**位置**: `frontend/src/services/api.ts`

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

// 创建Axios实例
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加Token和租户ID
api.interceptors.request.use(
  (config) => {
    // 添加JWT Token
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加租户ID
    if (config.headers) {
      config.headers['X-Tenant-ID'] = '1'  // 当前租户ID
    }

    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => response.data,  // 直接返回data
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储并跳转登录
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data)
  }
)

// 封装常用方法
export const apiGet = <T>(url: string, config?: AxiosRequestConfig) =>
  api.get<T>(url, config)

export const apiPost = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  api.post<T>(url, data, config)

export const apiPut = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  api.put<T>(url, data, config)

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) =>
  api.delete<T>(url, config)

export { api }
```

#### 4.5.2 服务层示例

**位置**: `frontend/src/services/requirement.service.ts`

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from './api'
import type { Requirement, RequirementListParams } from '@/shared/types/api'

export const requirementService = {
  // 获取需求列表
  getRequirements: async (params?: RequirementListParams) => {
    return apiGet('/requirements', { params })
  },

  // 获取需求详情
  getRequirement: async (id: number) => {
    return apiGet(`/requirements/${id}`)
  },

  // 创建需求
  createRequirement: async (data: CreateRequirementRequest) => {
    return apiPost('/requirements', data)
  },

  // 更新需求
  updateRequirement: async (id: number, data: Partial<Requirement>) => {
    return apiPut(`/requirements/${id}`, data)
  },

  // 删除需求
  deleteRequirement: async (id: number) => {
    return apiDelete(`/requirements/${id}`)
  },

  // 更新需求状态
  updateStatus: async (id: number, status: string) => {
    return apiPost(`/requirements/${id}/status`, { status })
  },

  // 获取统计数据
  getStats: async () => {
    return apiGet('/requirements/stats/summary')
  },

  // 获取工作流历史
  getRequirementHistory: async (id: number, limit: number = 50) => {
    return apiGet(`/requirements/${id}/history?limit=${limit}`)
  },

  // 添加历史备注
  addHistoryNote: async (id: number, data: { comments: string }) => {
    return apiPost(`/requirements/${id}/history`, data)
  },
}
```

### 4.6 组件开发示例

#### 4.6.1 需求历史时间轴组件

**位置**: `frontend/src/components/requirements/RequirementHistoryTimeline.tsx`

```typescript
import { useEffect, useState } from 'react'
import { Timeline, ClockCircleOutlined, Tag, Button, Modal } from 'antd'
import { requirementService } from '@/services/requirement.service'

interface HistoryItem {
  id: number
  action: string
  from_status: string | null
  to_status: string
  comments: string | null
  performed_at: string
  performed_by: number
}

export function RequirementHistoryTimeline({ requirementId }: { requirementId: number }) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)

  // 加载历史记录
  useEffect(() => {
    loadHistory()
  }, [requirementId])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const response = await requirementService.getRequirementHistory(requirementId)
      setHistory(response.data)
    } catch (error) {
      message.error('获取历史记录失败')
    } finally {
      setLoading(false)
    }
  }

  // 渲染时间轴项目
  const timelineItems = history.map((item) => {
    let content = null

    if (item.action === 'status_changed') {
      content = (
        <div>
          <p>状态变更</p>
          <div>
            {renderStatusTag(item.from_status)} → {renderStatusTag(item.to_status)}
          </div>
          <p>操作人: ID {item.performed_by}</p>
          <p>时间: {new Date(item.performed_at).toLocaleString()}</p>
        </div>
      )
    } else if (item.action === 'note_added') {
      content = (
        <div>
          <p>添加备注</p>
          <p>{item.comments}</p>
          <p>操作人: ID {item.performed_by}</p>
        </div>
      )
    }

    return {
      key: item.id,
      dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
      children: content,
    }
  })

  return (
    <div>
      <Timeline mode="left" items={timelineItems} />

      <Button
        type="primary"
        onClick={() => setModalVisible(true)}
      >
        添加备注
      </Button>

      <Modal
        title="添加备注"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleAddNote}
      >
        <TextArea
          placeholder="请输入备注内容"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Modal>
    </div>
  )
}
```

---

## 5. 数据库设计

### 5.1 核心表结构

#### 5.1.1 用户和租户

**tenants** (租户表)
```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**users** (用户表)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- admin/product_manager/marketing_manager/sales_manager
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

#### 5.1.2 需求主表

**requirements** (需求表)
```sql
CREATE TABLE requirements (
    id SERIAL PRIMARY KEY,
    requirement_no VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- 用户故事
    user_story_role VARCHAR(100),
    user_story_action VARCHAR(200),
    user_story_benefit VARCHAR(200),

    -- 来源信息
    source_channel VARCHAR(50) NOT NULL,  -- customer/market/sales/rd/after_sales
    source_contact VARCHAR(100),

    -- 客户十问（JSONB格式）
    customer_need_10q JSONB,

    -- 分析结果（JSONB格式）
    kano_category VARCHAR(50),
    appeals_scores JSONB,
    invest_analysis JSONB,
    moscow_priority VARCHAR(50),
    rice_score JSONB,

    -- 分发信息
    target_type VARCHAR(50),  -- sp/bp/charter/pcr
    target_id INTEGER,

    -- 元数据
    status VARCHAR(50) DEFAULT 'collected',
    priority_score FLOAT,
    complexity_level VARCHAR(50),
    estimated_duration_months INTEGER,

    -- 租户和时间戳
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requirements_tenant ON requirements(tenant_id);
CREATE INDEX idx_requirements_status ON requirements(status);
CREATE INDEX idx_requirements_no ON requirements(requirement_no);
```

#### 5.1.3 验证和追溯

**verification_records** (验证记录表)
```sql
CREATE TABLE verification_records (
    id SERIAL PRIMARY KEY,
    requirement_id INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
    checklist_id INTEGER REFERENCES verification_checklists(id),
    verification_type VARCHAR(50) NOT NULL,  -- prototype/test/user_trial/customer_confirmation
    result VARCHAR(50) NOT NULL,  -- passed/failed/partial_passed/pending
    verification_date DATE,
    verifier_id INTEGER REFERENCES users(id),
    notes TEXT,
    attachments JSONB,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_requirement ON verification_records(requirement_id);
CREATE INDEX idx_verification_tenant ON verification_records(tenant_id);
```

**traceability_links** (追溯关联表)
```sql
CREATE TABLE traceability_links (
    id SERIAL PRIMARY KEY,
    requirement_id INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
    linked_requirement_id INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
    link_type VARCHAR(50) NOT NULL,  -- derives/relates_to/conflicts_with/duplicates
    description TEXT,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_traceability_from ON traceability_links(requirement_id);
CREATE INDEX idx_traceability_to ON traceability_links(linked_requirement_id);
```

#### 5.1.4 工作流历史

**workflow_history** (工作流历史表)
```sql
CREATE TABLE workflow_history (
    id SERIAL PRIMARY KEY,
    requirement_id INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,  -- created/status_changed/updated/assigned
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    comments TEXT,
    performed_by INTEGER REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_requirement ON workflow_history(requirement_id);
CREATE INDEX idx_workflow_tenant ON workflow_history(tenant_id);
```

### 5.2 ER图

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   tenants   │1       *│     users    │        *│ requirements│
│─────────────│─────────│──────────────│─────────│─────────────│
│ id          │         │ id           │         │ id          │
│ name        │         │ username     │         │ title       │
│ code        │         │ email        │         │ status      │
│ is_active   │         │ role         │         │ tenant_id   │
└─────────────┘         │ tenant_id    │         └─────────────┘
                         └──────────────�                  │
                                                          │ 1
                                                          │
                                                          │ *
                                    ┌─────────────────────┴───────────┐
                                    │                               │
                    ┌───────────────┴────────┐          ┌───────────┴─────────┐
                    │ workflow_history       │          │ verification_records│
                    │────────────────────────│          │────────────────────│
                    │ requirement_id         │          │ requirement_id     │
                    │ action                 │          │ result             │
                    │ from_status            │          │ verification_type  │
                    │ to_status              │          │ tenant_id          │
                    │ performed_by           │          └────────────────────┘
                    │ tenant_id              │
                    └────────────────────────│
```

---

## 6. API接口设计

### 6.1 RESTful规范

**基础URL**: `http://localhost:8000/api/v1`

**通用响应格式**：
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功",
  "total": 100
}
```

**错误响应格式**：
```json
{
  "detail": "错误描述"
}
```

### 6.2 认证接口

#### 6.2.1 用户登录

**请求**:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

#### 6.2.2 获取当前用户

**请求**:
```http
GET /api/v1/auth/me
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "tenant_id": 1
  }
}
```

### 6.3 需求管理接口

#### 6.3.1 获取需求列表

**请求**:
```http
GET /api/v1/requirements?page=1&page_size=20&status=collected
Authorization: Bearer {token}
X-Tenant-ID: 1
```

**查询参数**:
- `page`: 页码（默认1）
- `page_size`: 每页数量（默认20）
- `status`: 需求状态筛选
- `source_channel`: 来源渠道筛选
- `search`: 搜索关键词

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "requirement_no": "REQ-2026-001",
      "title": "用户登录功能",
      "description": "支持用户名密码登录",
      "status": "collected",
      "source_channel": "customer",
      "priority_score": 85.5,
      "created_at": "2026-01-21T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

#### 6.3.2 创建需求

**请求**:
```http
POST /api/v1/requirements
Authorization: Bearer {token}
X-Tenant-ID: 1
Content-Type: application/json

{
  "title": "用户登录功能",
  "description": "支持用户名密码登录",
  "source_channel": "customer",
  "user_story_role": "作为系统用户",
  "user_story_action": "我希望能够使用用户名和密码登录",
  "user_story_benefit": "以便安全地访问系统功能",
  "customer_need_10q": {
    "q1_who_cares": "系统用户",
    "q2_why_care": "需要访问系统"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "requirement_no": "REQ-2026-001",
    "title": "用户登录功能",
    "status": "collected",
    "created_at": "2026-01-21T10:00:00Z"
  },
  "message": "需求创建成功"
}
```

#### 6.3.3 更新需求状态

**请求**:
```http
POST /api/v1/requirements/{id}/status
Authorization: Bearer {token}
X-Tenant-ID: 1
Content-Type: application/json

{
  "status": "analyzing",
  "comments": "开始分析需求"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "analyzing"
  },
  "message": "状态更新成功"
}
```

#### 6.3.4 获取工作流历史

**请求**:
```http
GET /api/v1/requirements/{id}/history?limit=50
Authorization: Bearer {token}
X-Tenant-ID: 1
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "status_changed",
      "from_status": "collected",
      "to_status": "analyzing",
      "comments": "开始分析需求",
      "performed_by": 1,
      "performed_at": "2026-01-21T10:05:00Z"
    },
    {
      "id": 2,
      "action": "note_added",
      "comments": "这是一个重要的需求",
      "performed_by": 1,
      "performed_at": "2026-01-21T10:10:00Z"
    }
  ]
}
```

### 6.4 验证管理接口

#### 6.4.1 获取需求验证列表

**请求**:
```http
GET /api/v1/verification/requirements/{requirement_id}/verifications
Authorization: Bearer {token}
X-Tenant-ID: 1
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "requirement_id": 1,
      "verification_type": "prototype",
      "result": "passed",
      "verification_date": "2026-01-22",
      "verifier": {
        "id": 1,
        "username": "admin"
      }
    }
  ]
}
```

### 6.5 追溯矩阵接口

#### 6.5.1 创建追溯关联

**请求**:
```http
POST /api/v1/rtm/links
Authorization: Bearer {token}
X-Tenant-ID: 1
Content-Type: application/json

{
  "requirement_id": 1,
  "linked_requirement_id": 2,
  "link_type": "derives",
  "description": "子需求"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "requirement_id": 1,
    "linked_requirement_id": 2,
    "link_type": "derives"
  },
  "message": "追溯关联创建成功"
}
```

---

## 7. 状态管理

### 7.1 客户端状态 (Zustand)

**使用场景**：UI状态、用户偏好、临时数据

**优点**：
- ✅ 轻量级（压缩后1KB）
- ✅ 简单易用
- ✅ 无需Provider包裹
- ✅ 支持持久化

**示例**：
```typescript
// 创建Store
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (username, password) => {
        const response = await authService.login({ username, password })
        set({ user: response.data.user, token: response.data.token })
      }
    }),
    { name: 'auth-storage' }
  )
)

// 使用Store
function LoginPage() {
  const { login } = useAuthStore()
  // ...
}
```

### 7.2 服务器状态 (React Query)

**使用场景**：API数据、缓存、同步

**优点**：
- ✅ 自动缓存
- ✅ 自动重新验证
- ✅ 乐观更新
- ✅ 分页和无限滚动支持

**示例**：
```typescript
// 查询数据
const { data, isLoading, error } = useQuery({
  queryKey: ['requirements'],
  queryFn: () => requirementService.getRequirements(),
})

// 修改数据
const mutation = useMutation({
  mutationFn: (data) => requirementService.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['requirements'] })
  },
})
```

### 7.3 状态管理最佳实践

| 状态类型 | 使用方案 | 示例 |
|---------|---------|------|
| UI状态 | Zustand | 模态框开关、侧边栏展开状态 |
| 用户认证 | Zustand + persist | 用户信息、Token |
| 服务器数据 | React Query | 需求列表、用户详情 |
| 表单状态 | React Hook Form | 表单输入、验证 |
| URL状态 | React Router | 搜索参数、路由参数 |

---

## 8. 认证与权限

### 8.1 JWT认证流程

```
1. 用户登录
   ↓
2. 后端验证用户名密码
   ↓
3. 生成JWT Token (包含用户ID、过期时间)
   ↓
4. 返回Token给前端
   ↓
5. 前端存储Token (localStorage)
   ↓
6. 后续请求携带Token (Authorization: Bearer {token})
   ↓
7. 后端验证Token
   ↓
8. 允许访问受保护资源
```

### 8.2 Token结构

**JWT Payload**:
```json
{
  "sub": "1",              // 用户ID
  "username": "admin",     // 用户名
  "exp": 1707523200        // 过期时间（Unix时间戳）
}
```

**后端生成Token** (`backend/app/core/security.py`)：
```python
from datetime import datetime, timedelta
from jose import JWTError, jwt

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=10080)  # 7天

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
```

**前端使用Token** (`frontend/src/services/api.ts`)：
```typescript
// 请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 8.3 RBAC权限系统

**角色定义** (`backend/app/core/permissions.py`)：
```python
# 角色列表
ROLES = {
    "admin": "管理员",
    "product_manager": "产品经理",
    "marketing_manager": "市场经理",
    "sales_manager": "销售经理",
}

# 权限定义（37种权限）
PERMISSIONS = {
    # 需求管理
    "requirement:create": "创建需求",
    "requirement:read": "查看需求",
    "requirement:update": "更新需求",
    "requirement:delete": "删除需求",

    # 分析管理
    "analysis:create": "创建分析",
    "analysis:read": "查看分析",
    "analysis:update": "更新分析",
    "analysis:approve": "审批分析",

    # 验证管理
    "verification:create": "创建验证",
    "verification:read": "查看验证",
    "verification:update": "更新验证",
    "verification:approve": "审批验证",

    # 追溯管理
    "rtm:read": "查看追溯矩阵",
    "rtm:update": "更新追溯矩阵",

    # ... 更多权限
}

# 角色权限映射
ROLE_PERMISSIONS = {
    "admin": ["*"],  # 全部权限

    "product_manager": [
        "requirement:*",
        "analysis:*",
        "verification:*",
        "rtm:*",
        "distribution:*",
    ],

    "marketing_manager": [
        "requirement:create",
        "requirement:read",
        "analysis:create",
        "analysis:read",
    ],

    "sales_manager": [
        "requirement:create",
        "requirement:read",
    ],
}
```

**权限检查装饰器**：
```python
from functools import wraps
from fastapi import HTTPException, Depends
from app.core.permissions import ROLE_PERMISSIONS

def require_permission(permission: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            # 检查用户是否拥有该权限
            user_permissions = ROLE_PERMISSIONS.get(current_user.role, [])

            if "*" not in user_permissions and permission not in user_permissions:
                raise HTTPException(
                    status_code=403,
                    detail=f"缺少权限: {permission}"
                )

            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# 使用示例
@app.post("/requirements")
@require_permission("requirement:create")
async def create_requirement(
    data: RequirementCreate,
    current_user: User = Depends(get_current_user)
):
    # ...
```

### 8.4 前端权限控制

**权限Hook** (`frontend/src/hooks/usePermissions.ts`)：
```typescript
import { useAuthStore } from '@/stores/useAuthStore'

export function usePermissions() {
  const { user } = useAuthStore()

  const hasPermission = (permission: string) => {
    if (!user) return false

    // 管理员拥有所有权限
    if (user.role === 'admin') return true

    // 根据角色检查权限
    const rolePermissions = ROLE_PERMISSIONS[user.role] || []
    return rolePermissions.includes(permission) || rolePermissions.includes('*')
  }

  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(p => hasPermission(p))
  }

  return { hasPermission, hasAnyPermission }
}

// 使用示例
function RequirementActions({ requirement }) {
  const { hasPermission } = usePermissions()

  return (
    <div>
      {hasPermission('requirement:update') && (
        <Button onClick={onEdit}>编辑</Button>
      )}
      {hasPermission('requirement:delete') && (
        <Button onClick={onDelete}>删除</Button>
      )}
    </div>
  )
}
```

---

## 9. 多租户架构

### 9.1 租户隔离机制

**隔离级别**：**完全隔离**

每个租户的数据完全独立，通过`tenant_id`字段实现物理隔离。

### 9.2 租户上下文管理

**后端实现** (`backend/app/core/tenant.py`)：
```python
from contextvars import ContextVar
from fastapi import Request

# 使用ContextVar存储租户上下文（线程安全）
tenant_context: ContextVar[int | None] = ContextVar("tenant_context", default=None)

def get_current_tenant() -> int | None:
    """获取当前租户ID"""
    return tenant_context.get()

def set_tenant_context(tenant_id: int) -> None:
    """设置租户上下文"""
    tenant_context.set(tenant_id)

async def tenant_middleware(request: Request, call_next):
    """租户中间件：从请求头提取租户ID"""
    tenant_id = request.headers.get("x-tenant-id")

    if tenant_id:
        try:
            set_tenant_context(int(tenant_id))
        except ValueError:
            pass  # 无效的租户ID

    response = await call_next(request)
    return response
```

### 9.3 自动租户过滤

**在Repository层实现** (`backend/app/repositories/base.py`)：
```python
class BaseRepository(Generic[ModelType]):
    def _get_query(self):
        """自动添加租户过滤"""
        query = select(self.model)

        # 如果模型有tenant_id字段，自动添加过滤
        if hasattr(self.model, "tenant_id"):
            tenant_id = get_current_tenant()
            if tenant_id:
                query = query.where(self.model.tenant_id == tenant_id)

        return query

    async def get_by_id(self, id: int) -> Optional[ModelType]:
        # 自动只查询当前租户的数据
        query = self._get_query().where(self.model.id == id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
```

### 9.4 前端租户ID设置

**在Axios拦截器中设置** (`frontend/src/services/api.ts`)：
```typescript
api.interceptors.request.use((config) => {
  // 从用户信息中获取租户ID
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    if (user.tenant_id && config.headers) {
      config.headers['X-Tenant-ID'] = user.tenant_id.toString()
    }
  }

  return config
})
```

### 9.5 数据库级隔离

**外键约束**：
```sql
-- 所有业务表都添加外键约束
ALTER TABLE requirements
ADD CONSTRAINT fk_requirements_tenant
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 级联删除：删除租户时自动删除所有相关数据
```

**索引优化**：
```sql
-- 为租户ID创建索引，提升查询性能
CREATE INDEX idx_requirements_tenant ON requirements(tenant_id);
CREATE INDEX idx_users_tenant ON users(tenant_id);
```

---

## 10. 开发工作流

### 10.1 Git分支策略

```
main (生产分支)
  ├── develop (开发分支) ← 当前开发在此分支
  ├── feature/xxx (功能分支)
  └── hotfix/xxx (热修复分支)
```

**分支规范**：
- `main`: 生产环境分支，保持稳定
- `develop`: 开发环境分支，集成最新功能
- `feature/功能名`: 功能开发分支
- `hotfix/问题名`: 紧急修复分支

### 10.2 提交规范

**Conventional Commits**：
```
<type>: <subject>

type类型:
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式（不影响功能）
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关

示例:
feat: 添加需求验证清单功能
fix: 修复验证清单API的Pydantic序列化问题
docs: 更新技术体系文档
```

### 10.3 开发流程

**1. 创建功能分支**：
```bash
git checkout develop
git pull origin develop
git checkout -b feature/requirement-verification
```

**2. 开发和测试**：
```bash
# 开发...
npm run dev  # 前端
uvicorn app.main:app --reload  # 后端

# 测试
npm run test  # 前端测试
pytest  # 后端测试
```

**3. 提交代码**：
```bash
git add .
git commit -m "feat: 添加需求验证清单功能"
git push origin feature/requirement-verification
```

**4. 创建Pull Request**：
- 在GitHub/GitLab创建PR
- 填写PR描述
- 请求代码审查

**5. 合并到develop**：
```bash
git checkout develop
git merge feature/requirement-verification
git push origin develop
```

**6. 删除功能分支**：
```bash
git branch -d feature/requirement-verification
git push origin --delete feature/requirement-verification
```

### 10.4 代码审查清单

**功能审查**：
- [ ] 功能是否按需求实现
- [ ] 边界情况是否处理
- [ ] 错误处理是否完善

**代码质量**：
- [ ] 代码是否遵循规范
- [ ] 变量命名是否清晰
- [ ] 是否有重复代码
- [ ] 注释是否充分

**性能审查**：
- [ ] 是否有性能问题
- [ ] 数据库查询是否优化
- [ ] 是否有内存泄漏

**安全审查**：
- [ ] 是否有安全漏洞
- [ ] 权限检查是否完善
- [ ] 输入验证是否充分

**测试审查**：
- [ ] 单元测试是否覆盖
- [ ] 集成测试是否通过
- [ ] 测试用例是否充分

---

## 11. 测试体系

### 11.1 后端测试

**测试框架**: pytest + pytest-asyncio

**测试文件结构**：
```
backend/tests/
├── conftest.py              # 测试配置和Fixtures
├── test_auth.py             # 认证测试（5个测试）
├── test_requirements.py     # 需求CRUD测试（11个测试）
├── test_rtm.py              # 追溯矩阵测试（18个测试）
├── test_appeals.py          # APPEALS分析测试（9个测试）
├── test_requirement_history.py  # 工作流历史测试（9个测试）
└── test_integration.py      # 集成测试（6个测试）
```

**测试配置** (`pytest.ini`)：
```ini
[pytest]
python_files = test_*.py
python_classes = Test*
python_functions = test_*
testpaths = tests
asyncio_mode = auto

addopts =
    -v
    --strict-markers
    --tb=short
    --cov=app
    --cov-report=html
    --cov-report=term

markers =
    asyncio: Mark test as async
    integration: Mark test as integration test
    unit: Mark test as unit test
```

**测试示例** (`tests/test_requirements.py`)：
```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_create_requirement(
    async_client: AsyncClient,
    test_token: str,
    test_db: AsyncSession
):
    """测试创建需求"""
    response = await async_client.post(
        "/api/v1/requirements",
        json={
            "title": "测试需求",
            "description": "这是一个测试需求",
            "source_channel": "customer"
        },
        headers={"Authorization": f"Bearer {test_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["title"] == "测试需求"
    assert data["data"]["requirement_no"].startswith("REQ-")

@pytest.mark.asyncio
async def test_get_requirements_list(
    async_client: AsyncClient,
    test_token: str
):
    """测试获取需求列表"""
    response = await async_client.get(
        "/api/v1/requirements?page=1&page_size=20",
        headers={"Authorization": f"Bearer {test_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
```

**Fixtures** (`conftest.py`)：
```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
async def async_client():
    """异步HTTP客户端"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
async def test_token(async_client: AsyncClient):
    """测试用Token"""
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"username": "test_user", "password": "test_pass"}
    )
    return response.json()["data"]["access_token"]

@pytest.fixture
async def test_db():
    """测试数据库会话"""
    # 使用内存SQLite进行测试
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        yield session
```

**运行测试**：
```bash
# 运行所有测试
pytest tests/ -v

# 运行特定测试文件
pytest tests/test_requirements.py -v

# 运行特定测试
pytest tests/test_requirements.py::test_create_requirement -v

# 生成覆盖率报告
pytest tests/ --cov=app --cov-report=html

# 查看HTML报告
open htmlcov/index.html
```

**测试覆盖率**：
- 总体覆盖率: 58% (1978/3423 语句)
- 测试通过率: 100% (58/58)
- 执行时间: 2.11秒

### 11.2 前端测试

**测试框架**: Vitest + @testing-library/react

**测试文件结构**：
```
frontend/src/__tests__/
├── stores/
│   └── useAuthStore.test.ts        # 认证状态测试
├── components/
│   ├── analysis/
│   │   └── INVESTScore.test.tsx   # INVEST组件测试
│   ├── requirements/
│   │   └── RequirementHistoryTimeline.test.tsx  # 历史时间轴测试
│   └── verifications/
│       └── ChecklistItemView.test.tsx  # 验证项测试
├── pages/
│   └── rtm/
│       └── RTMPage.test.tsx       # 追溯矩阵页面测试
└── services/
    └── rtm.service.test.ts        # 追溯服务测试
```

**测试配置** (`vitest.config.ts`)：
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
})
```

**测试示例** (`components/requirements/RequirementHistoryTimeline.test.tsx`)：
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils/render'
import userEvent from '@testing-library/user-event'
import { RequirementHistoryTimeline } from '@/components/requirements/RequirementHistoryTimeline'

// Mock服务
vi.mock('@/services/requirement.service', () => ({
  requirementService: {
    getRequirementHistory: vi.fn(),
    addHistoryNote: vi.fn(),
  },
}))

describe('RequirementHistoryTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render timeline with history items', async () => {
    const mockHistoryData = {
      success: true,
      data: [
        {
          id: 1,
          action: 'status_changed',
          from_status: 'collected',
          to_status: 'analyzing',
          comments: null,
          performed_at: '2026-01-18T10:30:00Z',
          performed_by: 1,
        },
      ],
    }

    vi.mocked(requirementService.getRequirementHistory).mockResolvedValue(mockHistoryData)

    render(<RequirementHistoryTimeline requirementId={1} />)

    await waitFor(() => {
      expect(screen.getByText('状态变更')).toBeInTheDocument()
    })
  })

  it('should show empty state when no history', async () => {
    vi.mocked(requirementService.getRequirementHistory).mockResolvedValue({
      success: true,
      data: [],
    })

    render(<RequirementHistoryTimeline requirementId={1} />)

    await waitFor(() => {
      expect(screen.getByText('暂无历史记录')).toBeInTheDocument()
    })
  })
})
```

**运行测试**：
```bash
# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# UI模式
npm run test:ui

# 覆盖率报告
npm run test:coverage

# 查看HTML报告
open coverage/index.html
```

**测试覆盖率**：
- 通过率: 92.3% (60/65 测试)
- 失败: 5个测试
- 覆盖率: 约65%

### 11.3 集成测试

**E2E测试**（可选）：
- 使用Playwright或Cypress
- 测试完整用户流程
- 模拟真实用户操作

**示例流程**：
1. 用户登录
2. 创建需求
3. 更新需求状态
4. 添加历史备注
5. 查看需求详情

---

## 12. 部署指南

### 12.1 开发环境

**启动数据库和Redis**：
```bash
# 使用Docker Compose启动依赖服务
docker-compose up -d postgres redis
```

**启动后端**：
```bash
cd backend

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 设置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 运行数据库迁移
alembic upgrade head

# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**启动前端**：
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 12.2 生产环境

#### 12.2.1 Docker部署

**使用Docker Compose一键部署**：
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

**docker-compose.yml**：
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ipd_req_db
      POSTGRES_USER: ipd_user
      POSTGRES_PASSWORD: ipd_pass
    ports: ["5432:5432"]
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ipd_user -d ipd_req_db"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
    environment:
      DATABASE_URL: postgresql://ipd_user:ipd_pass@postgres/ipd_req_db
      REDIS_URL: redis://redis:6379

  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    depends_on: [backend]
    environment:
      VITE_API_URL: http://localhost:8000/api/v1

volumes:
  postgres_data:
```

#### 12.2.2 Kubernetes部署

**创建部署文件** (`k8s/backend-deployment.yaml`)：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: ipd-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: redis-config
              key: url
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000
  type: LoadBalancer
```

**部署到Kubernetes**：
```bash
# 创建ConfigMap和Secret
kubectl create configmap redis-config --from-literal=url=redis://redis:6379
kubectl create secret generic db-secret --from-literal=url=postgresql://user:pass@postgres/db

# 部署应用
kubectl apply -f k8s/

# 查看状态
kubectl get pods
kubectl get services
```

### 12.3 环境变量配置

**后端环境变量** (`.env`)：
```bash
# 应用配置
APP_NAME=IPD Requirements Management System
APP_VERSION=1.0.0
DEBUG=false

# API配置
API_V1_PREFIX=/api/v1

# 安全配置
SECRET_KEY=your-production-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# 数据库配置
DATABASE_URL=postgresql://ipd_user:strong_password@postgres:5432/ipd_req_db

# Redis配置
REDIS_URL=redis://redis:6379

# CORS配置
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# 文件上传
MAX_UPLOAD_SIZE=10485760
UPLOAD_DIR=/app/uploads
```

**前端环境变量** (`.env.production`)：
```bash
# API配置
VITE_API_URL=https://api.your-domain.com/api/v1
```

### 12.4 健康检查

**后端健康检查**：
```http
GET /health
```

**响应**：
```json
{
  "status": "healthy",
  "timestamp": "2026-01-21T10:00:00Z",
  "database": "connected",
  "redis": "connected"
}
```

**Nginx配置示例**：
```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:5173;
}

server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 13. 常见问题

### 13.1 开发问题

**Q1: 如何解决跨域问题？**

A: 在后端配置CORS中间件：
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Q2: 如何调试API？**

A: 使用Swagger UI或ReDoc：
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

**Q3: 前端热更新不工作？**

A: 检查Vite配置：
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    hmr: true,  // 启用热更新
    watch: {
      usePolling: true,  // 某些系统需要轮询
    },
  },
})
```

**Q4: 数据库迁移失败？**

A: 检查迁移状态：
```bash
# 查看当前版本
alembic current

# 查看迁移历史
alembic history

# 回滚到上一个版本
alembic downgrade -1

# 重新生成迁移
alembic revision --autogenerate -m "描述"
```

**Q5: 如何清空测试数据库？**

A: 使用pytest fixture自动清理，或手动：
```bash
# 删除所有表
pytest --create-db

# 或使用SQLite内存数据库（自动清理）
DATABASE_URL=sqlite+aiosqlite:///:memory:
```

### 13.2 部署问题

**Q6: Docker容器启动失败？**

A: 检查日志：
```bash
docker-compose logs backend
docker-compose logs frontend
```

常见问题：
- 端口被占用：修改`docker-compose.yml`中的端口映射
- 数据库连接失败：检查环境变量配置
- 权限问题：确保有写入权限

**Q7: 如何备份数据库？**

A: 使用pg_dump：
```bash
# 备份
docker exec postgres pg_dump -U ipd_user ipd_req_db > backup.sql

# 恢复
docker exec -i postgres psql -U ipd_user ipd_req_db < backup.sql
```

**Q8: 如何更新生产环境？**

A: 零停机部署流程：
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 构建新镜像
docker-compose build

# 3. 启动新容器（滚动更新）
docker-compose up -d --no-deps backend
docker-compose up -d --no-deps frontend

# 4. 清理旧镜像
docker image prune -f
```

### 13.3 性能问题

**Q9: API响应慢？**

A: 优化建议：
1. 添加数据库索引
2. 使用Redis缓存热点数据
3. 启用分页查询
4. 使用连接池
5. 添加负载均衡

**Q10: 前端首屏加载慢？**

A: 优化建议：
1. 使用路由懒加载（已实现）
2. 启用Gzip压缩
3. 使用CDN加速
4. 图片懒加载
5. 代码分割

---

## 14. 快速上手

### 14.1 环境准备

**必需软件**：
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Git

**推荐工具**：
- VS Code（扩展：Python、TypeScript、Vite）
- Postman（API测试）
- DBeaver（数据库管理）

### 14.2 克隆项目

```bash
# 克隆仓库
git clone <repository-url>
cd claude_study

# 查看分支
git branch -a
git checkout develop  # 切换到开发分支
```

### 14.3 后端启动

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 运行数据库迁移
alembic upgrade head

# 创建测试用户
python scripts/create_test_user.py

# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 测试API
curl http://localhost:8000/docs
```

### 14.4 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动开发服务器
npm run dev

# 访问应用
open http://localhost:5173
```

### 14.5 登录系统

**默认账号**：
- 用户名：`admin`
- 密码：`admin123`

**首次登录后**：
1. 修改默认密码
2. 创建组织和租户
3. 邀请团队成员

### 14.6 开发任务示例

**任务：添加新的需求来源渠道**

**步骤1：修改后端**
```python
# backend/app/models/requirement.py
class Requirement(Base, TimestampMixin, TenantMixin):
    source_channel: Mapped[str] = mapped_column(
        String(50),
        comment="来源渠道: customer/market/sales/rd/after_sales/partner"
    )
```

**步骤2：修改前端类型**
```typescript
// frontend/src/shared/types/api.ts
export type SourceChannel =
  | 'customer'
  | 'market'
  | 'sales'
  | 'rd'
  | 'after_sales'
  | 'partner'  // 新增
```

**步骤3：添加测试**
```python
# backend/tests/test_requirements.py
@pytest.mark.asyncio
async def test_create_requirement_from_partner():
    response = await async_client.post(
        "/api/v1/requirements",
        json={
            "title": "合作伙伴需求",
            "source_channel": "partner"
        },
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
```

**步骤4：运行测试**
```bash
cd backend
pytest tests/test_requirements.py::test_create_requirement_from_partner -v

cd frontend
npm run test
```

**步骤5：提交代码**
```bash
git add .
git commit -m "feat: 添加合作伙伴作为需求来源渠道"
git push origin feature/add-partner-channel
```

### 14.7 学习资源

**项目文档**：
- API文档: `http://localhost:8000/docs`
- 数据库设计: `backend/docs/database.md`
- 前端组件文档: `frontend/docs/components.md`

**外部资源**：
- FastAPI官方文档: https://fastapi.tiangolo.com/
- React文档: https://react.dev/
- Ant Design文档: https://ant.design/
- SQLAlchemy文档: https://docs.sqlalchemy.org/

---

## 附录

### A. 关键文件路径速查

**后端关键文件**：
- 应用入口: `backend/app/main.py`
- 配置文件: `backend/app/config.py`
- 需求模型: `backend/app/models/requirement.py`
- 需求API: `backend/app/api/v1/requirements.py`
- 权限控制: `backend/app/core/permissions.py`
- 租户中间件: `backend/app/core/tenant.py`
- 基础仓储: `backend/app/repositories/base.py`

**前端关键文件**：
- 应用入口: `frontend/src/main.tsx`
- 根组件: `frontend/src/App.tsx`
- 路由配置: `frontend/src/router/index.tsx`
- 主布局: `frontend/src/shared/components/layout/MainLayout.tsx`
- 认证状态: `frontend/src/stores/useAuthStore.ts`
- API配置: `frontend/src/services/api.ts`
- 类型定义: `frontend/src/shared/types/api.ts`

### B. 端口占用说明

| 服务 | 端口 | 用途 |
|------|------|------|
| Frontend (Vite) | 5173 | 前端开发服务器 |
| Backend (FastAPI) | 8000 | 后端API服务器 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |

### C. 命令速查

**后端**：
```bash
# 启动开发服务器
uvicorn app.main:app --reload --port 8000

# 运行测试
pytest tests/ -v

# 数据库迁移
alembic upgrade head

# 查看日志
tail -f logs/app.log
```

**前端**：
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test

# 代码检查
npm run lint
```

**Docker**：
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

---

**文档版本**: v1.0
**生成时间**: 2026-01-21
**维护者**: 开发团队

---

## 结语

本文档全面介绍了IPD需求管理系统的技术架构、开发流程和核心模块。如果你是新人，建议按照"快速上手"章节的步骤进行操作，在实践中逐步熟悉系统。

如有任何问题，请随时联系开发团队。

祝工作愉快！🎉

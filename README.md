# IPD需求管理系统

基于IPD（集成产品开发）框架的完整需求管理系统，实现需求全生命周期管理：**收集 → 分析 → 分发 → 实现 → 验证**。

## 系统架构

```
┌─────────────────────────────────────────┐
│         前端 (React + TypeScript)        │
│  需求收集 | 分析评分 | 分发流转 | 跟踪追溯 │
└─────────────────────────────────────────┘
                 ↓ HTTP/WebSocket
┌─────────────────────────────────────────┐
│         API网关 (FastAPI)                │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      业务逻辑层 (Services)               │
│  需求服务 | APPEALS | KANO | RTM         │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      数据层 (PostgreSQL + Redis)         │
└─────────────────────────────────────────┘
```

## 技术栈

### 后端
- **框架**: FastAPI 0.104+
- **数据库**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **迁移**: Alembic
- **缓存**: Redis 7
- **认证**: JWT (python-jose)

### 前端
- **框架**: React 18
- **语言**: TypeScript 5+
- **构建**: Vite 5
- **路由**: React Router v6
- **UI库**: Ant Design 5
- **状态管理**: Zustand
- **服务端状态**: TanStack Query
- **图表**: Recharts

## 核心功能

### 1. 需求收集
- 多渠道收集（客户、市场、竞争、销售、售后、研发）
- 客户需求十问表单
- 附件上传支持
- **AI智能洞察**（DeepSeek驱动的文本分析）

### 2. 需求分析
- **APPEALS模型**：8维度评分（价格/可获得性/包装/性能/易用性/保证/生命周期成本/社会接受度）
- **KANO模型**：分类（基本型/期望型/兴奋型）
- 优先级自动计算
- **AI驱动的洞察提取**：
  - IPD需求十问自动提取
  - 用户画像智能分析
  - 场景与情感标签识别
  - 可视化用户故事板

### 3. 需求分发
- **SP**（战略规划）- 长期需求（>12个月）
- **BP**（业务计划/产品路标）- 中期需求（3-12个月）
- **Charter**（项目任务书）- 短期需求（<3个月）
- **PCR**（产品变更请求）- 紧急需求

### 4. 需求跟踪（RTM）
- 需求跟踪矩阵
- CDP阶段跟踪（概念/计划/开发/测试/发布/维护）
- 覆盖率统计

### 5. 需求验证
- 原型验证
- 测试验证
- 客户试用
- 验证报告生成

### 6. AI需求洞察
- 智能文本分析（基于DeepSeek AI）
- 自动提取IPD需求十问
- 可视化用户故事卡片
- 支持长文本分段处理
- 快速分析模式（10-20秒）
- 深度分析模式（30-60秒）

## 快速开始

### 使用Docker Compose（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

服务将在以下地址可用：
- **前端**: http://localhost:5173
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

### 本地开发

#### 1. 启动数据库
```bash
docker-compose up -d postgres redis
```

#### 2. 启动后端
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

#### 3. 启动前端
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 项目结构

```
.
├── backend/                 # FastAPI后端
│   ├── app/
│   │   ├── main.py         # 应用入口
│   │   ├── models/         # 数据模型（13张表）
│   │   ├── schemas/        # Pydantic模式
│   │   ├── api/v1/         # API路由
│   │   ├── services/       # 业务逻辑
│   │   ├── core/           # 核心工具（认证、安全）
│   │   └── db/             # 数据库配置
│   ├── alembic/            # 数据库迁移
│   └── tests/              # 测试
│
├── frontend/               # React前端
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── components/     # 可复用组件
│   │   ├── stores/         # Zustand状态管理
│   │   ├── services/       # API服务层
│   │   ├── hooks/          # React Hooks
│   │   └── types/          # TypeScript类型
│   └── package.json
│
└── docker-compose.yml      # Docker编排
```

## 数据库设计

### 核心表（15张）

| 表名 | 用途 |
|------|------|
| users | 用户管理 |
| requirements | 需求主表 |
| requirement_10q_answers | 客户需求十问 |
| appeals_analysis | APPEALS分析 |
| kano_classification | KANO分类 |
| strategic_plans | 战略规划（SP） |
| business_plans | 业务计划（BP） |
| charters | 项目任务书 |
| pcr_requests | 产品变更请求（PCR） |
| rtm_traces | 需求跟踪矩阵 |
| verification_records | 验证记录 |
| workflow_history | 工作流历史 |
| attachments | 附件管理 |
| **insight_analyses** | **AI洞察分析记录** |
| **user_storyboards** | **用户故事板** |

## API文档

启动后端后，访问：
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 环境变量

### 后端 (.env)
```
DATABASE_URL=postgresql://ipd_user:ipd_pass@localhost:5432/ipd_req_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
DEBUG=true
```

### 前端 (.env)
```
VITE_API_URL=http://localhost:8000/api/v1
```

## 开发进度

- [x] 第一阶段：基础设施搭建
  - [x] FastAPI项目结构
  - [x] PostgreSQL + SQLAlchemy + Alembic
  - [x] JWT认证系统
  - [x] 13张数据表模型
- [x] 前端React项目初始化
- [ ] 第二阶段：需求收集模块
- [ ] 第三阶段：分析模块
- [ ] 第四阶段：分发模块
- [ ] 第五阶段：跟踪模块
- [ ] 第六阶段：验证模块
- [ ] 第七阶段：测试与部署

## 许可证

MIT

## 联系方式

如有问题或建议，请提交Issue。

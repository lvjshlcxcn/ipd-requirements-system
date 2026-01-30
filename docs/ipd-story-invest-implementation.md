# IPD 需求十问 → 用户故事 → INVEST 分析功能实现文档

## 📋 功能概述

本功能实现了完整的 IPD（集成产品开发）需求分析流程：

1. **IPD 需求十问表单** - 收集客户访谈信息
2. **用户故事自动生成** - 基于十问智能生成用户故事卡片
3. **INVEST 质量评估** - 对用户故事进行六维度质量分析

## 🎨 UI 配色方案

严格遵循需求分析系统的配色规范：

| 颜色用途 | 色值 | 应用场景 |
|---------|------|---------|
| 主色（蓝色） | `#1890ff` | 主按钮、链接、滑块轨道 |
| 成功（绿色） | `#52c41a` | 高评分、成功状态、正向反馈 |
| 警告（橙色） | `#faad14` | 中等评分、警告提示 |
| 错误（红色） | `#ff4d4f` | 低评分、错误提示、高优先级 |
| 文本主色 | `rgba(0, 0, 0, 0.88)` | 主要文本内容 |
| 文本次要色 | `rgba(0, 0, 0, 0.65)` | 次要文本、描述信息 |
| 背景色 | `#f0f2f5` | 页面背景 |
| 卡片背景 | `#ffffff` | 卡片、表单背景 |

## 📁 项目结构

### 前端文件 (React + TypeScript)

```
frontend/src/
├── types/
│   └── ipd.ts                          # IPD 相关类型定义
├── services/
│   └── ipdStory.service.ts             # IPD API 服务
├── components/ipd-story/
│   ├── IPDQuestionnaireForm.tsx        # IPD 十问表单组件
│   ├── UserStoryCard.tsx               # 用户故事卡片组件
│   ├── INVESTAnalysisPanel.tsx         # INVEST 分析面板组件
│   └── index.ts                        # 组件导出
└── pages/ipd-story/
    └── IPDStoryFlowPage.tsx            # 主流程页面
```

### 后端文件 (FastAPI + Python)

```
backend/
├── app/
│   ├── schemas/
│   │   └── ipd_story.py                # IPD 相关 Pydantic 模型
│   ├── models/
│   │   └── ipd_story.py                # 数据库 ORM 模型
│   ├── services/
│   │   └── ipd_story_service.py        # 业务逻辑服务层
│   └── api/v1/
│       └── ipd_story.py                # API 路由定义
└── alembic/versions/
    └── 20260130_add_ipd_story_tables.py # 数据库迁移文件
```

## 🔌 API 端点

| 方法 | 路径 | 描述 |
|-----|------|------|
| POST | `/api/v1/ipd-story/generate` | 基于 IPD 十问生成用户故事 |
| POST | `/api/v1/ipd-story/invest-analyze` | 执行 INVEST 分析 |
| POST | `/api/v1/ipd-story/workflow` | 保存完整工作流 |
| GET | `/api/v1/ipd-story/workflow/{id}` | 获取工作流数据 |
| GET | `/api/v1/ipd-story/workflows` | 获取工作流列表 |
| GET | `/api/v1/ipd-story/workflow/{id}/export` | 导出工作流结果 |

## 🗄️ 数据库表结构

### 1. ipd_ten_questions (IPD 十问表)
```sql
- id: 主键
- tenant_id: 租户 ID
- created_by: 创建者 ID
- q1_who ~ q10_value: 十个问题字段
- created_at, updated_at: 时间戳
```

### 2. user_stories (用户故事表)
```sql
- id: 主键
- tenant_id: 租户 ID
- created_by: 创建者 ID
- title, role, action, benefit: 故事核心信息
- priority, frequency: 优先级和频次
- acceptance_criteria: JSON 数组，验收标准
- ipd_question_id: 关联 IPD 十问表
- created_at, updated_at: 时间戳
```

### 3. invest_analyses (INVEST 分析表)
```sql
- id: 主键
- tenant_id: 租户 ID
- created_by: 创建者 ID
- story_id: 关联用户故事表
- scores: JSON 对象，六个维度评分
- total_score, average_score: 总分和平均分
- suggestions: JSON 数组，改进建议
- notes: 备注
- analyzed_at, created_at: 时间戳
```

## 🔄 业务流程

```
用户填写 IPD 十问表单
         ↓
    提交到后端
         ↓
后端规则引擎处理：
  - 提取角色（谁关心）
  - 提取行动（理想方案）
  - 提取价值（为什么关心）
  - 生成验收标准（基于十问）
         ↓
  返回用户故事卡片
         ↓
  用户查看并确认
         ↓
  进入 INVEST 分析
         ↓
  用户调整六个维度评分（滑块）
         ↓
  实时计算总分/生成建议
         ↓
  保存或导出结果
```

## 🎯 INVEST 六维度

| 维度 | 英文 | 评估标准 | 优秀阈值 |
|-----|------|---------|---------|
| 独立 | Independent | 可以独立实现，不依赖其他功能 | ≥85 |
| 可协商 | Negotiable | 细节可以协商调整 | ≥85 |
| 有价值 | Valuable | 为用户或业务提供价值 | ≥85 |
| 可估算 | Estimable | 可以合理估算工作量 | ≥85 |
| 小型 | Small | 规模适中，短周期可完成 | ≥85 |
| 可测试 | Testable | 有明确的验收标准 | ≥85 |

## 💡 规则引擎逻辑

### 角色提取
```python
role_map = {
    '产品经理': '产品经理',
    '销售': '销售人员',
    '客服': '客服人员',
    '运营': '运营人员',
    '用户': '用户',
    '客户': '客户',
    '管理员': '系统管理员',
}
```

### 行动提取
```python
if '自动' in solution_text:
    return '系统能够自动处理相关流程'
elif '导出' or '报表' in solution_text:
    return '能够导出并查看数据报表'
elif '搜索' or '查找' in solution_text:
    return '能够快速搜索并找到所需信息'
elif '通知' or '提醒' in solution_text:
    return '能够及时接收相关通知'
```

### 验收标准生成
1. 基于理想方案生成
2. 基于问题生成
3. 基于频次生成
4. 补充通用标准（至少 3 条）

## 📊 雷达图实现

使用原生 Canvas API 绘制：
- 六边形背景网格
- 渐变填充数据区域
- 动态数据点标注
- 实时响应用户评分调整

## 🚀 部署步骤

### 1. 后端部署

```bash
cd backend

# 创建数据库迁移
alembic revision --autogenerate -m "add IPD story tables"

# 执行迁移
alembic upgrade head

# 启动服务
uvicorn app.main:app --reload
```

### 2. 前端部署

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 3. 路由配置

在 `frontend/src/router/routes.ts` 中添加：

```typescript
{
  path: '/ipd-story',
  element: <IPDStoryFlowPage />,
  title: 'IPD 需求分析',
}
```

在后端 `app/api/v1/__init__.py` 中注册路由：

```python
from app.api.v1 import ipd_story

api_router.include_router(ipd_story.router, prefix="/ipd-story", tags=["IPD Story"])
```

## 🧪 测试用例

### 单元测试

```typescript
// 测试 IPD 表单验证
describe('IPDQuestionnaireForm', () => {
  it('should require all required fields', () => {
    // 测试必填字段验证
  })
})

// 测试用户故事生成
describe('User Story Generation', () => {
  it('should extract role correctly', () => {
    // 测试角色提取逻辑
  })
})
```

### 集成测试

```python
def test_generate_user_story(db, client, auth_headers):
    response = client.post(
        "/api/v1/ipd-story/generate",
        json={
            "q1_who": "产品经理",
            "q2_why": "提升转化率",
            # ... 其他字段
        },
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
```

## 📈 后续优化方向

1. **AI 增强**：集成 LLM 进行更智能的故事生成
2. **模板系统**：支持自定义故事模板
3. **批量处理**：支持批量导入 IPD 十问数据
4. **版本管理**：支持故事的版本控制和历史追溯
5. **协作功能**：支持团队协作和评审
6. **导出增强**：完善 PDF、Word、PPT 导出功能
7. **数据分析**：提供故事质量趋势分析
8. **移动端适配**：优化移动端体验

## 🐛 已知问题

1. `list_workflows` 和 `get_workflow` 方法需要额外的 workflow 表支持
2. PDF/DOCX 导出功能待实现
3. 雷达图在不同屏幕尺寸下的响应式适配待优化

## 📝 更新日志

### 2026-01-30
- ✅ 初始版本发布
- ✅ 实现完整的 IPD 十问 → 用户故事 → INVEST 分析流程
- ✅ 前后端类型定义和服务层
- ✅ 数据库表结构和迁移脚本
- ✅ 遵循项目配色规范

## 👥 贡献者

- Claude Code (AI Assistant)
- 项目团队

## 📄 许可证

遵循项目整体许可证

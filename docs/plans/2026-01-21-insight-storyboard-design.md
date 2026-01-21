# 需求洞察故事板生成器 - 技术设计方案

**日期**: 2026-01-21
**功能名称**: 需求洞察故事板生成器 (Requirement Insight Storyboard)
**设计者**: Claude Code Assistant

---

## 1. 功能概述

### 1.1 核心价值

从客户调研录音文本中自动提取需求洞察，生成可视化的用户故事卡片，帮助产品经理快速理解客户真实痛点。

### 1.2 目标用户

- **主要用户**: 产品经理/需求分析师
- **使用场景**: 需求调研后的文本分析和洞察提炼

### 1.3 工作流程

```
1. 文本输入（外部文本粘贴）
   ↓
2. AI智能提取（DeepSeek API）
   ↓
3. 人工确认与编辑
   ↓
4. 故事板生成（可视化图文卡片）
   ↓
5. 关联需求（可选）
```

---

## 2. 技术架构

### 2.1 整体架构

```
前端 (React + TypeScript)
  ↓ 提交文本
后端 (FastAPI)
  ↓ 调用 LLM API
DeepSeek API
  ↓ 返回分析结果
后端处理并保存
  ↓ 返回结构化数据
前端渲染故事板
```

### 2.2 技术栈

**前端**:
- React 18 + TypeScript
- Ant Design 5（UI组件）
- Zustand（状态管理）
- html2canvas + jspdf（导出图片/PDF）

**后端**:
- FastAPI（Python异步框架）
- SQLAlchemy 2.0（ORM）
- PostgreSQL（数据库）
- OpenAI SDK（调用DeepSeek API）

**AI服务**:
- DeepSeek API (deepseek-chat模型)
- 支持最长20000字文本分析

---

## 3. 数据模型设计

### 3.1 核心数据表

**表1: insight_analyses（文本洞察分析记录）**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | BIGINT | 主键 |
| tenant_id | BIGINT | 租户ID |
| input_text | TEXT | 原始输入文本（最长20000字） |
| text_length | INTEGER | 文本字数 |
| input_source | VARCHAR(50) | 输入来源: manual/upload/voice |
| llm_provider | VARCHAR(50) | LLM提供商 |
| llm_model | VARCHAR(100) | 模型名称 |
| analysis_mode | VARCHAR(50) | 分析模式: full/quick |
| analysis_result | JSONB | 完整AI分析结果 |
| q1_who ~ q10_value | TEXT | 十问字段（冗余存储） |
| user_persona | JSONB | 用户画像 |
| scenario | JSONB | 场景信息 |
| emotional_tags | JSONB | 情感标签 |
| status | VARCHAR(20) | 状态: draft/confirmed/linked |
| created_by | BIGINT | 创建人 |
| created_at | TIMESTAMP | 创建时间 |
| analysis_duration | INTEGER | 分析耗时（秒） |
| tokens_used | INTEGER | 使用的token数 |

**表2: user_storyboards（用户故事板）**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | BIGINT | 主键 |
| insight_id | BIGINT | 关联的洞察分析ID |
| title | VARCHAR(200) | 标题 |
| card_data | JSONB | 故事卡片完整数据 |
| card_style | VARCHAR(50) | 卡片样式 |
| color_theme | VARCHAR(50) | 主题色 |
| export_image_path | TEXT | 导出图片路径 |
| linked_requirement_id | BIGINT | 关联需求ID |
| created_by | BIGINT | 创建人 |
| created_at | TIMESTAMP | 创建时间 |

---

## 4. 后端API设计

### 4.1 API路由

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/insights/analyze | 分析文本洞察 |
| GET | /api/v1/insights | 获取洞察列表 |
| GET | /api/v1/insights/{id} | 获取洞察详情 |
| PUT | /api/v1/insights/{id} | 更新洞察分析结果 |
| POST | /api/v1/insights/{id}/storyboard | 创建故事板 |
| POST | /api/v1/insights/{id}/link-requirement | 关联到需求 |

### 4.2 核心服务

**LLMService**: 统一的LLM调用服务
- 支持DeepSeek API
- 实现重试机制（最多3次）
- 返回结构化JSON数据

**InsightService**: 洞察分析业务服务
- 智能分段处理超长文本
- 合并多段分析结果
- 生成故事板卡片数据

---

## 5. 前端UI设计

### 5.1 功能入口

**需求列表页面**:
- 顶部工具栏新增按钮：「📊 AI洞察分析」

**需求详情页面**:
- Tab栏新增：「故事板」Tab

### 5.2 核心组件

**TextInsightModal**: 文本洞察分析弹窗
- 文本输入区（最多20000字）
- 分析模式选择（深度分析/快速分析）
- 实时进度显示

**UserStoryCard**: 用户故事卡片
- 用户角色展示（带头像）
- 使用场景展示
- 痛点流程图
- 期望解决方案
- 情感标签（紧迫度、重要性、频次）

**InsightEditor**: 洞察结果编辑器
- 左侧：十问结构化数据编辑
- 右侧：实时预览故事板效果

### 5.3 故事板视觉设计

**卡片尺寸**: 600x800px
**配色方案**:
- 高紧迫：红色系
- 中等紧迫：蓝色系
- 低紧迫：绿色系

**卡片结构**:
```
┌─────────────────────────────┐
│  👤 用户角色                 │
│  🎯 使用场景                 │
│  😫 痛点问题（流程图）         │
│  💡 期望解决方案              │
│  标签: #高紧迫 #高价值        │
└─────────────────────────────┘
```

---

## 6. 配置管理

### 6.1 环境变量配置

```bash
# DeepSeek API配置
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=4000
DEEPSEEK_TEMPERATURE=0.3
DEEPSEEK_TIMEOUT=60

# 分析功能配置
INSIGHTS_MAX_TEXT_LENGTH=20000
INSIGHTS_ENABLE_CACHING=true
INSIGHTS_CACHE_TTL=3600
INSIGHTS_SEGMENT_THRESHOLD=15000
```

### 6.2 Prompt配置

**IPD需求十问Prompt模板**:
- 提取10个维度的需求信息
- 返回结构化JSON格式
- 包含用户画像、场景、情感标签等扩展信息

**Prompt管理**:
- 存储在独立配置文件中
- 支持版本管理
- 可通过管理员界面编辑（预留）

---

## 7. 错误处理

### 7.1 输入验证

- 文本长度：10-20000字
- 内容检查：不能为空或仅空白字符
- 格式验证：必须包含中文或英文

### 7.2 LLM错误处理

**重试策略**:
- 最多重试3次
- 指数退避（2秒、4秒、10秒）

**降级策略**:
- API Key错误 → 提示检查配置
- 配额不足 → 提示联系管理员
- 超时 → 建议使用快速分析模式

### 7.3 超长文本处理

**智能分段**:
- 超过15000字自动分段
- 按段落或对话轮次分割
- 每段独立分析后合并结果

**结果合并**:
- 保留最完整的信息
- 优先级取最高
- 痛点列表合并去重

---

## 8. 测试策略

### 8.1 后端测试

**单元测试**:
- 文本验证测试
- 文本分段测试
- 结果合并测试
- LLM服务mock测试

**集成测试**:
- API端点测试
- 错误场景测试
- 权限测试

### 8.2 前端测试

**组件测试**:
- Modal交互测试
- 表单验证测试
- 卡片渲染测试

**服务测试**:
- API调用测试
- 错误处理测试

### 8.3 E2E测试

**完整流程测试**:
- 登录 → 输入文本 → 分析 → 编辑 → 保存 → 验证

**边界场景测试**:
- 空文本、过短文本、过长文本
- 网络错误、API超时

---

## 9. 实施计划

### 9.1 开发优先级

**Phase 1: 核心功能（MVP）**
1. 后端DeepSeek API集成和Prompt配置
2. 文本洞察分析API
3. 前端文本输入弹窗
4. 基础故事板卡片展示

**Phase 2: 完善功能**
1. 超长文本分段处理
2. 编辑和确认界面
3. 故事板导出（图片/PDF）
4. 关联需求功能

**Phase 3: 优化增强**
1. 缓存机制
2. 敏感信息过滤
3. 速率限制
4. 性能优化

### 9.2 技术风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| DeepSeek API不稳定 | 分析失败 | 实现重试机制、降级到快速模式 |
| API成本过高 | 运营成本 | 添加缓存、限制使用频率 |
| 长文本处理慢 | 用户体验差 | 智能分段、显示进度条 |
| AI结果不准确 | 用户体验差 | 人工编辑环节、持续优化Prompt |

### 9.3 成功指标

- **准确率**: AI提取十问的准确率 > 85%
- **效率**: 从输入文本到生成故事板 < 3分钟
- **可用性**: 分析成功率 > 95%
- **用户满意度**: 用户确认并保存的比例 > 80%

---

## 10. 关键文件清单

### 后端文件

```
backend/
├── app/
│   ├── api/v1/
│   │   └── insights.py                    # API路由
│   ├── models/
│   │   └── insight.py                     # 数据模型
│   ├── schemas/
│   │   └── insight.py                     # Pydantic模式
│   ├── services/
│   │   ├── llm_service.py                 # LLM服务
│   │   ├── insight_service.py             # 洞察业务服务
│   │   └── text_sanitizer.py              # 文本清洗服务
│   └── config/
│       ├── prompts.py                     # Prompt模板配置
│       └── settings.py                    # 应用配置
└── tests/
    ├── test_insight_service.py            # 单元测试
    └── test_insights_api.py               # 集成测试
```

### 前端文件

```
frontend/src/
├── pages/
│   └── insights/
│       ├── InsightList.tsx                # 洞察列表页
│       └── StoryboardGallery.tsx          # 故事板画廊
├── components/
│   └── insights/
│       ├── TextInsightModal.tsx           # 文本洞察弹窗
│       ├── InsightEditor.tsx              # 洞察编辑器
│       ├── UserStoryCard.tsx              # 用户故事卡片
│       ├── StoryboardCanvas.tsx           # 故事板画布
│       └── AnalysisProgress.tsx           # 分析进度组件
├── services/
│   └── insight.service.ts                 # 洞察API服务
├── stores/
│   └── insightStore.ts                    # 洞察状态管理
└── types/
    └── insight.ts                         # 类型定义
```

---

## 11. 附录：IPD需求十问模型

### 11.1 十问内容

1. **谁关心这个需求？**（用户角色、部门、职位）
2. **为什么关心？**（动机、背景、KPI压力）
3. **什么问题？**（具体痛点、困扰）
4. **当前怎么解决的？**（现有方案、工作流程）
5. **有什么问题？**（现有方案的不足）
6. **理想方案是什么？**（期望的解决方案）
7. **优先级？**（紧急程度、重要性）
8. **频次？**（问题出现的频率）
9. **影响范围？**（涉及多少人、多少业务）
10. **价值衡量？**（可量化的收益）

### 11.2 扩展信息

**用户画像（User Persona）**:
- 角色
- 部门
- 人口统计特征
- 痛点列表
- 目标列表

**场景（Scenario）**:
- 场景背景
- 环境描述
- 触发条件
- 发生频率

**情感标签（Emotional Tags）**:
- 紧迫度（high/medium/low）
- 重要性（high/medium/low）
- 情感倾向（frustrated/neutral/satisfied）
- 情感关键词

---

**文档版本**: v1.0
**最后更新**: 2026-01-21
**状态**: ✅ 设计完成，待实施

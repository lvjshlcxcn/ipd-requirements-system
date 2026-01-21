# 需求洞察故事板生成器 - 新会话执行指南

## 📋 执行任务

实施 **需求洞察故事板生成器** 功能

## 🎯 实施计划位置

**计划文档**: `docs/plans/2026-01-21-insight-storyboard-implementation.md`

## 🚀 启动步骤

### 1. 在新会话中打开

```bash
# 在新的Claude Code会话中
cd /Users/kingsun/claude_study
```

### 2. 告诉Claude：

```
请使用 superpowers:executing-plans skill 来执行以下实施计划：

docs/plans/2026-01-21-insight-storyboard-implementation.md

这是一个需求洞察故事板生成器功能，从客户访谈文本中自动提取需求洞察并生成可视化用户故事卡片。
```

### 3. 技术栈

- **后端**: FastAPI + PostgreSQL + SQLAlchemy + DeepSeek API
- **前端**: React 18 + TypeScript + Ant Design 5 + Zustand

### 4. 关键依赖

**后端需要安装**:
```bash
cd backend
pip install openai tenacity
```

**前端已有依赖**:
- React 18
- Ant Design 5
- Zustand

### 5. 配置要求

**后端 .env 文件需要添加**:
```bash
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=4000
DEEPSEEK_TEMPERATURE=0.3
DEEPSEEK_TIMEOUT=60

INSIGHTS_MAX_TEXT_LENGTH=20000
INSIGHTS_ENABLE_CACHING=true
INSIGHTS_CACHE_TTL=3600
INSIGHTS_SEGMENT_THRESHOLD=15000
```

### 6. 项目结构

**后端**:
- `backend/app/config.py` - 应用配置（需添加DeepSeek配置）
- `backend/app/services/llm_service.py` - 新建LLM服务
- `backend/app/config/prompts.py` - 新建Prompt模板
- `backend/app/models/insight.py` - 新建数据模型
- `backend/app/schemas/insight.py` - 新建Pydantic schemas
- `backend/app/api/v1/insights.py` - 新建API路由
- `backend/alembic/versions/` - 数据库迁移

**前端**:
- `frontend/src/types/insight.ts` - 新建类型定义
- `frontend/src/services/insight.service.ts` - 新建API服务
- `frontend/src/stores/insightStore.ts` - 新建Zustand store
- `frontend/src/components/insights/` - 新建组件目录
- `frontend/src/App.tsx` - 修改（集成AI洞察按钮）

### 7. 测试账户

- **URL**: http://localhost:5173
- **用户名**: admin
- **密码**: admin123

### 8. 验证检查清单

完成Phase 1-6后，验证：

- [ ] 后端配置正常加载DeepSeek API key
- [ ] 数据库表 `insight_analyses` 和 `user_storyboards` 创建成功
- [ ] API文档显示新的 `/api/v1/insights/*` 端点
- [ ] 前端需求列表页显示"AI洞察分析"按钮
- [ ] 点击按钮打开文本输入弹窗
- [ ] 输入测试文本后能成功调用AI分析
- [ ] 分析结果保存到数据库
- [ ] 测试文本：

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

### 9. 常见问题

**Q: DeepSeek API key从哪里获取？**
A: 访问 https://platform.deepseek.com/api_keys

**Q: 如何测试LLM服务是否正常？**
A:
```python
cd backend
python -c "from app.services.llm_service import llm_service; import asyncio; asyncio.run(llm_service.analyze_insight('测试文本', '{text}'))"
```

**Q: 数据库迁移失败怎么办？**
A: 检查PostgreSQL服务是否运行：`./req-status.sh`

**Q: 前端找不到组件怎么办？**
A: 确保创建了 `frontend/src/components/insights/index.ts` 导出文件

### 10. 实施顺序

严格按照计划中的Task 1-16顺序执行，每个Task包含：
- Step 1: 创建/修改文件
- Step 2-N: 其他步骤
- 最后Step: Git提交

每个Task完成后应该可以独立验证。

---

## 📞 支持

如果遇到问题：
1. 检查实施计划中的详细步骤
2. 查看错误信息
3. 回到原会话咨询

---

**准备就绪！在新会话中使用 executing-plans skill 开始实施。**

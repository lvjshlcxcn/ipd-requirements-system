# AI洞察功能测试指南

## 功能概述

AI洞察功能可以自动分析客户访谈文本，提取IPD需求十问、用户画像、场景和情感标签。

## 测试步骤

### 1. 访问前端应用

打开浏览器访问：http://localhost:5173

### 2. 登录系统

- 如果系统需要登录，使用你的账号登录
- 如果没有账号，可能需要先注册

### 3. 进入需求管理页面

- 点击左侧菜单的"需求管理"
- 或直接访问：http://localhost:5173/requirements

### 4. 打开AI洞察分析

在需求管理页面右上角，点击 **"📊 AI洞察分析"** 按钮

### 5. 输入测试文本

在弹出的对话框中，粘贴以下测试文本（或使用你自己的客户访谈文本）：

```
测试文本示例：

我们是一家风力发电机组制造企业，目前遇到一个很头疼的问题。

我们的运维团队反映，在处理风机故障时，经常因为无法及时获取准确的维护记录而导致停机时间过长。每次维修都要翻阅大量纸质文档，或者在不同的系统之间切换查找信息，非常影响效率。

这个问题每周都会发生3-5次，每次平均耽误2-4小时。我们希望能有一个统一的维护管理平台，能够快速查看设备历史、维修记录、备件库存等信息。

目前有30多个运维工程师受此问题影响，他们迫切需要一个更好的解决方案。
```

### 6. 选择分析模式

有两种模式可选：

- **深度分析（full）**：完整的IPD十问分析，耗时30-60秒
- **快速分析（quick）**：核心要点提取，耗时10-20秒

建议先试用"快速分析"模式。

### 7. 开始分析

点击"开始AI分析"按钮，等待分析完成。

分析过程中会显示进度条：
- 快速分析：10-20秒
- 深度分析：30-60秒

### 8. 查看分析结果

分析完成后，系统会自动显示洞察结果，包括：

#### IPD需求十问
1. **谁提出的需求**（q1_who）
2. **为什么提出**（q2_why）
3. **什么问题**（q3_what_problem）
4. **当前解决方案**（q4_current_solution）
5. **当前存在的问题**（q5_current_issues）
6. **理想解决方案**（q6_ideal_solution）
7. **优先级**（q7_priority）：high/medium/low
8. **频率**（q8_frequency）：daily/weekly/monthly/occasional
9. **影响范围**（q9_impact_scope）
10. **价值**（q10_value）

#### 扩展分析
- **用户画像**（user_persona）
  - 角色
  - 部门
  - 人群特征
  - 痛点
  - 目标

- **场景**（scenario）
  - 上下文
  - 环境
  - 触发因素
  - 频率

- **情感标签**（emotional_tags）
  - 紧急度
  - 重要性
  - 情感倾向
  - 情感关键词

## 其他查看方式

### 方式1：通过API查看

使用浏览器开发者工具或API工具（如Postman）：

```bash
# 获取所有洞察记录
GET http://localhost:8000/api/v1/insights/
Authorization: Bearer <your_token>

# 获取特定洞察详情
GET http://localhost:8000/api/v1/insights/{id}
Authorization: Bearer <your_token>
```

### 方式2：通过数据库查看

```sql
-- 查看所有洞察分析记录
SELECT
  id,
  input_text,
  status,
  created_at
FROM insight_analyses
ORDER BY created_at DESC;

-- 查看某个洞察的完整分析结果
SELECT
  id,
  q1_who,
  q2_why,
  q3_what_problem,
  q4_current_solution,
  q5_current_issues,
  q6_ideal_solution,
  q7_priority,
  q8_frequency,
  q9_impact_scope,
  q10_value,
  user_persona,
  scenario,
  emotional_tags,
  analysis_result
FROM insight_analyses
WHERE id = 1;
```

## 常见问题

### Q: 分析失败怎么办？

A: 检查以下几点：
1. 确认后端服务正常运行（http://localhost:8000）
2. 确认DeepSeek API密钥配置正确
3. 查看浏览器控制台错误信息
4. 查看后端日志

### Q: 如何查看历史分析记录？

A: 目前前端界面可能还没有历史记录列表页面，你可以：
- 通过API查看
- 直接查询数据库
- 查看后端日志

### Q: 分析结果可以编辑吗？

A: 可以。通过API的PUT请求更新洞察结果：
```bash
PUT http://localhost:8000/api/v1/insights/{id}
```

## 测试建议

1. **先测试短文本**：使用100-500字的短文本快速测试
2. **测试不同场景**：尝试不同类型的客户反馈文本
3. **对比两种模式**：对比快速分析和深度分析的结果差异
4. **验证准确性**：检查AI提取的信息是否准确
5. **测试边界情况**：
   - 空文本
   - 超长文本（20000字）
   - 格式化文本（列表、表格等）

## API配置信息

后端已在 `.env` 文件中配置了DeepSeek API：
```
DEEPSEEK_API_KEY=sk-154cca2f691445d5b7df8bbc1ff43b7b
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

## 下一步

测试完成后，你可以：
1. 根据分析结果创建正式的需求记录
2. 将洞察关联到现有需求
3. 生成用户故事板
4. 导出分析报告

---

**祝你测试顺利！如有问题请查看后端日志或联系开发团队。**

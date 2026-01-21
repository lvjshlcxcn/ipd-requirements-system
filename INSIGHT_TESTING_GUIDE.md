# 需求洞察功能 - 端到端测试指南

## 前置条件

1. 确保PostgreSQL服务运行: `./req-status.sh`
2. 确保DeepSeek API key已配置在 `backend/.env`
3. 启动服务: `./req-start.sh`

## 测试步骤

### 1. 访问应用

```
URL: http://localhost:5173
用户名: admin
密码: admin123
```

### 2. 导航到需求管理页面

点击侧边栏"需求管理"或直接访问需求列表

### 3. 点击"AI洞察分析"按钮

应该看到:
- 在"新建需求"按钮旁边有"📊 AI洞察分析"按钮
- 点击后打开文本洞察分析弹窗

### 4. 输入测试文本

使用以下测试文本:

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

### 5. 选择分析模式并开始分析

- 选择"快速分析"模式
- 点击"开始AI分析"按钮
- 应该看到进度条显示分析进度

### 6. 验证分析结果

预期结果:
- ✅ 分析成功完成(10-30秒)
- ✅ 显示"分析完成！"消息
- ✅ 提取的用户角色包含"产品经理"
- ✅ 痛点描述包含"手工合并数据耗时3天"
- ✅ 期望方案提到"自动化工具"

### 7. 验证数据库记录

```bash
# 连接到数据库并检查记录
PGPASSWORD=ipd_pass psql -U ipd_user -d ipd_req_db -c "SELECT id, text_length, q1_who, status, created_at FROM insight_analyses ORDER BY created_at DESC LIMIT 1;"
```

预期:
- 显示刚创建的洞察记录
- text_length 应该是输入文本的字数
- q1_who 应该包含"产品经理"
- status 应该是"draft"

### 8. 验证API文档

访问: http://localhost:8000/docs

预期:
- 看到"insights"标签
- 包含以下端点:
  - POST /insights/analyze
  - GET /insights/
  - GET /insights/{insight_id}
  - PUT /insights/{insight_id}
  - POST /insights/{insight_id}/link-requirement

### 9. 测试深度分析模式

重复步骤4-6,但选择"深度分析"模式。

预期:
- 分析时间更长(30-60秒)
- 返回完整的IPD需求十问
- 包含用户画像(user_persona)、场景(scenario)、情感标签(emotional_tags)

### 10. 测试文本长度验证

测试用例:

| 测试用例 | 输入 | 预期结果 |
|---------|------|---------|
| 空文本 | "" | 提示"请输入待分析的文本" |
| 过短文本 | "测试" | 提示"请输入待分析的文本" |
| 超长文本 | 超过20000字 | 提示"文本长度超过20000字限制" |
| 正常文本 | 1000字 | 成功分析 |

## 故障排查

### 问题1: 分析失败

**症状**: 点击"开始AI分析"后显示错误

**可能原因**:
- DeepSeek API key无效或未配置
- 网络连接问题
- API配额已用完

**解决方案**:
1. 检查 `backend/.env` 中的 DEEPSEEK_API_KEY
2. 访问 https://platform.deepseek.com/api_keys 确认key有效
3. 检查后端日志: `tail -f backend/logs/app.log`

### 问题2: 数据库错误

**症状**: 后端日志显示数据库连接错误

**解决方案**:
1. 检查PostgreSQL服务状态: `./req-status.sh`
2. 验证数据库连接: `PGPASSWORD=ipd_pass psql -U ipd_user -d ipd_req_db -c "SELECT 1;"`
3. 检查数据库表是否存在: `PGPASSWORD=ipd_pass psql -U ipd_user -d ipd_req_db -c "\dt"`

### 问题3: 前端无法连接后端

**症状**: 点击按钮无反应或网络错误

**解决方案**:
1. 检查后端是否运行: `curl http://localhost:8000/health`
2. 检查CORS配置
3. 查看浏览器控制台错误信息

## 测试完成检查清单

- [ ] AI洞察按钮显示在需求列表页
- [ ] 点击按钮打开文本输入弹窗
- [ ] 输入文本后能选择分析模式
- [ ] 快速分析模式成功返回结果(10-30秒)
- [ ] 深度分析模式成功返回完整结果(30-60秒)
- [ ] 分析结果保存到数据库
- [ ] API文档显示新的insights端点
- [ ] 文本长度验证正常工作
- [ ] 提取的用户角色正确
- [ ] 提取的痛点描述准确
- [ ] 提取的期望方案合理

## 性能基准

- **快速分析**: 10-20秒
- **深度分析**: 30-60秒
- **数据库查询**: < 100ms
- **前端响应**: 即时(< 100ms)

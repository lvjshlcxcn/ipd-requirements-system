# AI 洞察分析功能调试指南

## 问题描述
在 IPD 需求十问页面点击 "📊 AI洞察分析" 按钮后，分析失败。

## 可能的原因和解决方案

### 1. 后端服务未运行
**检查方法:**
```bash
curl http://localhost:8000/docs
# 应该返回 200
```

**解决方案:**
```bash
cd /Users/kingsun/claude_study/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. DeepSeek API 密钥问题
**检查方法:**
```bash
curl https://api.deepseek.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**解决方案:**
1. 访问 https://platform.deepseek.com/
2. 获取新的 API 密钥
3. 更新 `backend/.env` 文件中的 `DEEPSEEK_API_KEY`

### 3. 前端认证问题
**检查方法:**
打开浏览器开发者工具(F12) -> Network 标签，查看 `/api/v1/insights/analyze` 请求

**可能看到:**
- `401 Unauthorized` - 认证失败，需要重新登录
- `500 Internal Server Error` - 后端处理错误

**解决方案:**
1. 清除 localStorage 并重新登录
2. 检查 token 是否有效

### 4. 超时问题
AI 分析可能需要 10-60 秒，如果请求超时会失败。

**解决方案:**
在浏览器控制台查看错误信息：
```javascript
// 查看完整的错误
fetch('/api/v1/insights/analyze', {...})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err))
```

## 快速诊断步骤

1. **检查后端日志**
```bash
# 查看后端输出，应该能看到类似这样的日志：
# ✓ 从数据库加载模板 ipd_ten_questions
# DEBUG: 模板长度: xxxx
```

2. **检查前端控制台**
按 F12 打开开发者工具，查看 Console 标签是否有错误

3. **手动测试 API**
```bash
# 先登录获取 token
curl -X POST 'http://localhost:8000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'

# 使用返回的 token 测试分析
curl -X POST 'http://localhost:8000/api/v1/insights/analyze' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'X-Tenant-ID: 1' \
  -d '{
    "input_text": "测试文本",
    "input_source": "manual",
    "analysis_mode": "quick"
  }'
```

## 常见错误及解决方案

### 错误: "AI分析失败: Connection timeout"
- 原因: 无法连接到 DeepSeek API
- 解决: 检查网络连接，确认 API 密钥有效

### 错误: "AI返回的不是有效的JSON格式"
- 原因: DeepSeek API 返回格式错误
- 解决: 检查 DeepSeek 服务状态，可能需要重试

### 错误: "文本长度超过20000字限制"
- 原因: 输入文本太长
- 解决: 缩短文本或使用分段处理

### 错误: "未认证，请先登录"
- 原因: Token 过期或无效
- 解决: 退出登录后重新登录

## 改进建议

如果问题持续存在，可以：

1. **添加更详细的错误提示**
   - 在前端显示具体的错误信息
   - 在后端记录完整的错误日志

2. **添加重试机制**
   - 网络错误时自动重试
   - 提供手动重试按钮

3. **优化超时设置**
   - 增加前端请求超时时间
   - 显示分析进度

4. **添加测试模式**
   - 使用 mock 数据测试 UI
   - 绕过真实的 API 调用

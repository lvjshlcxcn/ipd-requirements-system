# 投票API快速测试指南

## 🚀 快速验证修复

### 1. 重启后端服务
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 准备测试数据
```sql
-- 查看会议45的投票人员设置
SELECT
    mr.meeting_id,
    mr.requirement_id,
    mr.assigned_voter_ids,
    r.requirement_no,
    r.title
FROM requirement_review_meeting_requirements mr
JOIN requirements r ON mr.requirement_id = r.id
WHERE mr.meeting_id = 45;

-- 查看现有投票记录
SELECT
    voter_id,
    vote_option,
    comment,
    created_at
FROM requirement_review_votes
WHERE meeting_id = 45 AND requirement_id = 20
ORDER BY created_at;
```

---

## 🧪 测试场景

### 场景1: ✅ 投票人员首次投票（应该成功）

```bash
# 使用 market_pm (用户ID=2) 登录获取token
# 假设该用户在 assigned_voter_ids 中且尚未投票

TOKEN="<your_market_pm_token>"

curl -X POST 'http://localhost:8000/api/v1/requirement-review-meetings/45/requirements/20/vote' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "vote_option": "approve",
    "comment": "我同意这个需求"
  }'
```

**预期结果**:
```json
{
  "success": true,
  "message": "投票成功",
  "data": {
    "id": <新投票ID>,
    "meeting_id": 45,
    "requirement_id": 20,
    "voter_id": 2,
    "vote_option": "approve"
  }
}
```

---

### 场景2: ❌ 已投票用户再次投票（应该返回400）

```bash
# 使用相同token再次投票

curl -X POST 'http://localhost:8000/api/v1/requirement-review-meetings/45/requirements/20/vote' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "vote_option": "reject",
    "comment": "我改主意了"
  }'
```

**预期结果** (修复后):
```json
{
  "detail": "您已经投过票了，不能修改投票选项"
}
```

**HTTP状态码**: `400 Bad Request` ⭐

---

### 场景3: 🚫 非投票人员尝试投票（应该返回403）

```bash
# 使用不在 assigned_voter_ids 中的用户 (例如 admin, 用户ID=1)
ADMIN_TOKEN="<your_admin_token>"

curl -X POST 'http://localhost:8000/api/v1/requirement-review-meetings/45/requirements/20/vote' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "vote_option": "approve",
    "comment": "管理员测试"
  }'
```

**预期结果**:
```json
{
  "detail": "您没有投票权限（非指定投票人员或会议未进行中）"
}
```

**HTTP状态码**: `403 Forbidden`

---

## 🎯 前端浏览器测试

### 步骤1: 打开浏览器开发者工具
```
1. 访问 http://localhost:5173
2. 按 F12 打开开发者工具
3. 切换到 Console 标签页
```

### 步骤2: 执行投票流程
```
1. 登录系统 (使用 market_pm 账号)
2. 进入"评审中心"
3. 点击会议 "RM-20260204-003"
4. 从左侧选择需求 "REQ-2026-0016"
5. 点击投票选项 (支持/反对/弃权)
6. 点击"提交投票"
```

### 步骤3: 验证结果

#### ✅ 首次投票成功
```
Console 输出:
✅ "投票成功"

Network 标签:
  POST /api/v1/requirement-review-meetings/45/requirements/20/vote
  Status: 200 OK
  Response: {"success":true,"message":"投票成功",...}
```

#### ❌ 已投票再次尝试
```
Console 输出:
❌ "您已经投过票了，不能修改投票选项"

Network 标签:
  POST /api/v1/requirement-review-meetings/45/requirements/20/vote
  Status: 400 Bad Request ⭐ (修复前是403)
  Response: {"detail":"您已经投过票了，不能修改投票选项"}
```

---

## 📊 验证检查清单

完成测试后,请确认以下项目:

### 后端API测试
- [ ] 场景1: 投票人员首次投票 → 返回 200 ✅
- [ ] 场景2: 已投票用户再次投票 → 返回 400 ✅
- [ ] 场景3: 非投票人员投票 → 返回 403 ✅
- [ ] 错误消息明确,无歧义 ✅

### 前端UI测试
- [ ] 投票成功显示 "投票成功" ✅
- [ ] 已投票显示 "您已经投过票了，不能修改投票选项" ✅
- [ ] 无权限显示 "您没有投票权限（非指定投票人员或会议未进行中）" ✅
- [ ] 投票后统计信息正确更新 ✅

### 数据库验证
```sql
-- 验证投票记录已保存
SELECT COUNT(*) FROM requirement_review_votes
WHERE meeting_id = 45 AND requirement_id = 20;

-- 验证每个用户只能投一票
SELECT voter_id, COUNT(*)
FROM requirement_review_votes
WHERE meeting_id = 45 AND requirement_id = 20
GROUP BY voter_id
HAVING COUNT(*) > 1;  -- 应该返回0行
```

---

## 🐛 调试技巧

### 如果测试失败:

1. **查看后端日志**
```bash
# 后端控制台应该显示:
INFO:     127.0.0.1:xxxx - "POST /api/v1/requirement-review-meetings/45/requirements/20/vote HTTP/1.1" 400
```

2. **查看Network请求详情**
```
- Headers: 检查 Authorization header 是否正确
- Payload: 检查请求体格式是否正确
- Response: 查看完整的错误消息
```

3. **检查数据库状态**
```sql
-- 确认会议状态
SELECT status FROM requirement_review_meetments WHERE id = 45;
-- 应该是 "in_progress"

-- 确认投票人员列表
SELECT assigned_voter_ids
FROM requirement_review_meeting_requirements
WHERE meeting_id = 45 AND requirement_id = 20;
-- 应该包含 [2, 3]

-- 确认用户是否已投票
SELECT * FROM requirement_review_votes
WHERE meeting_id = 45 AND requirement_id = 20 AND voter_id = 2;
```

---

## ✅ 修复总结

| 问题 | 修复前 | 修复后 |
|------|--------|--------|
| **已投票错误码** | 403 (无权限) | 400 (错误请求) ⭐ |
| **错误消息** | "您没有投票权限（非指定投票人员、已投票或会议未进行中）" | "您已经投过票了，不能修改投票选项" ✅ |
| **代码逻辑** | 双重检查,顺序错误 | 优先检查已投票,职责清晰 ✅ |

---

**测试完成后,请反馈结果!** 🎉

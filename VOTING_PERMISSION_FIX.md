# 投票权限问题 - 解决方案

## 问题诊断

**根本原因**: admin用户不在任何会议的参会人员列表中

### 当前状态
- Admin用户ID: 1
- 现有参会人员ID: 4, 3, 9, 6
- Admin不在列表中 → 投票时返回403 Forbidden

## 解决方案

### 方式1: 通过前端UI添加（推荐）

1. **登录系统**（使用admin账号）
   - 用户名: `admin`
   - 密码: `admin123`

2. **打开会议详情**
   - 进入评审中心
   - 选择一个会议（如会议60）

3. **添加参会人员**
   - 点击"添加参会人员"按钮
   - 在用户列表中选择admin
   - 确认添加

4. **开始投票**
   - 添加完成后，admin就可以投票了

### 方式2: 通过API添加

#### 步骤1: 登录获取token
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**响应示例**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### 步骤2: 添加admin到会议
```bash
curl -X POST http://localhost:8000/api/v1/review-meetings/60/attendees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"attendee_id": 1}'
```

**成功响应**:
```json
{
  "success": true,
  "message": "添加参会人员成功",
  "data": {...}
}
```

### 方式3: 直接操作数据库

```sql
INSERT INTO requirement_review_meeting_attendees
  (meeting_id, attendee_id, attendance_status, tenant_id, created_at, updated_at)
VALUES
  (60, 1, 'invited', 1, NOW(), NOW());

-- 或者添加到会议63
INSERT INTO requirement_review_meeting_attendees
  (meeting_id, attendee_id, attendance_status, tenant_id, created_at, updated_at)
VALUES
  (63, 1, 'invited', 1, NOW(), NOW());
```

## 验证

添加后，验证admin是否可以投票：

1. **检查参会人员列表**:
```bash
curl http://localhost:8000/api/v1/review-meetings/60/attendees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

2. **测试投票**:
```bash
curl -X POST http://localhost:8000/api/v1/review-meetings/60/requirements/20/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"vote_option": "approve"}'
```

**成功响应**:
```json
{
  "success": true,
  "message": "投票成功"
}
```

## 预防措施

为了避免这个问题，创建会议时应该：

1. **先创建会议**
2. **添加参会人员（包括自己）**
3. **添加需求**
4. **开始会议**
5. **然后才能投票**

## 投票权限规则

根据代码逻辑，投票需要满足：

1. ✅ **用户已登录**
2. ✅ **会议状态为 in_progress**
3. ✅ **用户在参会人员列表中**
4. ✅ **用户未投过票**

任何一条不满足都会返回403或400错误。

---

**创建时间**: 2026-02-05
**问题**: 403 Forbidden - 投票权限不足
**解决**: 添加admin到会议参会人员列表

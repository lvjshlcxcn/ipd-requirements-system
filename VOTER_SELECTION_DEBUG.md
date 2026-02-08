# 投票人员保存调试指南

## 🎯 问题描述

**您的情况：**
- 当前登录：admin (用户ID=1)
- 操作：在前端勾选了投票人员
- 结果：投票时收到 403 错误
- 原因：数据库显示投票人员列表只有 `[3]` (rd_pm)，不包含 admin

---

## 🔍 诊断步骤

### 步骤1: 检查是否看到成功提示

**在前端操作后，是否看到以下消息？**
- ✅ "投票人员设置成功"
- ❌ "设置投票人员失败"
- ❌ 什么都没显示

---

### 步骤2: 检查Network请求

**打开浏览器开发者工具 (F12)**

1. 切换到 **Network** 标签
2. 勾选一名参会人员作为投票人员
3. 查看 Network 中是否有以下请求：

```
PATCH /api/v1/requirement-review-meetings/54/requirements/16/voters
```

**检查请求详情：**

#### ✅ 成功的情况:
```
Status Code: 200 OK
Response:
{
  "success": true,
  "message": "投票人员设置成功",
  "data": {
    "meeting_id": 54,
    "requirement_id": 16,
    "assigned_voter_ids": [1, 3]  // 包含了 admin
  }
}
```

#### ❌ 失败的情况:
```
Status Code: 400/403/404
Response:
{
  "detail": "错误信息..."
}
```

---

### 步骤3: 检查前端 Console 日志

**在 Console 标签中，查看是否有错误：**

```javascript
// 可能的错误：
- "Failed to fetch"
- "Network Error"
- "Request failed with status code XXX"
```

---

## 🐛 可能的问题和解决方案

### 问题1: API 请求没有发送

**症状：** Network 中没有 PATCH 请求

**原因：** `canControl` 属性为 `false`，导致点击 checkbox 无效

**解决方案：**
检查 `VoterSelectionPanel` 组件是否接收了正确的 `canControl` 属性

```typescript
// 在 ReviewMeetingDetailPage.tsx 中检查
<VoterSelectionPanel
  canControl={isAdmin || isModerator}  // 应该为 true
  ...
/>
```

---

### 问题2: API 调用失败

**症状：** 看到 400/403/404 错误

**可能原因：**
1. 后端验证失败
2. 用户权限不足
3. 会议或需求不存在

**调试方法：**

**查看后端日志：**
```bash
cd backend
# 查看后端控制台输出，找到错误信息
```

**临时添加调试日志：**

文件：`backend/app/api/v1/requirement_review_meetings.py`

```python
@router.patch("/{meeting_id}/requirements/{requirement_id}/voters")
async def update_assigned_voters(...):
    """Update the list of assigned voters for a meeting requirement."""

    # 临时添加：打印请求信息
    print(f"\n🔍 更新投票人员请求:")
    print(f"   会议ID: {meeting_id}")
    print(f"   需求ID: {requirement_id}")
    print(f"   新投票人员列表: {voters_in.assigned_voter_ids}")
    print(f"   当前用户: {current_user.id if current_user else None}")

    tenant_id = get_tenant_id(current_user)
    ...
```

重启后端，重新尝试操作，查看控制台输出。

---

### 问题3: 前端显示保存成功，但数据库未更新

**症状：**
- 看到 "投票人员设置成功" 消息
- API 返回 200 OK
- 但数据库查询显示仍是旧数据

**可能原因：** 后端数据库事务未提交

**解决方案：**

检查后端 Repository 层的事务处理：

文件：`backend/app/repositories/requirement_review_meeting.py`

```python
def update_assigned_voters(self, meeting_id, requirement_id, voter_ids):
    """更新投票人员列表"""

    meeting_req = self.db.query(...).first()

    if meeting_req:
        meeting_req.assigned_voter_ids = voter_ids
        self.db.commit()  # ✅ 确保有 commit
        self.db.refresh(meeting_req)
        return meeting_req
```

---

### 问题4: 操作了错误的会议/需求

**症状：**
- 在会议A操作，但实际投票的是会议B
- 或者选择了需求1，但投票的是需求2

**解决方案：**

**确认当前页面：**
```javascript
// 在浏览器 Console 中执行
window.location.pathname
// 应该类似: /review-center/meetings/54
```

**确认选中的需求：**
```javascript
// 在浏览器 Console 中执行
JSON.parse(localStorage.getItem('selected_requirement'))
// 或者查看前端显示的需求信息
```

---

## ✅ 快速验证方法

### 使用 API 直接测试

**使用 curl 直接调用 API：**

```bash
# 1. 获取 admin 的 token
TOKEN=$(cat <<'EOF' | python3 -
import requests
response = requests.post('http://localhost:8000/api/v1/auth/login', json={
    'username': 'admin',
    'password': 'admin123'  # 替换为实际密码
})
print(response.json()['data']['access_token'])
EOF
)

# 2. 更新投票人员列表
curl -X PATCH 'http://localhost:8000/api/v1/requirement-review-meetings/54/requirements/16/voters' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "assigned_voter_ids": [1, 3]
  }'
```

**预期结果：**
```json
{
  "success": true,
  "message": "投票人员设置成功",
  "data": {
    "assigned_voter_ids": [1, 3]
  }
}
```

**如果成功，再次验证数据库：**
```bash
# 应该显示 [1, 3]
.venv/bin/python3 -c "
from sqlalchemy import create_engine, text
engine = create_engine('postgresql://ipd_user:ipd_pass@localhost:5432/ipd_req_db')
with engine.connect() as conn:
    result = conn.execute(text('''
        SELECT assigned_voter_ids
        FROM requirement_review_meeting_requirements
        WHERE meeting_id = 54 AND requirement_id = 16
    ''')).fetchone()
    print('投票人员列表:', result[0] if result else '未找到')
"
```

---

## 📋 调试检查清单

请按顺序完成以下检查：

- [ ] 前端是否显示 "投票人员设置成功"？
- [ ] Network 中是否有 PATCH 请求？
- [ ] PATCH 请求的状态码是什么？
- [ ] Response 中返回的 `assigned_voter_ids` 是什么？
- [ ] 后端控制台是否有错误日志？
- [ ] 数据库中 `assigned_voter_ids` 是否已更新？
- [ ] 当前操作的会议ID和需求ID是多少？

---

## 🎯 下一步

**请提供以下信息，我可以进一步帮助您：**

1. **前端提示消息：** 看到"投票人员设置成功"还是其他消息？

2. **Network 请求状态：**
   - 状态码：200 / 400 / 403 / 404？
   - Response 内容是什么？

3. **当前登录用户：** 确认是 admin (ID=1) 吗？

4. **操作的会议和需求：** 会议54，需求16？

请提供这些信息，我可以精确定位问题！🔍

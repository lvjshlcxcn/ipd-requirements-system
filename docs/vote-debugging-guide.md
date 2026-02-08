# 评审中心投票功能调试指南

## ✅ 已完成的修改

### 1. 前端修改（ReviewMeetingDetailPage.tsx）
```typescript
// 检查是否可以投票：只要会议开始、用户在参会人员列表中、选中了需求，就可以投票
const canVote =
  meetingData?.data?.status === 'in_progress' &&
  attendees.some((a: Attendee) => a.attendee_id === user?.id) &&
  selectedRequirementId !== null  // 必须选中需求
```

### 2. 后端修改（requirement_review_meeting.py）
```python
def is_attendee(self, meeting_id: int, user_id: int):
    """不过滤 attendance_status，允许所有参会人员投票"""
    return self.db.query(RequirementReviewMeetingAttendee).filter(
        RequirementReviewMeetingAttendee.meeting_id == meeting_id,
        RequirementReviewMeetingAttendee.attendee_id == user_id
        # 移除了 attendance_status 过滤
    ).first()
```

---

## 🔍 投票被禁用的排查步骤

### 步骤 1：检查浏览器控制台日志

打开浏览器开发者工具（F12），查看控制台输出：

```
[ReviewMeetingDetailPage] ===== 投票权限检查 =====
[ReviewMeetingDetailPage] canVote: true/false
[ReviewMeetingDetailPage] meetingStatus: "in_progress"
[ReviewMeetingDetailPage] userId: 123
[ReviewMeetingDetailPage] attendees count: 5
[ReviewMeetingDetailPage] isAttendee check: true/false
[ReviewMeetingDetailPage] statusInProgress check: true/false
```

**重点检查：**
- `canVote` 必须是 `true`
- `meetingStatus` 必须是 `"in_progress"`
- `isAttendee check` 必须是 `true`

### 步骤 2：检查网络请求

在 Network 标签页中，查看以下 API 请求：

1. **GET /api/v1/review-meetings/{id}**
   - 检查 `data.status` 是否为 `"in_progress"`

2. **GET /api/v1/review-meetings/{id}/attendees**
   - 检查数组中是否包含当前用户
   - 查看每个参会人员的 `attendee_id` 和 `attendance_status`

3. **GET /api/v1/review-meetings/{id}/requirements**
   - 检查是否有待评审需求

### 步骤 3：检查数据库状态

```sql
-- 检查会议状态
SELECT id, title, status, moderator_id
FROM requirement_review_meetments
WHERE id = <meeting_id>;

-- 检查参会人员
SELECT
    id,
    meeting_id,
    attendee_id,
    attendance_status,
    u.username
FROM requirement_review_meeting_attendees a
JOIN users u ON a.attendee_id = u.id
WHERE a.meeting_id = <meeting_id>;

-- 检查会议需求
SELECT
    mr.id,
    mr.meeting_id,
    mr.requirement_id,
    r.requirement_no,
    r.title
FROM requirement_review_meeting_requirements mr
JOIN requirements r ON mr.requirement_id = r.id
WHERE mr.meeting_id = <meeting_id>;
```

---

## 🐛 常见问题和解决方案

### 问题 1：`canVote` 为 false

**原因分析：**
- 会议状态不是 `"in_progress"`
- 用户不在 `attendees` 列表中
- 没有选中需求（`selectedRequirementId` 为 null）

**解决方案：**
1. 确保会议已开始（点击"开始会议"按钮）
2. 确保当前用户在参会人员列表中
3. 从左侧需求列表中选择一个需求

### 问题 2：后端返回 403 错误

**错误信息：**
```
您没有投票权限（非参会人员或会议未进行中）
```

**排查步骤：**
1. 检查后端日志：`can_vote` 方法返回值
2. 确认用户 ID 和会议 ID 匹配
3. 检查 `tenant_id` 是否正确

### 问题 3：前端显示投票按钮禁用

**可能原因：**
- `VotePanel` 组件接收到 `disabled=true`
- `!voteOption` 为 true（未选择投票选项）

**解决方法：**
```typescript
// 在 ReviewMeetingDetailPage.tsx 中添加调试日志
console.log('[VotePanel Debug]', {
  canVote,
  selectedRequirementId,
  meetingStatus: meetingData?.data?.status,
  userIsAttendee: attendees.some((a) => a.attendee_id === user?.id)
})
```

---

## 📊 投票权限判断流程图

```
用户点击投票按钮
    ↓
检查是否选中需求？
    ↓ NO → 提示"请从左侧选择一个需求进行投票"
    ↓ YES
检查会议状态是否为 'in_progress'？
    ↓ NO → 前端禁用投票
    ↓ YES
检查用户是否在 attendees 列表中？
    ↓ NO → 前端禁用投票
    ↓ YES
✅ 前端允许投票，发送 API 请求
    ↓
后端验证：service.can_vote(meeting_id, user_id)
    ↓
检查用户是否在 attendees 表中？
    ↓ NO → 返回 403 错误
    ↓ YES
检查会议状态是否为 'in_progress'？
    ↓ NO → 返回 403 错误
    ↓ YES
✅ 后端允许投票，保存投票记录
```

---

## 🧪 测试场景

### 场景 1：正常投票流程
1. 创建会议
2. 添加参会人员（包括当前用户）
3. 添加待评审需求
4. 点击"开始会议"按钮
5. 从左侧选择一个需求
6. 点击投票选项（支持/反对/弃权）
7. 点击"提交投票"

**预期结果：** 投票成功，显示投票统计

### 场景 2：会议未开始
1. 创建会议（状态为 `scheduled`）
2. 尝试投票

**预期结果：**
- 前端：投票按钮被禁用，提示"会议尚未开始"
- 后端：返回 403 错误

### 场景 3：用户不是参会人员
1. 创建会议
2. 不添加当前用户到参会人员
3. 尝试投票

**预期结果：**
- 前端：投票按钮被禁用，提示"您不是本次会议的参会人员"
- 后端：返回 403 错误

### 场景 4：未选中需求
1. 创建会议并开始
2. 添加当前用户到参会人员
3. 不选择任何需求
4. 查看投票面板

**预期结果：** 显示"请从左侧选择一个需求进行投票"

---

## 🔧 调试命令

### 前端调试
```bash
cd frontend
npm run dev
```

打开浏览器访问：http://localhost:5173
打开开发者工具（F12），查看 Console 和 Network 标签

### 后端调试
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

查看终端输出，关注 API 请求日志

---

## 📝 修改总结

| 文件 | 修改内容 | 原因 |
|------|---------|------|
| `ReviewMeetingDetailPage.tsx` | 添加 `selectedRequirementId !== null` 检查 | 确保选中需求才能投票 |
| `VotePanel.tsx` | 调整禁用提示显示条件 | 只在真正需要时显示提示 |
| `requirement_review_meeting.py` | 移除 `attendance_status` 过滤 | 允许所有参会人员投票 |

---

## 🎯 核心原则

**只要满足以下三个条件，就允许投票：**
1. ✅ 会议状态为 `in_progress`（进行中）
2. ✅ 当前用户在 `attendees` 列表中
3. ✅ 已选中待评审需求

**不再额外限制：**
- ❌ 不检查 `attendance_status`（允许 declined 状态的用户投票）
- ❌ 不检查其他业务条件

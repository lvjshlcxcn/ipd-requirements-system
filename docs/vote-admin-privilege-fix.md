# Admin 用户投票权限修复说明

## 🎯 修复目标

**Admin 用户任何时候都可以投票**，无需在参会人员列表中。

---

## ✅ 已完成的修改

### 1. 前端修改 - ReviewMeetingDetailPage.tsx

**新增 admin 角色检查：**
```typescript
// 检查是否可以投票
const isAdmin = user?.role === 'admin'
const isAttendee = attendees.some((a: Attendee) => a.attendee_id === user?.id)

const canVote =
  meetingData?.data?.status === 'in_progress' &&
  (isAdmin || isAttendee) &&  // admin 或参会人员都可以投票
  selectedRequirementId !== null  // 必须选中需求
```

**传递 isAdmin 参数给 VotePanel：**
```typescript
<VotePanel
  // ...
  isAdmin={isAdmin}
/>
```

**增强的调试日志：**
```typescript
console.log('[ReviewMeetingDetailPage] isAdmin:', isAdmin)
console.log('[ReviewMeetingDetailPage] isAttendee:', isAttendee)
console.log('[ReviewMeetingDetailPage] userRole:', user?.role)
```

---

### 2. 后端修改 - requirement_review_meeting.py

**修改 `can_vote` 方法：**
```python
def can_vote(self, meeting_id: int, user_id: int) -> bool:
    """Check if user can vote in the meeting.

    规则：
    1. admin 用户任何时候都可以投票（无需在参会人员列表中）
    2. 其他用户必须在参会人员列表中才能投票
    3. 会议必须进行中
    """
    # 检查会议状态（所有用户都必须满足）
    meeting = self.repo.get(meeting_id, get_current_tenant())
    if not meeting or meeting.status != "in_progress":
        return False

    # 获取用户信息
    user = self.db.query(User).filter(User.id == user_id).first()
    if not user:
        return False

    # admin 用户无需参会人员检查
    if user.role == "admin":
        return True

    # 其他用户必须是参会人员
    attendee = self.repo.is_attendee(meeting_id, user_id)
    if not attendee:
        return False

    return True
```

---

### 3. VotePanel 组件修改 - VotePanel.tsx

**新增 isAdmin 属性：**
```typescript
interface VotePanelProps {
  // ...
  isAdmin?: boolean  // 是否是 admin 用户
}
```

**更新禁用提示信息：**
```typescript
{disabled && selectedRequirementId && (
  <Alert
    message="投票功能暂时不可用"
    description={
      meetingStatus !== 'in_progress'
        ? '会议尚未开始或已结束'
        : isAdmin
          ? 'Admin 用户应该可以投票，如果看到此提示请检查会议状态'
          : '您不是本次会议的参会人员，无法投票'
    }
    type="warning"
  />
)}
```

---

## 📊 投票权限矩阵

| 用户角色 | 会议状态 | 在参会列表中 | 选中需求 | 是否可以投票 |
|---------|---------|-------------|---------|------------|
| **admin** | in_progress | ✅ 是/否 | ✅ 是 | ✅ **可以** |
| **admin** | in_progress | ❌ 否 | ❌ 否 | ❌ 未选中需求 |
| **admin** | scheduled/completed | - | - | ❌ 会议未进行 |
| **普通用户** | in_progress | ✅ 是 | ✅ 是 | ✅ **可以** |
| **普通用户** | in_progress | ❌ 否 | - | ❌ 非参会人员 |

---

## 🔍 验证步骤

### 1. 检查用户角色
打开浏览器控制台，查看：
```javascript
localStorage.getItem('user')  // 检查 role 字段是否为 "admin"
```

### 2. 查看调试日志
刷新会议详情页，在控制台中查看：
```
[ReviewMeetingDetailPage] ===== 投票权限检查 =====
[ReviewMeetingDetailPage] isAdmin: true  ← 应该是 true
[ReviewMeetingDetailPage] isAttendee: false  ← admin 可以为 false
[ReviewMeetingDetailPage] canVote: true  ← 应该是 true
[ReviewMeetingDetailPage] userRole: admin  ← 应该是 admin
```

### 3. 测试投票流程
1. 使用 admin 账号登录
2. 创建一个会议（不要添加 admin 到参会人员）
3. 添加待评审需求
4. 点击"开始会议"
5. 选择一个需求
6. 尝试投票

**预期结果：**
- ✅ admin 用户可以投票
- ✅ 投票按钮可点击
- ✅ 投票成功后显示统计

---

## 🧪 测试场景

### 场景 1：Admin 用户投票（未添加到参会列表）
**前置条件：**
- 当前登录用户：admin (role = "admin")
- 会议状态：in_progress
- admin 不在 attendees 列表中
- 已选中需求

**预期结果：** ✅ 可以投票

### 场景 2：普通用户投票（在参会列表中）
**前置条件：**
- 当前登录用户：user1 (role != "admin")
- 会议状态：in_progress
- user1 在 attendees 列表中
- 已选中需求

**预期结果：** ✅ 可以投票

### 场景 3：普通用户投票（不在参会列表中）
**前置条件：**
- 当前登录用户：user2 (role != "admin")
- 会议状态：in_progress
- user2 不在 attendees 列表中
- 已选中需求

**预期结果：** ❌ 无法投票，显示"您不是本次会议的参会人员"

### 场景 4：Admin 用户投票（会议未开始）
**前置条件：**
- 当前登录用户：admin
- 会议状态：scheduled

**预期结果：** ❌ 无法投票，显示"会议尚未开始或已结束"

---

## 📝 关键代码变更总结

| 文件 | 行号 | 变更内容 |
|------|------|---------|
| `ReviewMeetingDetailPage.tsx` | ~183 | 添加 `isAdmin` 检查 |
| `ReviewMeetingDetailPage.tsx` | ~186 | 修改 `canVote` 逻辑为 `(isAdmin \|\| isAttendee)` |
| `ReviewMeetingDetailPage.tsx` | ~263 | 传递 `isAdmin={isAdmin}` 给 VotePanel |
| `requirement_review_meeting.py` | 86-119 | 重写 `can_vote` 方法，添加 admin 权限检查 |
| `VotePanel.tsx` | 17 | 添加 `isAdmin?: boolean` 属性 |
| `VotePanel.tsx` | 96-110 | 更新禁用提示，针对 admin 显示特殊信息 |

---

## 🎯 核心原则

1. **Admin 权限：** admin 用户可以参与任何会议的投票，无需参会人员身份
2. **普通用户权限：** 必须在参会人员列表中才能投票
3. **通用限制：** 所有用户都必须满足以下条件才能投票
   - 会议状态为 `in_progress`（进行中）
   - 已选中待评审需求

---

## ⚠️ 注意事项

1. **角色字段：** 确保 User 模型中有 `role` 字段，且 admin 用户的 `role = "admin"`
2. **前端同步：** 确保登录后前端存储的用户信息包含 `role` 字段
3. **后端验证：** 后端会查询数据库获取用户的 role 字段，确保数据一致性
4. **调试日志：** 利用增强的调试日志快速定位问题

---

## 🔄 回滚方案

如果需要回滚到原逻辑（移除 admin 特权），按以下步骤操作：

### 前端回滚
```typescript
// ReviewMeetingDetailPage.tsx
const canVote =
  meetingData?.data?.status === 'in_progress' &&
  attendees.some((a: Attendee) => a.attendee_id === user?.id) &&
  selectedRequirementId !== null
```

### 后端回滚
```python
# requirement_review_meeting.py
def can_vote(self, meeting_id: int, user_id: int) -> bool:
    attendee = self.repo.is_attendee(meeting_id, user_id)
    if not attendee:
        return False

    meeting = self.repo.get(meeting_id, get_current_tenant())
    if not meeting or meeting.status != "in_progress":
        return False

    return True
```

---

## 📚 相关文档

- [投票功能调试指南](./vote-debugging-guide.md)
- [评审中心 API 文档](../backend/alembic/versions/20260203_2130_manual_add_review_meetings.py)

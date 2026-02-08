# 投票功能 CORS 错误修复总结

## 问题描述

前端提交投票时出现 CORS 错误：
```
[Error] Origin http://localhost:5173 is not allowed by Access-Control-Allow-Origin. Status code: 500
[Error] XMLHttpRequest cannot load http://localhost:8000/api/v1/requirement-review-meetings/30/requirements/19/vote due to access control checks.
```

---

## ✅ 已完成的修复

### 1. 后端 CORS 配置增强

**文件：** `backend/app/main.py`

**添加了通用异常处理器：**
```python
# Exception handler for all other exceptions
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions with CORS headers."""
    import traceback
    print(f"❌ Unhandled exception: {exc}")
    print(traceback.format_exc())

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "服务器内部错误",
            "detail": str(exc) if settings.DEBUG else "Internal server error",
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )
```

**作用：** 确保所有异常响应都包含正确的 CORS 头部，避免浏览器阻止跨域请求。

---

### 2. Admin 用户投票权限

**文件：**
- `frontend/src/pages/review-center/ReviewMeetingDetailPage.tsx`
- `backend/app/services/requirement_review_meeting.py`

**修改内容：**
- 前端：检查 `user.role === 'admin'`，admin 用户无需在参会人员列表中
- 后端：`can_vote` 方法中，admin 用户绕过参会人员检查

**代码示例：**
```typescript
// 前端
const isAdmin = user?.role === 'admin'
const isAttendee = attendees.some((a: Attendee) => a.attendee_id === user?.id)

const canVote =
  meetingData?.data?.status === 'in_progress' &&
  (isAdmin || isAttendee) &&
  selectedRequirementId !== null
```

```python
# 后端
def can_vote(self, meeting_id: int, user_id: int) -> bool:
    meeting = self.repo.get(meeting_id, get_current_tenant())
    if not meeting or meeting.status != "in_progress":
        return False

    user = self.db.query(User).filter(User.id == user_id).first()
    if not user:
        return False

    # admin 用户无需参会人员检查
    if user.role == "admin":
        return True

    # 其他用户必须是参会人员
    attendee = self.repo.is_attendee(meeting_id, user_id)
    return attendee is not None
```

---

### 3. 移除参会人员状态限制

**文件：** `backend/app/repositories/requirement_review_meeting.py`

**修改前：**
```python
def is_attendee(self, meeting_id: int, user_id: int):
    return self.db.query(RequirementReviewMeetingAttendee).filter(
        RequirementReviewMeetingAttendee.meeting_id == meeting_id,
        RequirementReviewMeetingAttendee.attendee_id == user_id,
        RequirementReviewMeetingAttendee.attendance_status.in_(["invited", "accepted", "attended"])  # 排除 declined
    ).first()
```

**修改后：**
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

## 🔍 测试验证

### 1. 后端 API 测试

```bash
cd backend
./test_vote.sh
```

**预期输出：**
```json
{
    "success": true,
    "message": "投票成功",
    "data": {
        "id": 5,
        "meeting_id": 30,
        "requirement_id": 19,
        "voter_id": 1,
        "vote_option": "approve",
        "comment": null,
        "tenant_id": 1,
        "created_at": "2026-02-04T11:38:57.194486+08:00",
        "updated_at": "2026-02-04T11:51:57.382055+00:00"
    }
}
```

### 2. 前端浏览器测试

1. **打开测试页面：**
   ```
   file:///Users/kingsun/claude_study/backend/test-cors.html
   ```

2. **点击"测试投票"按钮**

3. **预期结果：**
   - ✅ 登录成功
   - ✅ 投票成功
   - ✅ 显示投票数据

### 3. 前端应用测试

1. **启动前端：**
   ```bash
   cd frontend
   npm run dev
   ```

2. **使用 admin 账号登录**

3. **访问评审中心：**
   - 创建会议（或使用现有会议）
   - 添加需求
   - 开始会议
   - 选择需求
   - 投票

4. **检查浏览器控制台：**
   ```
   [ReviewMeetingDetailPage] ===== 投票权限检查 =====
   [ReviewMeetingDetailPage] isAdmin: true
   [ReviewMeetingDetailPage] canVote: true
   [ReviewMeetingDetailPage] userRole: admin
   ```

---

## 🎯 投票权限规则（最终版本）

| 用户类型 | 会议状态 | 在参会列表 | 选中需求 | 能否投票 |
|---------|---------|-----------|---------|---------|
| **Admin** | in_progress | ✅ 是/否 | ✅ 是 | ✅ **可以** |
| **普通用户** | in_progress | ✅ 是 | ✅ 是 | ✅ **可以** |
| **普通用户** | in_progress | ❌ 否 | ✅ 是 | ❌ 不可以 |
| **所有用户** | scheduled/completed | - | - | ❌ 不可以 |

---

## 📝 修改文件汇总

| 文件 | 修改内容 |
|------|---------|
| `backend/app/main.py` | 添加通用异常处理器，确保 CORS 头部 |
| `backend/app/services/requirement_review_meeting.py` | 修改 `can_vote` 方法，admin 用户特权 |
| `backend/app/repositories/requirement_review_meeting.py` | 移除 `is_attendee` 的状态过滤 |
| `frontend/src/pages/review-center/ReviewMeetingDetailPage.tsx` | 添加 admin 权限检查 |
| `frontend/src/pages/review-center/components/VotePanel.tsx` | 添加 isAdmin 参数，更新提示信息 |

---

## 🚨 如果仍然看到 CORS 错误

### 检查清单：

1. **确认后端正在运行：**
   ```bash
   curl http://localhost:8000/health
   ```

2. **确认后端已重载新代码：**
   - 后端应该使用 `--reload` 参数启动
   - 或手动重启后端

3. **确认前端 Origin 在允许列表中：**
   - 开发环境：`allowed_origins = ["*"]` （已配置）
   - 生产环境：检查 `settings.CORS_ORIGINS`

4. **检查浏览器控制台：**
   - Network 标签：查看请求/响应详情
   - Console 标签：查看具体错误信息

5. **查看后端终端输出：**
   - 确认没有 Python 异常
   - 确认请求已到达后端

---

## 🔧 调试命令

### 后端健康检查
```bash
curl http://localhost:8000/health
```

### 测试登录
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### 测试投票 API
```bash
# 获取 token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access_token'])")

# 投票
curl -X POST http://localhost:8000/api/v1/requirement-review-meetings/30/requirements/19/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: 1" \
  -d '{"vote_option": "approve"}'
```

---

## 📚 相关文档

- [Admin 用户投票权限修复说明](./vote-admin-privilege-fix.md)
- [投票功能调试指南](./vote-debugging-guide.md)

---

## ✅ 验证成功标准

1. ✅ 后端 API 返回 200 状态码
2. ✅ 响应包含 `"success": true`
3. ✅ 响应包含投票数据（id, vote_option, created_at 等）
4. ✅ 浏览器控制台无 CORS 错误
5. ✅ 前端显示投票成功提示
6. ✅ 投票统计正确更新

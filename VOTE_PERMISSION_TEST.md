# 投票权限功能测试文档

## 功能说明

### 已实现的新限制

#### 1. 只有被选定的投票人员才能投票
- ✅ 修改了 `can_vote` 方法，增加检查：
  - 用户必须在 `assigned_voter_ids` 列表中
  - 用户必须是参会人员
  - 会议必须进行中

#### 2. 投票后不能修改
- ✅ 在 `cast_vote` API 中增加检查：
  - 先查询用户是否已投过票
  - 如果已投票，返回 400 错误："您已经投过票了，不能修改投票选项"

## 修改的文件

### 后端 Service 层
**文件**: `backend/app/services/requirement_review_meeting.py`

**修改的方法**: `can_vote(meeting_id, user_id, requirement_id=None)`

**新增逻辑**:
```python
def can_vote(self, meeting_id: int, user_id: int, requirement_id: Optional[int] = None) -> bool:
    # ... 原有的会议状态和参会人员检查 ...

    # 新增：检查是否在指定投票人员列表中
    if requirement_id is not None:
        meeting_req = self.db.query(RequirementReviewMeetingRequirement).filter(
            RequirementReviewMeetingRequirement.meeting_id == meeting_id,
            RequirementReviewMeetingRequirement.requirement_id == requirement_id
        ).first()

        if not meeting_req or not meeting_req.assigned_voter_ids:
            return False

        if user_id not in meeting_req.assigned_voter_ids:
            return False

        # 新增：检查是否已经投过票
        existing_vote = self.repo.get_user_vote(meeting_id, requirement_id, user_id)
        if existing_vote:
            return False

    return True
```

### 后端 API 层
**文件**: `backend/app/api/v1/requirement_review_meetings.py`

**修改的接口**: `POST /{meeting_id}/requirements/{requirement_id}/vote`

**新增逻辑**:
```python
# 先检查是否已投过票（二次验证）
existing_vote = repo.get_user_vote(meeting_id, requirement_id, current_user.id)
if existing_vote:
    raise HTTPException(
        status_code=400,
        detail="您已经投过票了，不能修改投票选项"
    )
```

## 测试场景

### 测试数据
- **会议ID**: 45
- **需求ID**: 20
- **投票人员列表**: [2, 3]
  - 用户ID 2: market_pm（市场产品经理）
  - 用户ID 3: rd_pm（研发产品经理）

### 测试用例

#### ✅ 用例1: 未登录用户投票
**请求**:
```bash
curl -X POST 'http://localhost:8000/api/v1/requirement-review-meetings/45/requirements/20/vote' \
  -H 'Content-Type: application/json' \
  -d '{"vote_option":"approve","comment":"测试"}'
```

**预期结果**: ❌ 401 Unauthorized
```json
{
  "detail": "需要登录才能投票"
}
```

**实际结果**: ✅ 通过（已验证）

---

#### ⚠️ 用例2: 用户不在投票人员列表中
**前提**: 用户ID 1（admin或普通用户）不在 `assigned_voter_ids` 中

**请求**（需要登录token）:
```bash
curl -X POST 'http://localhost:8000/api/v1/requirement-review-meetings/45/requirements/20/vote' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{"vote_option":"approve","comment":"测试"}'
```

**预期结果**: ❌ 403 Forbidden
```json
{
  "detail": "您没有投票权限（非指定投票人员、已投票或会议未进行中）"
}
```

**实际结果**: ⏳ 需要在前端测试

---

#### ✅ 用例3: 投票人员在列表中，首次投票
**前提**:
- 用户ID 2 (market_pm) 在 `assigned_voter_ids` 中
- 该用户尚未投过票

**请求**（需要登录token）:
```bash
curl -X POST 'http://localhost:8000/api/v1/requirement-review-meetings/45/requirements/20/vote' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <用户2的token>' \
  -d '{"vote_option":"approve","comment":"我同意这个需求"}'
```

**预期结果**: ✅ 200 OK
```json
{
  "success": true,
  "message": "投票成功",
  "data": {
    "id": <vote_id>,
    "meeting_id": 45,
    "requirement_id": 20,
    "voter_id": 2,
    "vote_option": "approve",
    "comment": "我同意这个需求",
    ...
  }
}
```

**实际结果**: ⏳ 需要在前端测试

---

#### ❌ 用例4: 已投票用户再次投票
**前提**: 用户ID 2 已经投过票

**请求**（需要登录token）:
```bash
curl -X POST 'http://localhost:8000/api/v1/requirement-review-meetings/45/requirements/20/vote' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <用户2的token>' \
  -d '{"vote_option":"reject","comment":"我改主意了"}'
```

**预期结果**: ❌ 400 Bad Request
```json
{
  "detail": "您已经投过票了，不能修改投票选项"
}
```

**实际结果**: ⏳ 需要在前端测试

---

## 前端测试步骤

### 1. 准备测试环境
1. 访问 http://localhost:5173
2. 登录系统（用户ID 2: market_pm）

### 2. 进入投票页面
1. 进入"评审中心" → 点击会议"RM-20260204-003"
2. 点击需求"REQ-2026-0016"

### 3. 测试投票功能
1. **检查权限**: 如果当前用户不在 `assigned_voter_ids` 中，投票按钮应该禁用
2. **首次投票**: 如果用户在列表中，应该能投票
3. **投票后状态**: 投票后，投票选项应该变成灰色，不可修改

### 4. 测试修改限制
1. 用户投票后，尝试再次点击不同的投票选项
2. 应该显示错误提示："您已经投过票了，不能修改投票选项"

### 5. 测试进度更新
1. 投票后，"投票人员"面板应该更新进度
2. 显示 "1/2" 或 "2/2"
3. 投票人员的状态变为"已投票"

## 数据库验证

### 查看投票记录
```sql
SELECT
    id,
    meeting_id,
    requirement_id,
    voter_id,
    vote_option,
    comment,
    created_at
FROM requirement_review_votes
WHERE meeting_id = 45 AND requirement_id = 20
ORDER BY created_at;
```

### 查看投票人员列表
```sql
SELECT
    id,
    meeting_id,
    requirement_id,
    assigned_voter_ids
FROM requirement_review_meeting_requirements
WHERE meeting_id = 45 AND requirement_id = 20;
```

## API 错误码说明

| 状态码 | 错误信息 | 说明 |
|--------|---------|------|
| 401 | 需要登录才能投票 | 未提供认证token |
| 403 | 您没有投票权限（非指定投票人员、已投票或会议未进行中） | 不在投票人员列表中或会议未进行 |
| 400 | 您已经投过票了，不能修改投票选项 | 已投票，不允许修改 |

## 关键逻辑流程

### 投票权限检查流程
```
用户尝试投票
    ↓
检查是否登录？ → NO → 返回 401
    ↓ YES
检查会议是否进行中？ → NO → 返回 403
    ↓ YES
检查是否在参会人员列表？ → NO → 返回 403
    ↓ YES
检查是否在投票人员列表(assigned_voter_ids)？ → NO → 返回 403
    ↓ YES
检查是否已投过票？ → YES → 返回 400
    ↓ NO
允许投票，插入记录
```

## 测试状态
- [x] 后端代码修改完成
- [x] 后端服务重启成功
- [x] 未登录用户投票测试通过
- [ ] 非投票人员投票测试（需前端测试）
- [ ] 投票人员首次投票测试（需前端测试）
- [ ] 已投票用户再次投票测试（需前端测试）
- [ ] 前端UI适配（投票后禁用按钮）

## 下一步

请在浏览器中测试以下场景：

1. **使用不在 `assigned_voter_ids` 中的用户登录**，尝试投票
2. **使用在 `assigned_voter_ids` 中的用户登录**（market_pm 或 rd_pm），投票
3. **投票后尝试再次投票**，验证是否被拦截
4. **查看投票人员面板**，确认进度和状态更新

测试完成后，请反馈结果！

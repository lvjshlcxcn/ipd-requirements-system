# 需求评审投票系统 - 完整投票逻辑文档

## 📋 目录
1. [投票流程概述](#投票流程概述)
2. [权限检查机制](#权限检查机制)
3. [投票选项说明](#投票选项说明)
4. [数据存储结构](#数据存储结构)
5. [投票统计逻辑](#投票统计逻辑)
6. [并发投票处理](#并发投票处理)
7. [错误处理机制](#错误处理机制)
8. [完整投票流程示例](#完整投票流程示例)

---

## 投票流程概述

### 整体流程图

```
用户点击投票按钮
    ↓
前端权限检查（canVote）
    ↓
发送POST请求到API
    ↓
后端API权限检查（多层验证）
    ↓
Repository层执行投票
    ↓
数据库存储（带唯一约束）
    ↓
返回投票结果
    ↓
前端更新状态
    ↓
5秒后自动刷新统计
```

### 核心原则

1. **一票一用户**: 每个用户对每个需求只能投票一次
2. **不可修改**: 投票后不能更改选项
3. **实名投票**: 所有投票记录投票人信息
4. **实时统计**: 投票后5秒内更新统计
5. **结果存档**: 会议结束时自动保存投票结果

---

## 权限检查机制

### 检查层级（从外到内）

#### 层级1: API端点层 (`requirement_review_meetings.py:515-566`)

```python
@router.post("/{meeting_id}/requirements/{requirement_id}/vote")
async def cast_vote(...):
```

**检查1: 用户登录状态**
```python
if not current_user:
    raise HTTPException(status_code=401, detail="需要登录才能投票")
```
- **未登录**: 返回 401 Unauthorized
- **已登录**: 继续下一检查

**检查2: 重复投票检查（最高优先级）**
```python
existing_vote = repo.get_user_vote(meeting_id, requirement_id, current_user.id)
if existing_vote:
    raise HTTPException(
        status_code=400,
        detail="您已经投过票了，不能修改投票选项"
    )
```
- **已投票**: 返回 400 Bad Request
- **未投票**: 继续下一检查

**检查3: 综合权限检查**
```python
if not service.can_vote(meeting_id, current_user.id, requirement_id):
    raise HTTPException(
        status_code=403,
        detail="您没有投票权限（非指定投票人员或会议未进行中）"
    )
```
- **无权限**: 返回 403 Forbidden
- **有权限**: 执行投票

---

#### 层级2: Service层 (`requirement_review_meeting.py:93-119`)

```python
def can_vote(self, meeting_id: int, user_id: int, requirement_id: Optional[int] = None) -> bool:
```

**检查1: 会议状态**
```python
meeting = self.repo.get(meeting_id, get_current_tenant())
if not meeting or meeting.status != "in_progress":
    return False
```
- ❌ 会议不存在 → False
- ❌ 状态不是 `in_progress` → False
- ✅ 状态是 `in_progress` → 继续

**会议状态枚举**:
- `scheduled` - 已安排（未开始）
- `in_progress` - 进行中 ✅ **只有这个状态允许投票**
- `completed` - 已结束
- `cancelled` - 已取消

**检查2: 用户存在性**
```python
user = self.db.query(User).filter(User.id == user_id).first()
if not user:
    return False
```
- ❌ 用户不存在 → False
- ✅ 用户存在 → 继续

**检查3: 参会人员身份**
```python
attendee = self.repo.is_attendee(meeting_id, user_id)
if not attendee:
    return False
```
- ❌ 不在参会人员列表 → False
- ✅ 是参会人员 → **True**（允许投票）

**重要规则**（代码第99行注释）:
> 所有参会人员都可以投票（不再限制 assigned_voter_ids）

**以前的设计**（已废弃）:
- 以前只有 `assigned_voter_ids` 列表中的用户可以投票
- 现在改为：只要在参会人员列表中就能投票

---

#### 层级3: Repository层 (`requirement_review_meeting.py:273-319`)

```python
def cast_vote(self, meeting_id, requirement_id, voter_id, tenant_id, vote_option, comment):
```

**执行流程**:
1. 查询是否已有投票
2. 如果有 → 更新（但API层已阻止，所以实际不会执行）
3. 如果没有 → 创建新投票记录
4. 提交到数据库

---

## 投票选项说明

### 支持的投票选项

```python
# VoteCreate Schema
vote_option: Literal["approve", "reject", "abstain"]
```

| 选项值 | 含义 | 中文 | 说明 |
|--------|------|------|------|
| `approve` | 通过 | ✅ 赞成该需求 |
| `reject` | 拒绝 | ❌ 不赞成该需求 |
| `abstain` | 弃权 | ⚪ 中立，不参与决策 |

### 可选字段

```python
comment: Optional[str] = None  # 投票备注/意见
```
- 投票时可以添加评论
- 存储在 `requirement_review_votes.comment` 字段
- 最大长度取决于数据库定义

---

## 数据存储结构

### 核心表: `requirement_review_votes`

```python
class RequirementReviewVote(Base):
    __tablename__ = "requirement_review_votes"

    id: Column(Integer, primary_key=True)
    meeting_id: Column(Integer, nullable=False)      # 会议ID
    requirement_id: Column(Integer, nullable=False)  # 需求ID
    voter_id: Column(Integer, nullable=False)        # 投票人ID
    tenant_id: Column(Integer, nullable=False)        # 租户ID
    vote_option: Column(String, nullable=False)      # 投票选项
    comment: Column(Text)                           # 投票备注
    voted_at: Column(DateTime)                       # 投票时间
    created_at: Column(DateTime)
    updated_at: Column(DateTime)

    # 唯一约束（核心）
    __table_args__ = (
        UniqueConstraint(
            'meeting_id',
            'requirement_id',
            'voter_id',
            name='uq_meeting_requirement_voter'
        ),
        Index('ix_review_votes_meeting_req_option',
              'meeting_id', 'requirement_id', 'vote_option'),
        Index('ix_review_votes_tenant_meeting',
              'tenant_id', 'meeting_id'),
    )
```

### 唯一约束的作用

```sql
UniqueConstraint(meeting_id, requirement_id, voter_id)
```

**保证**:
- 同一个用户对同一个会议的同一个需求只能投票一次
- 数据库层面强制执行，不受应用层影响
- 即使应用层检查失败，数据库也会拒绝重复

**并发安全**:
- 多个用户同时投票 → 数据库串行化处理
- 只有一次投票成功，其他返回违反唯一约束错误
- 应用层捕获并返回 400 错误

---

## 投票统计逻辑

### 统计API端点

```
GET /{meeting_id}/requirements/{requirement_id}/votes
```

### Repository层统计实现

**使用SQL聚合查询** (`requirement_review_meeting.py:349-377`):

```python
def get_vote_statistics(self, meeting_id: int, requirement_id: int):
    stats = self.db.execute(
        text("""
            SELECT
                vote_option,
                COUNT(*) as count
            FROM requirement_review_votes
            WHERE meeting_id = :meeting_id
              AND requirement_id = :requirement_id
            GROUP BY vote_option
        """),
        {"meeting_id": meeting_id, "requirement_id": requirement_id}
    ).fetchall()

    # 计算百分比
    total_votes = sum(s.count for s in stats)
    return {
        "approve": {"count": approve_count, "percentage": approve_count/total_votes*100},
        "reject": {"count": reject_count, "percentage": reject_count/total_votes*100},
        "abstain": {"count": abstain_count, "percentage": abstain_count/total_votes*100},
        "total": total_votes
    }
```

### 统计结果示例

```json
{
  "success": true,
  "data": {
    "meeting_id": 60,
    "requirement_id": 20,
    "vote_option_counts": {
      "approve": 5,
      "reject": 2,
      "abstain": 1
    },
    "vote_option_percentages": {
      "approve": 62.5,
      "reject": 25.0,
      "abstain": 12.5
    },
    "total_votes": 8,
    "voters": [
      {
        "voter_id": 4,
        "username": "market_pm",
        "vote_option": "approve",
        "voted_at": "2026-02-05T06:00:00"
      }
    ]
  }
}
```

---

## 并发投票处理

### 并发场景示例

**场景**: 3个用户同时为同一需求投票

```
时间线:
T0: 用户A、B、C同时点击"投票"按钮
T1: 三个请求同时到达API
T2: API层检查都显示"未投票"
T3: 三个请求同时到达数据库
```

### 数据库层处理

```python
# Repository层 (line 273-319)
def cast_vote(...):
    # 查询现有投票
    existing_vote = db.query(RequirementReviewVote).filter(
        RequirementReviewVote.meeting_id == meeting_id,
        RequirementReviewVote.requirement_id == requirement_id,
        RequirementReviewVote.voter_id == voter_id
    ).first()

    if existing_vote:
        # 更新（但API层已阻止）
        ...
    else:
        # 创建新投票
        vote = RequirementReviewVote(...)
        db.add(vote)
        db.commit()  # ← 数据库在这里检查唯一约束
```

### 唯一约束触发

**情况1: 所有3个请求都是同一用户**
- 第1个请求: 成功创建投票
- 第2个请求: 违反唯一约束 → 抛出异常
- 第3个请求: 违反唯一约束 → 抛出异常
- **结果**: 只有1次投票成功 ✅

**情况2: 3个不同用户投票**
- 第1个请求: 成功（用户A）
- 第2个请求: 成功（用户B）
- 第3个请求: 成功（用户C）
- **结果**: 3次投票都成功 ✅

### 异常处理

```python
try:
    db.commit()
except IntegrityError as e:
    # 捕获唯一约束违反
    if 'uq_meeting_requirement_voter' in str(e):
        raise HTTPException(
            status_code=400,
            detail="您已经投过票了"
        )
    else:
        raise  # 其他异常继续抛出
```

---

## 错误处理机制

### 完整错误响应矩阵

| 场景 | HTTP状态码 | 错误消息 | 检查位置 |
|------|-----------|---------|---------|
| 未登录 | 401 | "需要登录才能投票" | API层 line 531-532 |
| 已投票 | 400 | "您已经投过票了，不能修改投票选项" | API层 line 538-543 |
| 会议未开始 | 403 | "您没有投票权限（非指定投票人员或会议未进行中）" | Service层 line 105-106 |
| 非参会人员 | 403 | "您没有投票权限（非指定投票人员或会议未进行中）" | Service层 line 114-116 |
| 用户不存在 | 403 | "您没有投票权限..." | Service层 line 110-111 |
| 会议不存在 | 403 | "您没有投票权限..." | Service层 line 104-105 |
| 数据库错误 | 500 | "投票失败，请稍后重试" | Repository层 |

### 错误消息设计原则

1. **明确性**: 告诉用户具体原因
2. **可操作性**: 告诉用户如何解决
3. **安全性**: 不泄露敏感信息

---

## 完整投票流程示例

### 场景: admin为会议60的需求20投票

#### 步骤1: 前端发起投票

```typescript
// frontend/src/pages/review-center/components/VotePanel.tsx
const handleVote = async (option: 'approve' | 'reject' | 'abstain') => {
  const response = await castVote(meetingId, requirementId, {
    vote_option: option,
    comment: "我认为这个需求很重要"
  });

  if (response.success) {
    // 投票成功
    message.success("投票成功");
    // 立即查询统计
    queryClient.invalidateQueries(['voteStatistics']);
  }
};
```

#### 步骤2: 发送HTTP请求

```http
POST /api/v1/review-meetings/60/requirements/20/vote HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "vote_option": "approve",
  "comment": "我认为这个需求很重要"
}
```

#### 步骤3: API层权限检查

```python
# 1. 检查登录
current_user = get_current_user_sync()  # ✅ 已登录
tenant_id = get_tenant_id(current_user)    # tenant_id = 1

# 2. 检查重复投票
existing_vote = repo.get_user_vote(60, 20, 1)  # ✅ 未投票

# 3. 检查投票权限
can_vote = service.can_vote(60, 1, 20)
# ✅ meeting.status = "in_progress"
# ✅ admin是参会人员
# ✅ 返回 True
```

#### 步骤4: Repository层执行投票

```python
vote = repo.cast_vote(
    meeting_id=60,
    requirement_id=20,
    voter_id=1,           # admin的ID
    tenant_id=1,
    vote_option="approve",
    comment="我认为这个需求很重要"
)
```

#### 步骤5: 数据库存储

```sql
INSERT INTO requirement_review_votes (
    meeting_id, requirement_id, voter_id, tenant_id,
    vote_option, comment, voted_at, created_at, updated_at
) VALUES (
    60, 20, 1, 1,
    'approve', '我认为这个需求很重要',
    '2026-02-05 06:00:00',
    '2026-02-05 06:00:00',
    '2026-02-05 06:00:00'
);
```

**唯一约束检查**:
- 检查 `uq_meeting_requirement_voter(meeting_id=60, requirement_id=20, voter_id=1)`
- ✅ 不存在 → 插入成功

#### 步骤6: 返回结果

```json
{
  "success": true,
  "message": "投票成功",
  "data": {
    "id": 123,
    "meeting_id": 60,
    "requirement_id": 20,
    "voter_id": 1,
    "vote_option": "approve",
    "comment": "我认为这个需求很重要",
    "voted_at": "2026-02-05T06:00:00"
  }
}
```

#### 步骤7: 前端更新状态

```typescript
// 投票成功后
setHasVoted(true);         // 显示"已投票"状态
setVoteOption('approve');  // 显示投的票
setVoteDisabled(true);     // 禁用投票按钮

// 5秒后自动刷新统计
setTimeout(() => {
  queryClient.invalidateQueries(['voteStatistics']);
}, 5000);
```

#### 步骤8: 实时统计更新

```typescript
// TanStack Query每5秒自动刷新
useQuery({
  queryKey: ['voteStatistics', meetingId, requirementId],
  queryFn: () => getVoteStatistics(meetingId, requirementId),
  refetchInterval: 5000,  // 5秒轮询
});
```

---

## 特殊场景处理

### 场景1: 会议结束前最后一人投票

```python
# 投票成功后，会议自动结束
if all_voters_voted(meeting_id):
    end_meeting(meeting_id)
    archive_vote_results(meeting_id)
```

### 场景2: 投票后修改需求

```python
# 需求可以在投票后修改
# 投票结果不会受影响
# 因为投票记录的是 requirement_id，不是需求内容
```

### 场景3: 移除已投票的参会人员

```python
# 级联删除投票记录
def remove_attendee(meeting_id, attendee_id):
    # 删除参会人员
    db.query(RequirementReviewMeetingAttendee)\
        .filter_by(meeting_id=meeting_id, attendee_id=attendee_id)\
        .delete()

    # 级联删除该人员的投票
    db.query(RequirementReviewVote)\
        .filter_by(meeting_id=meeting_id, voter_id=attendee_id)\
        .delete()

    db.commit()
```

---

## 性能优化

### 1. 索引优化

```sql
-- 复合索引：加速统计查询
CREATE INDEX ix_review_votes_meeting_req_option
ON requirement_review_votes(meeting_id, requirement_id, vote_option);

-- 租户索引：加速租户隔离查询
CREATE INDEX ix_review_votes_tenant_meeting
ON requirement_review_votes(tenant_id, meeting_id);
```

### 2. 批量查询优化

```python
# 使用joinedload避免N+1查询
def get_votes_with_users(meeting_id, requirement_id):
    return db.query(RequirementReviewVote)\
        .options(joinedload(RequirementReviewVote.voter))\
        .filter_by(meeting_id=meeting_id, requirement_id=requirement_id)\
        .all()
```

### 3. 缓存策略

```python
# 缓存投票统计（5秒TTL）
@cache(ttl=5)
def get_vote_statistics_cached(meeting_id, requirement_id):
    return get_vote_statistics(meeting_id, requirement_id)
```

---

## 安全考虑

### 1. 防止SQL注入

```python
# 使用ORM参数化查询
db.query(RequirementReviewVote).filter(
    RequirementReviewVote.meeting_id == meeting_id,
    RequirementReviewVote.requirement_id == requirement_id,
    RequirementReviewVote.voter_id == voter_id
)
```

### 2. 防止越权投票

```python
# 租户隔离
tenant_id = get_tenant_id(current_user)

# 所有查询都带上租户ID
filter_by(tenant_id=tenant_id)
```

### 3. 审计日志

```python
# 记录所有投票操作
log.info(
    f"Vote cast: user={current_user.id}, "
    f"meeting={meeting_id}, requirement={requirement_id}, "
    f"option={vote_option}"
)
```

---

## 总结

### 投票逻辑核心要点

1. ✅ **三层权限检查**: API → Service → Repository
2. ✅ **唯一约束保证**: 数据库层面防止重复投票
3. ✅ **明确的错误消息**: 每种失败情况都有清晰提示
4. ✅ **实时统计更新**: 5秒轮询机制
5. ✅ **结果永久存档**: 会议结束时保存到 vote_results 表

### 投票流程简述

```
登录 → 成为参会人员 → 会议开始 → 选择需求 → 点击投票 →
权限验证 → 数据库存储 → 统计更新 → 前端显示
```

### 关键检查点

| 检查点 | 失败条件 | HTTP状态码 |
|--------|---------|-----------|
| 登录状态 | 未登录 | 401 |
| 重复投票 | 已投过票 | 400 |
| 会议状态 | 非 in_progress | 403 |
| 参会身份 | 非参会人员 | 403 |

---

**文档版本**: 1.0
**最后更新**: 2026-02-05
**覆盖范围**: 完整投票逻辑、权限检查、数据存储、错误处理

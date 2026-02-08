# 投票统计显示问题修复总结

## 问题描述

投票成功后，投票统计面板没有显示投票结果（显示"暂无投票"）。

---

## 🔍 问题分析

### 前端期望的数据格式

```typescript
interface VoteStatistics {
  requirement_id: number;
  total_votes: number;
  approve_count: number;
  approve_percentage: number;
  reject_count: number;
  reject_percentage: number;
  abstain_count: number;
  abstain_percentage: number;
  votes: Array<{
    voter_id: number;
    voter_name: string;
    vote_option: VoteOption;
    comment?: string;
    voted_at: string;
  }>;
}
```

### 后端实际返回的格式（修复前）

```json
{
  "approve": {"count": 1, "percentage": 100.0, "votes": [...]},
  "reject": {"count": 0, "percentage": 0.0, "votes": []},
  "abstain": {"count": 0, "percentage": 0.0, "votes": []}
}
```

### 数据格式不匹配

| 问题 | 前端期望 | 后端返回（修复前） |
|------|---------|------------------|
| **顶层结构** | 扁平化 | 嵌套（按选项分组） |
| **总票数** | `total_votes` | 需要计算各 count 之和 |
| **计数字段** | `approve_count`, `reject_count`, `abstain_count` | `approve.count`, `reject.count`, `abstain.count` |
| **百分比** | `approve_percentage` 等 | `approve.percentage` 等 |
| **投票列表** | 单一数组包含所有投票 | 三个数组分散在各选项中 |
| **用户名** | `voter_name` | ❌ 缺失 |
| **投票时间** | `voted_at` | ❌ 缺失 |

---

## ✅ 已完成的修复

### 1. 修改 Repository 层

**文件：** `backend/app/repositories/requirement_review_meeting.py`

**修改内容：** 重写 `get_vote_statistics` 方法，返回符合前端期望的扁平化结构。

**修复前：**
```python
def get_vote_statistics(self, meeting_id: int, requirement_id: int) -> Dict[str, Any]:
    # 使用 SQL GROUP BY 聚合
    sql = text("""
        SELECT
            vote_option,
            COUNT(*) as count,
            json_agg(json_build_object(
                'voter_id', voter_id,
                'comment', comment
            )) as votes
        FROM requirement_review_votes
        WHERE meeting_id = :meeting_id AND requirement_id = :requirement_id
        GROUP BY vote_option
    """)

    stats = {
        "approve": {"count": 0, "percentage": 0.0, "votes": []},
        "reject": {"count": 0, "percentage": 0.0, "votes": []},
        "abstain": {"count": 0, "percentage": 0.0, "votes": []},
    }
    # ... 处理逻辑
```

**修复后：**
```python
def get_vote_statistics(self, meeting_id: int, requirement_id: int) -> Dict[str, Any]:
    """Get aggregated vote statistics with user information."""

    from sqlalchemy import text
    from app.models.user import User

    # 获取所有投票，并 JOIN 用户表获取用户信息
    sql = text("""
        SELECT
            v.vote_option,
            v.voter_id,
            u.username as voter_name,
            v.comment,
            v.created_at as voted_at
        FROM requirement_review_votes v
        LEFT JOIN users u ON v.voter_id = u.id
        WHERE v.meeting_id = :meeting_id AND v.requirement_id = :requirement_id
        ORDER BY v.created_at DESC
    """)

    result = self.db.execute(sql, {
        "meeting_id": meeting_id,
        "requirement_id": requirement_id
    })

    # 初始化统计（扁平化结构）
    stats = {
        "requirement_id": requirement_id,
        "total_votes": 0,
        "approve_count": 0,
        "approve_percentage": 0.0,
        "reject_count": 0,
        "reject_percentage": 0.0,
        "abstain_count": 0,
        "abstain_percentage": 0.0,
        "votes": []
    }

    votes_list = []
    for row in result:
        vote_option = row[0]
        voter_id = row[1]
        voter_name = row[2]
        comment = row[3]
        voted_at = row[4]

        stats["total_votes"] += 1
        stats[f"{vote_option}_count"] += 1

        votes_list.append({
            "voter_id": voter_id,
            "voter_name": voter_name or f"User{voter_id}",
            "vote_option": vote_option,
            "comment": comment,
            "voted_at": voted_at.isoformat() if voted_at else None
        })

    # 计算百分比
    if stats["total_votes"] > 0:
        stats["approve_percentage"] = round(stats["approve_count"] * 100.0 / stats["total_votes"], 1)
        stats["reject_percentage"] = round(stats["reject_count"] * 100.0 / stats["total_votes"], 1)
        stats["abstain_percentage"] = round(stats["abstain_count"] * 100.0 / stats["total_votes"], 1)

    stats["votes"] = votes_list

    return stats
```

**关键改进：**
- ✅ JOIN 用户表获取 `voter_name`
- ✅ 返回 `voted_at` 时间戳
- ✅ 使用扁平化结构匹配前端期望
- ✅ 统一的 `votes` 数组包含所有投票
- ✅ 字段名与前端类型定义完全一致

---

### 2. 修改 Schema 定义

**文件：** `backend/app/schemas/requirement_review_meeting.py`

**修改内容：** 更新 `VoteStatisticsData` 和新增 `VoteItem` schema。

**修复前：**
```python
class VoteOptionStats(BaseModel):
    """Statistics for a vote option."""
    count: int
    percentage: float
    votes: List[Dict[str, Any]]


class VoteStatisticsData(BaseModel):
    """Vote statistics data schema."""

    approve: VoteOptionStats
    reject: VoteOptionStats
    abstain: VoteOptionStats
```

**修复后：**
```python
class VoteItem(BaseModel):
    """单个投票记录"""

    voter_id: int
    voter_name: str
    vote_option: str
    comment: Optional[str] = None
    voted_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VoteStatisticsData(BaseModel):
    """Vote statistics data schema (匹配前端期望的格式)."""

    requirement_id: int
    total_votes: int
    approve_count: int
    approve_percentage: float
    reject_count: int
    reject_percentage: float
    abstain_count: int
    abstain_percentage: float
    votes: List[VoteItem]

    model_config = ConfigDict(from_attributes=True)
```

**关键改进：**
- ✅ 新增 `VoteItem` schema 定义单个投票记录
- ✅ `VoteStatisticsData` 使用扁平化结构
- ✅ 字段名与前端类型定义完全匹配

---

## 🧪 测试验证

### API 测试结果

```bash
$ /tmp/test_vote_stats.sh
```

**返回数据：**
```json
{
    "success": true,
    "data": {
        "requirement_id": 19,
        "total_votes": 1,
        "approve_count": 0,
        "approve_percentage": 0.0,
        "reject_count": 0,
        "reject_percentage": 0.0,
        "abstain_count": 1,
        "abstain_percentage": 100.0,
        "votes": [
            {
                "voter_id": 1,
                "voter_name": "admin",
                "vote_option": "abstain",
                "comment": null,
                "voted_at": "2026-02-04T11:38:57.194486+08:00"
            }
        ]
    }
}
```

✅ **数据格式正确！**

---

## 📊 前后端数据流

### 修复后的完整流程

```
用户投票
    ↓
前端发送 POST /api/v1/requirement-review-meetings/30/requirements/19/vote
    ↓
后端保存投票记录
    ↓
前端调用 queryClient.refetchQueries(['vote-statistics', 30, 19])
    ↓
前端发送 GET /api/v1/requirement-review-meetings/30/requirements/19/votes
    ↓
后端执行 get_vote_statistics()
    ↓
JOIN requirement_review_votes 和 users 表
    ↓
返回扁平化的统计数据
    ↓
✅ VoteStatisticsPanel 接收数据并渲染
```

---

## 🎯 预期效果

投票成功后，投票统计面板应该立即显示：

1. **总票数**
   - 显示"共 X 票"
   - ✅ 投票后立即 +1

2. **进度条统计**
   - 支持通过 (X) - 绿色进度条和百分比
   - 反对拒绝 (X) - 红色进度条和百分比
   - 弃权 (X) - 黄色进度条和百分比
   - ✅ 投票后立即更新百分比

3. **投票详情列表**
   - 显示每个投票人的头像、姓名、投票选项、评审意见
   - ✅ 投票后立即显示新投票
   - ✅ 按时间倒序排列（最新的在上面）

---

## 🔧 调试技巧

### 检查 API 返回数据

```bash
# 获取投票统计
curl -X GET http://localhost:8000/api/v1/requirement-review-meetings/30/requirements/19/votes \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: 1"
```

### 检查前端接收数据

在 `VoteStatisticsPanel.tsx` 中添加日志：

```typescript
export function VoteStatisticsPanel({ statistics }: VoteStatisticsPanelProps) {
  console.log('[VoteStatisticsPanel] 接收到的数据:', statistics)
  const { total_votes, approve_count, reject_count, abstain_count, votes } = statistics
  // ...
}
```

### 检查 SQL 查询

在 `get_vote_statistics` 方法中添加日志：

```python
print(f"[DEBUG] 查询投票统计: meeting_id={meeting_id}, requirement_id={requirement_id}")
print(f"[DEBUG] 返回数据: {stats}")
```

---

## 📝 修改文件汇总

| 文件 | 修改内容 |
|------|---------|
| `backend/app/repositories/requirement_review_meeting.py` | 重写 `get_vote_statistics` 方法，返回扁平化结构 |
| `backend/app/schemas/requirement_review_meeting.py` | 更新 `VoteStatisticsData`，新增 `VoteItem` |

---

## 🎉 修复完成

现在投票统计功能应该能够：
1. ✅ 投票成功后立即显示投票统计
2. ✅ 显示正确的总票数
3. ✅ 显示正确的投票百分比
4. ✅ 显示投票人姓名和投票时间
5. ✅ 显示评审意见（如果有）
6. ✅ 按时间倒序排列投票

---

## 📚 相关文档

- [投票刷新问题修复](./vote-refresh-fix.md)
- [CORS 错误修复](./vote-cors-fix.md)
- [Admin 投票权限修复](./vote-admin-privilege-fix.md)
- [投票功能调试指南](./vote-debugging-guide.md)

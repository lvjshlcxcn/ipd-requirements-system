# 系统维护指南 - 需求评审投票系统

## 📚 目录
1. [日常维护](#日常维护)
2. [测试运行](#测试运行)
3. [常见问题](#常见问题)
4. [性能优化](#性能优化)
5. [扩展建议](#扩展建议)

---

## 日常维护

### 每日检查
```bash
# 1. 检查服务状态
systemctl status backend-service
systemctl status nginx

# 2. 查看日志
tail -f /var/log/backend-service/app.log
tail -f /var/log/nginx/access.log

# 3. 检查数据库连接
psql -U username -d database_name -c "SELECT COUNT(*) FROM requirement_review_meetings;"

# 4. 监控资源使用
htop
df -h
```

### 每周任务
- [ ] 备份数据库
- [ ] 检查磁盘空间
- [ ] 审查错误日志
- [ ] 验证备份完整性

### 每月任务
- [ ] 运行完整测试套件
- [ ] 性能基准测试
- [ ] 安全扫描
- [ ] 文档更新

---

## 测试运行

### 后端测试

#### 快速测试（开发中）
```bash
cd /Users/kingsun/claude_study/backend

# 只运行快速测试
pytest tests/unit/ -v

# 运行特定测试文件
pytest tests/integration/test_api/test_concurrent_voting.py -v

# 运行特定测试
pytest tests/ -k "test_cast_vote" -v
```

#### 完整测试（部署前）
```bash
cd /Users/kingsun/claude_study/backend

# 运行所有测试
pytest tests/ -v --cov=app --cov-report=html

# 生成覆盖率报告
open htmlcov/index.html
```

#### 性能测试
```bash
# 并发压力测试
pytest tests/integration/test_api/test_concurrent_voting.py -v --benchmark-only

# 或使用locust
locust -f tests/load/test_voting_load.py --host=http://localhost:8000
```

### 前端测试

#### 单元测试
```bash
cd /Users/kingsun/claude_study/frontend

# 运行所有测试
npm test

# 运行特定文件
npm test -- VotePanel.test.tsx

# 监听模式
npm test -- --watch
```

#### E2E测试
```bash
cd /Users/kingsun/claude_study/frontend

# 运行所有E2E测试
npm run test:e2e

# 运行特定场景
npx playwright test review-meeting-voting.spec.ts

# UI模式
npm run test:e2e:ui

# 调试模式
npm run test:e2e:debug
```

---

## 常见问题

### 问题1: 测试失败

**症状**: 运行测试时部分失败

**解决方案**:
```bash
# 1. 清理缓存
cd backend
rm -rf .pytest_cache __pycache__ */__pycache__

# 2. 重新创建虚拟环境
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. 重置测试数据库
pytest tests/ --create-db

# 4. 重新运行
pytest tests/ -v
```

### 问题2: 数据库迁移失败

**症状**: alembic upgrade head 失败

**解决方案**:
```bash
# 1. 检查当前版本
alembic current

# 2. 查看迁移历史
alembic history

# 3. 回滚到上一个版本
alembic downgrade -1

# 4. 检查迁移SQL
alembic upgrade head --sql

# 5. 手动修复后重试
alembic upgrade head
```

### 问题3: 前端构建失败

**症状**: npm run build 失败

**解决方案**:
```bash
# 1. 清理node_modules
cd frontend
rm -rf node_modules package-lock.json

# 2. 重新安装
npm install

# 3. 清理构建缓存
rm -rf dist .vite

# 4. 重新构建
npm run build
```

### 问题4: 并发投票错误

**症状**: 投票时出现"重复投票"错误

**解决方案**:
```bash
# 1. 检查数据库约束
psql -d database_name -c "\d requirement_review_votes"

# 2. 查看是否有重复记录
psql -d database_name -c "
SELECT meeting_id, requirement_id, voter_id, COUNT(*)
FROM requirement_review_votes
GROUP BY meeting_id, requirement_id, voter_id
HAVING COUNT(*) > 1;
"

# 3. 清理重复记录（如果有）
psql -d database_name -c "
DELETE FROM requirement_review_votes
WHERE ctid NOT IN (
    SELECT min(ctid)
    FROM requirement_review_votes
    GROUP BY meeting_id, requirement_id, voter_id
);
"

# 4. 重建索引
psql -d database_name -c "REINDEX TABLE requirement_review_votes;"
```

### 问题5: 实时更新不工作

**症状**: 投票统计不自动更新

**解决方案**:
```typescript
// 1. 检查轮询间隔（frontend/src/pages/review-center/ReviewMeetingDetailPage.tsx）
const REFRESH_INTERVAL = 5000; // 5秒

// 2. 确保useQuery配置正确
useQuery({
  queryKey: ['voteStatistics', meetingId],
  queryFn: () => fetchVoteStatistics(meetingId),
  refetchInterval: REFRESH_INTERVAL,
});

// 3. 检查浏览器控制台是否有错误
// 打开开发者工具 → Console

// 4. 手动触发刷新
queryClient.invalidateQueries(['voteStatistics']);
```

---

## 性能优化

### 数据库优化

#### 1. 添加索引
```sql
-- 投票统计查询优化
CREATE INDEX IF NOT EXISTS ix_vote_stats_meeting_req
ON requirement_review_votes(meeting_id, requirement_id);

-- 当前投票人查询优化
CREATE INDEX IF NOT EXISTS ix_vote_voter_status
ON requirement_review_votes(meeting_id, requirement_id, voter_id);

-- 时间范围查询优化
CREATE INDEX IF NOT EXISTS ix_meeting_scheduled_at
ON requirement_review_meetings(scheduled_at DESC);
```

#### 2. 查询优化
```python
# 使用joinedload避免N+1
from sqlalchemy.orm import joinedload

def get_meeting_with_requirements(db, meeting_id):
    return db.query(Meeting)\
        .options(joinedload(Meeting.requirements))\
        .filter(Meeting.id == meeting_id)\
        .first()
```

### 应用优化

#### 1. 缓存策略
```python
# 使用Redis缓存投票统计
from functools import lru_cache

@lru_cache(maxsize=128)
def get_vote_statistics_cached(meeting_id, requirement_id):
    return get_vote_statistics(meeting_id, requirement_id)
```

#### 2. 异步处理
```python
# 使用后台任务处理投票结果存档
from celery import Celery

app = Celery('tasks', broker='redis://localhost:6379')

@app.task
def archive_vote_results_async(meeting_id):
    archive_vote_results(meeting_id)
```

---

## 扩展建议

### 短期优化（1-2周）

#### 1. WebSocket实时更新
**当前**: 5秒轮询
**改进**: WebSocket推送

```typescript
// 前端实现
const ws = new WebSocket('ws://localhost:8000/ws/voting/{meeting_id}');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  updateStatistics(update);
};
```

#### 2. 补充API层测试
**目标**: 覆盖率从66%提升到85%

```python
# 添加的测试
def test_update_meeting_title():
def test_update_meeting_time():
def test_delete_meeting_cascade():
def test_bulk_add_attendees():
```

### 中期优化（1个月）

#### 1. 投票修改功能
```python
# 允许修改投票（如果会议主持人批准）
@router.put("/{meeting_id}/requirements/{requirement_id}/vote")
async def update_vote(
    meeting_id: int,
    requirement_id: int,
    vote_update: VoteUpdate,
    current_user = Depends(get_current_user)
):
    # 检查是否有权限
    # 记录修改历史
    # 更新投票
```

#### 2. 审计日志
```python
# 记录所有投票操作
class VoteAuditLog(Base):
    __tablename__ = "vote_audit_logs"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer)
    requirement_id = Column(Integer)
    voter_id = Column(Integer)
    action = Column(String)  # cast, update, delete
    old_value = Column(String)
    new_value = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String)
```

### 长期优化（3个月+）

#### 1. 投票导出功能
```python
# 导出为PDF/Excel
@router.get("/{meeting_id}/vote-results/export")
async def export_vote_results(
    meeting_id: int,
    format: str = "pdf",  # pdf, excel, csv
    current_user = Depends(get_current_user)
):
    # 生成报告
    # 返回文件
```

#### 2. 高级统计
```python
# 投票趋势分析
@router.get("/{meeting_id}/vote-analytics")
async def get_vote_analytics(meeting_id: int):
    return {
        "participation_rate": 0.95,
        "avg_voting_time": 120,  # 秒
        "approval_trend": "increasing",
        "consensus_score": 0.78
    }
```

#### 3. 多语言支持
```python
# i18n支持
from fastapi import Header

@router.get("/api/v1/review-meetings/")
async def list_meetings(
    Accept-Language: str = Header("zh-CN")
):
    # 根据语言返回内容
```

---

## 📞 技术支持

### 文档位置
- **完整总结**: `/Users/kingsun/claude_study/TDD_PROJECT_COMPLETE_SUMMARY.md`
- **测试报告**: `/Users/kingsun/claude_study/backend/TEST_VERIFICATION_REPORT.md`
- **E2E指南**: `/Users/kingsun/claude_study/frontend/e2e/README.md`
- **部署检查**: `/Users/kingsun/claude_study/DEPLOYMENT_CHECKLIST.md`

### 运行快速检查
```bash
# 一键健康检查
cd /Users/kingsun/claude_study/backend
pytest tests/ -v -x --tb=short -q

# 预期: 所有测试通过 ✅
```

---

**维护指南版本**: 1.0
**最后更新**: 2026-02-04
**维护团队**: [团队名称]

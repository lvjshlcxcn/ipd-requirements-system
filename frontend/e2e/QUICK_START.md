# E2E 测试快速开始指南

## 第一次运行？按照这个指南操作

### 步骤 1: 确认环境

```bash
# 确认后端运行在 8000 端口
curl http://localhost:8000/api/v1/health

# 应该看到: {"status":"ok"}
```

### 步骤 2: 创建测试用户

如果系统中还没有测试用户，运行以下脚本创建：

```bash
# 在 backend 目录
python -c "
from app.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

db = SessionLocal()
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

test_users = [
    {'username': 'test_moderator', 'email': 'mod@test.com', 'role': 'moderator'},
    {'username': 'test_voter1', 'email': 'voter1@test.com', 'role': 'voter'},
    {'username': 'test_voter2', 'email': 'voter2@test.com', 'role': 'voter'},
    {'username': 'test_voter3', 'email': 'voter3@test.com', 'role': 'voter'},
    {'username': 'test_user', 'email': 'user@test.com', 'role': 'user'},
]

for user_data in test_users:
    existing = db.query(User).filter(User.username == user_data['username']).first()
    if not existing:
        user = User(
            username=user_data['username'],
            email=user_data['email'],
            hashed_password=pwd_context.hash('password123'),
            role=user_data['role'],
            is_active=True,
            tenant_id=1
        )
        db.add(user)

db.commit()
print('✅ 测试用户创建成功')
"
```

### 步骤 3: 确认测试数据

```bash
# 确认至少有 2 个需求用于测试
curl http://localhost:8000/api/v1/requirements/ \
  -H "Authorization: Bearer <your_token>"

# 应该看到至少 2 个需求
```

### 步骤 4: 运行单个测试验证

```bash
# 在 frontend 目录

# 先安装 Playwright（如果还没安装）
npm install -D @playwright/test
npx playwright install chromium

# 运行最简单的测试验证设置
npx playwright test duplicate-vote-rejection.spec.ts --headed
```

## 常用命令速查

```bash
# 运行所有 E2E 测试
npm run test:e2e

# 运行特定测试
npx playwright test review-meeting-voting.spec.ts

# 带浏览器窗口运行（调试用）
npx playwright test --headed

# 调试模式（可以一步步执行）
npx playwright test --debug

# 查看测试报告
npm run test:e2e:report

# 重新运行失败的测试
npx playwright test --repeat-each 3

# 只运行特定项目
npx playwright test --grep "完整投票流程"
```

## 故障排除

### 问题 1: "Cannot find module '@playwright/test'"

```bash
cd frontend
npm install -D @playwright/test
npx playwright install chromium
```

### 问题 2: "Login failed"

检查测试用户是否存在：
```bash
# 在 backend 目录
python -c "
from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).filter(User.username.like('test_%')).all()
for u in users:
    print(f'{u.username} - {u.role}')
"
```

### 问题 3: "Meeting not found"

检查会议是否创建成功：
```bash
curl http://localhost:8000/api/v1/requirement-review-meetings/ \
  -H "Authorization: Bearer <token>"
```

### 问题 4: 测试超时

在 `playwright.config.ts` 中增加超时：
```typescript
use: {
  actionTimeout: 30000,    // 30 秒
  navigationTimeout: 60000, // 60 秒
  timeout: 120000,          // 120 秒
}
```

## 测试文件映射

| 测试文件 | 测试场景 | 预计时间 |
|---------|---------|---------|
| `review-meeting-voting.spec.ts` | 完整投票流程 | 3-5 分钟 |
| `duplicate-vote-rejection.spec.ts` | 重复投票拒绝 | 2-3 分钟 |
| `moderator-controls.spec.ts` | 主持人权限控制 | 2-3 分钟 |
| `realtime-updates.spec.ts` | 实时更新（多浏览器） | 3-4 分钟 |
| `vote-results-archival.spec.ts` | 投票结果存档 | 2-3 分钟 |

**总预计时间**: 12-18 分钟

## 下一步

1. ✅ 运行所有测试
2. ✅ 查看 HTML 报告
3. ✅ 修复失败的测试
4. ✅ 添加新的测试场景

## 需要帮助？

查看详细文档：
- 完整指南: `e2e/README.md`
- Playwright 文档: https://playwright.dev

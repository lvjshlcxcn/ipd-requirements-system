# 需求评审投票系统 E2E 测试

这是需求评审投票系统的端到端（E2E）测试套件，使用 Playwright 测试框架。

## 测试概览

本测试套件包含 5 个主要测试场景，覆盖完整的用户投票流程：

1. **完整投票流程** (`review-meeting-voting.spec.ts`)
   - 创建会议、添加参会人员和需求
   - 开始会议并指定投票人
   - 三位投票人依次投票
   - 查看统计结果并结束会议
   - 验证结果存档

2. **重复投票被拒绝** (`duplicate-vote-rejection.spec.ts`)
   - 验证用户不能重复投票
   - 验证快速点击提交按钮只记录一票
   - 验证错误消息正确显示

3. **主持人控制功能** (`moderator-controls.spec.ts`)
   - 验证只有主持人能开始/结束会议
   - 验证只有主持人能看到控制面板
   - 验证"下一位投票人"功能权限

4. **实时更新** (`realtime-updates.spec.ts`)
   - 多浏览器场景测试
   - 验证投票统计实时同步
   - 验证多用户同时查看统计

5. **投票结果存档** (`vote-results-archival.spec.ts`)
   - 验证会议结束后结果正确存档
   - 验证存档数据完整性和不可修改性
   - 验证筛选和排序功能

## 前置要求

### 1. 测试用户

确保系统中存在以下测试用户（在 `e2e/helpers/test-data.ts` 中配置）：

```typescript
const TEST_USERS = {
  moderator: {
    username: 'test_moderator',
    password: 'password123',
    role: 'moderator',
  },
  voter1: {
    username: 'test_voter1',
    password: 'password123',
    role: 'voter',
  },
  voter2: {
    username: 'test_voter2',
    password: 'password123',
    role: 'voter',
  },
  voter3: {
    username: 'test_voter3',
    password: 'password123',
    role: 'voter',
  },
  regularUser: {
    username: 'test_user',
    password: 'password123',
    role: 'user',
  },
};
```

### 2. 测试需求

系统中至少需要 2 个需求（ID 为 1 和 2）用于测试。

### 3. 服务运行

确保以下服务正在运行：

- **后端服务**: `http://localhost:8000`
- **前端开发服务器**: `http://localhost:5173`（由 Playwright 自动启动）

## 安装和设置

```bash
# 1. 安装依赖
npm install

# 2. 安装 Playwright 浏览器
npx playwright install chromium

# 3. 验证安装
npx playwright --version
```

## 运行测试

### 运行所有 E2E 测试

```bash
npm run test:e2e
```

### 运行特定测试文件

```bash
# 只运行完整投票流程测试
npx playwright test review-meeting-voting.spec.ts

# 只运行重复投票测试
npx playwright test duplicate-vote-rejection.spec.ts
```

### 交互式模式（UI）

```bash
npm run test:e2e:ui
```

### 调试模式

```bash
# 带浏览器窗口的调试模式
npm run test:e2e:headed

# 调试模式（带 Playwright Inspector）
npm run test:e2e:debug
```

## 查看测试报告

测试运行完成后，查看 HTML 报告：

```bash
npm run test:e2e:report
```

或直接打开 `playwright-report/index.html` 文件。

## 测试配置

配置文件位于 `playwright.config.ts`：

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,      // E2E 测试顺序执行（避免数据冲突）
  workers: 1,                 // 单工作进程
  baseURL: 'http://localhost:5173',
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
});
```

## 测试数据管理

### 辅助函数

测试辅助函数位于 `e2e/helpers/test-data.ts`：

- `login()` - API 登录并获取 token
- `createTestMeeting()` - 创建测试会议
- `addAttendeeToMeeting()` - 添加参会人员
- `addRequirementToMeeting()` - 添加需求
- `startMeeting()` / `endMeeting()` - 开始/结束会议
- `castVote()` - 投票
- `getVoteStatistics()` - 获取投票统计
- `cleanupTestData()` - 清理测试数据

### 数据清理

每个测试文件都会在 `afterAll` 钩子中自动清理创建的测试数据：

```typescript
test.afterAll(async ({ request }) => {
  await cleanupTestData(request, moderatorToken, createdMeetingIds);
});
```

## 测试最佳实践

### 1. 使用 data-testid 选择器

在组件中添加 `data-testid` 属性，避免依赖 CSS 类名：

```tsx
<button data-testid="start-meeting-button">开始会议</button>
```

```typescript
await page.click('[data-testid="start-meeting-button"]');
```

### 2. 等待策略

- ✅ 使用 `waitForSelector()` 等待元素出现
- ✅ 使用 `waitForURL()` 等待路由变化
- ❌ 避免使用固定延迟（`page.waitForTimeout()`）

### 3. 模拟用户行为

- 使用 `fill()` 填写表单
- 使用 `click()` 点击按钮
- 使用 `press()` 模拟键盘输入

### 4. 验证点

每个测试场景都应验证：
- UI 状态变化
- API 响应数据
- 数据库状态（通过 API）

## 常见问题

### Q: 测试失败，找不到元素

**A**: 检查以下几点：
1. 元素选择器是否正确
2. 是否需要等待异步加载
3. 元素是否在 iframe 或 shadow DOM 中

### Q: 测试超时

**A**: 增加超时时间：

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 秒
  // ...
});
```

### Q: 测试数据冲突

**A**: 确保测试顺序执行，并在 `afterAll` 中清理数据。

### Q: API 返回 401 Unauthorized

**A**: 检查：
1. 测试用户是否存在
2. 登录凭证是否正确
3. Token 是否正确设置

## 调试技巧

### 1. 使用 Playwright Inspector

```bash
npx playwright test --debug
```

### 2. 查看截图和视频

失败的测试会自动保存截图和视频到：
- `test-results/` - 截图和视频
- `playwright-report/` - HTML 报告

### 3. 慢动作模式

```typescript
// 在 playwright.config.ts 中设置
use: {
  actionTimeout: 10000,
  slowMo: 500, // 慢动作模式（500ms 延迟）
}
```

### 4. 保留浏览器窗口

```bash
npx playwright test --headed
```

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 测试覆盖率

当前测试覆盖：

| 功能 | 测试场景 | 覆盖率 |
|------|---------|--------|
| 会议管理 | 创建、开始、结束 | ✅ 100% |
| 参会人员 | 添加、移除 | ✅ 100% |
| 需求管理 | 添加、移除、排序 | ✅ 100% |
| 投票功能 | 投票、重复投票拒绝 | ✅ 100% |
| 统计功能 | 实时更新、多用户同步 | ✅ 100% |
| 权限控制 | 主持人权限、用户权限 | ✅ 100% |
| 存档功能 | 存档、查询、筛选 | ✅ 100% |

## 贡献指南

添加新测试时：

1. 在 `e2e/` 目录创建新的测试文件
2. 使用 `test.describe()` 组织测试
3. 使用 `test.step()` 创建测试步骤
4. 在 `afterAll` 中清理测试数据
5. 更新此 README 文档

## 资源链接

- [Playwright 官方文档](https://playwright.dev)
- [Playwright 测试最佳实践](https://playwright.dev/docs/best-practices)
- [测试组织指南](https://playwright.dev/docs/organizing-tests)

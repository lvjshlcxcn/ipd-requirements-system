# 前端测试系统建设方案

## 📊 现状分析

### 测试覆盖情况

**已有测试文件** (11个, 约2599行代码):
- ✅ stores: useAuthStore.test.ts (完整测试，含屏幕锁定)
- ✅ services: rtm.service.test.ts (完整测试)
- ⚠️ components: 4个测试文件 (部分失败)
- ⚠️ pages: 5个测试文件 (部分失败)
- ✅ hooks: useSessionTimeout.test.ts
- ✅ e2e: screen-lock.spec.ts (Playwright)

**源码文件统计**:
- 源码文件: 80个 .ts/.tsx 文件
- 测试文件: 11个
- 测试覆盖率: 约 14% (11/80)

### 测试执行结果

```
Test Files:  6 passed | 5 failed | 1 skipped (12)
Tests:       81 passed | 6 failed (87)
Duration:    9.30s
```

**主要问题**:
1. 部分测试超时失败 (useSessionTimeout测试)
2. Mock配置不完整 (MainLayout测试)
3. 异步测试处理不稳定

### 工具链现状

**已配置工具**:
```json
{
  "vitest": "^1.6.1",              // 测试框架
  "@vitest/coverage-v8": "^1.6.1", // 覆盖率工具
  "@vitest/ui": "^1.1.0",          // UI界面
  "@testing-library/react": "^14.3.1", // 组件测试
  "@testing-library/user-event": "^14.6.1", // 用户交互
  "happy-dom": "^12.10.3",         // DOM环境
  "jsdom": "^23.2.0"               // 备用DOM环境
}
```

**测试脚本**:
```json
{
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

### 测试配置

**vitest.config.ts**:
- ✅ 已配置 jsdom 环境
- ✅ 已配置 setupFiles
- ✅ 已配置覆盖率报告 (text, json, html)
- ✅ 已配置路径别名 (@)
- ⚠️ 覆盖率排除配置不完整

**test/setup.ts**:
- ✅ 已配置 jest-dom matchers
- ✅ 已配置 matchMedia mock
- ✅ 已配置 IntersectionObserver mock
- ✅ 已配置 ResizeObserver mock
- ✅ 已配置 fetch mock

---

## 🎯 建设目标

### 短期目标 (1-2周)

1. **修复现有测试** (优先级: 🔴 高)
   - 修复5个失败的测试用例
   - 修复超时问题
   - 修复Mock配置问题

2. **完善测试基础设施** (优先级: 🔴 高)
   - 创建测试工具库 (test-utils)
   - 创建Mock数据管理
   - 创建测试覆盖率目标

3. **提升核心功能覆盖率** (优先级: 🟡 中)
   - 认证模块 (auth): 100%
   - 需求管理模块 (requirements): 80%
   - RTM模块: 90%

### 中期目标 (1个月)

4. **扩展测试范围** (优先级: 🟡 中)
   - Services层: 所有service测试覆盖率 > 80%
   - Stores层: 所有store测试覆盖率 > 80%
   - 核心组件: 所有核心组件测试覆盖率 > 70%

5. **集成测试** (优先级: 🟡 中)
   - 页面集成测试
   - 路由导航测试
   - 状态管理集成测试

6. **E2E测试** (优先级: 🟢 低)
   - 配置Playwright
   - 核心流程E2E测试
   - 回归测试套件

### 长期目标 (3个月)

7. **质量保障体系** (优先级: 🟢 低)
   - CI/CD集成
   - 代码质量门禁
   - 性能测试
   - 可访问性测试

---

## 📋 详细实施方案

### 阶段1: 修复与基础设施 (Week 1-2)

#### 1.1 修复现有测试

**目标**: 所有现有测试通过率 100%

**任务清单**:
- [ ] 修复 useSessionTimeout.test.ts 超时问题
  - 问题: waitFor 超时, 计时器处理不正确
  - 解决方案: 使用 vi.useFakeTimers() 正确控制时间

- [ ] 修复 MainLayout.test.tsx Mock配置
  - 问题: useSessionTimeout 参数不匹配
  - 解决方案: 更新测试预期参数

- [ ] 修复其他失败的测试
  - 检查所有失败的测试
  - 统一修复Mock和异步处理

**验收标准**:
```bash
npm test -- --run
# 输出: Test Files  12 passed | 0 failed
```

#### 1.2 创建测试工具库

**文件结构**:
```
src/test/
├── setup.ts                    # 已存在
├── utils/
│   ├── render.tsx              # 创建: 自定义渲染函数
│   ├── mockHelpers.ts          # 创建: Mock辅助函数
│   └── testHelpers.ts          # 创建: 测试辅助函数
└── mocks/
    ├── data.ts                 # 创建: 通用Mock数据
    ├── handlers.ts             # 创建: MSW handlers
    └── server.ts               # 创建: MSW server
```

**render.tsx 实现**:
```typescript
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 自定义渲染函数，包含所有必要的Provider
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return {
    ...render(ui, { wrapper: AllTheProviders, ...options }),
    queryClient,
  }
}

// 重新导出所有 testing-library 工具
export * from '@testing-library/react'
```

**mockHelpers.ts 实现**:
```typescript
import { vi } from 'vitest'

// Mock localStorage
export const mockLocalStorage = () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {}

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString()
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
    }
  })()

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })
}

// Mock authService
export const mockAuthService = () => {
  return {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    verifyPassword: vi.fn(),
    getCurrentUser: vi.fn(),
  }
}

// Mock API响应
export const mockApiResponse = <T>(data: T, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
})
```

**data.ts 实现**:
```typescript
// 用户Mock数据
export const mockUsers = {
  admin: {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    tenant_id: 1,
  },
  user: {
    id: 2,
    username: 'user',
    email: 'user@example.com',
    role: 'user',
    tenant_id: 1,
  },
}

// 需求Mock数据
export const mockRequirements = [
  {
    id: 1,
    requirement_no: 'REQ-2026-0001',
    title: '用户登录功能',
    description: '实现用户名密码登录',
    source_channel: 'customer',
    status: 'collected',
    priority_score: 8,
    created_at: '2026-01-26T10:00:00Z',
    updated_at: '2026-01-26T10:00:00Z',
  },
  // ... 更多测试数据
]

// 认证Mock响应
export const mockAuthResponse = {
  access_token: 'mock-token',
  token_type: 'bearer',
  user: mockUsers.admin,
}
```

#### 1.3 设置覆盖率目标

**更新 vitest.config.ts**:
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/__tests__/', // 排除测试文件本身
      ],
      // 设置覆盖率阈值
      thresholds: {
        lines: 60,          // 目标: 60%行覆盖率
        functions: 60,      // 目标: 60%函数覆盖率
        branches: 50,       // 目标: 50%分支覆盖率
        statements: 60,     // 目标: 60%语句覆盖率
      },
      // 每次运行检查覆盖率
      perFile: false,       // 不要求每个文件都达标
    },
  },
})
```

---

### 阶段2: 扩展测试范围 (Week 3-4)

#### 2.1 Services层测试

**优先级**: 🔴 高

**目标**: 所有services测试覆盖率 > 80%

**测试清单**:
- [ ] auth.service.test.ts (已存在Mock,需创建测试)
- [ ] requirement.service.test.ts (已存在Mock,需创建测试)
- [ ] promptTemplate.service.test.ts (新功能,必须测试)
- [ ] analytics.service.test.ts
- [ ] insight.service.test.ts

**测试模板** (auth.service.test.ts):
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authService } from '@/services/auth.service'
import api from '@/services/api'

// Mock api模块
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        access_token: 'test-token',
        user: { id: 1, username: 'testuser', role: 'admin' },
      }
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse })

      const result = await authService.login('testuser', 'password123')

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password123',
      })
      expect(result.data).toEqual(mockResponse)
    })

    it('should handle login error', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Invalid credentials'))

      await expect(authService.login('testuser', 'wrong'))
        .rejects.toThrow('Invalid credentials')
    })

    it('should validate empty username', async () => {
      await expect(authService.login('', 'password'))
        .rejects.toThrow('Username is required')
    })
  })

  describe('logout', () => {
    it('should clear token on logout', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { success: true } })

      await authService.logout()

      expect(api.post).toHaveBeenCalledWith('/auth/logout')
      expect(localStorage.getItem('auth-token')).toBeNull()
    })
  })
})
```

#### 2.2 Stores层测试

**优先级**: 🔴 高

**目标**: 所有stores测试覆盖率 > 80%

**测试清单**:
- [x] useAuthStore.test.ts (已完成)
- [ ] useRequirementStore.test.ts
- [ ] useAnalysisStore.test.ts
- [ ] useVerificationStore.test.ts
- [ ] useNotificationStore.test.ts

**测试模板** (useRequirementStore.test.ts):
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRequirementStore } from '@/stores/useRequirementStore'

describe('useRequirementStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useRequirementStore.setState({
      requirements: [],
      currentRequirement: null,
      loading: false,
      error: null,
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useRequirementStore())

      expect(result.current.requirements).toEqual([])
      expect(result.current.currentRequirement).toBeNull()
      expect(result.current.loading).toBe(false)
    })
  })

  describe('setRequirements', () => {
    it('should update requirements list', () => {
      const { result } = renderHook(() => useRequirementStore())
      const mockData = [
        { id: 1, title: 'Test Requirement' },
      ]

      act(() => {
        result.current.setRequirements(mockData)
      })

      expect(result.current.requirements).toEqual(mockData)
    })
  })

  describe('fetchRequirements', () => {
    it('should fetch requirements successfully', async () => {
      const { result } = renderHook(() => useRequirementStore())
      const mockData = {
        items: [{ id: 1, title: 'Test' }],
        total: 1,
      }

      // Mock requirementService.getRequirements
      vi.mock('@/services/requirement.service', () => ({
        requirementService: {
          getRequirements: vi.fn().mockResolvedValue({ data: mockData }),
        },
      }))

      await act(async () => {
        await result.current.fetchRequirements()
      })

      expect(result.current.requirements).toEqual(mockData.items)
      expect(result.current.loading).toBe(false)
    })
  })
})
```

#### 2.3 核心组件测试

**优先级**: 🟡 中

**目标**: 核心组件测试覆盖率 > 70%

**测试清单**:
- [x] ChecklistItemView.test.tsx (已完成)
- [x] MainLayout.test.tsx (需修复)
- [x] ScreenLockModal.test.tsx (已完成)
- [ ] RequirementForm.test.tsx
- [ ] RequirementCard.test.tsx
- [ ] APPEALSForm.test.tsx
- [ ] VerificationForm.test.tsx
- [ ] PromptTemplatesPage.test.tsx (新功能,必须测试)

**测试模板** (RequirementForm.test.tsx):
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils/render'
import userEvent from '@testing-library/user-event'
import { RequirementForm } from '@/components/requirements/RequirementForm'

// Mock service
vi.mock('@/services/requirement.service', () => ({
  requirementService: {
    createRequirement: vi.fn(),
    updateRequirement: vi.fn(),
  },
}))

describe('RequirementForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form fields', () => {
    render(
      <RequirementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByLabelText(/标题/)).toBeInTheDocument()
    expect(screen.getByLabelText(/描述/)).toBeInTheDocument()
    expect(screen.getByLabelText /优先级/)).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(
      <RequirementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await user.type(screen.getByLabelText(/标题/), '测试需求')
    await user.type(screen.getByLabelText(/描述/), '测试描述')
    await user.click(screen.getByRole('button', { name: /提交/ }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(
      <RequirementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await user.click(screen.getByRole('button', { name: /提交/ }))

    await waitFor(() => {
      expect(screen.getByText(/请输入标题/)).toBeInTheDocument()
    })
  })

  it('should load existing data for edit mode', () => {
    const existingData = {
      id: 1,
      title: '现有需求',
      description: '现有描述',
      priority_score: 8,
    }

    render(
      <RequirementForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={existingData}
      />
    )

    expect(screen.getByDisplayValue('现有需求')).toBeInTheDocument()
    expect(screen.getByDisplayValue('现有描述')).toBeInTheDocument()
  })
})
```

---

### 阶段3: 集成测试与E2E (Week 5-6)

#### 3.1 页面集成测试

**优先级**: 🟡 中

**测试清单**:
- [x] RequirementListPage.test.tsx (需修复)
- [x] RequirementDetailPage.test.tsx (需修复)
- [x] RequirementCreatePage.test.tsx (需修复)
- [x] RTMPage.test.tsx (需修复)
- [ ] DashboardPage.test.ts
- [ ] AnalyticsPage.test.ts

**测试重点**:
- 页面渲染
- 数据加载
- 用户交互流程
- 错误处理
- 导航跳转

#### 3.2 配置Playwright E2E测试

**优先级**: 🟢 低

**安装Playwright**:
```bash
npm install -D @playwright/test
npx playwright install
```

**playwright.config.ts**:
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

**E2E测试清单**:
- [x] screen-lock.spec.ts (已完成)
- [ ] auth-flow.spec.ts (登录注册流程)
- [ ] requirement-crud.spec.ts (需求CRUD流程)
- [ ] rtm-workflow.spec.ts (RTM工作流)

**E2E测试示例** (auth-flow.spec.ts):
```typescript
import { test, expect } from '@playwright/test'

test.describe('认证流程 E2E', () => {
  test('应该能够成功登录并访问主页', async ({ page }) => {
    await page.goto('/login')

    // 填写登录表单
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="password"]', 'testpass123')
    await page.click('button[type="submit"]')

    // 等待跳转到主页
    await page.waitForURL('/')
    await expect(page.locator('h1')).toContainText('仪表盘')
  })

  test('应该显示登录失败错误', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="username"]', 'wronguser')
    await page.fill('input[name="password"]', 'wrongpass')
    await page.click('button[type="submit"]')

    await expect(page.locator('.error-message')).toBeVisible()
    await expect(page.locator('.error-message'))
      .toContainText('用户名或密码错误')
  })

  test('未登录时访问受保护页面应重定向到登录页', async ({ page }) => {
    await page.goto('/requirements')

    await page.waitForURL('/login')
    expect(page.url()).toContain('/login')
  })
})
```

---

### 阶段4: CI/CD集成 (Week 7-8)

#### 4.1 GitHub Actions配置

**文件**: `.github/workflows/test.yml`

```yaml
name: 前端测试

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: 安装依赖
        working-directory: ./frontend
        run: npm ci

      - name: 运行Lint检查
        working-directory: ./frontend
        run: npm run lint

      - name: 运行单元测试
        working-directory: ./frontend
        run: npm test -- --run --coverage

      - name: 上传覆盖率报告
        uses: codecov/codecov-action@v3
        with:
          directory: ./frontend/coverage
          files: ./coverage/lcov.info
          flags: frontend
          name: frontend-coverage

      - name: 运行E2E测试
        working-directory: ./frontend
        run: npm run test:e2e

      - name: 上传E2E测试报告
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 7

  quality-gate:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'pull_request'

    steps:
      - name: 检查覆盖率
        working-directory: ./frontend
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 60" | bc -l) )); then
            echo "❌ 覆盖率 $COVERAGE% 低于要求的 60%"
            exit 1
          fi
          echo "✅ 覆盖率 $COVERAGE% 符合要求"
```

#### 4.2 代码质量门禁

**SonarQube集成** (可选):
```yaml
- name: SonarQube扫描
  uses: sonarsource/sonarqube-scan-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  with:
    args: >
      -Dsonar.projectKey=ipd-frontend
      -Dsonar.sources=frontend/src
      -Dsonar.test.exclusions=**/*.test.ts,**/*.test.tsx
      -Dsonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info
      -Dsonar.coverage.exclusions=**/*.test.ts,**/*.test.tsx,**/test/**
```

---

## 📈 成功指标

### 量化指标

| 指标 | 当前值 | 目标值 | 衡量方式 |
|------|--------|--------|----------|
| 测试通过率 | 93% (81/87) | 100% | `npm test -- --run` |
| 代码覆盖率 | ~20% | 60% | `npm test -- --coverage` |
| 测试文件数 | 11 | 40+ | `find src/__tests__ -name "*.test.*"` |
| E2E测试 | 1个 | 10+ | `find src/e2e -name "*.spec.ts"` |
| 测试执行时间 | 9.30s | <30s | 测试日志Duration |
| CI/CD集成 | ❌ | ✅ | GitHub Actions状态 |

### 质量标准

**Unit Tests (单元测试)**:
- 每个service至少有测试文件
- 每个store至少有测试文件
- 核心组件至少有测试文件
- 测试命名清晰,遵循AAA模式 (Arrange-Act-Assert)

**Integration Tests (集成测试)**:
- 页面级测试覆盖主要用户流程
- Mock外部依赖(service, store)
- 测试路由导航

**E2E Tests (端到端测试)**:
- 覆盖关键业务流程
- 使用真实浏览器
- 测试完整用户旅程

---

## 🛠 工具和最佳实践

### 测试工具

**核心工具**:
- **Vitest**: 快速的单元测试框架
- **Testing Library**: React组件测试
- **Playwright**: E2E测试
- **MSW (Mock Service Worker)**: API Mock (可选)

**辅助工具**:
- **@testing-library/user-event**: 模拟用户交互
- **vitest-ui**: 测试可视化界面
- **@vitest/coverage-v8**: 覆盖率报告

### 最佳实践

#### 1. 测试命名规范

```typescript
// ✅ 好的命名
describe('UserService', () => {
  it('should return user when login succeeds', () => {})
  it('should throw error when credentials are invalid', () => {})
})

// ❌ 不好的命名
describe('UserService', () => {
  it('test1', () => {})
  it('works', () => {})
})
```

#### 2. AAA模式

```typescript
it('should calculate total price correctly', () => {
  // Arrange - 准备测试数据
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 },
  ]
  const expectedTotal = 250

  // Act - 执行被测试的逻辑
  const total = calculateTotal(items)

  // Assert - 断言结果
  expect(total).toBe(expectedTotal)
})
```

#### 3. 避免测试实现细节

```typescript
// ✅ 测试用户行为
it('should show success message after submission', async () => {
  const user = userEvent.setup()
  render(<ContactForm />)

  await user.type(screen.getByLabelText(/邮箱/), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /提交/ }))

  expect(screen.getByText(/提交成功/)).toBeInTheDocument()
})

// ❌ 测试实现细节
it('should call handleSubmit with email', () => {
  const handleSubmit = vi.fn()
  render(<ContactForm onSubmit={handleSubmit} />)

  // ... 代码
  expect(handleSubmit).toHaveBeenCalledWith({ email: 'test@example.com' })
})
```

#### 4. 使用描述性的选择器

```typescript
// ✅ 好的选择器
screen.getByRole('button', { name: /提交/ })
screen.getByLabelText(/邮箱/)
screen.getByText('提交成功')

// ❌ 不好的选择器
screen.querySelector('.btn-primary')
screen.findAll('[data-testid="submit-btn"]')
```

#### 5. Mock外部依赖

```typescript
// ✅ Mock API调用
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

// ✅ Mock路由
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: '123' }),
}))
```

---

## 📚 参考资料

### 官方文档
- [Vitest文档](https://vitest.dev/)
- [Testing Library文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright文档](https://playwright.dev/docs/intro)

### 最佳实践文章
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest Best Practices](https://vitest.dev/guide/why.html)

---

## 🚀 实施时间表

### Week 1-2: 修复与基础设施
- Day 1-2: 修复现有失败的测试
- Day 3-4: 创建测试工具库 (render.tsx, mockHelpers.ts)
- Day 5-7: 创建Mock数据管理
- Day 8-10: 配置覆盖率目标和CI/CD

### Week 3-4: 扩展测试范围
- Day 11-14: Services层测试 (auth, requirement, promptTemplate)
- Day 15-17: Stores层测试 (requirement, analysis)
- Day 18-21: 核心组件测试 (RequirementForm, PromptTemplatesPage)

### Week 5-6: 集成测试
- Day 22-25: 页面集成测试 (修复现有的, 添加新的)
- Day 26-28: 配置Playwright E2E测试
- Day 29-30: 编写E2E测试用例

### Week 7-8: CI/CD与优化
- Day 31-33: 配置GitHub Actions
- Day 34-36: 设置质量门禁
- Day 37-40: 优化测试性能, 文档完善

---

## ✅ 验收标准

### 阶段1验收 (Week 2)
- [ ] 所有现有测试通过 (12/12 files, 87/87 tests)
- [ ] 测试工具库创建完成
- [ ] Mock数据管理创建完成
- [ ] 覆盖率报告生成正常

### 阶段2验收 (Week 4)
- [ ] Services层测试覆盖率 > 80%
- [ ] Stores层测试覆盖率 > 80%
- [ ] 核心组件测试覆盖率 > 70%
- [ ] 新增测试文件 > 20个

### 阶段3验收 (Week 6)
- [ ] 页面集成测试完成
- [ ] Playwright配置完成
- [ ] E2E测试 > 5个

### 阶段4验收 (Week 8)
- [ ] CI/CD集成完成
- [ ] 覆盖率 > 60%
- [ ] 测试文档完善

---

## 📝 后续维护

### 测试维护建议

1. **持续更新**: 新功能必须包含测试
2. **定期Review**: 每月Review测试覆盖率
3. **重构优化**: 发现重复代码及时提取工具函数
4. **文档更新**: 测试规范和最佳实践文档

### 常见问题处理

**测试运行慢**:
- 使用 `vi.mock()` 避免加载真实模块
- 减少不必要的 `waitFor` 调用
- 并行运行测试 (Vitest默认)

**Mock复杂**:
- 创建可复用的mock函数
- 使用MSW统一管理API Mock
- 将Mock数据集中管理

**测试脆弱**:
- 测试用户行为而非实现细节
- 使用语义化选择器而非CSS选择器
- 增加适当的等待和重试机制

---

**文档版本**: v1.0
**创建日期**: 2026-01-26
**最后更新**: 2026-01-26
**维护者**: Frontend Team

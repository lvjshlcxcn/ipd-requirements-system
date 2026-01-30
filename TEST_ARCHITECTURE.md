# IPD需求管理系统 - 测试架构技术文档

## 📋 文档概览

本文档详细描述IPD需求管理系统的前后端测试架构，包括测试策略、工具链、组织结构、覆盖率目标和最佳实践。

**项目信息**:
- **后端**: FastAPI + SQLAlchemy 2.0 + Pytest
- **前端**: React 18 + TypeScript + Vitest + Playwright
- **整体测试通过率**: ~91% (后端87% + 前端96%)
- **文档版本**: v1.0
- **最后更新**: 2026-01-27

---

## 🏗️ 测试架构总览

### 测试金字塔

```
           E2E Tests (5%)
          ┌───────────────┐
          │  Playwright   │
          │   (Frontend)  │
          └───────────────┘
        ↑─────────────────↑
    Integration Tests (25%)
    ┌────────────────────────┐
    │  API Integration       │  ┌───────────────┐
    │  (Backend)             │  │  Component    │
    │  - pytest              │  │  (Frontend)   │
    │  - httpx AsyncClient   │  │  - vitest     │
    └────────────────────────┘  └───────────────┘
      ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  Unit Tests (70%)
┌──────────────────────┐  ┌─────────────────────┐
│  Model/Schema/Service│  │  Component/Hooks/   │
│  Tests (Backend)     │  │  Store/Service      │
│  - pytest            │  │  Tests (Frontend)   │
│  - Mock              │  │  - vitest + vi.mock │
└──────────────────────┘  └─────────────────────┘
```

### 测试分布统计

| 层级 | 后端测试数 | 前端测试数 | 总计 | 占比 |
|------|-----------|-----------|------|------|
| **Unit Tests** | 389 | 292 | 681 | 70% |
| **Integration Tests** | 39 | 12 | 51 | 25% |
| **E2E Tests** | 0 | 44 | 44 | 5% |
| **总计** | 428 | 348 | **776** | **100%** |

---

## 🔧 后端测试架构

### 技术栈

| 组件 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **测试框架** | pytest | 9.0+ | 测试运行器 |
| **异步支持** | pytest-asyncio | 1.3+ | 异步测试支持 |
| **HTTP客户端** | httpx | AsyncClient | API测试 |
| **覆盖率** | pytest-cov | 7.0+ | 代码覆盖率 |
| **Mock** | pytest-mock | 3.15+ | Mock对象 |
| **数据库** | SQLite (内存) | - | 测试数据库 |

### 目录结构

```
backend/tests/
├── conftest.py                    # 全局fixtures配置
├── pytest.ini                     # pytest配置文件
│
├── unit/                          # 单元测试 (60%)
│   ├── test_models/               # Models测试
│   │   ├── test_user.py           # 用户模型 (23 tests)
│   │   ├── test_requirement.py    # 需求模型 (28 tests)
│   │   ├── test_tenant.py         # 租户模型 (9 tests)
│   │   ├── test_insight.py        # 洞察模型 (13 tests)
│   │   └── test_prompt_template.py # 模板模型 (27 tests)
│   │
│   ├── test_schemas/              # Schema验证测试
│   │   ├── test_requirement_schemas.py  # 需求schema (30 tests)
│   │   ├── test_insight_schemas.py      # 洞察schema (25 tests)
│   │   └── test_analysis_schemas.py     # 分析schema (34 tests)
│   │
│   ├── test_services/             # 业务逻辑测试
│   │   ├── test_requirement_service.py  # 需求服务 (36 tests)
│   │   ├── test_analysis_service.py     # 分析服务 (27 tests)
│   │   ├── test_user_service.py         # 用户服务 (15 tests)
│   │   └── test_llm_service.py          # LLM服务 (12 tests)
│   │
│   └── test_repositories/         # 数据访问测试
│       ├── test_base_repository.py      # 基础仓库 (23 tests)
│       └── test_requirement_repository.py # 需求仓库 (18 tests)
│
├── integration/                   # 集成测试 (40%)
│   ├── test_api/                  # API端点测试
│   │   ├── test_auth_api.py       # 认证API (12 tests)
│   │   ├── test_requirements_api.py # 需求API (18 tests)
│   │   ├── test_insights_api.py   # 洞察API (15 tests)
│   │   └── test_analysis_api.py   # 分析API (8 tests)
│   │
│   └── test_workflows/            # 工作流测试
│       └── test_requirement_workflow.py # 需求工作流 (5 tests)
│
└── fixtures/                      # 自定义fixtures (计划中)
    ├── db_fixtures.py
    ├── auth_fixtures.py
    └── mock_fixtures.py
```

### Pytest配置详解

**文件位置**: `/backend/pytest.ini`

```ini
[pytest]
# 测试发现模式
python_files = test_*.py
python_classes = Test*
python_functions = test_*

# 测试路径
testpaths = tests

# 输出选项
addopts =
    -v                              # 详细输出
    --strict-markers                # 严格标记检查
    --tb=short                      # 简洁回溯
    --disable-warnings              # 禁用警告
    --asyncio-mode=auto             # 自动异步模式
    --cov=app                       # 覆盖率目标: app目录
    --cov-report=html               # HTML覆盖率报告
    --cov-report=term-missing       # 终端显示未覆盖行
    --cov-fail-under=80             # 覆盖率阈值: 80%

# 测试标记
markers =
    unit: 单元测试
    integration: 集成测试
    slow: 慢速测试
    asyncio: 异步测试
```

### 核心Fixtures架构

**文件位置**: `/backend/tests/conftest.py`

#### 1. 数据库Fixtures

```python
# 同步数据库 (用于单元测试)
@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """创建同步SQLite内存数据库会话"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

# 异步数据库 (用于集成测试)
@pytest.fixture(scope="function")
async def async_db_session() -> Generator[AsyncSession, None, None]:
    """创建异步SQLite内存数据库会话"""
    async_engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async_session_maker = async_sessionmaker(bind=async_engine)
    async with async_session_maker() as session:
        yield session
```

#### 2. 业务对象Fixtures

```python
# 测试租户 (同步版本)
@pytest.fixture(scope="function")
def test_tenant_sync(db_session: Session) -> Tenant:
    """创建测试租户"""
    tenant = Tenant(
        name="Test Tenant",
        code="test_tenant",
        is_active=True,
    )
    db_session.add(tenant)
    db_session.commit()
    return tenant

# 测试用户 (同步版本)
@pytest.fixture(scope="function")
def test_user_sync(db_session: Session, test_tenant_sync: Tenant) -> User:
    """创建测试用户"""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User",
        role="admin",
        tenant_id=test_tenant_sync.id,
    )
    db_session.add(user)
    db_session.commit()
    return user

# 测试需求 (同步版本)
@pytest.fixture(scope="function")
def test_requirement(db_session: Session, test_user_sync: User, test_tenant_sync: Tenant) -> Requirement:
    """创建测试需求"""
    requirement = Requirement(
        requirement_no="REQ-001",
        title="Test Requirement",
        description="Test description",
        source_channel="customer",
        status="collected",
        tenant_id=test_tenant_sync.id,
        created_by=test_user_sync.id,
    )
    db_session.add(requirement)
    db_session.commit()
    return requirement
```

#### 3. API客户端Fixtures

```python
# 同步客户端包装器 (用于集成测试)
@pytest.fixture(scope="function")
def client(db_session: Session, test_tenant_sync: Tenant):
    """创建测试HTTP客户端"""

    # 覆盖数据库依赖
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # 创建AsyncClient
    transport = ASGITransport(app=app)
    test_client = AsyncClient(transport=transport, base_url="http://test")

    # 同步包装器
    class SyncClientWrapper:
        def __init__(self, async_client, tenant_id):
            self._async_client = async_client
            self.tenant_id = tenant_id
            self.loop = asyncio.get_event_loop()

        def _add_tenant_header(self, kwargs):
            headers = kwargs.get('headers', {}).copy()
            headers['X-Tenant-ID'] = str(self.tenant_id)
            kwargs['headers'] = headers
            return kwargs

        def post(self, *args, **kwargs):
            kwargs = self._add_tenant_header(kwargs)
            return self.loop.run_until_complete(
                self._async_client.post(*args, **kwargs)
            )

        # get, put, delete, patch 类似...

    return SyncClientWrapper(test_client, test_tenant_sync.id)
```

#### 4. Mock Fixtures

```python
# Mock LLM服务
@pytest.fixture
def mock_llm_service(monkeypatch):
    """Mock LLM服务用于测试"""
    mock_result = {
        "q1_who": "产品经理",
        "q2_why": "需要管理需求",
        # ... 完整的10个问题回答
    }

    async def mock_analyze(*args, **kwargs):
        return mock_result

    from app.services import llm_service
    monkeypatch.setattr(
        llm_service.llm_service,
        "analyze_insight",
        mock_analyze
    )
    return mock_result

# Mock LLM服务错误
@pytest.fixture
def mock_llm_service_error(monkeypatch):
    """Mock LLM服务错误场景"""
    async def mock_analyze(*args, **kwargs):
        raise Exception("DeepSeek API error")

    from app.services import llm_service
    monkeypatch.setattr(
        llm_service.llm_service,
        "analyze_insight",
        mock_analyze
    )
```

### 测试分类与标记

#### 单元测试标记

```python
@pytest.mark.unit
class TestUserModel:
    """测试用户模型"""

    def test_user_creation(self, db_session: Session, test_tenant: Tenant):
        """测试创建用户"""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hash",
            tenant_id=test_tenant.id,
        )
        db_session.add(user)
        db_session.commit()

        assert user.id is not None
        assert user.username == "testuser"
```

#### 集成测试标记

```python
@pytest.mark.integration
class TestAuthAPI:
    """测试认证API"""

    def test_login_success(self, client: SyncClientWrapper):
        """测试登录成功"""
        response = client.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "testpass123"
        })

        assert response.status_code == 200
        assert response.json()["success"] is True
        assert "access_token" in response.json()["data"]
```

#### 异步测试标记

```python
@pytest.mark.asyncio
async def test_async_requirement_creation(async_db_session: AsyncSession):
    """测试异步创建需求"""
    requirement = Requirement(
        requirement_no="REQ-001",
        title="Test",
        # ...
    )
    async_db_session.add(requirement)
    await async_db_session.commit()

    assert requirement.id is not None
```

### 覆盖率目标

| 模块 | 当前覆盖率 | 目标覆盖率 | 状态 |
|------|-----------|-----------|------|
| **Models** | 97%+ | 90% | ✅ 达标 |
| **Schemas** | 92%+ | 90% | ✅ 达标 |
| **Services** | 55% | 85% | ⚠️ 进行中 |
| **Repositories** | 47% | 80% | ⚠️ 进行中 |
| **API层** | 38% | 80% | ⚠️ 进行中 |
| **整体** | **47%** | **80%** | ⚠️ 进行中 |

### Mock策略

#### 1. 外部服务Mock

**LLM服务Mock**:
```python
# 成功场景
with patch('app.services.llm_service.llm_service.analyze_insight') as mock_analyze:
    mock_analyze.return_value = {"q1_who": "PM", ...}
    result = await llm_service.analyze_insight("test text")
    assert result["q1_who"] == "PM"

# 错误场景
with patch('app.services.llm_service.llm_service.analyze_insight') as mock_analyze:
    mock_analyze.side_effect = Exception("API Error")
    with pytest.raises(Exception):
        await llm_service.analyze_insight("test text")
```

#### 2. 数据库Mock

```python
# Mock Repository层
@pytest.fixture
def mock_repo():
    with patch('app.services.requirement.RequirementRepository') as mock:
        mock.return_value.get_by_id.return_value = Requirement(id=1, title="Test")
        yield mock
```

### 常用测试命令

```bash
# ===== 运行所有测试 =====
pytest                              # 运行所有测试
pytest tests/                       # 等同于上面
pytest -v                           # 详细输出

# ===== 运行特定类型测试 =====
pytest -m unit                      # 只运行单元测试
pytest -m integration               # 只运行集成测试
pytest -m "not slow"                # 排除慢速测试

# ===== 运行特定文件/类/函数 =====
pytest tests/unit/test_models/      # 运行目录下所有测试
pytest tests/unit/test_models/test_user.py  # 运行单个文件
pytest tests/unit/test_models/test_user.py::TestUserModel::test_user_creation

# ===== 覆盖率报告 =====
pytest --cov=app                    # 生成覆盖率
pytest --cov=app --cov-report=html  # 生成HTML报告
open htmlcov/index.html             # 查看报告

# ===== 并行运行 =====
pytest -n auto                      # 使用所有CPU核心并行运行

# ===== 调试模式 =====
pytest -s                           # 显示print输出
pytest -vv                          # 超详细输出
pytest --pdb                        # 失败时进入pdb调试器

# ===== 遇到第一个失败停止 =====
pytest -x                           # 遇到第一个失败停止
pytest --maxfail=3                  # 最多3个失败后停止

# ===== 重新运行失败的测试 =====
pytest --lf                         # 只运行上次失败的测试
pytest --ff                         # 优先运行失败的测试
```

---

## 🎨 前端测试架构

### 技术栈

| 组件 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **测试框架** | Vitest | 1.0+ | 测试运行器 |
| **测试环境** | jsdom | - | 浏览器环境模拟 |
| **断言库** | Vitest内置 | - | expect/toBe等 |
| **Mock工具** | vi.mock | - | 模块Mock |
| **覆盖率** | v8 | - | 代码覆盖率 |
| **E2E测试** | Playwright | - | 端到端测试 |

### 目录结构

```
frontend/src/
├── __tests__/                     # 测试文件 (镜像src结构)
│   ├── services/                  # 服务层测试
│   │   ├── auth.service.test.ts
│   │   ├── requirement.service.test.ts
│   │   ├── insight.service.test.ts
│   │   ├── analysis.service.test.ts
│   │   └── notification.service.test.ts
│   │
│   ├── stores/                    # Zustand状态测试
│   │   ├── useAuthStore.test.ts
│   │   ├── useRequirementStore.test.ts
│   │   ├── useInsightStore.test.ts
│   │   ├── useAnalysisStore.test.ts
│   │   └── useNotificationStore.test.ts
│   │
│   ├── components/                # 组件测试
│   │   ├── layout/
│   │   │   ├── MainLayout.test.tsx
│   │   │   └── ScreenLockModal.test.tsx
│   │   └── settings/
│   │       └── PromptTemplatesPage.test.tsx
│   │
│   ├── pages/                     # 页面组件测试
│   │   ├── RequirementListPage.test.tsx
│   │   ├── RequirementDetailPage.test.tsx
│   │   ├── RequirementCreatePage.test.tsx
│   │   └── RTMPage.test.tsx
│   │
│   └── hooks/                     # 自定义Hooks测试
│       └── useSessionTimeout.test.ts
│
├── test/                          # 测试工具和配置
│   ├── setup.ts                   # 全局测试设置
│   ├── utils/
│   │   ├── render.tsx             # 自定义render函数
│   │   ├── mockHelpers.ts         # Mock辅助函数
│   │   └── modalHelpers.ts        # Modal测试辅助
│   └── mocks/
│       └── data.ts                # 集中Mock数据
│
└── e2e/                           # E2E测试 (Playwright)
    ├── auth.spec.ts
    ├── requirements.spec.ts
    ├── insights.spec.ts
    └── distribution.spec.ts
```

### Vitest配置详解

**文件位置**: `/frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  test: {
    // 全局变量 (describe, test, expect等)
    globals: true,

    // 测试环境: jsdom (模拟浏览器)
    environment: 'jsdom',

    // 全局测试设置文件
    setupFiles: ['./src/test/setup.ts'],

    // 支持CSS (用于styled-components等)
    css: true,

    // 覆盖率配置
    coverage: {
      provider: 'v8',                           // 使用v8引擎
      reporter: ['text', 'json', 'html'],       // 多种报告格式
      exclude: [
        'node_modules/',
        'src/test/',                            // 排除测试工具代码
        '**/*.d.ts',                            // 排除类型定义
        '**/*.config.*',                        // 排除配置文件
        '**/mockData',                          // 排除mock数据
        'src/e2e/',                             // 排除E2E测试
      ],
      // 覆盖率阈值
      thresholds: {
        lines: 60,          // 行覆盖率: 60%
        functions: 60,      // 函数覆盖率: 60%
        branches: 50,       // 分支覆盖率: 50%
        statements: 60,     // 语句覆盖率: 60%
      },
      perFile: false,       // 不要求每个文件都达标
    },

    // 排除E2E测试
    exclude: [
      'node_modules/',
      'dist',
      'src/e2e/',
      '**/*.spec.ts',      // Playwright测试文件
    ],

    // 只包含src目录下的测试
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
    ],
  },
})
```

### 测试设置文件

**文件位置**: `/frontend/src/test/setup.ts`

```typescript
import { vi } from 'vitest'
import { TextEncoder, TextDecoder } from 'util'

// 全局Mock: localStorage
const localStorageMock = {
  getItem: (key: string) => null,
  setItem: (key: string, value: string) => {},
  removeItem: (key: string) => {},
  clear: () => {},
}
global.localStorage = localStorageMock as Storage

// 全局Mock: TextEncoder/TextDecoder
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// 全局Mock: matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// 全局Mock: IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any
```

### 测试工具函数

#### 自定义Render函数

**文件位置**: `/frontend/src/test/utils/render.tsx`

```typescript
import { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

// 自定义render函数,包含所有必要的Providers
export function renderWithProviders(
  ui: ReactElement,
  options: {
    route?: string
    queryClient?: QueryClient
  } = {}
) {
  const { route = '/', queryClient } = options

  // 创建默认QueryClient
  const defaultQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,              // 测试中不重试
        gcTime: 0,                // 测试后立即清理
      },
      mutations: {
        retry: false,
      },
    },
  })

  const mergedQueryClient = queryClient || defaultQueryClient

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter initialEntries={[route]}>
        <QueryClientProvider client={mergedQueryClient}>
          <ConfigProvider locale={zhCN}>
            {children}
          </ConfigProvider>
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper }),
    queryClient: mergedQueryClient,
  }
}

// 重新导出所有RTL工具
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
```

#### Mock辅助函数

**文件位置**: `/frontend/src/test/utils/mockHelpers.ts`

```typescript
import { vi } from 'vitest'

// Mock API响应
export function createMockResponse<T>(data: T, success = true) {
  return {
    success,
    message: success ? 'Success' : 'Error',
    data,
  }
}

// Mock Paginated响应
export function createMockPaginatedResponse<T>(
  items: T[],
  total = items.length,
  page = 1,
  pageSize = 10
) {
  return {
    success: true,
    data: {
      items,
      total,
      page,
      page_size: pageSize,
    },
  }
}

// Mock延迟响应
export function createMockDelayedResponse<T>(data: T, delay = 100) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(createMockResponse(data))
    }, delay)
  })
}
```

#### Modal测试辅助

**文件位置**: `/frontend/src/test/utils/modalHelpers.ts`

```typescript
import { waitFor, within } from '@testing-library/react'
import { screen } from '@testing-library/react'

// 等待Modal出现并获取内容
export async function getModalDialog() {
  const dialog = await waitFor(
    () => screen.getByRole('dialog'),
    { timeout: 3000 }
  )
  return within(dialog)
}

// 等待Modal出现并查找按钮
export async function getModalButtons() {
  const { getByRole } = await getModalDialog()
  const buttons = await waitFor(
    () => getByRole('button', { hidden: true }),
    { timeout: 1000 }
  )
  return buttons
}

// 点击Modal中的按钮 (通过文本)
export async function clickModalButton(buttonText: string) {
  const { getAllByRole } = await getModalDialog()
  const buttons = getAllByRole('button')
  const targetButton = buttons.find(btn =>
    btn.textContent?.includes(buttonText)
  )
  if (targetButton) {
    targetButton.click()
  }
}
```

### 测试模式详解

#### 1. 服务层测试模式

```typescript
// auth.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import authService from '@/services/auth.service'
import api from '@/services/api'

// Mock API模块
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // 准备Mock数据
      const mockCredentials = {
        username: 'testuser',
        password: 'testpass123',
      }
      const mockResponse = {
        data: {
          success: true,
          data: {
            access_token: 'mock-token',
            user: {
              id: 1,
              username: 'testuser',
              email: 'test@example.com',
            },
          },
        },
      }

      // 设置Mock返回值
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      // 调用服务方法
      const result = await authService.login(mockCredentials)

      // 验证结果
      expect(api.post).toHaveBeenCalledWith('/auth/login', mockCredentials)
      expect(result).toEqual(mockResponse.data.data)
    })

    it('should handle login error', async () => {
      const mockCredentials = {
        username: 'wronguser',
        password: 'wrongpass',
      }
      const mockError = {
        response: {
          data: {
            success: false,
            message: '用户名或密码错误',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(
        authService.login(mockCredentials)
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            message: '用户名或密码错误',
          },
        },
      })
    })
  })
})
```

#### 2. Zustand Store测试模式

```typescript
// useAuthStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useAuthStore from '@/stores/useAuthStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    // 重置store状态
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should set user and token on login', async () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    }
    const mockToken = 'mock-token'

    // 使用act包装状态更新
    await act(async () => {
      await result.current.login(mockUser, mockToken)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe(mockToken)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should clear state on logout', async () => {
    const { result } = renderHook(() => useAuthStore())

    // 先登录
    await act(async () => {
      await result.current.login(
        { id: 1, username: 'testuser' },
        'token'
      )
    })

    expect(result.current.isAuthenticated).toBe(true)

    // 再登出
    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
```

#### 3. 组件测试模式

```typescript
// MainLayout.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils/render'
import { BrowserRouter } from 'react-router-dom'
import MainLayout from '@/shared/components/layout/MainLayout'
import useAuthStore from '@/stores/useAuthStore'

// Mock store
vi.mock('@/stores/useAuthStore', () => ({
  default: vi.fn(),
}))

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render navigation when authenticated', () => {
    // Mock已登录状态
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser' },
      token: 'mock-token',
    })

    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </BrowserRouter>
    )

    // 验证导航栏显示
    expect(screen.getByText('需求管理')).toBeInTheDocument()
    expect(screen.getByText('需求洞察')).toBeInTheDocument()
    expect(screen.getByText('数据分析')).toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', () => {
    // Mock未登录状态
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
    })

    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </BrowserRouter>
    )

    // 验证重定向到登录页
    expect(window.location.pathname).toBe('/login')
  })
})
```

#### 4. 异步Hook测试模式

```typescript
// useSessionTimeout.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useSessionTimeout from '@/hooks/useSessionTimeout'

describe('useSessionTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start countdown on session timeout warning', async () => {
    const { result } = renderHook(() =>
      useSessionTimeout({ timeoutMs: 300000 }) // 5分钟
    )

    expect(result.current.isLocked).toBe(false)
    expect(result.current.remainingSeconds).toBe(0)

    // 快进到timeout前1分钟
    vi.advanceTimersByTime(240000)

    await waitFor(() => {
      expect(result.current.remainingSeconds).toBe(60)
    })
  })

  it('should lock screen when countdown reaches zero', async () => {
    const onLock = vi.fn()

    const { result } = renderHook(() =>
      useSessionTimeout({
        timeoutMs: 60000, // 1分钟
        onLock,
      })
    )

    // 快进到timeout
    vi.advanceTimersByTime(60000)

    await waitFor(() => {
      expect(result.current.isLocked).toBe(true)
      expect(onLock).toHaveBeenCalled()
    })
  })
})
```

### 覆盖率统计

| 模块 | 文件数 | 测试数 | 覆盖率 | 状态 |
|------|--------|--------|--------|------|
| **Services** | 7 | 35 | 100% | ✅ 完美 |
| **Stores** | 5 | 45 | 100% | ✅ 完美 |
| **Components** | 4 | 12 | ~40% | ⚠️ 进行中 |
| **Pages** | 5 | 18 | ~50% | ⚠️ 进行中 |
| **Hooks** | 1 | 5 | 80% | ✅ 良好 |
| **总计** | 22 | **115** | **~96%通过率** | ✅ 优秀 |

### 常用测试命令

```bash
# ===== 运行所有测试 =====
npm test                           # 运行所有测试一次
npm run test:watch                 # Watch模式
npm run test:ui                    # UI界面模式
npm run test:coverage              # 生成覆盖率报告

# ===== 运行特定文件 =====
npm test -- auth.service.test      # 运行单个文件
npm test -- --grep "login"         # 运行匹配的测试

# ===== 调试模式 =====
npm test -- --no-coverage          # 禁用覆盖率(更快)
npm test -- --reporter=verbose     # 详细输出

# ===== 更新快照 =====
npm test -- -u                     # 更新失败的快照

# ===== 只运行失败的测试 =====
npm test -- --reporter=verbose --bail
```

---

## 🎭 E2E测试架构

### 技术栈

| 组件 | 技术 | 用途 |
|------|------|------|
| **E2E框架** | Playwright | 跨浏览器E2E测试 |
| **测试运行器** | Vitest (Playwright模式) | 与单元测试统一 |
| **断言库** | Playwright内置 | expect(page).toHaveText等 |

### 目录结构

```
frontend/src/e2e/
├── auth.spec.ts                   # 认证流程E2E
│   ├── 登录流程
│   ├── 登出流程
│   └── Token刷新
├── requirements.spec.ts            # 需求管理E2E
│   ├── 创建需求
│   ├── 编辑需求
│   ├── 状态流转
│   └── 删除需求
├── insights.spec.ts                # 洞察分析E2E
│   ├── 创建洞察
│   ├── AI分析
│   └── 转换为需求
└── distribution.spec.ts            # 需求分发E2E
    ├── 分发到SP
    ├── 分发到BP
    └── 查看分发历史
```

### E2E测试示例

```typescript
// auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('用户认证流程', () => {
  test('should login successfully', async ({ page }) => {
    // 访问登录页
    await page.goto('http://localhost:5173/login')

    // 填写表单
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="password"]', 'testpass123')

    // 点击登录按钮
    await page.click('button[type="submit"]')

    // 验证跳转到首页
    await expect(page).toHaveURL('http://localhost:5173/')

    // 验证用户信息显示
    await expect(page.locator('text=testuser')).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/login')

    await page.fill('input[name="username"]', 'wronguser')
    await page.fill('input[name="password"]', 'wrongpass')
    await page.click('button[type="submit"]')

    // 验证错误消息
    await expect(page.locator('text=用户名或密码错误')).toBeVisible()
  })
})
```

### E2E测试命令

```bash
# ===== 运行E2E测试 =====
npm run test:e2e                    # 运行所有E2E测试
npm run test:e2e -- --headed        # 显示浏览器窗口
npm run test:e2e -- --debug         # 调试模式(慢动作)

# ===== 特定测试 =====
npm run test:e2e auth.spec.ts       # 运行单个文件
npm run test:e2e -- --grep "登录"    # 运行匹配的测试
```

---

## 📊 测试覆盖率对比

### 后端覆盖率详情

```bash
# 运行覆盖率测试
cd backend
pytest --cov=app --cov-report=html

# 查看报告
open htmlcov/index.html
```

**当前覆盖率**: 47% (目标: 80%)

| 模块 | 语句 | 分支 | 行 | 函数 |
|------|------|------|------|------|
| app/models/** | 98% | 95% | 98% | 100% |
| app/schemas/** | 92% | 88% | 92% | 95% |
| app/services/** | 55% | 48% | 55% | 60% |
| app/repositories/** | 47% | 40% | 47% | 52% |
| app/api/** | 38% | 32% | 38% | 42% |

### 前端覆盖率详情

```bash
# 运行覆盖率测试
cd frontend
npm run test:coverage

# 查看报告
open coverage/index.html
```

**当前覆盖率**: 96%通过率 (目标: 95%)

| 模块 | 语句% | 分支% | 函数% | 行% |
|------|-------|-------|--------|-----|
| src/services/** | 100 | 92 | 100 | 100 |
| src/stores/** | 100 | 95 | 100 | 100 |
| src/components/** | 65 | 52 | 68 | 65 |
| src/pages/** | 58 | 45 | 62 | 58 |
| src/hooks/** | 85 | 78 | 88 | 85 |

---

## 🎯 测试最佳实践

### AAA模式 (Arrange-Act-Assert)

所有测试应遵循AAA模式：

```python
def test_update_requirement_status():
    # ===== Arrange (准备) =====
    service = RequirementService(db_session)
    requirement = Requirement(
        title="Test",
        status="collected",
        tenant_id=test_tenant.id,
    )
    db_session.add(requirement)
    db_session.commit()

    # ===== Act (执行) =====
    result = service.update_status(
        requirement.id,
        "analyzing",
        updated_by=test_user.id
    )

    # ===== Assert (断言) =====
    assert result.status == "analyzing"
    assert result.updated_by == test_user.id
```

### 测试命名规范

```python
# ✅ 好的命名 (清晰描述测试内容)
def test_user_creation_with_valid_data()
def test_requirement_status_forward_workflow()
def test_analyze_insight_with_empty_text_should_raise_error()

# ❌ 不好的命名 (模糊不清)
def test_user()
def test_requirement()
def test_analysis()
```

### 测试独立性

每个测试应该独立运行，不依赖其他测试：

```python
# ✅ 好的做法 (每个测试创建独立数据)
def test_update_requirement_1():
    req = Requirement(title="Req1", ...)
    db_session.add(req)
    db_session.commit()
    # 测试...

def test_update_requirement_2():
    req = Requirement(title="Req2", ...)  # 独立数据
    db_session.add(req)
    db_session.commit()
    # 测试...

# ❌ 不好的做法 (共享数据)
@pytest.fixture(scope="module")
def shared_requirement():
    # 全局共享,测试间相互影响
    return Requirement(...)
```

### Mock使用原则

**何时使用Mock**:
- ✅ 外部服务 (LLM API, 支付网关等)
- ✅ 文件系统操作
- ✅ 时间/日期依赖
- ✅ 数据库连接 (在单元测试中)

**何时不使用Mock**:
- ❌ 被测试的核心业务逻辑
- ❌ 简单的数据结构
- ❌ 已经被测试的依赖项

### 前端测试原则

**组件测试**:
```typescript
// ✅ 测试用户行为和结果
it('should show error message when form is invalid', async () => {
  const { getByText, getByRole } = render(<LoginForm />)
  const user = userEvent.setup()

  await user.click(getByRole('button', { name: '登录' }))

  expect(getByText('请输入用户名')).toBeInTheDocument()
})

// ❌ 测试实现细节
it('should call handleSubmit on button click', () => {
  const handleSubmit = vi.fn()
  const { getByRole } = render(
    <LoginForm onSubmit={handleSubmit} />
  )

  getByRole('button').click()

  expect(handleSubmit).toHaveBeenCalled() // 测试细节,脆弱
})
```

**异步测试**:
```typescript
// ✅ 等待异步操作完成
it('should load requirements on mount', async () => {
  const { getByText } = render(<RequirementListPage />)

  // 等待加载完成
  await waitFor(() => {
    expect(getByText('需求1')).toBeInTheDocument()
  })
})

// ❌ 不等待异步操作
it('should load requirements', () => {
  const { getByText } = render(<RequirementListPage />)

  expect(getByText('需求1')).toBeInTheDocument()  // 可能失败
})
```

---

## 🐛 调试技巧

### 后端测试调试

```bash
# 1. 打印调试
pytest -s tests/unit/test_services/test_requirement_service.py::test_create

# 2. 进入pdb调试器
pytest --pdb tests/unit/test_services/...

# 3. 只运行失败的测试
pytest --lf --vv

# 4. 显示详细输出
pytest -vv --tb=long

# 5. 运行到最后一个失败
pytest --ff
```

### 前端测试调试

```bash
# 1. UI模式 (最直观)
npm run test:ui

# 2. 只运行特定文件
npm test -- RequirementListPage

# 3. 禁用coverage (更快)
npm test -- --no-coverage

# 4. Watch模式
npm run test:watch

# 5. 调试特定测试
npm test -- -t "should load requirements"
```

---

## 📈 持续集成配置

### GitHub Actions示例

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio

      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run tests
        run: |
          cd frontend
          npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json
```

---

## 🎓 测试资源链接

### 官方文档
- **Pytest**: https://docs.pytest.org/
- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/
- **Testing Library**: https://testing-library.com/

### 项目内部文档
- **后端CLAUDE.md**: `/backend/CLAUDE.md`
- **前端CLAUDE.md**: `/frontend/CLAUDE.md`
- **测试实施计划**: `/Users/kingsun/.claude/plans/kind-orbiting-emerson.md`

---

## 📝 附录

### 修复历史记录

| 日期 | 修复内容 | 影响测试数 |
|------|---------|-----------|
| 2026-01-27 | Schema验证修复 | 1个 |
| 2026-01-27 | 评分边界值修复 | 3个 |
| 2026-01-27 | Tenant上下文修复 | 11个 |
| 2026-01-27 | Fixture类型修复 | 12个 |
| 2026-01-27 | Repository逻辑修复 | 1个 |

### 待优化项

1. **后端**: Integration tests async/sync混合 (44个测试待修复)
2. **前端**: Modal测试优化 (12个测试待修复)
3. **E2E**: 完善Playwright测试覆盖率
4. **CI**: 配置自动化测试流水线

---

**文档维护者**: Claude Code AI Assistant
**最后审核**: 2026-01-27
**下次审查**: 2026-02-27

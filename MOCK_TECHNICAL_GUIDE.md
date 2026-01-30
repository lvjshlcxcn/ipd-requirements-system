# Mock功能技术路线指南

## 📋 文档概述

本文档详细说明IPD需求管理系统中Mock功能的技术路线、实施策略和最佳实践。

**核心问题**: 如何在测试中隔离外部依赖，确保测试的稳定性、速度和可重复性？

**适用范围**:
- 后端单元测试 (Python + Pytest)
- 前端组件测试 (TypeScript + Vitest)
- 集成测试中的外部服务Mock

---

## 🎯 为什么需要Mock？

### Mock解决的问题

| 问题 | 不使用Mock | 使用Mock |
|------|-----------|---------|
| **测试速度** | 调用真实API (秒级) | 瞬间返回 (毫秒级) |
| **测试稳定性** | 依赖外部服务 (不稳定) | 完全隔离 (100%稳定) |
| **测试成本** | 每次调用产生费用 | 零成本 |
| **边界条件** | 难以触发错误场景 | 轻松模拟各种场景 |
| **并发问题** | 多个测试相互影响 | 每个测试独立 |

### 应该Mock的场景

✅ **应该Mock**:
- 外部API调用 (LLM服务、支付网关、短信服务等)
- 文件系统操作 (读写文件)
- 数据库操作 (在单元测试中)
- 时间/日期依赖
- 随机数生成
- 第三方库 (不在测试范围内的)

❌ **不应该Mock**:
- 被测试的核心业务逻辑
- 简单的数据结构 (POJO)
- 已经被其他测试覆盖的依赖

---

## 🔧 后端Mock技术路线 (Python)

### 技术栈对比

| 工具 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **unittest.mock** | 标准库，功能强大 | 语法较复杂 | 复杂Mock场景 |
| **pytest-mock** | 简洁API，与pytest集成 | 功能略少 | 大多数测试场景 |
| **monkeypatch** | 直接替换对象 | 不够优雅 | Fixture级别替换 |
| **responses** | 专门Mock HTTP请求 | 仅限HTTP | API测试 |

### 技术路线选择

```
                    ┌─────────────────┐
                    │   测试场景？     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌─────▼─────┐       ┌────▼────┐
    │ 单元测试  │        │ 集成测试   │       │ E2E测试  │
    └────┬────┘        └─────┬─────┘       └────┬────┘
         │                   │                   │
    使用pytest-mock      使用responses       不使用Mock
    (隔离外部依赖)       (Mock HTTP请求)    (真实环境)
```

### 1. pytest-mock (推荐)

#### 基础用法

```python
import pytest
from unittest.mock import MagicMock
from app.services.llm_service import LLMService

class TestLLMService:
    """测试LLM服务"""

    def test_analyze_insight_success(self, mocker):
        """测试成功分析洞察"""
        # ===== Arrange (准备) =====
        service = LLMService()
        text_to_analyze = "这是一个客户访谈内容"

        # Mock外部API调用
        mock_response = {
            "q1_who": "产品经理",
            "q2_why": "需要管理需求",
            "q3_what_problem": "Excel管理混乱",
            # ... 更多字段
        }

        # 使用mocker.patch Mock外部方法
        mocker.patch(
            'app.services.llm_service.openai.chat.completions.create',
            return_value=mock_response
        )

        # ===== Act (执行) =====
        result = service.analyze_insight(text_to_analyze)

        # ===== Assert (断言) =====
        assert result["q1_who"] == "产品经理"
        assert result["q3_what_problem"] == "Excel管理混乱"

    def test_analyze_insight_api_error(self, mocker):
        """测试API错误处理"""
        service = LLMService()

        # Mock API抛出异常
        mocker.patch(
            'app.services.llm_service.openai.chat.completions.create',
            side_effect=Exception("API Error: Rate limit exceeded")
        )

        # 断言会抛出异常
        with pytest.raises(Exception, match="Rate limit exceeded"):
            service.analyze_insight("test text")
```

#### Mock返回值序列

```python
def test_retry_logic(self, mocker):
    """测试重试逻辑"""
    service = LLMService()

    # 前两次失败，第三次成功
    mock_create = mocker.patch(
        'app.services.llm_service.openai.chat.completions.create'
    )

    mock_create.side_effect = [
        Exception("Timeout"),
        Exception("Timeout"),
        {"q1_who": "PM"}  # 第三次成功
    ]

    result = service.analyze_insight_with_retry("test")

    assert mock_create.call_count == 3
    assert result["q1_who"] == "PM"
```

#### 验证调用次数和参数

```python
def test_verify_call_count(self, mocker):
    """验证方法调用次数"""
    service = LLMService()

    mock_create = mocker.patch(
        'app.services.llm_service.openai.chat.completions.create'
    )
    mock_create.return_value = {"q1_who": "PM"}

    # 调用3次
    for _ in range(3):
        service.analyze_insight("test")

    # 验证调用次数
    assert mock_create.call_count == 3

    # 验证最后一次调用的参数
    last_call_args = mock_create.call_args
    assert last_call_args[1]["messages"][0]["content"] == "test"
```

### 2. monkeypatch (Fixture级别)

#### 替换全局配置

```python
@pytest.fixture
def mock_settings(monkeypatch):
    """Mock配置对象"""
    from app.config import get_settings

    # 使用monkeypatch替换配置值
    monkeypatch.setattr(get_settings, "OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(get_settings, "OPENAI_MODEL", "gpt-4-test")

    return get_settings()

def test_with_mock_settings(mock_settings):
    """使用Mock配置的测试"""
    assert mock_settings.OPENAI_API_KEY == "test-key"
    assert mock_settings.OPENAI_MODEL == "gpt-4-test"
```

#### 替换环境变量

```python
def test_with_mock_env(monkeypatch, tmp_path):
    """Mock环境变量和文件系统"""
    # 设置临时环境变量
    monkeypatch.setenv("DATABASE_URL", "sqlite:///test.db")

    # 创建临时文件
    test_file = tmp_path / "test.txt"
    test_file.write_text("test content")

    # 测试代码使用环境变量和文件
    assert os.getenv("DATABASE_URL") == "sqlite:///test.db"
    assert test_file.read_text() == "test content"
```

### 3. responses (HTTP请求Mock)

#### Mock外部API

```python
import pytest
import responses
from app.services.external_api import ExternalAPIService

class TestExternalAPI:
    """测试外部API调用"""

    @responses.activate
    def test_fetch_user_data(self):
        """测试获取用户数据"""
        # Mock HTTP响应
        responses.add(
            method=responses.GET,
            url='https://api.external.com/users/123',
            json={
                "id": 123,
                "name": "Test User",
                "email": "test@example.com"
            },
            status=200
        )

        # 调用服务
        service = ExternalAPIService()
        result = service.fetch_user(123)

        # 验证结果
        assert result["name"] == "Test User"

    @responses.activate
    def test_fetch_user_not_found(self):
        """测试用户不存在"""
        responses.add(
            method=responses.GET,
            url='https://api.external.com/users/999',
            json={"error": "User not found"},
            status=404
        )

        service = ExternalAPIService()

        with pytest.raises(Exception, match="User not found"):
            service.fetch_user(999)
```

### 4. Auto-spec (自动规范)

```python
def test_auto_spec(mocker):
    """使用auto-spec确保Mock接口正确"""
    from app.models.user import User

    # 创建符合User接口的Mock对象
    mock_user = mocker.create_autospec(User)
    mock_user.username = "testuser"
    mock_user.email = "test@example.com"

    # ✅ 正确: 访问存在的属性
    assert mock_user.username == "testuser"

    # ❌ 错误: 访问不存在的属性会抛出异常
    # mock_user.non_existent_attr  # AttributeError
```

---

## 🎨 前端Mock技术路线 (TypeScript)

### 技术栈对比

| 工具 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **vi.mock()** | Vitest内置，类型安全 | 自动Mock可能过度 | 组件级Mock |
| **手动Mock** | 完全控制，轻量 | 需要手动维护 | 小型项目 |
| **MSW (Mock Service Worker)** | 拦截网络请求 | 配置复杂 | API集成测试 |
| **Nock** | HTTP请求Mock | 不支持fetch | 旧项目 |

### 技术路线选择

```
                    ┌─────────────────┐
                    │   测试层级？     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌─────▼─────┐       ┌────▼────┐
    │ 组件测试  │        │ 集成测试   │       │ E2E测试  │
    └────┬────┘        └─────┬─────┘       └────┬────┘
         │                   │                   │
    使用vi.mock()       使用MSW           使用真实后端
    (Mock服务层)       (Mock网络请求)    (或Playwright mock)
```

### 1. vi.mock() (推荐)

#### Mock整个服务模块

```typescript
// auth.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import authService from '@/services/auth.service'
import api from '@/services/api'

// ===== 方式1: Mock整个API模块 =====
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should login successfully', async () => {
    // ===== 准备Mock数据 =====
    const mockCredentials = {
      username: 'testuser',
      password: 'testpass123',
    }

    const mockResponse = {
      data: {
        success: true,
        data: {
          access_token: 'mock-jwt-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'admin',
          },
        },
      },
    }

    // ===== 设置Mock返回值 =====
    // 使用 vi.mocked() 获取类型安全的Mock对象
    vi.mocked(api.post).mockResolvedValue(mockResponse as any)

    // ===== 执行测试 =====
    const result = await authService.login(mockCredentials)

    // ===== 验证结果 =====
    expect(api.post).toHaveBeenCalledWith(
      '/auth/login',
      mockCredentials
    )
    expect(result).toEqual(mockResponse.data.data)
    expect(result.access_token).toBe('mock-jwt-token')
  })

  it('should handle login error', async () => {
    const mockCredentials = {
      username: 'wronguser',
      password: 'wrongpass',
    }

    // Mock错误响应
    const mockError = {
      response: {
        data: {
          success: false,
          message: '用户名或密码错误',
        },
      },
    }

    vi.mocked(api.post).mockRejectedValue(mockError)

    // 验证抛出异常
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
```

#### Mock部分方法

```typescript
// requirement.service.test.ts
import requirementService from '@/services/requirement.service'
import api from '@/services/api'

// 只Mock get方法，其他方法保持真实
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),  // 真实实现
    delete: vi.fn(),  // 真实实现
  },
}))

describe('requirementService (部分Mock)', () => {
  it('should use real implementation for update', async () => {
    // post和get是Mock的
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } })
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        data: { id: 1, title: 'Updated' }
      }
    })

    // put和delete使用真实实现
    // 这会调用真实的API (如果需要测试真实行为)
  })
})
```

### 2. 工厂函数Mock (Factory Pattern)

#### 创建Mock数据工厂

```typescript
// src/test/mocks/data.ts
import { Requirement, User, Insight } from '@/types'

// ===== 用户Mock数据工厂 =====
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'admin' as const,
    department: 'Engineering',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ===== 需求Mock数据工厂 =====
export function createMockRequirement(overrides: Partial<Requirement> = {}): Requirement {
  return {
    id: 1,
    requirement_no: 'REQ-001',
    title: 'Test Requirement',
    description: 'Test description',
    source_channel: 'customer' as const,
    status: 'collected' as const,
    priority_score: 50,
    created_by: 1,
    tenant_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ===== 批量创建Mock数据 =====
export function createMockRequirements(count: number): Requirement[] {
  return Array.from({ length: count }, (_, i) =>
    createMockRequirement({
      id: i + 1,
      requirement_no: `REQ-${String(i + 1).padStart(3, '0')}`,
      title: `Requirement ${i + 1}`,
    })
  )
}

// ===== 分页响应Mock工厂 =====
export function createMockPaginatedResponse<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10
): ApiResponse<{ items: T[]; total: number; page: number }> {
  return {
    success: true,
    data: {
      items,
      total: items.length,
      page,
      page_size: pageSize,
    },
  }
}
```

#### 使用Mock工厂

```typescript
// requirement.service.test.ts
import { createMockRequirement, createMockRequirements, createMockPaginatedResponse } from '@/test/mocks/data'

describe('requirementService with Mock factories', () => {
  it('should get requirement list', async () => {
    // 使用工厂创建Mock数据
    const mockRequirements = createMockRequirements(10)
    const mockResponse = createMockPaginatedResponse(mockRequirements)

    vi.mocked(api.get).mockResolvedValue({ data: mockResponse })

    const result = await requirementService.getList({ page: 1 })

    expect(result.items).toHaveLength(10)
    expect(result.items[0].title).toBe('Requirement 1')
  })

  it('should create requirement', async () => {
    // 使用工厂创建单个Mock对象
    const newRequirement = createMockRequirement({
      title: 'New Requirement',
      status: 'analyzing',
    })

    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, data: newRequirement }
    })

    const result = await requirementService.create(newRequirement)

    expect(result.title).toBe('New Requirement')
    expect(result.status).toBe('analyzing')
  })
})
```

### 3. MSW (Mock Service Worker)

#### 安装和配置

```bash
npm install -D msw
```

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { createMockRequirement, createMockRequirements } from './data'

// 定义API请求处理器
export const handlers = [
  // GET /api/v1/requirements
  http.get('/api/v1/requirements', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    // 返回Mock数据
    const mockRequirements = createMockRequirements(limit)

    return HttpResponse.json({
      success: true,
      data: {
        items: mockRequirements,
        total: 100,
        page,
        page_size: limit,
      },
    })
  }),

  // POST /api/v1/requirements
  http.post('/api/v1/requirements', async ({ request }) => {
    const body = await request.json()

    // 创建新需求
    const newRequirement = createMockRequirement(body)

    return HttpResponse.json({
      success: true,
      data: newRequirement,
    }, { status: 201 })
  }),

  // GET /api/v1/requirements/:id
  http.get('/api/v1/requirements/:id', ({ params }) => {
    const { id } = params

    // 返回特定需求
    const requirement = createMockRequirement({
      id: parseInt(id as string),
      requirement_no: `REQ-${id}`,
    })

    return HttpResponse.json({
      success: true,
      data: requirement,
    })
  }),
]
```

```typescript
// src/test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// 创建MSW服务器
export const mockServer = setupServer(...handlers)
```

```typescript
// vitest.config.ts
import { beforeAll, afterEach } from 'vitest'
import { mockServer } from './src/test/mocks/server'

beforeAll(() => {
  // 所有测试前启动MSW服务器
  mockServer.listen({
    onUnhandledRequest: 'error',  // 未处理的请求报错
  })
})

afterEach(() => {
  // 每个测试后重置handlers
  mockServer.resetHandlers()
})
```

#### 使用MSW的测试

```typescript
// requirement.integration.test.ts
import { describe, it, expect } from 'vitest'
import requirementService from '@/services/requirement.service'

describe('requirementService (MSW集成测试)', () => {
  it('should fetch requirements from real API call (but mocked by MSW)', async () => {
    // MSW会拦截网络请求并返回Mock数据
    // 测试代码看起来像是在调用真实API
    const result = await requirementService.getList({ page: 1 })

    expect(result.items).toHaveLength(10)
    expect(result.total).toBe(100)
  })

  it('should create requirement', async () => {
    const newReq = {
      title: 'New Requirement',
      description: 'Test',
      source_channel: 'customer',
    }

    const result = await requirementService.create(newReq)

    expect(result.id).toBeDefined()
    expect(result.title).toBe('New Requirement')
  })
})
```

### 4. Spy (间谍模式)

#### 监视函数调用

```typescript
// useAuthStore.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useAuthStore from '@/stores/useAuthStore'

describe('useAuthStore (Spy模式)', () => {
  beforeEach(() => {
    // 重置store
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  })

  it('should call localStorage.setItem on login', async () => {
    // ===== Setup: 监视localStorage =====
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    const { result } = renderHook(() => useAuthStore())

    // ===== Act: 执行登录 =====
    await act(async () => {
      await result.current.login(
        { id: 1, username: 'testuser' },
        'mock-token'
      )
    })

    // ===== Assert: 验证调用 =====
    expect(setItemSpy).toHaveBeenCalledWith(
      'access_token',
      'mock-token'
    )
    expect(setItemSpy).toHaveBeenCalledWith(
      'user',
      JSON.stringify({ id: 1, username: 'testuser' })
    )

    // 清理
    setItemSpy.mockRestore()
  })

  it('should call API with correct parameters', async () => {
    const { result } = renderHook(() => useAuthStore())

    // 监视API调用
    const postSpy = vi.spyOn(api, 'post')
    postSpy.mockResolvedValue({
      data: {
        success: true,
        data: { access_token: 'token', user: { id: 1 } },
      },
    })

    await act(async () => {
      await result.current.login({
        username: 'testuser',
        password: 'testpass123',
      })
    })

    // 验证API调用参数
    expect(postSpy).toHaveBeenCalledWith('/auth/login', {
      username: 'testuser',
      password: 'testpass123',
    })

    postSpy.mockRestore()
  })
})
```

---

## 🔄 Mock最佳实践对比

### 实践1: 服务层Mock

#### ❌ 不好的做法 (过度Mock)

```python
# 过度Mock: 测试没有价值
def test_service_with_over_mocking(mocker):
    service = MyService()

    # Mock了所有依赖,测试变成测试Mock本身
    mock_repo = mocker.patch('app.services.MyService.repo')
    mock_repo.get_by_id.return_value = Requirement(id=1, title="Test")

    mock_another = mocker.patch('app.services.MyService.another_method')
    mock_another.return_value = "result"

    # 调用被测试的方法
    result = service.some_method(1)

    # 这个测试只验证Mock被调用,没有测试实际逻辑
    assert mock_repo.get_by_id.called
    assert mock_another.called
```

#### ✅ 好的做法 (适当Mock)

```python
# 适当Mock: 只Mock外部依赖
def test_service_with_proper_mocking(mocker, db_session):
    service = MyService(db_session)

    # 只Mock外部LLM服务
    mocker.patch(
        'app.services.llm_service.openai.chat.completions.create',
        return_value={"q1_who": "PM"}
    )

    # 真实数据库,真实业务逻辑
    requirement = Requirement(title="Test", status="collected")
    db_session.add(requirement)
    db_session.commit()

    result = service.analyze_requirement(requirement.id)

    # 验证业务逻辑结果
    assert result["q1_who"] == "PM"
    assert requirement.status == "analyzed"  # 验证状态变更
```

### 实践2: 异步Mock

#### Python后端

```python
# ===== 方式1: 使用AsyncMock =====
import pytest
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_async_service(mocker):
    service = MyService()

    # Mock异步方法
    mock_async_method = mocker.patch(
        'app.services.MyService.external_api_call',
        new=AsyncMock(return_value={"status": "success"})
    )

    result = await service.process_async()

    assert result["status"] == "success"

# ===== 方式2: Mock返回协程 =====
async def test_async_service_with_coroutine(mocker):
    service = MyService()

    # Mock返回协程对象
    async def mock_api_call():
        return {"status": "success"}

    mocker.patch(
        'app.services.MyService.external_api_call',
        return_value=mock_api_call()
    )

    result = await service.process_async()

    assert result["status"] == "success"
```

#### TypeScript前端

```typescript
// ===== Mock异步服务 =====
describe('async service tests', () => {
  it('should handle async loading', async () => {
    // Mock异步方法
    vi.mocked(api.get).mockResolvedValue({
      data: { success: true, data: { items: [] } }
    })

    const { result } = renderHook(() => useRequirements())

    // 等待异步操作完成
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toEqual([])
    })
  })

  it('should handle async error', async () => {
    // Mock异步错误
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useRequirements())

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })
  })
})
```

### 实践3: 时间Mock

#### Python时间Mock

```python
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

class TestTimeDependentLogic:
    """测试时间相关逻辑"""

    @pytest.mark.freeze_time("2024-01-01 12:00:00")
    def test_session_timeout_at_fixed_time():
        """使用pytest-freezegun冻结时间"""
        user = User(
            last_activity=datetime(2024, 1, 1, 11, 0, 0)
        )

        # 时间被冻结在12:00
        assert user.is_session_expired(timeout_minutes=30) is True

    def test_time_travel(mocker):
        """使用Mock穿越时间"""
        # Mock当前时间为12:00
        fixed_time = datetime(2024, 1, 1, 12, 0, 0)
        mocker.patch('app.services.datetime.datetime').now.return_value = fixed_time

        user = User(
            last_activity=datetime(2024, 1, 1, 11, 0, 0)
        )

        assert user.is_session_expired(timeout_minutes=30) is True

        # 穿越到11:30 (未过期)
        earlier_time = datetime(2024, 1, 1, 11, 30, 0)
        mocker.patch('app.services.datetime.datetime').now.return_value = earlier_time

        assert user.is_session_expired(timeout_minutes=30) is False
```

#### TypeScript时间Mock

```typescript
// useSessionTimeout.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import useSessionTimeout from '@/hooks/useSessionTimeout'

describe('useSessionTimeout (时间Mock)', () => {
  beforeEach(() => {
    vi.useFakeTimers()  // 使用假定时器
  })

  afterEach(() => {
    vi.useRealTimers()  # 恢复真实定时器
  })

  it('should trigger timeout after configured duration', async () => {
    const onTimeout = vi.fn()

    const { result } = renderHook(() =>
      useSessionTimeout({
        timeoutMs: 60000,  // 1分钟
        onTimeout,
      })
    )

    // 快进30秒 (未超时)
    vi.advanceTimersByTime(30000)
    expect(result.current.isLocked).toBe(false)
    expect(onTimeout).not.toHaveBeenCalled()

    // 再快进31秒 (已超时)
    vi.advanceTimersByTime(31000)

    // 等待定时器回调执行
    await waitFor(() => {
      expect(result.current.isLocked).toBe(true)
      expect(onTimeout).toHaveBeenCalled()
    })
  })
})
```

---

## 🎯 Mock技术路线决策树

```
开始: 需要Mock什么？
│
├─ 外部API调用？
│  ├─ 是 → 后端用responses, 前端用MSW
│  └─ 否 → 继续
│
├─ 数据库操作？
│  ├─ 单元测试 → 使用Mock Repository
│  └─ 集成测试 → 使用真实测试数据库
│
├─ 文件系统？
│  ├─ 是 → 后端用monkeypatch + tmp_path
│  │        前端用vi.spyOn(FileReader)
│  └─ 否 → 继续
│
├─ 时间/日期？
│  ├─ 后端 → pytest-freezegun或mocker.patch
│  └─ 前端 → vi.useFakeTimers() + vi.advanceTimersByTime()
│
├─ 服务层依赖？
│  ├─ 简单场景 → pytest-mock / vi.mock()
│  ├─ 复杂场景 → 手动创建Mock对象
│  └─ 需要类型安全 → mocker.create_autospec() / vi.mocked()
│
└─ 第三方库？
   ├─ 文档齐全 → 按文档Mock
   ├─ 文档缺失 → 使用Auto-spec
   └─ 无法Mock → 考虑重构代码
```

---

## 📊 Mock策略对比表

| 场景 | 后端工具 | 前端工具 | 难度 | 推荐度 |
|------|---------|---------|------|--------|
| **HTTP API** | responses | MSW | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **数据库** | Mock Repository | N/A | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **文件系统** | monkeypatch + tmp_path | vi.spyOn | ⭐⭐ | ⭐⭐⭐ |
| **时间依赖** | pytest-freezegun | vi.useFakeTimers | ⭐ | ⭐⭐⭐⭐⭐ |
| **外部服务** | pytest-mock | vi.mock | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **随机数** | mocker.patch | vi.spyOn | ⭐ | ⭐⭐⭐ |

---

## 🚀 实施建议

### 阶段1: 建立Mock基础设施

```python
# backend/tests/mocks/__init__.py
"""Mock工厂和工具"""

from .factories import (
    create_mock_user,
    create_mock_requirement,
    create_mock_insight,
)
from .llm_mock import MockLLMService

__all__ = [
    'create_mock_user',
    'create_mock_requirement',
    'create_mock_insight',
    'MockLLMService',
]
```

```typescript
// frontend/src/test/mocks/index.ts
/** Mock工厂和工具 */

export * from './data'
export * from './handlers'
export { mockServer } from './server'
```

### 阶段2: 创建Mock Fixtures

```python
# backend/tests/conftest.py

@pytest.fixture
def mock_llm_service(monkeypatch):
    """全局LLM服务Mock"""
    from app.services import llm_service

    mock_result = {
        "q1_who": "产品经理",
        "q2_why": "需要管理需求",
        # ... 完整的10个问题
    }

    async def mock_analyze(*args, **kwargs):
        return mock_result

    monkeypatch.setattr(
        llm_service.llm_service,
        "analyze_insight",
        mock_analyze
    )

    return mock_result
```

```typescript
// frontend/src/test/setup.ts

// 全局Mock API
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// 全局Mock localStorage
const localStorageMock = {
  getItem: (key: string) => null,
  setItem: (key: string, value: string) => {},
  removeItem: (key: string) => {},
  clear: () => {},
}
global.localStorage = localStorageMock as Storage
```

### 阶段3: 编写Mock使用指南

```markdown
# 团队Mock使用指南

## 何时使用Mock

1. **必须使用**: 外部API、文件系统、数据库(单元测试)
2. **推荐使用**: 时间依赖、随机数、第三方库
3. **避免使用**: 被测核心逻辑、简单数据结构

## Mock使用流程

1. 确定需要Mock的依赖
2. 选择合适的Mock工具
3. 编写Mock代码
4. 验证Mock正确性
5. 编写测试断言
```

---

## 🔍 常见问题FAQ

### Q1: Mock太多会不会失去测试意义?

**A**: 是的。原则:
- ✅ Mock外部依赖 (API、数据库)
- ✅ Mock不稳定因素 (网络、时间)
- ❌ 不要Mock被测的核心逻辑
- ❌ 不要Mock简单的数据结构

### Q2: 如何验证Mock是否正确?

**A**:
1. 代码审查: 检查Mock行为是否符合真实场景
2. 集成测试: 用真实数据验证Mock场景
3. 定期更新: 当真实接口变化时更新Mock
4. 契约测试: 使用Pact等工具验证Mock契约

### Q3: Mock数据应该多真实?

**A**:
- ✅ 包含所有必要字段
- ✅ 覆盖边界情况 (空值、极大值、错误格式)
- ❌ 不需要100%还原真实数据
- ❌ 避免过度复杂

### Q4: 前端Mock还是后端Mock?

**A**: 看场景:
- **前端Mock**: 组件测试 (快速、稳定)
- **后端Mock**: 服务层测试 (隔离外部依赖)
- **MSW**: 前端集成测试 (Mock网络层)
- **真实API**: E2E测试 (验证端到端流程)

---

## 📚 延伸阅读

### 官方文档
- **Python Mock**: https://docs.python.org/3/library/unittest.mock.html
- **pytest-mock**: https://pytest-mock.readthedocs.io/
- **Vitest Mock**: https://vitest.dev/guide/mocking.html
- **MSW**: https://mswjs.io/

### 推荐文章
- "When to Mock and When Not to Mock" - Martin Fowler
- "Test Mocks: Fake It Till You Make It" - Google Testing Blog
- "Mocking isn't a dirty word" - Kent Beck

---

**文档维护者**: Claude Code AI Assistant
**最后更新**: 2026-01-27
**版本**: v1.0

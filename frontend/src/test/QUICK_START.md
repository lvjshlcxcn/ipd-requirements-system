# 测试快速开始指南

## 🚀 运行测试

```bash
# 运行所有测试（一次性）
npm test

# 监听模式（开发时使用）
npm run test:watch

# 带UI界面
npm run test:ui

# 生成覆盖率报告
npm run test:coverage
```

## 📝 编写测试

### 1. Service层测试模板

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { myService } from '@/services/my.service'
import api from '@/services/api'

// Mock API
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('MyService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该成功获取数据', async () => {
    const mockData = { id: 1, name: 'Test' }
    vi.mocked(api.get).mockResolvedValue({ data: mockData })

    const result = await myService.getData()

    expect(result.data).toEqual(mockData)
  })
})
```

### 2. 组件测试模板

```typescript
import { render, screen } from '@/test/utils/render'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('应该渲染标题', () => {
    render(<MyComponent title="测试标题" />)
    expect(screen.getByText('测试标题')).toBeInTheDocument()
  })

  it('应该处理点击事件', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<MyComponent onClick={handleClick} />)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### 3. Store测试模板

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMyStore } from '@/stores/useMyStore'

describe('useMyStore', () => {
  beforeEach(() => {
    useMyStore.setState({ data: [], loading: false })
  })

  it('应该更新数据', () => {
    const { result } = renderHook(() => useMyStore())
    
    act(() => {
      result.current.setData([1, 2, 3])
    })
    
    expect(result.current.data).toEqual([1, 2, 3])
  })
})
```

## 🎨 使用测试工具

### 使用renderWithProviders

```typescript
import { renderWithProviders } from '@/test/utils/render'

const { queryClient } = renderWithProviders(<MyComponent />)
```

### 使用Mock数据

```typescript
import { mockUsers, mockApiResponse } from '@/test/mocks/data'

// 使用Mock用户
const user = mockUsers.admin

// 创建Mock API响应
const response = mockApiResponse({ id: 1, name: 'Test' })
```

### 使用Mock辅助函数

```typescript
import { mockLocalStorage, mockApiResponse } from '@/test/utils/mockHelpers'

// Mock localStorage
const storage = mockLocalStorage()
storage.setItem('token', 'test-token')

// 创建Mock响应
const response = mockApiResponse({ data: 'test' })
```

## 📊 查看覆盖率

```bash
npm run test:coverage
```

覆盖率报告将生成在 `coverage/index.html`

## 🔧 常见问题

### Q: 如何Mock一个组件？
```typescript
vi.mock('@/components/MyComponent', () => ({
  MyComponent: () => <div>Mock</div>,
}))
```

### Q: 如何测试异步操作？
```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('加载完成')).toBeInTheDocument()
})
```

### Q: 如何Mock路由？
```typescript
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: '123' }),
}))
```

## 📚 更多资源

- [Vitest文档](https://vitest.dev/)
- [Testing Library文档](https://testing-library.com/docs/react-testing-library/intro/)
- [测试系统建设方案](../../TEST_SYSTEM_BUILD_PLAN.md)

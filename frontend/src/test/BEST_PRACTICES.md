# React 组件测试最佳实践

## 核心原则

### 1. 测试用户行为，而非实现细节

❌ **不好的做法**：
```tsx
it('should set state to true when clicked', () => {
  render(<Button />)
  expect(buttonInstance.state.isActive).toBe(true)
})
```

✅ **好的做法**：
```tsx
it('should show active class when clicked', () => {
  render(<Button />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByRole('button')).toHaveClass('active')
})
```

### 2. 使用与用户相同的方式查找元素

**优先级顺序**：

1. ✅ ** getByRole** - 最佳，反映无障碍访问
2. ✅ ** getByLabelText** - 表单元素
3. ✅ ** getByPlaceholderText** - 表单占位符
4. ⚠️ ** getByText** - 文本内容
5. ❌ ** getByTestId** - 最后的选择

❌ **不好的做法**：
```tsx
const button = container.querySelector('.ant-btn-primary')
```

✅ **好的做法**：
```tsx
const button = screen.getByRole('button', { name: 'Submit' })
```

### 3. 保持测试简单和聚焦

每个测试应该只测试一件事：

❌ **不好的做法**：
```tsx
it('should handle login, logout, and registration', () => {
  // 太多事情在一个测试中
})
```

✅ **好的做法**：
```tsx
describe('Authentication', () => {
  it('should login successfully')
  it('should logout successfully')
  it('should register new user')
})
```

## 组件测试模式

### 测试 Ant Design 组件

#### Button 组件

```tsx
import { render, screen } from '@/test/utils/render'
import { Button } from 'antd'
import userEvent from '@testing-library/user-event'

describe('Button Component', () => {
  it('should render button with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const user = userEvent.setup()
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when loading prop is true', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

#### Input 组件

```tsx
import { render, screen } from '@/test/utils/render'
import { Input } from 'antd'
import userEvent from '@testing-library/user-event'

describe('Input Component', () => {
  it('should update value when user types', async () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    const user = userEvent.setup()
    
    await user.type(input, 'Hello world')
    
    expect(input).toHaveValue('Hello world')
  })

  it('should show error message when hasError is true', () => {
    render(<Input status="error" placeholder="Email" />)
    expect(screen.getByPlaceholderText('Email')).toHaveClass('ant-input-status-error')
  })
})
```

#### Modal 组件

```tsx
import { render, screen, waitFor } from '@/test/utils/render'
import { Modal } from 'antd'
import userEvent from '@testing-library/user-event'

describe('Modal Component', () => {
  it('should open modal when trigger is clicked', async () => {
    const [modal, contextHolder] = Modal.useModal()
    
    const TestComponent = () => (
      <>
        <button onClick={() => modal.confirm({ title: 'Test' })}>Open</button>
        {contextHolder}
      </>
    )
    
    render(<TestComponent />)
    
    const user = userEvent.setup()
    await user.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })
})
```

### 测试表单

```tsx
import { render, screen, waitFor } from '@/test/utils/render'
import userEvent from '@testing-library/user-event'

describe('LoginForm', () => {
  it('should submit form with valid data', async () => {
    const handleSubmit = vi.fn()
    render(<LoginForm onSubmit={handleSubmit} />)
    
    const user = userEvent.setup()
    
    // Fill in form
    await user.type(screen.getByLabelText('Username'), 'testuser')
    await user.type(screen.getByLabelText('Password'), 'password123')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    // Assert
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      })
    })
  })

  it('should show validation errors for empty fields', async () => {
    render(<LoginForm />)
    
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    expect(await screen.findByText('请输入用户名')).toBeInTheDocument()
    expect(await screen.findByText('请输入密码')).toBeInTheDocument()
  })
})
```

### 测试异步操作

```tsx
import { render, screen, waitFor } from '@/test/utils/render'
import userEvent from '@testing-library/user-event'

describe('AsyncComponent', () => {
  it('should show loading state while fetching', async () => {
    render(<UserList />)
    
    // Initially show loading
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument()
    })
    
    // Loading should be gone
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
  })

  it('should handle errors gracefully', async () => {
    // Mock failed API call
    vi.mock('@/services/api', () => ({
      getUser: vi.fn().mockRejectedValue(new Error('API Error')),
    }))
    
    render(<UserList />)
    
    await waitFor(() => {
      expect(screenByText(/加载失败/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
```

### 测试条件渲染

```tsx
describe('ConditionalRendering', () => {
  it('should show content when condition is true', () => {
    render(<UserGreeting isLoggedIn={true} />)
    expect(screen.getByText('Welcome back!')).toBeInTheDocument()
  })

  it('should show login prompt when condition is false', () => {
    render(<UserGreeting isLoggedIn={false} />)
    expect(screen.getByText('Please login')).toBeInTheDocument()
    expect(screen.queryByText('Welcome back!')).not.toBeInTheDocument()
  })
})
```

## Hook 测试模式

### 测试自定义 Hooks

```tsx
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUserProfile } from '@/hooks/useUserProfile'

describe('useUserProfile', () => {
  it('should fetch user data on mount', async () => {
    vi.mock('@/services/api', () => ({
      getUser: vi.fn().mockResolvedValue({ name: 'John' }),
    }))
    
    const { result } = renderHook(() => useUserProfile(1))
    
    expect(result.current.loading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.user).toEqual({ name: 'John' })
      expect(result.current.loading).toBe(false)
    })
  })

  it('should handle errors', async () => {
    vi.mock('@/services/api', () => ({
      getUser: vi.fn().mockRejectedValue(new Error('Not found')),
    }))
    
    const { result } = renderHook(() => useUserProfile(999))
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
  })
})
```

## 性能优化

### 使用 describe 块共享设置

```tsx
describe('Component', () => {
  let defaultProps = {}
  
  beforeEach(() => {
    defaultProps = {
      title: 'Test',
      onSave: vi.fn(),
    }
  })

  it('test 1', () => {
    render(<Component {...defaultProps} />)
  })
  
  it('test 2', () => {
    render(<Component {...defaultProps} variant="secondary" />)
  })
})
```

### 清理副作用

```tsx
describe('ComponentWithSideEffects', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should set up interval on mount', () => {
    vi.useFakeTimers()
    
    render(<PollingComponent />)
    
    expect(setInterval).toHaveBeenCalled()
  })
})
```

## Mock 策略

### Mock API 服务

```tsx
import { render, screen } from '@/test/utils/render'

// 1. Mock 整个模块
vi.mock('@/services/api', () => ({
  getRequirements: vi.fn().mockResolvedValue(mockData),
}))

// 2. 在测试中使用
it('should display requirements', async () => {
  render(<RequirementList />)
  
  expect(await screen.findByText('Requirement 1')).toBeInTheDocument()
})
```

### Mock React Query

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithQuery = (component) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}
```

## 调试技巧

### 使用 debug()

```tsx
it('should render correctly', () => {
  const { container } = render(<MyComponent />)
  
  // 打印整个 DOM
  screen.debug()
  
  // 打印特定元素
  screen.debug(screen.getByRole('button'))
})
```

### 暂停测试执行

```tsx
it('debug test', () => {
  render(<MyComponent />)
  
  screen.debug()
  
  // 暂停执行，可以在浏览器中检查 DOM
  // await page.pause()
})
```

## 常见陷阱

### 1. 异步更新未等待

❌ 错误：
```tsx
fireEvent.click(button)
expect(screen.getByText('Loaded')).toBeInTheDocument()
```

✅ 正确：
```tsx
await user.click(button)
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

### 2. 测试实现细节

❌ 错误：
```tsx
expect(component.state.isOpen).toBe(true)
```

✅ 正确：
```tsx
expect(screen.getByRole('dialog')).toBeVisible()
```

### 3. 过度查询

❌ 错误：
```tsx
expect(screen.getByText('Button')).toBeInTheDocument()
expect(screen.getByText('Submit')).toBeInTheDocument()
expect(screen.getByText('Click me')).toBeInTheDocument()
```

✅ 正确：
```tsx
expect(screen.getAllByRole('button')).toHaveLength(3)
```

## 总结

关键要点：
1. ✅ 测试用户行为，而非实现
2. ✅ 使用 getByRole 优先
3. ✅ 等待异步操作
4. ✅ 保持测试简单和聚焦
5. ✅ 使用真实用户交互（userEvent）
6. ✅ 正确 mock 外部依赖

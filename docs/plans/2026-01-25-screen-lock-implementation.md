# 屏幕自动锁定功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 1 分钟无活动自动锁屏功能，用户输入密码解锁，无需重新登录

**Architecture:** 扩展现有 useSessionTimeout Hook 支持锁定模式，扩展 useAuthStore 管理锁定状态，创建 ScreenLockModal 组件显示锁定界面

**Tech Stack:** React, TypeScript, Zustand, Ant Design, localStorage

---

## Task 1: 扩展 useAuthStore 添加锁定状态

**Files:**
- Modify: `frontend/src/stores/useAuthStore.ts`
- Test: `frontend/src/__tests__/stores/useAuthStore.test.ts`

### Step 1: 编写锁定状态测试

```typescript
// frontend/src/__tests__/stores/useAuthStore.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/stores/useAuthStore'

describe('useAuthStore - Screen Lock', () => {
  beforeEach(() => {
    localStorage.clear()
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.logout()
    })
  })

  test('应该初始化锁定状态为未锁定', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.isLocked).toBe(false)
    expect(result.current.failedPasswordAttempts).toBe(0)
    expect(result.current.lockedUsername).toBeNull()
  })

  test('应该能够锁定屏幕并保存用户名', () => {
    const { result } = renderHook(() => useAuthStore())
    const username = 'testuser'

    act(() => {
      result.current.lockScreen(username)
    })

    expect(result.current.isLocked).toBe(true)
    expect(result.current.lockedUsername).toBe(username)
    expect(localStorage.getItem('app_screen_locked')).toBe('true')
    expect(localStorage.getItem('app_locked_username')).toBe(username)
  })

  test('应该能够加载锁定状态', () => {
    localStorage.setItem('app_screen_locked', 'true')
    localStorage.setItem('app_locked_username', 'testuser')
    localStorage.setItem('app_failed_attempts', '3')

    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.loadLockState()
    })

    expect(result.current.isLocked).toBe(true)
    expect(result.current.lockedUsername).toBe('testuser')
    expect(result.current.failedPasswordAttempts).toBe(3)
  })

  test('应该能够重置失败次数', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.lockScreen('testuser')
      // 模拟失败次数
      useAuthStore.setState({ failedPasswordAttempts: 3 })
      result.current.resetFailedAttempts()
    })

    expect(result.current.failedPasswordAttempts).toBe(0)
    expect(localStorage.getItem('app_failed_attempts')).toBeNull()
  })
})
```

### Step 2: 运行测试确认失败

```bash
cd ../claude_study-screen-lock/frontend
npm test -- useAuthStore.test.ts --watchAll=false
```

Expected: FAIL - lockScreen, loadLockState, resetFailedAttempts 方法不存在

### Step 3: 实现 useAuthStore 扩展

在 `frontend/src/stores/useAuthStore.ts` 中添加：

```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // 新增：屏幕锁定相关状态
  isLocked: boolean
  failedPasswordAttempts: number
  lockedUsername: string | null

  // Actions
  initialize: () => void
  login: (username: string, password: string) => Promise<void>
  register: (userData: { username: string; email: string; password: string }) => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>

  // 新增：屏幕锁定相关方法
  lockScreen: (username: string) => void
  unlockScreen: (password: string) => Promise<boolean>
  resetFailedAttempts: () => void
  loadLockState: () => void
}
```

在 persist 配置中添加锁定状态的持久化：

```typescript
partialize: (state) => ({
  token: state.token,
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLocked: state.isLocked,
  lockedUsername: state.lockedUsername,
  failedPasswordAttempts: state.failedPasswordAttempts,
}),
```

在 store 实现中添加方法：

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 现有状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // 新增状态
      isLocked: false,
      failedPasswordAttempts: 0,
      lockedUsername: null,

      // 现有方法保持不变
      initialize: () => {
        const hasTokenInStorage = localStorage.getItem('access_token')
        const state = get()

        if (hasTokenInStorage && !state.isAuthenticated) {
          console.log('[AuthStore] 检测到 token，自动设置为已认证状态')
          set({ isAuthenticated: true })
        }
      },

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authService.login({ username, password })
          const { access_token, user } = response.data

          authService.setToken(access_token)

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await authService.register(userData)
          const { access_token, user } = response.data

          authService.setToken(access_token)

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        authService.logout()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLocked: false,
          lockedUsername: null,
          failedPasswordAttempts: 0,
        })
        localStorage.removeItem('app_screen_locked')
        localStorage.removeItem('app_locked_username')
        localStorage.removeItem('app_locked_time')
        localStorage.removeItem('app_failed_attempts')
      },

      fetchCurrentUser: async () => {
        const token = get().token
        if (!token) return

        set({ isLoading: true })
        try {
          const response = await authService.getCurrentUser()
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      // 新增：锁定屏幕
      lockScreen: (username: string) => {
        set({
          isLocked: true,
          lockedUsername: username,
          failedPasswordAttempts: 0,
        })
        localStorage.setItem('app_screen_locked', 'true')
        localStorage.setItem('app_locked_username', username)
        localStorage.setItem('app_locked_time', Date.now().toString())
        localStorage.removeItem('app_failed_attempts')
      },

      // 新增：解锁屏幕
      unlockScreen: async (password: string) => {
        const state = get()

        try {
          // 调用登录 API 验证密码
          const response = await authService.login({
            username: state.lockedUsername!,
            password,
          })

          // 验证成功
          localStorage.removeItem('app_screen_locked')
          localStorage.removeItem('app_locked_username')
          localStorage.removeItem('app_locked_time')
          localStorage.removeItem('app_failed_attempts')

          set({
            isLocked: false,
            lockedUsername: null,
            failedPasswordAttempts: 0,
          })

          return true
        } catch (error) {
          // 验证失败
          const attempts = (state.failedPasswordAttempts || 0) + 1
          localStorage.setItem('app_failed_attempts', attempts.toString())

          if (attempts >= 5) {
            // 5次失败，强制登出
            get().logout()
          } else {
            set({ failedPasswordAttempts: attempts })
          }

          return false
        }
      },

      // 新增：重置失败次数
      resetFailedAttempts: () => {
        set({ failedPasswordAttempts: 0 })
        localStorage.removeItem('app_failed_attempts')
      },

      // 新增：加载锁定状态
      loadLockState: () => {
        const isLocked = localStorage.getItem('app_screen_locked') === 'true'
        const lockedUsername = localStorage.getItem('app_locked_username')
        const failedAttempts = parseInt(localStorage.getItem('app_failed_attempts') || '0', 10)

        set({
          isLocked,
          lockedUsername,
          failedPasswordAttempts: failedAttempts,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLocked: state.isLocked,
        lockedUsername: state.lockedUsername,
        failedPasswordAttempts: state.failedPasswordAttempts,
      }),
    }
  )
)
```

### Step 4: 运行测试验证通过

```bash
npm test -- useAuthStore.test.ts --watchAll=false
```

Expected: PASS

### Step 5: 提交代码

```bash
cd ../claude_study-screen-lock
git add frontend/src/stores/useAuthStore.ts frontend/src/__tests__/stores/useAuthStore.test.ts
git commit -m "feat: extend useAuthStore with screen lock state

- Add isLocked, failedPasswordAttempts, lockedUsername state
- Add lockScreen, unlockScreen, resetFailedAttempts, loadLockState methods
- Persist lock state to localStorage
- Support 5 failed attempts before forced logout

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: 扩展 useSessionTimeout Hook 支持锁定模式

**Files:**
- Modify: `frontend/src/hooks/useSessionTimeout.ts`
- Test: `frontend/src/__tests__/hooks/useSessionTimeout.test.ts`

### Step 1: 编写锁定模式测试

```typescript
// frontend/src/__tests__/hooks/useSessionTimeout.test.ts
import { renderHook, act } from '@testing-library/react'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'

// Mock useAuthStore
jest.mock('@/stores/useAuthStore')

describe('useSessionTimeout - Lock Mode', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test('应该在锁定模式下触发 onLock 回调', () => {
    const onLock = jest.fn()
    const { result } = renderHook(() =>
      useSessionTimeout({
        mode: 'lock',
        lockTimeoutMs: 1000, // 1秒（测试用）
        onLock,
        isAuthenticated: true,
      })
    )

    // 快进 1 秒
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(onLock).toHaveBeenCalledTimes(1)
  })

  test('应该在锁定倒计时期间显示警告', () => {
    const onLock = jest.fn()
    const onCountdown = jest.fn()
    const warningSeconds = 10

    renderHook(() =>
      useSessionTimeout({
        mode: 'lock',
        lockTimeoutMs: 10000, // 10秒
        warningSeconds,
        onCountdown,
        onLock,
        isAuthenticated: true,
      })
    )

    // 快进到倒计时开始（10秒 - 10秒 = 0秒）
    act(() => {
      jest.advanceTimersByTime(0)
    })

    expect(onCountdown).toHaveBeenCalledWith(warningSeconds)
  })

  test('用户活动应该取消锁定并重置定时器', () => {
    const onLock = jest.fn()
    const onCountdown = jest.fn()
    const onCancelCountdown = jest.fn()

    const { result } = renderHook(() =>
      useSessionTimeout({
        mode: 'lock',
        lockTimeoutMs: 10000, // 10秒
        warningSeconds: 5,    // 5秒警告
        onCountdown,
        onCancelCountdown,
        onLock,
        isAuthenticated: true,
      })
    )

    // 快进到倒计时开始
    act(() => {
      jest.advanceTimersByTime(5000) // 10秒 - 5秒 = 5秒
    })

    expect(onCountdown).toHaveBeenCalled()

    // 模拟用户活动（鼠标移动）
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove'))
    })

    expect(onCancelCountdown).toHaveBeenCalled()
    expect(onLock).not.toHaveBeenCalled()
  })
})
```

### Step 2: 运行测试确认失败

```bash
npm test -- useSessionTimeout.test.ts --watchAll=false
```

Expected: FAIL - mode 参数不存在

### Step 3: 实现 useSessionTimeout 扩展

修改 `frontend/src/hooks/useSessionTimeout.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react'

interface SessionTimeoutOptions {
  /** 超时时间（毫秒），默认 3 分钟 */
  timeoutMs?: number
  /** 是否启用调试日志 */
  debug?: boolean
  /** 倒计时剩余多少秒时显示警告（默认 30 秒） */
  warningSeconds?: number
  /** 倒计时回调 */
  onCountdown?: (remainingSeconds: number) => void
  /** 取消倒计时的回调（用户点击"继续工作"时调用） */
  onCancelCountdown?: () => void

  // 新增参数
  /** 超时模式：'lock' 锁定屏幕 | 'logout' 退出登录 */
  mode?: 'lock' | 'logout'
  /** 锁定回调 */
  onLock?: () => void
  /** 锁定超时时间（毫秒） */
  lockTimeoutMs?: number
  /** 用户认证状态（用于控制是否启动超时） */
  isAuthenticated?: boolean
}

/**
 * 会话超时 Hook
 *
 * 监听用户活动，如果在指定时间内无活动则自动登出或锁定
 *
 * @example
 * ```tsx
 * // 登出模式（默认）
 * useSessionTimeout()
 *
 * // 锁定模式
 * useSessionTimeout({
 *   mode: 'lock',
 *   lockTimeoutMs: 60 * 1000,  // 1分钟锁定
 *   onLock: () => lockScreen(),
 *   isAuthenticated: true
 * })
 * ```
 */
export function useSessionTimeout(options: SessionTimeoutOptions = {}) {
  const {
    timeoutMs = 3 * 60 * 1000, // 默认 3 分钟
    debug = false,
    warningSeconds = 30,
    onCountdown,
    onCancelCountdown,
    mode = 'logout', // 默认登出模式
    onLock,
    lockTimeoutMs = 1 * 60 * 1000, // 默认 1 分钟锁定
    isAuthenticated = true,
  } = options

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isCountingDownRef = useRef(false)

  const log = useCallback((...args: unknown[]) => {
    if (debug) {
      console.log('[SessionTimeout]', ...args)
    }
  }, [debug])

  /** 清除所有定时器 */
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
      warningTimeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    isCountingDownRef.current = false
  }, [])

  /** 执行锁定或登出 */
  const performAction = useCallback(() => {
    if (mode === 'lock' && onLock) {
      log('执行屏幕锁定')
      clearTimers()
      onLock()
    } else {
      log('执行自动登出')
      clearTimers()
      // 登出模式：调用传入的 logout 函数
      // 注意：这里保持向后兼容，由外部传入 logout 函数
    }
  }, [mode, onLock, clearTimers, log])

  /** 重置超时定时器 */
  const resetTimeout = useCallback(() => {
    clearTimers()

    // 根据模式选择超时时间
    const actualTimeout = mode === 'lock' ? lockTimeoutMs : timeoutMs
    log('重置超时定时器', { mode, actualTimeout })

    // 设置超时定时器
    timeoutRef.current = setTimeout(() => {
      performAction()
    }, actualTimeout)

    // 如果有倒计时警告，设置警告定时器
    if (warningSeconds > 0 && onCountdown) {
      const warningTime = Math.max(0, actualTimeout - warningSeconds * 1000)
      warningTimeoutRef.current = setTimeout(() => {
        log('开始倒计时警告', { warningSeconds })
        isCountingDownRef.current = true

        let remaining = warningSeconds
        onCountdown(remaining)

        countdownIntervalRef.current = setInterval(() => {
          remaining--
          if (remaining <= 0) {
            clearTimers()
          } else {
            onCountdown(remaining)
          }
        }, 1000)
      }, warningTime)
    }
  }, [mode, lockTimeoutMs, timeoutMs, warningSeconds, onCountdown, clearTimers, performAction, log])

  /** 处理用户活动事件 */
  const handleActivity = useCallback(() => {
    // 如果正在倒计时，取消倒计时并重置超时
    if (isCountingDownRef.current) {
      log('检测到用户活动，取消倒计时并重置超时')
      isCountingDownRef.current = false
      clearTimers()
      if (onCancelCountdown) {
        onCancelCountdown()
      }
      resetTimeout()
      return
    }
    log('检测到用户活动')
    resetTimeout()
  }, [resetTimeout, clearTimers, log, onCancelCountdown])

  useEffect(() => {
    // 如果用户未登录，不启动超时机制
    if (!isAuthenticated) {
      log('用户未登录，跳过会话超时设置')
      return
    }

    const actualTimeout = mode === 'lock' ? lockTimeoutMs : timeoutMs
    log('启动会话超时机制', { mode, actualTimeout, warningSeconds })

    // 监听的用户活动事件
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ]

    // 添加事件监听器
    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    // 初始化定时器
    resetTimeout()

    // 清理函数
    return () => {
      log('清理会话超时机制')
      clearTimers()
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [isAuthenticated, handleActivity, resetTimeout, clearTimers, log, mode, lockTimeoutMs, timeoutMs, warningSeconds])

  return {
    /** 手动重置超时 */
    resetTimeout,
    /** 清除超时机制 */
    clearTimers,
  }
}
```

### Step 4: 运行测试验证通过

```bash
npm test -- useSessionTimeout.test.ts --watchAll=false
```

Expected: PASS

### Step 5: 提交代码

```bash
git add frontend/src/hooks/useSessionTimeout.ts frontend/src/__tests__/hooks/useSessionTimeout.test.ts
git commit -m "feat: extend useSessionTimeout to support lock mode

- Add mode parameter: 'lock' or 'logout'
- Add onLock callback for screen lock functionality
- Add lockTimeoutMs parameter for lock timeout
- Maintain backward compatibility with existing logout mode

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: 创建 ScreenLockModal 组件

**Files:**
- Create: `frontend/src/shared/components/layout/ScreenLockModal.tsx`
- Test: `frontend/src/__tests__/components/layout/ScreenLockModal.test.tsx`

### Step 1: 编写 ScreenLockModal 测试

```typescript
// frontend/src/__tests__/components/layout/ScreenLockModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScreenLockModal } from '@/shared/components/layout/ScreenLockModal'
import { useAuthStore } from '@/stores/useAuthStore'

// Mock useAuthStore
jest.mock('@/stores/useAuthStore')

describe('ScreenLockModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('当未锁定时不显示 Modal', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isLocked: false,
      lockedUsername: null,
      failedPasswordAttempts: 0,
    })

    render(<ScreenLockModal />)

    expect(screen.queryByText('欢迎回来')).not.toBeInTheDocument()
  })

  test('当锁定时显示 Modal 和用户名', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isLocked: true,
      lockedUsername: 'testuser',
      failedPasswordAttempts: 0,
      unlockScreen: jest.fn().mockResolvedValue(true),
    })

    render(<ScreenLockModal />)

    expect(screen.getByText('欢迎回来，testuser')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '解锁' })).toBeInTheDocument()
  })

  test('成功解锁后隐藏 Modal', async () => {
    const unlockScreen = jest.fn().mockResolvedValue(true)
    (useAuthStore as jest.Mock).mockReturnValue({
      isLocked: true,
      lockedUsername: 'testuser',
      failedPasswordAttempts: 0,
      unlockScreen,
    })

    render(<ScreenLockModal />)

    const passwordInput = screen.getByPlaceholderText('请输入密码')
    const unlockButton = screen.getByRole('button', { name: '解锁' })

    await userEvent.type(passwordInput, 'correctpassword')
    fireEvent.click(unlockButton)

    await waitFor(() => {
      expect(unlockScreen).toHaveBeenCalledWith('correctpassword')
    })
  })

  test('密码错误时显示剩余尝试次数', async () => {
    const unlockScreen = jest.fn().mockResolvedValue(false)
    (useAuthStore as jest.Mock).mockReturnValue({
      isLocked: true,
      lockedUsername: 'testuser',
      failedPasswordAttempts: 2,
      unlockScreen,
    })

    render(<ScreenLockModal />)

    const passwordInput = screen.getByPlaceholderText('请输入密码')
    const unlockButton = screen.getByRole('button', { name: '解锁' })

    await userEvent.type(passwordInput, 'wrongpassword')
    fireEvent.click(unlockButton)

    await waitFor(() => {
      expect(screen.getByText(/密码错误，剩余 2 次尝试机会/)).toBeInTheDocument()
    })
  })

  test('支持 Enter 键提交', async () => {
    const unlockScreen = jest.fn().mockResolvedValue(true)
    (useAuthStore as jest.Mock).mockReturnValue({
      isLocked: true,
      lockedUsername: 'testuser',
      failedPasswordAttempts: 0,
      unlockScreen,
    })

    render(<ScreenLockModal />)

    const passwordInput = screen.getByPlaceholderText('请输入密码')

    await userEvent.type(passwordInput, 'password{Enter}')

    await waitFor(() => {
      expect(unlockScreen).toHaveBeenCalledWith('password')
    })
  })
})
```

### Step 2: 运行测试确认失败

```bash
npm test -- ScreenLockModal.test.tsx --watchAll=false
```

Expected: FAIL - ScreenLockModal 组件不存在

### Step 3: 实现 ScreenLockModal 组件

创建 `frontend/src/shared/components/layout/ScreenLockModal.tsx`:

```typescript
import { Modal, Input, Button, message } from 'antd'
import { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

export function ScreenLockModal() {
  const { isLocked, lockedUsername, unlockScreen, failedPasswordAttempts } = useAuthStore()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 如果未锁定，不显示 Modal
  if (!isLocked) return null

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError('请输入密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const success = await unlockScreen(password)

      if (success) {
        setPassword('')
        message.success('解锁成功')
      } else {
        const remaining = 5 - (failedPasswordAttempts + 1)
        if (remaining > 0) {
          setError(`密码错误，剩余 ${remaining} 次尝试机会`)
        } else {
          message.error('密码错误次数过多，已强制登出')
        }
      }
    } catch (err) {
      setError('网络连接失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock()
    }
  }

  return (
    <Modal
      open={true}
      closable={false}
      maskClosable={false}
      centered
      width={400}
      footer={null}
      styles={{
        mask: { backdropFilter: 'blur(8px)' },
      }}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <h2 style={{ marginBottom: '8px' }}>欢迎回来，{lockedUsername}</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>请输入密码解锁</p>

        <Input.Password
          size="large"
          placeholder="请输入密码"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError('')
          }}
          onKeyPress={handleKeyPress}
          autoFocus
          style={{ marginBottom: '16px' }}
        />

        {error && (
          <div style={{ color: '#ff4d4f', marginBottom: '16px', textAlign: 'left' }}>
            ⚠️ {error}
          </div>
        )}

        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          onClick={handleUnlock}
        >
          解锁
        </Button>
      </div>
    </Modal>
  )
}
```

### Step 4: 运行测试验证通过

```bash
npm test -- ScreenLockModal.test.tsx --watchAll=false
```

Expected: PASS

### Step 5: 提交代码

```bash
git add frontend/src/shared/components/layout/ScreenLockModal.tsx frontend/src/__tests__/components/layout/ScreenLockModal.test.tsx
git commit -m "feat: create ScreenLockModal component

- Display lock modal when screen is locked
- Show username and password input field
- Handle unlock with password verification
- Display remaining attempts on failure
- Support Enter key submission
- Blur background effect

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: 在 MainLayout 中集成锁屏功能

**Files:**
- Modify: `frontend/src/shared/components/layout/MainLayout.tsx`
- Test: `frontend/src/__tests__/components/layout/MainLayout.test.tsx`

### Step 1: 编写 MainLayout 集成测试

```typescript
// frontend/src/__tests__/components/layout/MainLayout.test.tsx
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MainLayout } from '@/shared/components/layout/MainLayout'
import { useAuthStore } from '@/stores/useAuthStore'
import * as useSessionTimeoutModule from '@/hooks/useSessionTimeout'

// Mock useSessionTimeout
jest.mock('@/hooks/useSessionTimeout')

describe('MainLayout - Screen Lock Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test('应该在组件挂载时加载锁定状态', () => {
    localStorage.setItem('app_screen_locked', 'true')
    localStorage.setItem('app_locked_username', 'testuser')

    const loadLockState = jest.fn()
    ;(useAuthStore as jest.Mock).mockReturnValue({
      user: { username: 'testuser' },
      isAuthenticated: true,
      isLocked: false,
      loadLockState,
      logout: jest.fn(),
      initialize: jest.fn(),
    })

    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    )

    expect(loadLockState).toHaveBeenCalled()
  })

  test('应该集成锁定模式的会话超时', () => {
    const useSessionTimeoutSpy = jest.spyOn(useSessionTimeoutModule, 'useSessionTimeout')

    ;(useAuthStore as jest.Mock).mockReturnValue({
      user: { username: 'testuser' },
      isAuthenticated: true,
      isLocked: false,
      lockedUsername: 'testuser',
      lockScreen: jest.fn(),
      loadLockState: jest.fn(),
      logout: jest.fn(),
      initialize: jest.fn(),
    })

    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    )

    expect(useSessionTimeoutSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'lock',
        lockTimeoutMs: 1 * 60 * 1000,
      })
    )
  })

  test('应该显示锁定倒计时警告', async () => {
    const onCountdown = jest.fn()

    ;(useAuthStore as jest.Mock).mockReturnValue({
      user: { username: 'testuser' },
      isAuthenticated: true,
      isLocked: false,
      lockScreen: jest.fn(),
      loadLockState: jest.fn(),
      logout: jest.fn(),
      initialize: jest.fn(),
    })

    jest.spyOn(useSessionTimeoutModule, 'useSessionTimeout').mockImplementation(({ onCountdown: cb }) => {
      // 模拟调用倒计时回调
      setTimeout(() => cb?.(10), 100)
      return { resetTimeout: jest.fn(), clearTimers: jest.fn() }
    })

    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    )

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(await screen.findByText(/即将锁定屏幕/)).toBeInTheDocument()
  })
})
```

### Step 2: 运行测试确认失败

```bash
npm test -- MainLayout.test.tsx --watchAll=false
```

Expected: FAIL - 锁定功能未集成

### Step 3: 修改 MainLayout 集成锁屏

修改 `frontend/src/shared/components/layout/MainLayout.tsx`:

```typescript
import { Layout, Menu, Space, Button, Tooltip, Modal, message, Statistic } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MENU_ITEMS } from '@/shared/constants'
import { DeepSeekIcon, ClaudeIcon } from '@/components/AIIcons'
import { UserOutlined, LogoutOutlined, MenuOutlined, ExclamationCircleOutlined, LockOutlined } from '@ant-design/icons'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { useAuthStore } from '@/stores/useAuthStore'
import { ScreenLockModal } from './ScreenLockModal'

const { Header, Sider, Content } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, initialize, user, lockScreen } = useAuthStore()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [lockCountdownVisible, setLockCountdownVisible] = useState(false)
  const [lockCountdownSeconds, setLockCountdownSeconds] = useState(0)
  const lockCountdownActiveRef = useRef(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user_info')
    if (userStr) {
      try {
        setUserInfo(JSON.parse(userStr))
      } catch (e) {
        console.error('Failed to parse user info:', e)
      }
    }

    // 初始化认证状态
    initialize()

    // 加载锁定状态
    useAuthStore.getState().loadLockState()
  }, [initialize])

  // 使用 useCallback 包装回调
  const handleLockCountdown = useCallback((seconds: number) => {
    if (!lockCountdownActiveRef.current) {
      lockCountdownActiveRef.current = true
      setLockCountdownVisible(true)
    }
    setLockCountdownSeconds(seconds)
  }, [])

  const handleCancelLockCountdown = useCallback(() => {
    setLockCountdownVisible(false)
    lockCountdownActiveRef.current = false
  }, [])

  // 锁定模式的会话超时管理（1 分钟无活动自动锁屏）
  useSessionTimeout({
    mode: 'lock',
    lockTimeoutMs: 1 * 60 * 1000, // 1 分钟锁定
    timeoutMs: 3 * 60 * 1000, // 3 分钟登出（安全兜底）
    warningSeconds: 10, // 提前 10 秒开始倒计时
    debug: false,
    onLock: () => {
      lockScreen(user?.username || 'User')
    },
    onCountdown: handleLockCountdown,
    onCancelCountdown: handleCancelLockCountdown,
    isAuthenticated: !!user,
  })

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗?',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        logout()
        localStorage.removeItem('user_info')
        message.success('已退出登录')
        navigate('/login')
      },
    })
  }

  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          padding: '16px',
          color: 'white',
          textAlign: 'center',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingLeft: collapsed ? '0' : '24px'
        }}>
          {!collapsed && (
            <h2 style={{ color: 'white', margin: 0, fontSize: '18px' }}>IPD需求管理</h2>
          )}
          {collapsed && (
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>IPD</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={MENU_ITEMS}
          onClick={handleMenuClick}
          inlineCollapsed={collapsed}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleCollapsed}
              style={{ fontSize: '16px', width: 48, height: 48 }}
            />
            <h1 style={{ margin: 0 }}>IPD Requirements Management</h1>
          </Space>
          <Space size="middle">
            <Tooltip title="DeepSeek AI">
              <Button
                type="primary"
                icon={<DeepSeekIcon width={20} height={20} />}
                onClick={() => window.open('https://chat.deepseek.com/', '_blank')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  width: '44px',
                  height: '44px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </Tooltip>
            <Tooltip title="Claude AI">
              <Button
                type="primary"
                icon={<ClaudeIcon width={20} height={20} />}
                onClick={() => window.open('https://claude.ai/', '_blank')}
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                  border: 'none',
                  width: '44px',
                  height: '44px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </Tooltip>
            <span style={{ color: '#666' }}>
              <UserOutlined /> {userInfo?.username || user?.username || 'User'}
            </span>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              退出
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px', padding: '24px', background: '#fff' }}>
          {children}
        </Content>
      </Layout>

      {/* 屏幕锁定倒计时警告 */}
      <Modal
        title={
          <Space>
            <LockOutlined style={{ color: '#faad14', fontSize: '20px' }} />
            <span>即将锁定屏幕</span>
          </Space>
        }
        open={lockCountdownVisible}
        onCancel={() => {}}
        footer={[
          <Button key="continue" type="primary" onClick={() => {}}>
            继续工作
          </Button>,
        ]}
        maskClosable={false}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '16px', marginBottom: '20px' }}>
            由于长时间未操作，屏幕将在 <strong style={{ color: '#ff4d4f' }}>{lockCountdownSeconds}</strong> 秒后自动锁定
          </p>
          <Statistic
            value={lockCountdownSeconds}
            suffix="秒"
            valueStyle={{ color: lockCountdownSeconds <= 5 ? '#ff4d4f' : '#faad14', fontSize: '48px' }}
          />
          <p style={{ color: '#666', marginTop: '20px' }}>
            点击"继续工作"按钮或移动鼠标可取消锁定
          </p>
        </div>
      </Modal>

      {/* 屏幕锁定 Modal */}
      <ScreenLockModal />
    </Layout>
  )
}
```

### Step 4: 运行测试验证通过

```bash
npm test -- MainLayout.test.tsx --watchAll=false
```

Expected: PASS

### Step 5: 提交代码

```bash
git add frontend/src/shared/components/layout/MainLayout.tsx frontend/src/__tests__/components/layout/MainLayout.test.tsx
git commit -m "feat: integrate screen lock into MainLayout

- Load lock state on component mount
- Integrate lock mode session timeout (1 minute)
- Add lock countdown warning modal (10 seconds)
- Render ScreenLockModal component
- Maintain backward compatibility with existing features

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: 添加 E2E 测试

**Files:**
- Create: `frontend/src/e2e/screen-lock.spec.ts`

### Step 1: 创建 E2E 测试文件

```typescript
// frontend/src/e2e/screen-lock.spec.ts
import { test, expect } from '@playwright/test'

test.describe('屏幕锁定功能 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('http://localhost:5173/login')
    await page.fill('input[placeholder*="用户名"], input[name="username"]', 'testuser')
    await page.fill('input[placeholder*="密码"], input[name="password"]', 'testpass123')
    await page.click('button[type="submit"]')

    // 等待跳转到主页
    await page.waitForURL('http://localhost:5173/')
    await page.waitForLoadState('networkidle')
  })

  test('1分钟无操作后应该锁定屏幕', async ({ page }) => {
    // 等待锁定倒计时出现（50秒后）
    await page.waitForTimeout(50000)

    // 检查倒计时警告是否出现
    await expect(page.locator('text=/即将锁定屏幕/')).toBeVisible()

    // 等待倒计时结束（10秒）
    await page.waitForTimeout(10000)

    // 检查锁定 Modal 是否出现
    await expect(page.locator('text=/欢迎回来/')).toBeVisible()
    await expect(page.locator('input[placeholder*="请输入密码"]')).toBeVisible()
  })

  test('应该能够通过密码解锁', async ({ page }) => {
    // 快进到锁定状态（手动设置 localStorage）
    await page.evaluate(() => {
      localStorage.setItem('app_screen_locked', 'true')
      localStorage.setItem('app_locked_username', 'testuser')
      window.location.reload()
    })

    // 等待页面加载
    await page.waitForLoadState('networkidle')

    // 输入密码
    await page.fill('input[placeholder*="请输入密码"]', 'testpass123')
    await page.click('button:has-text("解锁")')

    // 等待解锁成功
    await page.waitForTimeout(1000)

    // 检查锁定 Modal 是否消失
    await expect(page.locator('text=/欢迎回来/')).not.toBeVisible()
  })

  test('密码错误应该显示剩余次数', async ({ page }) => {
    // 设置锁定状态
    await page.evaluate(() => {
      localStorage.setItem('app_screen_locked', 'true')
      localStorage.setItem('app_locked_username', 'testuser')
      window.location.reload()
    })

    await page.waitForLoadState('networkidle')

    // 输入错误密码
    await page.fill('input[placeholder*="请输入密码"]', 'wrongpassword')
    await page.click('button:has-text("解锁")')

    // 等待响应
    await page.waitForTimeout(1000)

    // 检查错误提示
    await expect(page.locator('text=/密码错误，剩余/')).toBeVisible()
  })

  test('锁定期间刷新页面应该保持锁定', async ({ page }) => {
    // 设置锁定状态
    await page.evaluate(() => {
      localStorage.setItem('app_screen_locked', 'true')
      localStorage.setItem('app_locked_username', 'testuser')
    })

    // 刷新页面
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 检查锁定 Modal 是否仍然显示
    await expect(page.locator('text=/欢迎回来，testuser/')).toBeVisible()
  })

  test('倒计时期间操作应该取消锁定', async ({ page }) => {
    // 等待倒计时出现
    await page.waitForTimeout(50000)

    // 检查倒计时警告
    await expect(page.locator('text=/即将锁定屏幕/')).toBeVisible()

    // 移动鼠标
    await page.mouse.move(100, 100)

    // 等待一下
    await page.waitForTimeout(1000)

    // 检查倒计时是否消失
    await expect(page.locator('text=/即将锁定屏幕/')).not.toBeVisible()

    // 再等一会确认没有锁定
    await page.waitForTimeout(15000)
    await expect(page.locator('text=/欢迎回来/')).not.toBeVisible()
  })
})
```

### Step 2: 运行 E2E 测试

```bash
cd frontend
npm run test:e2e
```

注意：这些测试需要后端服务正在运行。

### Step 3: 提交代码

```bash
git add frontend/src/e2e/screen-lock.spec.ts
git commit -m "test: add E2E tests for screen lock feature

- Test 1 minute auto-lock functionality
- Test password unlock flow
- Test password error handling
- Test lock state persistence across page refresh
- Test countdown cancellation on user activity

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: 更新文档

**Files:**
- Create: `frontend/SCREEN_LOCK_USER_GUIDE.md`
- Modify: `README.md`

### Step 1: 创建用户指南

```markdown
# 屏幕锁定功能用户指南

## 功能概述

为了保护您的账户安全，系统会在您 **1 分钟无操作** 后自动锁定屏幕。锁定后需要输入密码才能继续使用。

## 功能特性

### 自动锁定
- 无操作 1 分钟后自动锁定
- 锁定前 10 秒显示倒计时警告
- 任意操作可取消倒计时

### 解锁方式
- 只需输入密码（无需重新输入用户名）
- 密码错误 5 次后强制登出
- 支持 Enter 键快速提交

### 状态持久化
- 刷新浏览器后保持锁定状态
- 关闭浏览器重新打开仍需解锁

## 使用说明

### 正常使用
1. 登录系统后正常使用
2. 系统会自动检测您的活动（鼠标、键盘、触摸等）
3. 1 分钟无活动会显示倒计时警告
4. 任意操作可取消锁定

### 锁定后解锁
1. 看到"欢迎回来"锁定界面
2. 输入您的登录密码
3. 点击"解锁"或按 Enter 键
4. 解锁成功后继续使用

### 安全提示
- 请勿在他人面前输入密码
- 离开座位前建议手动退出
- 密码错误次数过多会被强制登出

## 常见问题

**Q: 为什么我经常被锁定？**
A: 系统设置为 1 分钟无操作即锁定，这是为了安全考虑。如果觉得太频繁，请联系管理员调整。

**Q: 我忘记了密码怎么办？**
A: 需要强制退出并重新登录，请联系系统管理员重置密码。

**Q: 锁定后我的数据会丢失吗？**
A: 不会。锁定只是安全保护，您的操作和状态都会保留。

**Q: 可以自定义锁定时间吗？**
A: 当前版本锁定时间固定为 1 分钟，未来版本可能会支持自定义。
```

### Step 2: 更新 README

在 `README.md` 中添加：

```markdown
## 功能特性

### 安全功能
- **屏幕自动锁定**: 1 分钟无操作自动锁屏，密码解锁
- **会话超时**: 3 分钟无操作自动登出（安全兜底）
- **密码错误保护**: 5 次错误后强制登出

详细文档请参阅：[屏幕锁定功能用户指南](frontend/SCREEN_LOCK_USER_GUIDE.md)
```

### Step 3: 提交文档

```bash
git add frontend/SCREEN_LOCK_USER_GUIDE.md README.md
git commit -m "docs: add screen lock user guide and update README

- Add comprehensive user guide for screen lock feature
- Document auto-lock, unlock flow, and security features
- Add FAQ section
- Update main README with security features

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: 创建开发检查清单

**Files:**
- Create: `SCREEN_LOCK_DEV_CHECKLIST.md`

### Step 1: 创建开发检查清单

```markdown
# 屏幕锁定功能开发检查清单

## 开发前检查
- [ ] 阅读设计文档 (`docs/plans/2026-01-25-screen-lock-design.md`)
- [ ] 创建 feature branch: `feature/screen-lock`
- [ ] 确认测试环境可用

## 开发检查
- [ ] Task 1: 扩展 useAuthStore
  - [ ] 添加锁定状态字段
  - [ ] 实现 lockScreen 方法
  - [ ] 实现 unlockScreen 方法
  - [ ] 实现 loadLockState 方法
  - [ ] 实现 resetFailedAttempts 方法
  - [ ] 编写单元测试
  - [ ] 测试通过

- [ ] Task 2: 扩展 useSessionTimeout
  - [ ] 添加 mode 参数
  - [ ] 添加 onLock 回调
  - [ ] 添加 lockTimeoutMs 参数
  - [ ] 实现锁定模式逻辑
  - [ ] 编写单元测试
  - [ ] 测试通过

- [ ] Task 3: 创建 ScreenLockModal
  - [ ] 实现锁定界面 UI
  - [ ] 实现密码输入
  - [ ] 实现错误提示
  - [ ] 实现 Enter 键支持
  - [ ] 编写单元测试
  - [ ] 测试通过

- [ ] Task 4: 集成到 MainLayout
  - [ ] 添加锁定倒计时 Modal
  - [ ] 调用 useSessionTimeout 锁定模式
  - [ ] 渲染 ScreenLockModal
  - [ ] 加载锁定状态
  - [ ] 编写集成测试
  - [ ] 测试通过

- [ ] Task 5: E2E 测试
  - [ ] 编写 E2E 测试用例
  - [ ] 运行 E2E 测试
  - [ ] 测试通过

## 测试检查
- [ ] 单元测试全部通过
- [ ] 集成测试全部通过
- [ ] E2E 测试全部通过
- [ ] 手动测试完成
  - [ ] 1 分钟自动锁定
  - [ ] 密码解锁
  - [ ] 密码错误提示
  - [ ] 5 次错误强制登出
  - [ ] 刷新页面保持锁定
  - [ ] 倒计时取消

## 代码质量检查
- [ ] 代码符合 ESLint 规范
- [ ] 代码符合 TypeScript 规范
- [ ] 无 console.log 调试代码
- [ ] 代码注释完整

## 文档检查
- [ ] 用户指南完成
- [ ] README 更新
- [ ] API 文档更新（如有）
- [ ] 变更日志更新

## 提交检查
- [ ] 所有代码已提交
- [ ] Commit message 符合规范
- [ ] 无敏感信息泄露
- [ ] Git 历史清晰

## 发布前检查
- [ ] 所有测试通过
- [ ] 在开发环境验证
- [ ] 在测试环境验证
- [ ] 性能测试通过
- [ ] 安全测试通过
```

### Step 2: 提交检查清单

```bash
git add SCREEN_LOCK_DEV_CHECKLIST.md
git commit -m "docs: add screen lock development checklist

- Comprehensive checklist for screen lock feature
- Cover development, testing, and release steps
- Include manual testing scenarios

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 测试执行指南

### 运行所有测试
```bash
cd frontend

# 单元测试
npm test

# E2E 测试（需要先启动应用）
npm run dev  # 终端1
npm run test:e2e  # 终端2
```

### 手动测试步骤
1. 启动应用: `npm run dev`
2. 登录系统
3. 等待 1 分钟（或修改代码缩短时间）
4. 观察锁定倒计时
5. 观察自动锁定
6. 测试密码解锁
7. 测试错误密码
8. 测试刷新页面

---

## 完成标准

✅ 所有单元测试通过
✅ 所有 E2E 测试通过
✅ 手动测试完成
✅ 代码审查通过
✅ 文档完整
✅ 无已知 Bug

---

**实施计划完成，准备开始执行！**

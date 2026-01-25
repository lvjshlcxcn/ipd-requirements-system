import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/shared/components/layout/MainLayout'
import { useAuthStore } from '@/stores/useAuthStore'
import * as useSessionTimeoutModule from '@/hooks/useSessionTimeout'

// Mock useSessionTimeout
vi.mock('@/hooks/useSessionTimeout')

// Mock useAuthStore
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}))

// Mock the getState method
const mockGetState = vi.fn()

vi.mocked(useAuthStore).mockImplementation(() => ({
  user: { username: 'testuser' },
  isAuthenticated: true,
  isLocked: false,
  loadLockState: vi.fn(),
  logout: vi.fn(),
  initialize: vi.fn(),
  lockScreen: vi.fn(),
}))

useAuthStore.getState = mockGetState

describe('MainLayout - Screen Lock Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()

    // Reset the default mock implementation
    mockGetState.mockReturnValue({
      loadLockState: vi.fn(),
    })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('应该在组件挂载时加载锁定状态', () => {
    localStorage.setItem('app_screen_locked', 'true')
    localStorage.setItem('app_locked_username', 'testuser')

    const loadLockState = vi.fn()

    mockGetState.mockReturnValue({
      loadLockState,
    })

    vi.mocked(useAuthStore).mockReturnValue({
      user: { username: 'testuser' },
      isAuthenticated: true,
      isLocked: false,
      loadLockState,
      logout: vi.fn(),
      initialize: vi.fn(),
      lockScreen: vi.fn(),
    })

    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </BrowserRouter>
    )

    expect(loadLockState).toHaveBeenCalled()
  })

  it('应该集成锁定模式的会话超时', () => {
    const useSessionTimeoutSpy = vi.spyOn(useSessionTimeoutModule, 'useSessionTimeout')

    vi.mocked(useAuthStore).mockReturnValue({
      user: { username: 'testuser' },
      isAuthenticated: true,
      isLocked: false,
      lockedUsername: 'testuser',
      lockScreen: vi.fn(),
      loadLockState: vi.fn(),
      logout: vi.fn(),
      initialize: vi.fn(),
    })

    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </BrowserRouter>
    )

    expect(useSessionTimeoutSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'lock',
        lockTimeoutMs: 1 * 60 * 1000,
      })
    )
  })
})

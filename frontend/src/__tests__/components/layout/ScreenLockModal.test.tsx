import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScreenLockModal } from '@/shared/components/layout/ScreenLockModal'

// Mock useAuthStore with a factory function
const mockUnlockScreen = vi.fn()
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    isLocked: false,
    lockedUsername: null,
    failedPasswordAttempts: 0,
    unlockScreen: mockUnlockScreen,
  })),
}))

import { useAuthStore } from '@/stores/useAuthStore'

describe('ScreenLockModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default mock behavior
    mockUnlockScreen.mockReset()
    mockUnlockScreen.mockResolvedValue(true)
  })

  it('当未锁定时不显示 Modal', () => {
    ;(useAuthStore as vi.Mock).mockReturnValue({
      isLocked: false,
      lockedUsername: null,
      failedPasswordAttempts: 0,
      unlockScreen: mockUnlockScreen,
    })

    render(<ScreenLockModal />)

    expect(screen.queryByText('欢迎回来')).not.toBeInTheDocument()
  })

  it('当锁定时显示 Modal 和用户名', () => {
    ;(useAuthStore as vi.Mock).mockReturnValue({
      isLocked: true,
      lockedUsername: 'testuser',
      failedPasswordAttempts: 0,
      unlockScreen: mockUnlockScreen,
    })

    render(<ScreenLockModal />)

    expect(screen.getByText('欢迎回来，testuser')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument()
    expect(screen.getByText(/解锁/)).toBeInTheDocument()
  })

  it('成功解锁后调用 unlockScreen', async () => {
    mockUnlockScreen.mockResolvedValue(true)
    ;(useAuthStore as vi.Mock).mockReturnValue({
      isLocked: true,
      lockedUsername: 'testuser',
      failedPasswordAttempts: 0,
      unlockScreen: mockUnlockScreen,
    })

    render(<ScreenLockModal />)

    const passwordInput = screen.getByPlaceholderText('请输入密码')
    const unlockButton = screen.getByRole('button')

    await userEvent.type(passwordInput, 'correctpassword')
    await userEvent.click(unlockButton)

    await waitFor(() => {
      expect(mockUnlockScreen).toHaveBeenCalled()
    })
  })

  it('密码错误时显示错误信息', async () => {
    mockUnlockScreen.mockResolvedValue(false)
    ;(useAuthStore as vi.Mock).mockReturnValue({
      isLocked: true,
      lockedUsername: 'testuser',
      failedPasswordAttempts: 2,
      unlockScreen: mockUnlockScreen,
    })

    render(<ScreenLockModal />)

    const passwordInput = screen.getByPlaceholderText('请输入密码')
    const unlockButton = screen.getByRole('button')

    await userEvent.type(passwordInput, 'wrongpassword')
    await userEvent.click(unlockButton)

    // Wait for error message to appear - check for partial match
    await waitFor(() => {
      expect(screen.getByText(/密码错误/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('支持 Enter 键提交', async () => {
    mockUnlockScreen.mockResolvedValue(true)
    ;(useAuthStore as vi.Mock).mockReturnValue({
      isLocked: true,
      lockedUsername: 'testuser',
      failedPasswordAttempts: 0,
      unlockScreen: mockUnlockScreen,
    })

    render(<ScreenLockModal />)

    const passwordInput = screen.getByPlaceholderText('请输入密码')

    await userEvent.type(passwordInput, 'password{Enter}')

    await waitFor(() => {
      expect(mockUnlockScreen).toHaveBeenCalled()
    })
  })
})

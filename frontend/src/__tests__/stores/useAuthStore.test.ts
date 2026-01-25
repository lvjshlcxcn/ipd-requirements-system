import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/stores/useAuthStore'

// Mock the authService
vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    verifyPassword: vi.fn(), // 添加 verifyPassword mock
    register: vi.fn(),
    logout: vi.fn(),
    setToken: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isLocked: false,
      lockedUsername: null,
      failedPasswordAttempts: 0,
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const { authService } = await import('@/services/auth.service')
      const mockResponse = {
        data: {
          access_token: 'test-token',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'admin',
          },
        },
      }
      
      vi.mocked(authService.login).mockResolvedValue(mockResponse as any)
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.login('testuser', 'password123')
      })
      
      expect(result.current.user).toEqual(mockResponse.data.user)
      expect(result.current.token).toBe('test-token')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle login failure', async () => {
      const { authService } = await import('@/services/auth.service')
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'))
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        try {
          await result.current.login('testuser', 'wrong-password')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      })
      
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Logout', () => {
    it('should clear user data on logout', async () => {
      const { authService } = await import('@/services/auth.service')

      // First login
      const mockResponse = {
        data: {
          access_token: 'test-token',
          user: { id: 1, username: 'testuser', email: 'test@example.com', role: 'admin' },
        },
      }
      vi.mocked(authService.login).mockResolvedValue(mockResponse as any)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login('testuser', 'password123')
      })

      expect(result.current.isAuthenticated).toBe(true)

      // Then logout
      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('Screen Lock', () => {
    beforeEach(() => {
      localStorage.clear()
      const { result } = renderHook(() => useAuthStore())
      act(() => {
        result.current.logout()
      })
    })

    it('should initialize with unlocked state', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.isLocked).toBe(false)
      expect(result.current.failedPasswordAttempts).toBe(0)
      expect(result.current.lockedUsername).toBeNull()
    })

    it('should lock screen and save username', () => {
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

    it('should load lock state from localStorage', () => {
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

    it('should reset failed attempts', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.lockScreen('testuser')
        // Simulate failed attempts
        useAuthStore.setState({ failedPasswordAttempts: 3 })
        result.current.resetFailedAttempts()
      })

      expect(result.current.failedPasswordAttempts).toBe(0)
      expect(localStorage.getItem('app_failed_attempts')).toBeNull()
    })

    it('should unlock screen with correct password', async () => {
      const { authService } = await import('@/services/auth.service')
      const { result } = renderHook(() => useAuthStore())

      // First lock the screen
      act(() => {
        result.current.lockScreen('testuser')
      })

      expect(result.current.isLocked).toBe(true)

      // Mock authService.login to return success
      const mockResponse = {
        data: {
          access_token: 'test-token',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@test.com',
            role: 'user',
          },
        },
      }
      vi.mocked(authService.verifyPassword).mockResolvedValue(mockResponse as any)

      // Unlock with correct password
      await act(async () => {
        const success = await result.current.unlockScreen('correctpassword')
        expect(success).toBe(true)
      })

      expect(result.current.isLocked).toBe(false)
      expect(result.current.lockedUsername).toBeNull()
      expect(result.current.failedPasswordAttempts).toBe(0)
    })

    it('should increment failed attempts on wrong password', async () => {
      const { authService } = await import('@/services/auth.service')
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.lockScreen('testuser')
      })

      const mockVerifyPassword = vi.mocked(authService.verifyPassword)
      mockVerifyPassword.mockRejectedValue(new Error('Invalid password'))

      await act(async () => {
        const success = await result.current.unlockScreen('wrongpassword')
        expect(success).toBe(false)
      })

      expect(result.current.failedPasswordAttempts).toBe(1)
      expect(result.current.isLocked).toBe(true)
    })

    it('should force logout after 5 failed attempts', async () => {
      const { authService } = await import('@/services/auth.service')
      const { result } = renderHook(() => useAuthStore())

      // Mock window.location.href using Object.defineProperty
      const mockLocation = { href: '' }
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true,
      })

      act(() => {
        result.current.lockScreen('testuser')
        // Set 4 failed attempts
        useAuthStore.setState({ failedPasswordAttempts: 4 })
      })

      const mockVerifyPassword = vi.mocked(authService.verifyPassword)
      mockVerifyPassword.mockRejectedValue(new Error('Invalid password'))

      await act(async () => {
        await result.current.unlockScreen('wrongpassword')
      })

      // After 5th failed attempt, should force logout
      expect(result.current.isLocked).toBe(false)
      expect(result.current.lockedUsername).toBeNull()
      expect(result.current.failedPasswordAttempts).toBe(0)
      expect(mockLocation.href).toBe('/login')
    })

    it('should return false when unlocking without locked username', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Don't lock the screen, so lockedUsername is null
      expect(result.current.lockedUsername).toBeNull()

      await act(async () => {
        const success = await result.current.unlockScreen('password')
        expect(success).toBe(false) // 现在返回 false 而不是抛出错误
      })
    })

    it('should throw error when locking with empty username', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        expect(() => {
          result.current.lockScreen('')
        }).toThrow('Username is required to lock screen')
      })

      act(() => {
        expect(() => {
          result.current.lockScreen('   ')
        }).toThrow('Username is required to lock screen')
      })
    })

    it('should reset failed attempts on successful unlock', async () => {
      const { authService } = await import('@/services/auth.service')
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.lockScreen('testuser')
        // Simulate 2 failed attempts
        useAuthStore.setState({ failedPasswordAttempts: 2 })
      })

      expect(result.current.failedPasswordAttempts).toBe(2)

      // Mock successful login
      const mockResponse = {
        data: {
          access_token: 'test-token',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@test.com',
            role: 'user',
          },
        },
      }
      vi.mocked(authService.verifyPassword).mockResolvedValue(mockResponse as any)

      await act(async () => {
        await result.current.unlockScreen('correctpassword')
      })

      expect(result.current.failedPasswordAttempts).toBe(0)
      expect(localStorage.getItem('app_failed_attempts')).toBeNull()
    })
  })
})

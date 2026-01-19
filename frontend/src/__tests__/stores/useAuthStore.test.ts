import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/stores/useAuthStore'

// Mock the authService
vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setToken: vi.fn(),
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
      
      vi.mocked(authService.login).mockResolvedValue(mockResponse)
      
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
      vi.mocked(authService.login).mockResolvedValue(mockResponse)
      
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
})

/**
 * AuthService 测试
 *
 * 测试认证相关的所有API调用和本地存储操作
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authService, type LoginRequest, type RegisterRequest } from '@/services/auth.service'
import api from '@/services/api'
import axios from 'axios'

// Mock api模块
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  apiPost: vi.fn(),
}))

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

// Mock localStorage
const mockLocalStorage = (() => {
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
  value: mockLocalStorage,
  writable: true,
})

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  describe('login', () => {
    it('应该成功登录', async () => {
      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      }

      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          access_token: 'test-token',
          token_type: 'bearer',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'admin',
          },
        },
      }

      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockResolvedValue(mockResponse)

      const result = await authService.login(credentials)

      expect(apiPost).toHaveBeenCalledWith('/auth/login', credentials)
      expect(result.success).toBe(true)
      expect(result.data.access_token).toBe('test-token')
      expect(result.data.user.username).toBe('testuser')
    })

    it('应该处理登录失败（用户名不存在）', async () => {
      const credentials: LoginRequest = {
        username: 'nonexistent',
        password: 'password123',
      }

      const mockError = new Error('用户名或密码错误')
      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockRejectedValue(mockError)

      await expect(authService.login(credentials)).rejects.toThrow(
        '用户名或密码错误'
      )
    })

    it('应该处理登录失败（密码错误）', async () => {
      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'wrongpassword',
      }

      const mockError = new Error('用户名或密码错误')
      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockRejectedValue(mockError)

      await expect(authService.login(credentials)).rejects.toThrow(
        '用户名或密码错误'
      )
    })

    it('应该处理空字段', async () => {
      const credentials: LoginRequest = {
        username: '',
        password: '',
      }

      const mockError = new Error('用户名和密码不能为空')
      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockRejectedValue(mockError)

      await expect(authService.login(credentials)).rejects.toThrow(
        '用户名和密码不能为空'
      )
    })
  })

  describe('verifyPassword', () => {
    it('应该成功验证密码（解锁屏幕）', async () => {
      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      }

      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          access_token: 'test-token',
          token_type: 'bearer',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'admin',
          },
        },
      }

      vi.mocked(axios.post).mockResolvedValue({ data: mockResponse })

      const result = await authService.verifyPassword(credentials)

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        credentials,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result.success).toBe(true)
    })

    it('应该携带现有token进行验证', async () => {
      mockLocalStorage.setItem('access_token', 'existing-token')

      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      }

      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          access_token: 'new-token',
          token_type: 'bearer',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
          },
        },
      }

      vi.mocked(axios.post).mockResolvedValue({ data: mockResponse })

      await authService.verifyPassword(credentials)

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        credentials,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer existing-token',
          }),
        })
      )
    })

    it('应该处理验证失败（密码错误）', async () => {
      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'wrongpassword',
      }

      vi.mocked(axios.post).mockRejectedValue(new Error('密码错误'))

      await expect(authService.verifyPassword(credentials)).rejects.toThrow(
        '密码错误'
      )
    })
  })

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      const userData: RegisterRequest = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        full_name: 'New User',
      }

      const mockResponse = {
        success: true,
        message: '注册成功',
        data: {
          access_token: 'new-token',
          token_type: 'bearer',
          user: {
            id: 2,
            username: 'newuser',
            email: 'newuser@example.com',
            full_name: 'New User',
            role: 'user',
          },
        },
      }

      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockResolvedValue(mockResponse)

      const result = await authService.register(userData)

      expect(apiPost).toHaveBeenCalledWith('/auth/register', userData)
      expect(result.success).toBe(true)
      expect(result.data.user.username).toBe('newuser')
    })

    it('应该处理注册失败（邮箱已存在）', async () => {
      const userData: RegisterRequest = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      }

      const mockError = new Error('邮箱已被注册')
      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockRejectedValue(mockError)

      await expect(authService.register(userData)).rejects.toThrow(
        '邮箱已被注册'
      )
    })

    it('应该处理注册失败（用户名已存在）', async () => {
      const userData: RegisterRequest = {
        username: 'existing',
        email: 'new@example.com',
        password: 'password123',
      }

      const mockError = new Error('用户名已被占用')
      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockRejectedValue(mockError)

      await expect(authService.register(userData)).rejects.toThrow(
        '用户名已被占用'
      )
    })

    it('应该处理无效邮箱格式', async () => {
      const userData: RegisterRequest = {
        username: 'newuser',
        email: 'invalid-email',
        password: 'password123',
      }

      const mockError = new Error('邮箱格式不正确')
      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockRejectedValue(mockError)

      await expect(authService.register(userData)).rejects.toThrow(
        '邮箱格式不正确'
      )
    })

    it('应该处理弱密码', async () => {
      const userData: RegisterRequest = {
        username: 'newuser',
        email: 'new@example.com',
        password: '123',
      }

      const mockError = new Error('密码强度不足，至少8位')
      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockRejectedValue(mockError)

      await expect(authService.register(userData)).rejects.toThrow(
        '密码强度不足，至少8位'
      )
    })
  })

  describe('getCurrentUser', () => {
    it('应该成功获取当前用户信息', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockUser })

      const result = await authService.getCurrentUser()

      expect(api.get).toHaveBeenCalledWith('/auth/me')
      expect(result.data).toEqual(mockUser)
    })

    it('应该处理未登录状态', async () => {
      vi.mocked(api.get).mockRejectedValue(
        new Error('未登录')
      )

      await expect(authService.getCurrentUser()).rejects.toThrow(
        '未登录'
      )
    })
  })

  describe('logout', () => {
    it('应该清除token', () => {
      mockLocalStorage.setItem('access_token', 'test-token')

      expect(mockLocalStorage.getItem('access_token')).toBe('test-token')

      authService.logout()

      expect(mockLocalStorage.getItem('access_token')).toBeNull()
    })

    it('应该多次调用logout不报错', () => {
      mockLocalStorage.setItem('access_token', 'test-token')

      authService.logout()
      expect(mockLocalStorage.getItem('access_token')).toBeNull()

      authService.logout()
      expect(mockLocalStorage.getItem('access_token')).toBeNull()
    })
  })

  describe('setToken', () => {
    it('应该保存token到localStorage', () => {
      authService.setToken('test-token')

      expect(mockLocalStorage.getItem('access_token')).toBe('test-token')
    })

    it('应该覆盖已存在的token', () => {
      authService.setToken('old-token')
      expect(mockLocalStorage.getItem('access_token')).toBe('old-token')

      authService.setToken('new-token')
      expect(mockLocalStorage.getItem('access_token')).toBe('new-token')
    })
  })

  describe('getToken', () => {
    it('应该获取已保存的token', () => {
      mockLocalStorage.setItem('access_token', 'test-token')

      const token = authService.getToken()

      expect(token).toBe('test-token')
    })

    it('应该在没有token时返回null', () => {
      const token = authService.getToken()

      expect(token).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('有token时应该返回true', () => {
      mockLocalStorage.setItem('access_token', 'test-token')

      const result = authService.isAuthenticated()

      expect(result).toBe(true)
    })

    it('没有token时应该返回false', () => {
      const result = authService.isAuthenticated()

      expect(result).toBe(false)
    })

    it('token为空字符串时应该返回false', () => {
      mockLocalStorage.setItem('access_token', '')

      const result = authService.isAuthenticated()

      expect(result).toBe(false)
    })
  })

  describe('边界情况', () => {
    it('应该处理特殊字符的用户名', async () => {
      const credentials: LoginRequest = {
        username: 'user@domain.com',
        password: 'password123',
      }

      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          access_token: 'test-token',
          token_type: 'bearer',
          user: {
            id: 1,
            username: 'user@domain.com',
            email: 'user@domain.com',
            role: 'user',
          },
        },
      }

      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockResolvedValue(mockResponse)

      const result = await authService.login(credentials)

      expect(result.data.user.username).toBe('user@domain.com')
    })

    it('应该处理特殊字符的密码', async () => {
      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'p@ssw0rd!#$%',
      }

      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          access_token: 'test-token',
          token_type: 'bearer',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
          },
        },
      }

      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockResolvedValue(mockResponse)

      const result = await authService.login(credentials)

      expect(result.success).toBe(true)
    })

    it('应该处理超长用户名', async () => {
      const longUsername = 'a'.repeat(100)
      const credentials: LoginRequest = {
        username: longUsername,
        password: 'password123',
      }

      const mockError = new Error('用户名过长')
      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockRejectedValue(mockError)

      await expect(authService.login(credentials)).rejects.toThrow(
        '用户名过长'
      )
    })
  })
})

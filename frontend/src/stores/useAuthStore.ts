import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/auth.service'

// Constants
const MAX_FAILED_PASSWORD_ATTEMPTS = 5

interface User {
  id: number
  username: string
  email: string
  full_name?: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Screen lock state
  isLocked: boolean
  failedPasswordAttempts: number
  lockedUsername: string | null

  // Actions
  initialize: () => void
  login: (username: string, password: string) => Promise<void>
  register: (userData: { username: string; email: string; password: string }) => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>

  // Screen lock actions
  lockScreen: (username: string) => void
  unlockScreen: (password: string) => Promise<boolean>
  resetFailedAttempts: () => void
  loadLockState: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Screen lock state
      isLocked: false,
      failedPasswordAttempts: 0,
      lockedUsername: null,

      // Initialize: automatically set as authenticated if token exists
      initialize: () => {
        // Prioritize checking access_token in localStorage
        const hasTokenInStorage = localStorage.getItem('access_token')
        const state = get()

        // If localStorage has token but state shows unauthenticated, force authenticated state
        if (hasTokenInStorage && !state.isAuthenticated) {
          console.log('[AuthStore] Token detected, setting authenticated state')
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
            // 登录时清除所有锁屏状态
            isLocked: false,
            lockedUsername: null,
            failedPasswordAttempts: 0,
          })

          // 清除 localStorage 中的锁屏相关数据
          localStorage.removeItem('app_screen_locked')
          localStorage.removeItem('app_locked_username')
          localStorage.removeItem('app_locked_time')
          localStorage.removeItem('app_failed_attempts')
        } catch (error: unknown) {
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
            // 注册时清除所有锁屏状态
            isLocked: false,
            lockedUsername: null,
            failedPasswordAttempts: 0,
          })

          // 清除 localStorage 中的锁屏相关数据
          localStorage.removeItem('app_screen_locked')
          localStorage.removeItem('app_locked_username')
          localStorage.removeItem('app_locked_time')
          localStorage.removeItem('app_failed_attempts')
        } catch (error: unknown) {
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
        } catch (error: unknown) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      // Screen lock methods
      lockScreen: (username: string) => {
        if (!username || username.trim() === '') {
          throw new Error('Username is required to lock screen')
        }

        console.log('[AuthStore] 锁定屏幕，用户名:', username)

        set({
          isLocked: true,
          lockedUsername: username,
          failedPasswordAttempts: 0,
        })
        localStorage.setItem('app_screen_locked', 'true')
        localStorage.setItem('app_locked_username', username)
        localStorage.setItem('app_locked_time', Date.now().toString())
        localStorage.removeItem('app_failed_attempts')

        console.log('[AuthStore] 锁屏状态已保存，lockedUsername:', username)
      },

      unlockScreen: async (password: string) => {
        const state = get()

        console.log('[AuthStore] unlockScreen 被调用')
        console.log('[AuthStore] 当前状态:', {
          lockedUsername: state.lockedUsername,
          isLocked: state.isLocked,
          user: state.user,
          isAuthenticated: state.isAuthenticated
        })

        // 如果没有 lockedUsername，尝试从 user 或 localStorage 获取
        let username = state.lockedUsername
        if (!username) {
          console.log('[AuthStore] lockedUsername 为空，尝试从其他地方获取')
          username = state.user?.username
          if (!username) {
            console.log('[AuthStore] store.user 也为空，尝试从 localStorage 获取')
            const userInfo = localStorage.getItem('user_info')
            if (userInfo) {
              try {
                username = JSON.parse(userInfo).username
              } catch (e) {
                console.error('[AuthStore] 解析 user_info 失败:', e)
              }
            }
          }

          if (!username) {
            console.error('[AuthStore] 无法获取用户名，解锁失败')
            return false
          }

          console.log('[AuthStore] 从其他地方获取到用户名:', username)
        }

        console.log('[AuthStore] 尝试解锁屏幕，用户名:', username)

        try {
          // Call verifyPassword API to validate password
          // This bypasses the global 401 interceptor to avoid auto-redirect
          console.log('[AuthStore] 调用 verifyPassword API 验证密码...')

          const response = await authService.verifyPassword({
            username: username,
            password,
          })

          console.log('[AuthStore] 密码验证成功，响应:', response)

          // Verification successful
          localStorage.removeItem('app_screen_locked')
          localStorage.removeItem('app_locked_username')
          localStorage.removeItem('app_locked_time')
          localStorage.removeItem('app_failed_attempts')

          set({
            isLocked: false,
            lockedUsername: null,
            failedPasswordAttempts: 0,
          })

          console.log('[AuthStore] 屏幕解锁成功')
          return true
        } catch (error: unknown) {
          console.log('[AuthStore] 密码验证失败:', error)

          // Verification failed
          const attempts = (state.failedPasswordAttempts || 0) + 1
          localStorage.setItem('app_failed_attempts', attempts.toString())

          if (attempts >= MAX_FAILED_PASSWORD_ATTEMPTS) {
            // Max failures reached, force logout
            console.log('[AuthStore] 密码错误次数过多，强制登出')
            // 清除锁屏相关数据
            localStorage.removeItem('app_screen_locked')
            localStorage.removeItem('app_locked_username')
            localStorage.removeItem('app_failed_attempts')

            // 调用 logout 清除认证状态
            get().logout()

            // 强制跳转到登录页
            window.location.href = '/login'
          } else {
            set({ failedPasswordAttempts: attempts })
          }

          return false
        }
      },

      resetFailedAttempts: () => {
        set({ failedPasswordAttempts: 0 })
        localStorage.removeItem('app_failed_attempts')
      },

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

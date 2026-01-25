import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/auth.service'

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

      // 初始化：如果有 token 则自动设置为已认证
      initialize: () => {
        // 优先检查 localStorage 中的 access_token
        const hasTokenInStorage = localStorage.getItem('access_token')
        const state = get()

        // 如果 localStorage 有 token，但状态显示未认证，则强制设置为已认证
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

      // Screen lock methods
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

      unlockScreen: async (password: string) => {
        const state = get()

        try {
          // Call login API to verify password
          const response = await authService.login({
            username: state.lockedUsername!,
            password,
          })

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

          return true
        } catch (error) {
          // Verification failed
          const attempts = (state.failedPasswordAttempts || 0) + 1
          localStorage.setItem('app_failed_attempts', attempts.toString())

          if (attempts >= 5) {
            // 5 failures, force logout
            get().logout()
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

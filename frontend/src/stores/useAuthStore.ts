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

  // Actions
  initialize: () => void
  login: (username: string, password: string) => Promise<void>
  register: (userData: { username: string; email: string; password: string }) => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

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
        })
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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)

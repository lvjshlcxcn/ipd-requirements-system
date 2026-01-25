import api, { apiPost } from './api'
import axios from 'axios'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  full_name?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    access_token: string
    token_type: string
    user: {
      id: number
      username: string
      email: string
      full_name?: string
      role: string
    }
  }
}

export const authService = {
  /**
   * User login
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    // 发送 JSON 格式，与后端 Pydantic BaseModel 匹配
    return apiPost('/auth/login', credentials)
  },

  /**
   * Verify password for screen unlock
   * This method bypasses the global 401 interceptor to avoid auto-redirect to login page
   */
  verifyPassword: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const baseURL = import.meta.env.VITE_API_URL || '/api/v1'
    const token = localStorage.getItem('access_token')

    const response = await axios.post(
      `${baseURL}/auth/login`,
      credentials,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    )

    return response.data
  },

  /**
   * User registration
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    return apiPost('/auth/register', userData)
  },

  /**
   * Get current user info
   */
  getCurrentUser: async () => {
    return api.get('/auth/me')
  },

  /**
   * Logout (client-side only)
   */
  logout: () => {
    localStorage.removeItem('access_token')
  },

  /**
   * Store auth token
   */
  setToken: (token: string) => {
    localStorage.setItem('access_token', token)
  },

  /**
   * Get stored token
   */
  getToken: () => {
    return localStorage.getItem('access_token')
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token')
  },
}

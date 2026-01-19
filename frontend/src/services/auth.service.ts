import api, { apiPost } from './api'

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
    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)
    return apiPost('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
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

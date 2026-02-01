import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add tenant ID header
    config.headers['X-Tenant-ID'] = '1'

    // 如果是 FormData，删除 Content-Type 让浏览器自动设置
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('[API Response] 成功响应:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data
    })
    return response.data
  },
  (error) => {
    console.error('[API Response] 错误响应:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      console.error('[API Response] 401 未授权，清除 token 并跳转登录')
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

export default api

// Generic API methods
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return (await api.get<T>(url, config)) as T
}

export const apiPost = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return (await api.post<T>(url, data, config)) as T
}

export const apiPut = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return (await api.put<T>(url, data, config)) as T
}

export const apiDelete = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return (await api.delete<T>(url, config)) as T
}

export const apiPatch = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return (await api.patch<T>(url, data, config)) as T
}

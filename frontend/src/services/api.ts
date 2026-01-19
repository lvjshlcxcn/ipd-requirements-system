import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

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
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

export default api

// Generic API methods
export const apiGet = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return api.get<T>(url, config)
}

export const apiPost = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return api.post<T>(url, data, config)
}

export const apiPut = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return api.put<T>(url, data, config)
}

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return api.delete<T>(url, config)
}

export const apiPatch = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return api.patch<T>(url, data, config)
}

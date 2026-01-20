export interface User {
  id: number
  username: string
  email: string
  role: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface PaginationParams {
  page: number
  page_size: number
}

export interface PaginationResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

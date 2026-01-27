/**
 * Mock辅助函数
 *
 * 提供常用的Mock函数和工具
 */

import { vi } from 'vitest'

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const localStorageMock = (() => {
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
    value: localStorageMock,
    writable: true,
  })

  return localStorageMock
}

/**
 * Mock sessionStorage
 */
export function mockSessionStorage() {
  const sessionStorageMock = (() => {
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

  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  })

  return sessionStorageMock
}

/**
 * 创建Mock API响应
 */
export function mockApiResponse<T>(data: T, success = true) {
  return {
    success,
    data,
    message: success ? 'Success' : 'Error',
  }
}

/**
 * 创建Mock分页响应
 */
export function mockPaginatedResponse<T>(
  items: T[],
  page = 1,
  pageSize = 10,
  total?: number
) {
  return {
    success: true,
    data: {
      items,
      total: total || items.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((total || items.length) / pageSize),
    },
  }
}

/**
 * Mock window.location
 */
export function mockWindowLocation() {
  const mockLocation = {
    href: '',
    origin: 'http://localhost:5173',
    protocol: 'http:',
    host: 'localhost:5173',
    hostname: 'localhost',
    port: '5173',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    reload: vi.fn(),
    replace: vi.fn(),
  }

  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
    configurable: true,
  })

  return mockLocation
}

/**
 * Mock IntersectionObserver
 */
export function mockIntersectionObserver() {
  const mockIntersectionObserver = vi.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })

  Object.defineProperty(window, 'IntersectionObserver', {
    value: mockIntersectionObserver,
    writable: true,
  })

  return mockIntersectionObserver
}

/**
 * Mock ResizeObserver
 */
export function mockResizeObserver() {
  const mockResizeObserver = vi.fn()
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })

  Object.defineProperty(window, 'ResizeObserver', {
    value: mockResizeObserver,
    writable: true,
  })

  return mockResizeObserver
}

/**
 * Mock matchMedia
 */
export function mockMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

/**
 * 创建延迟函数（用于测试异步操作）
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Mock console方法以减少测试噪音
 */
export function mockConsole() {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'debug').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  // 保留warn和error以便调试
}

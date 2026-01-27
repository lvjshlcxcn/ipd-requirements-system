/**
 * 自定义测试渲染工具
 *
 * 提供包含所有必要Provider的自定义渲染函数
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

// 创建测试用的QueryClient
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // 静默错误日志，避免测试输出混乱
    },
  })
}

// AllTheProviders组件 - 包裹所有必要的Provider
interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

export function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const testQueryClient = queryClient || createTestQueryClient()

  return (
    <BrowserRouter>
      <QueryClientProvider client={testQueryClient}>
        <ConfigProvider locale={zhCN}>
          {children}
        </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

// 自定义渲染函数
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient
  }
) {
  const { queryClient, ...renderOptions } = options || {}

  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <AllTheProviders queryClient={queryClient}>
          {children}
        </AllTheProviders>
      ),
      ...renderOptions,
    }),
    queryClient: queryClient || createTestQueryClient(),
  }
}

// 重新导出所有testing-library工具
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

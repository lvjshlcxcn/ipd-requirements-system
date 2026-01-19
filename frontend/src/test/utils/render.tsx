import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { QueryClient } from '@tanstack/react-query'

// Create a test QueryClient instance
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
  })
}

// Custom render function with default providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // For now, just use the default render
  // Later, we can add providers like Router, Query, etc.
  return render(ui, options)
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { render, screen, waitFor, within } from '@/test/utils/render'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient } from '@/test/utils/render'
import { QueryClientProvider } from '@tanstack/react-query'

// Mock requirement service
vi.mock('@/services/requirement.service', () => ({
  requirementService: {
    getRequirementHistory: vi.fn(),
    addHistoryNote: vi.fn(),
  },
}))

// Mock message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  }
})

import { RequirementHistoryTimeline } from '@/components/requirements/RequirementHistoryTimeline'
import { requirementService } from '@/services/requirement.service'
import { message } from 'antd'

// Test data
const mockHistoryData = {
  success: true,
  data: [
    {
      id: 1,
      action: 'status_changed',
      from_status: 'collected',
      to_status: 'analyzing',
      comments: null,
      performed_at: '2026-01-18T10:30:00Z',
      performed_by: 1,
    },
    {
      id: 2,
      action: 'note_added',
      from_status: null,
      to_status: 'analyzing',
      comments: '这是一个测试备注',
      performed_at: '2026-01-18T09:15:00Z',
      performed_by: 1,
    },
  ],
}

describe('RequirementHistoryTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render timeline with history items', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue(mockHistoryData)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      // Wait for history to load
      await waitFor(() => {
        expect(screen.getByText('状态变更')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /添加备注/ })).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show empty state when no history', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue({
        success: true,
        data: [],
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('暂无历史记录')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show loading state', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockReturnValue(
        new Promise(resolve => setTimeout(() => resolve(mockHistoryData), 100))
      )

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      expect(screen.getByText('加载中...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Timeline Item Display', () => {
    it('should display status change with status tags', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue(mockHistoryData)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('已收集')).toBeInTheDocument()
        expect(screen.getByText('分析中')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should display note with comment content', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue(mockHistoryData)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('这是一个测试备注')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should display user ID', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue(mockHistoryData)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      await waitFor(() => {
        expect(screen.getAllByText('ID: 1')).toHaveLength(2)
      }, { timeout: 3000 })
    })
  })

  describe('Add Note Functionality', () => {
    it('should open modal when add note button is clicked', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue({
        success: true,
        data: [],
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /添加备注/ })
        expect(addButton).toBeInTheDocument()
      }, { timeout: 3000 })

      // Click add note button
      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /添加备注/ }))
      })

      // Modal should be visible
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/请输入备注内容/)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should submit note when confirm button is clicked', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue({
        success: true,
        data: [],
      })
      vi.mocked(requirementService.addHistoryNote).mockResolvedValue({
        success: true,
        message: '备注添加成功',
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      // Open modal
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /添加备注/ })
        expect(addButton).toBeInTheDocument()
      }, { timeout: 3000 })

      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /添加备注/ }))
      })

      // Wait for modal to open and textarea to appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/请输入备注内容/)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Type note
      const textarea = screen.getByPlaceholderText(/请输入备注内容/)
      await userEvent.type(textarea, '这是一个新的备注')

      // Submit - find and click the OK button
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Find all buttons and click the one with text "确定"
      const allButtons = screen.getAllByRole('button')
      const confirmButton = allButtons.find(btn => btn.textContent?.includes('确定'))
      if (!confirmButton) {
        throw new Error('Confirm button not found')
      }
      await act(async () => {
        await userEvent.click(confirmButton)
      })

      // Verify API was called
      await waitFor(() => {
        expect(requirementService.addHistoryNote).toHaveBeenCalledWith(1, {
          comments: '这是一个新的备注',
        })
      }, { timeout: 3000 })

      // Verify success message
      expect(message.success).toHaveBeenCalledWith('备注添加成功')
    })

    it('should show validation error when submitting empty note', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue({
        success: true,
        data: [],
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      // Open modal
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /添加备注/ })
        expect(addButton).toBeInTheDocument()
      }, { timeout: 3000 })

      await userEvent.click(screen.getByRole('button', { name: /添加备注/ }))

      // Wait for modal to be visible
      await waitFor(() => {
        const modal = screen.getByRole('dialog')
        expect(modal).toBeInTheDocument()
      }, { timeout: 3000 })

      // Try to submit empty note
      const allButtons = screen.getAllByRole('button')
      const confirmButton = allButtons.find(btn => btn.textContent?.includes('确定'))
      if (!confirmButton) {
        throw new Error('Confirm button not found')
      }
      await userEvent.click(confirmButton)

      // Should show warning
      expect(message.warning).toHaveBeenCalledWith('请输入备注内容')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockRejectedValue(
        new Error('网络错误')
      )

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      // Should show empty state with error message
      await waitFor(() => {
        expect(screen.getByText('加载失败，请稍后重试')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should handle add note error gracefully', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue({
        success: true,
        data: [],
      })
      vi.mocked(requirementService.addHistoryNote).mockRejectedValue(new Error('添加失败'))

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      // Open modal
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /添加备注/ })
        expect(addButton).toBeInTheDocument()
      }, { timeout: 3000 })

      await userEvent.click(screen.getByRole('button', { name: /添加备注/ }))

      // Type note
      const textarea = screen.getByPlaceholderText(/请输入备注内容/)
      await userEvent.type(textarea, '测试备注')

      // Wait for modal to be visible
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Try to submit
      const allButtons = screen.getAllByRole('button')
      const confirmButton = allButtons.find(btn => btn.textContent?.includes('确定'))
      if (!confirmButton) {
        throw new Error('Confirm button not found')
      }
      await userEvent.click(confirmButton)

      // Should show error message
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('添加备注失败')
      }, { timeout: 3000 })
    })
  })

  describe('Pagination', () => {
    it('should show pagination when history exceeds page size', async () => {
      // Create 25 mock history items (more than default page size of 10)
      const largeMockHistory = {
        success: true,
        data: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          action: i % 2 === 0 ? 'status_changed' : 'note_added',
          from_status: i % 2 === 0 ? 'collected' : null,
          to_status: 'analyzing',
          comments: i % 2 === 0 ? null : `备注 ${i + 1}`,
          performed_at: new Date(Date.now() - i * 60000).toISOString(),
          performed_by: 1,
        })),
      }

      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue(largeMockHistory)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      // Wait for history to load and pagination to appear
      await waitFor(() => {
        expect(screen.getByText(/共 25 条记录/)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should not show pagination when history fits on one page', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue(mockHistoryData)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/共 2 条记录/)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Should not show pagination when totalPages <= 1
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })

    it('should display correct page count in header', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue(mockHistoryData)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText('共 2 条记录')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Auto-refresh with TanStack Query', () => {
    it('should refetch history when adding a note', async () => {
      vi.mocked(requirementService.getRequirementHistory).mockResolvedValue({
        success: true,
        data: [],
      })
      vi.mocked(requirementService.addHistoryNote).mockResolvedValue({
        success: true,
        message: '备注添加成功',
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      render(<RequirementHistoryTimeline requirementId={1} />, { wrapper })

      // Open modal
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /添加备注/ })
        expect(addButton).toBeInTheDocument()
      }, { timeout: 3000 })

      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /添加备注/ }))
      })

      // Type note
      const textarea = screen.getByPlaceholderText(/请输入备注内容/)
      await userEvent.type(textarea, '新备注')

      // Submit
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      }, { timeout: 3000 })

      const allButtons = screen.getAllByRole('button')
      const confirmButton = allButtons.find(btn => btn.textContent?.includes('确定'))
      if (!confirmButton) {
        throw new Error('Confirm button not found')
      }
      await act(async () => {
        await userEvent.click(confirmButton)
      })

      // Verify service was called and cache should be invalidated
      await waitFor(() => {
        expect(requirementService.addHistoryNote).toHaveBeenCalledWith(1, {
          comments: '新备注',
        })
      }, { timeout: 3000 })

      expect(message.success).toHaveBeenCalledWith('备注添加成功')
    })
  })
})

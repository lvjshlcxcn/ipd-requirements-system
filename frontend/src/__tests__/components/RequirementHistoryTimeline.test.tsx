import { describe, it, expect, beforeEach, vi } from 'vitest'
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
      await userEvent.click(screen.getByRole('button', { name: /添加备注/ }))

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

      await userEvent.click(screen.getByRole('button', { name: /添加备注/ }))

      // Wait for modal to open and textarea to appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/请输入备注内容/)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Type note
      const textarea = screen.getByPlaceholderText(/请输入备注内容/)
      await userEvent.type(textarea, '这是一个新的备注')

      // Submit - wait for modal to be visible first, then find button
      await waitFor(() => {
        const modal = screen.getByRole('dialog')
        expect(modal).toBeInTheDocument()
      }, { timeout: 3000 })

      // Find button within the modal context
      const modal = screen.getByRole('dialog')
      const allButtons = within(modal).getAllByRole('button')
      const confirmButton = allButtons.find(btn => btn.textContent?.trim().includes('确定'))
      if (!confirmButton) {
        console.log('Available buttons:', allButtons.map(b => b.textContent))
        throw new Error('Confirm button not found')
      }
      await userEvent.click(confirmButton)

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
      const modal = screen.getByRole('dialog')
      const allButtons = within(modal).getAllByRole('button')
      const confirmButton = allButtons.find(btn => btn.textContent?.trim().includes('确定'))
      if (!confirmButton) {
        console.log('Available buttons:', allButtons.map(b => b.textContent))
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

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('获取历史记录失败')
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
        const modal = screen.getByRole('dialog')
        expect(modal).toBeInTheDocument()
      }, { timeout: 3000 })

      // Try to submit
      const modal = screen.getByRole('dialog')
      const allButtons = within(modal).getAllByRole('button')
      const confirmButton = allButtons.find(btn => btn.textContent?.trim().includes('确定'))
      if (!confirmButton) {
        console.log('Available buttons:', allButtons.map(b => b.textContent))
        throw new Error('Confirm button not found')
      }
      await userEvent.click(confirmButton)

      // Should show error message
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('添加备注失败')
      }, { timeout: 3000 })
    })
  })

  describe('Refresh on Trigger Change', () => {
    it('should refetch history when refreshTrigger changes', async () => {
      // @ts-ignore
      let callCount = 0

      vi.mocked(requirementService.getRequirementHistory).mockImplementation(() => {
        callCount++
        return Promise.resolve(mockHistoryData)
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )

      // @ts-ignore
      const { rerender: customRerender } = render(
        <RequirementHistoryTimeline requirementId={1} />,
        { wrapper }
      )

      await waitFor(() => {
        expect(screen.getByText('状态变更')).toBeInTheDocument()
      }, { timeout: 3000 })

      const firstCallCount = callCount

      // Update refreshTrigger
      // @ts-ignore
      customRerender(
        <RequirementHistoryTimeline requirementId={1} />
      )

      await waitFor(() => {
        expect(callCount).toBeGreaterThan(firstCallCount)
      }, { timeout: 3000 })
    })
  })
})

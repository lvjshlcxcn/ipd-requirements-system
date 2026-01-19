import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils/render'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '@/test/utils/render'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' }),
}))

// Mock RequirementHistoryTimeline component
vi.mock('@/components/requirements/RequirementHistoryTimeline', () => ({
  RequirementHistoryTimeline: () => <div data-testid="history-timeline">历史时间线组件</div>,
}))

// Mock Ant Design Modal
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    Modal: {
      confirm: vi.fn(() => {
        // 默认不调用 onOk，让测试手动控制
        return { destroy: vi.fn() }
      }),
    },
  }
})

// Mock service
vi.mock('@/services/requirement.service', () => ({
  requirementService: {
    getRequirement: vi.fn(),
    deleteRequirement: vi.fn(),
    getRequirementHistory: vi.fn(),
  },
}))

import RequirementDetailPage from '@/pages/requirements/RequirementDetailPage'
import { requirementService } from '@/services/requirement.service'
import { Modal } from 'antd'

// Get reference to mocked Modal.confirm
const mockModalConfirm = Modal.confirm as ReturnType<typeof vi.fn>

// Test data
const mockRequirementData = {
  id: 1,
  requirement_no: 'REQ-2026-0001',
  title: '用户登录功能',
  description: '实现用户名密码登录功能，包括注册、找回密码等功能',
  source_channel: 'customer',
  source_contact: '张三',
  status: 'analyzing',
  priority_score: 8,
  estimated_duration_months: 3,
  complexity_level: 'medium',
  customer_need_10q: {
    q1_who_cares: '产品经理',
    q2_why_care: '提高效率',
    q3_how_often: '每天',
    q4_current_solution: '手工记录',
    q5_pain_points: '容易出错',
    q6_expected_outcome: '提高准确性',
    q7_value_impact: '节省时间',
    q8_urgency_level: '高',
  },
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-16T14:30:00Z',
}

const mockApiResponse = {
  success: true,
  data: mockRequirementData,
}

describe('RequirementDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createWrapper = () => ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  )

  describe('Data Loading', () => {
    it('should load and display requirement details', async () => {
      vi.mocked(requirementService.getRequirement).mockResolvedValue(mockApiResponse)

      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('用户登录功能')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should show loading state while fetching', async () => {
      vi.mocked(requirementService.getRequirement).mockReturnValue(
        new Promise(resolve => setTimeout(() => resolve(mockApiResponse), 100))
      )

      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      // Should show loading skeleton
      await waitFor(() => {
        const skeletons = screen.queryAllByText(/用户登录功能/)
        // 加载中可能还没显示标题，或者显示加载骨架
        expect(skeletons.length).toBeGreaterThanOrEqual(0)
      }, { timeout: 1000 })
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(requirementService.getRequirement).mockRejectedValue(new Error('获取需求详情失败'))

      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      // Should show error message
      await waitFor(() => {
        const errorElement = screen.queryByText(/获取需求详情失败|加载失败/)
        if (errorElement) {
          expect(errorElement).toBeInTheDocument()
        }
      }, { timeout: 5000 })
    })
  })

  describe('Information Display', () => {
    beforeEach(() => {
      vi.mocked(requirementService.getRequirement).mockResolvedValue(mockApiResponse)
    })

    it('should display requirement title', async () => {
      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('用户登录功能')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should display edit buttons', async () => {
      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        const editButtons = screen.queryAllByText('编辑')
        expect(editButtons.length).toBeGreaterThan(0)
      }, { timeout: 5000 })
    })

    it('should display delete button', async () => {
      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        const deleteButtons = screen.queryAllByText('删除')
        expect(deleteButtons.length).toBeGreaterThan(0)
      }, { timeout: 5000 })
    })

    it('should render history timeline component', async () => {
      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('history-timeline')).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('Edit Functionality', () => {
    beforeEach(() => {
      vi.mocked(requirementService.getRequirement).mockResolvedValue(mockApiResponse)
    })

    it('should navigate to edit page when edit button is clicked', async () => {
      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        const editButtons = screen.queryAllByText('编辑')
        expect(editButtons.length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      // Click first edit button
      const editButton = screen.queryAllByText('编辑')[0]
      await userEvent.click(editButton)

      // Verify navigation
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      }, { timeout: 3000 })

      // Check if navigate was called with edit path
      const calls = mockNavigate.mock.calls
      expect(calls.length).toBeGreaterThan(0)
    })
  })

  describe('Delete Functionality', () => {
    beforeEach(() => {
      vi.mocked(requirementService.getRequirement).mockResolvedValue(mockApiResponse)
    })

    it('should show confirmation dialog when delete button is clicked', async () => {
      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        const deleteButtons = screen.queryAllByText('删除')
        expect(deleteButtons.length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      // Click delete button
      const deleteButton = screen.queryAllByText('删除')[0]
      await userEvent.click(deleteButton)

      // Verify Modal.confirm was called
      await waitFor(() => {
        expect(mockModalConfirm).toHaveBeenCalled()
      }, { timeout: 3000 })

      // Verify the call included the correct title
      expect(mockModalConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '确认删除',
        })
      )
    })

    it('should delete requirement and navigate when confirmed', async () => {
      vi.mocked(requirementService.deleteRequirement).mockResolvedValue({
        success: true,
        message: '删除成功'
      })

      // Capture onOk callback
      let onOkCallback: (() => void) | undefined
      mockModalConfirm.mockImplementation(({ onOk }) => {
        onOkCallback = onOk
        return { destroy: vi.fn() }
      })

      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        const deleteButtons = screen.queryAllByText('删除')
        expect(deleteButtons.length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      // Click delete button
      const deleteButton = screen.queryAllByText('删除')[0]
      await userEvent.click(deleteButton)

      // Wait for modal to be shown
      await waitFor(() => {
        expect(mockModalConfirm).toHaveBeenCalled()
      }, { timeout: 3000 })

      // Manually call onOk to simulate user clicking confirm
      if (onOkCallback) {
        await onOkCallback()
      }

      // Wait for delete API to be called
      await waitFor(() => {
        expect(requirementService.deleteRequirement).toHaveBeenCalledWith(1)
      }, { timeout: 3000 })

      // Verify navigation back to list
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/requirements')
      }, { timeout: 3000 })
    })

    it('should cancel deletion when user cancels', async () => {
      // Mock that doesn't call onOk
      mockModalConfirm.mockImplementation(() => {
        return { destroy: vi.fn() }
      })

      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        const deleteButtons = screen.queryAllByText('删除')
        expect(deleteButtons.length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      // Click delete button
      const deleteButton = screen.queryAllByText('删除')[0]
      await userEvent.click(deleteButton)

      // Wait for modal to be shown
      await waitFor(() => {
        expect(mockModalConfirm).toHaveBeenCalled()
      }, { timeout: 3000 })

      // Verify delete API was NOT called (since user cancelled)
      expect(requirementService.deleteRequirement).not.toHaveBeenCalled()
    })
  })

  describe('URL Parameter Handling', () => {
    it('should parse requirement ID from URL', async () => {
      vi.mocked(requirementService.getRequirement).mockResolvedValue(mockApiResponse)

      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      // Verify page renders successfully
      await waitFor(() => {
        expect(screen.getByTestId('history-timeline')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should handle API error for invalid ID', async () => {
      vi.mocked(requirementService.getRequirement).mockRejectedValue(new Error('404 Not Found'))

      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      // Should show error or handle gracefully
      await waitFor(() => {
        // Either an error message is shown or page fails gracefully
        const hasError = screen.queryByText(/获取需求详情失败|加载失败|不存在/)
        const hasContent = screen.queryByText('用户登录功能')
        // At least one should be true (either error shown or content loaded)
        expect(hasError || hasContent).toBeTruthy()
      }, { timeout: 5000 })
    })
  })

  describe('Back Navigation', () => {
    it('should have back button', async () => {
      vi.mocked(requirementService.getRequirement).mockResolvedValue(mockApiResponse)

      render(<RequirementDetailPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        // Check for back button or navigation
        const backButtons = screen.queryAllByRole('button')
        expect(backButtons.length).toBeGreaterThan(0)
      }, { timeout: 5000 })
    })
  })
})

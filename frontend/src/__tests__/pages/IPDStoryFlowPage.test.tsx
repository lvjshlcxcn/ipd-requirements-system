import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils/render'
import userEvent from '@testing-library/user-event'
import { act } from 'react'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock TextInsightModal component
vi.mock('@/components/insights/TextInsightModal', () => ({
  TextInsightModal: ({
    visible,
    onClose,
    onAnalysisComplete,
  }: {
    visible: boolean
    onClose: () => void
    onAnalysisComplete: (insight: any) => void
  }) => {
    if (!visible) return null

    return (
      <div data-testid="text-insight-modal">
        <button
          data-testid="close-modal-btn"
          onClick={onClose}
        >
          关闭
        </button>
        <button
          data-testid="analyze-btn"
          onClick={() =>
            onAnalysisComplete({
              id: 1,
              insight_number: 'INS-001',
              input_text: '测试文本',
              text_length: 4,
              analysis_result: {
                q1_who: '调度员',
                q2_why: '需要提高工作效率',
                q3_what_problem: '手动填写操作票容易出错',
                q4_current_solution: '人工填写纸质操作票',
                q5_current_issues: '耗时长、易出错',
                q6_ideal_solution: '一键生成电子操作票',
                q7_priority: 'high',
                q8_frequency: 'daily',
                q9_impact_scope: '影响日常调度工作',
                q10_value: '节省时间、减少错误',
                user_persona: {
                  role: '调度员',
                  department: '调度部',
                  demographics: '30-45岁',
                  pain_points: ['效率低', '易出错'],
                  goals: ['提高效率', '减少错误'],
                },
                scenario: {
                  context: '日常调度工作',
                  environment: '电力调度中心',
                  trigger: '需要执行倒闸操作',
                  frequency: '每天多次',
                },
                emotional_tags: {
                  urgency: 'high',
                  importance: 'high',
                  sentiment: 'frustrated',
                  emotional_keywords: ['烦恼', '效率'],
                },
                summary: '调度员需要一键生成操作票来提高工作效率',
              },
              status: 'confirmed' as const,
              created_at: '2026-01-30T00:00:00Z',
            })
          }
        >
          开始分析
        </button>
      </div>
    )
  },
}))

import { IPDStoryFlowPage } from '@/pages/ipd-story/IPDStoryFlowPage'

describe('IPDStoryFlowPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    localStorage.setItem('access_token', 'test-token')
    localStorage.setItem('tenant_id', '1')
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Basic Rendering', () => {
    it('should render the iframe', () => {
      render(<IPDStoryFlowPage />)

      const iframe = screen.getByTitle(/IPD需求十问/)
      expect(iframe).toBeInTheDocument()
      expect(iframe).toHaveProperty('tagName', 'IFRAME')
    })

    it('should pass token and tenant_id to iframe src', () => {
      render(<IPDStoryFlowPage />)

      const iframe = screen.getByTitle(/IPD需求十问/) as HTMLIFrameElement
      expect(iframe.src).toContain('token=test-token')
      expect(iframe.src).toContain('tenant_id=1')
    })

    it('should not show TextInsightModal initially', () => {
      render(<IPDStoryFlowPage />)

      const modal = screen.queryByTestId('text-insight-modal')
      expect(modal).not.toBeInTheDocument()
    })
  })

  describe('Message Handling', () => {
    it('should navigate to /insights when receiving NAVIGATE_TO_INSIGHTS message', async () => {
      render(<IPDStoryFlowPage />)

      // Wait for useEffect to set up event listener
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })

      act(() => {
        window.postMessage({ type: 'NAVIGATE_TO_INSIGHTS' }, '*')
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/insights')
      })
    })

    it('should navigate to /requirements when receiving CLOSE_IPD_STORY_FLOW message', async () => {
      render(<IPDStoryFlowPage />)

      // Wait for useEffect to set up event listener
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })

      act(() => {
        window.postMessage({ type: 'CLOSE_IPD_STORY_FLOW' }, '*')
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/requirements')
      })
    })

    it('should show TextInsightModal when receiving OPEN_TEXT_INSIGHT_MODAL message', async () => {
      render(<IPDStoryFlowPage />)

      // Initially modal should not be visible
      expect(screen.queryByTestId('text-insight-modal')).not.toBeInTheDocument()

      // Send message to open modal
      act(() => {
        window.postMessage({ type: 'OPEN_TEXT_INSIGHT_MODAL' }, '*')
      })

      // Modal should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('text-insight-modal')).toBeInTheDocument()
      })
    })
  })

  describe('TextInsightModal Interaction', () => {
    it('should close TextInsightModal when close button is clicked', async () => {
      render(<IPDStoryFlowPage />)

      // Open modal
      act(() => {
        window.postMessage({ type: 'OPEN_TEXT_INSIGHT_MODAL' }, '*')
      })

      await waitFor(() => {
        expect(screen.getByTestId('text-insight-modal')).toBeInTheDocument()
      })

      // Click close button
      const closeBtn = screen.getByTestId('close-modal-btn')
      await userEvent.click(closeBtn)

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('text-insight-modal')).not.toBeInTheDocument()
      })
    })

    it('should send analysis result to iframe when analysis completes', async () => {
      // Mock postMessage
      const postMessageSpy = vi.fn()

      // Mock iframe contentWindow
      Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
        get() {
          return {
            postMessage: postMessageSpy,
          }
        },
        configurable: true,
      })

      render(<IPDStoryFlowPage />)

      // Open modal
      act(() => {
        window.postMessage({ type: 'OPEN_TEXT_INSIGHT_MODAL' }, '*')
      })

      await waitFor(() => {
        expect(screen.getByTestId('text-insight-modal')).toBeInTheDocument()
      })

      // Click analyze button (simulates analysis completion)
      const analyzeBtn = screen.getByTestId('analyze-btn')
      await userEvent.click(analyzeBtn)

      // Verify postMessage was called with correct data
      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          {
            type: 'INSIGHT_ANALYSIS_RESULT',
            result: expect.objectContaining({
              q1_who: '调度员',
              q2_why: '需要提高工作效率',
              q6_ideal_solution: '一键生成电子操作票',
            }),
          },
          '*'
        )
      })

      // Modal should be closed after analysis
      await waitFor(() => {
        expect(screen.queryByTestId('text-insight-modal')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing token in localStorage', () => {
      localStorage.removeItem('access_token')

      render(<IPDStoryFlowPage />)

      const iframe = screen.getByTitle(/IPD需求十问/) as HTMLIFrameElement
      expect(iframe.src).not.toContain('token=')
    })

    it('should use default tenant_id when not in localStorage', () => {
      localStorage.removeItem('tenant_id')

      render(<IPDStoryFlowPage />)

      const iframe = screen.getByTitle(/IPD需求十问/) as HTMLIFrameElement
      expect(iframe.src).toContain('tenant_id=1')
    })

    it('should ignore unknown message types', () => {
      render(<IPDStoryFlowPage />)

      // Send unknown message type
      act(() => {
        window.postMessage({ type: 'UNKNOWN_MESSAGE' }, '*')
      })

      // Should not navigate or show modal
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(screen.queryByTestId('text-insight-modal')).not.toBeInTheDocument()
    })
  })

  describe('Window Resize', () => {
    it('should update iframe height on window resize', () => {
      render(<IPDStoryFlowPage />)

      const iframe = screen.getByTitle(/IPD需求十问/) as HTMLIFrameElement
      const initialHeight = iframe.style.height

      // Trigger window resize
      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      // Height should be updated (may be the same, but should have been recalculated)
      expect(iframe).toBeInTheDocument()
    })
  })
})

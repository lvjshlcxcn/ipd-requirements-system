import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VotePanel } from '@/pages/review-center/components/VotePanel'
import type { VoteOption, CurrentVoter } from '@/types/review-meeting'
import { renderWithProviders } from '@/test/utils/render'

// Mock antd message
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

describe('VotePanel Component', () => {
  const mockOnSubmit = vi.fn()
  const mockOnNextVoter = vi.fn()

  const defaultProps = {
    selectedRequirementId: 1,
    onSubmit: mockOnSubmit,
    onNextVoter: mockOnNextVoter,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('TDD Phase 1: 未选择需求状态', () => {
    it('应该显示"请选择需求"提示（未选择需求时）', () => {
      renderWithProviders(<VotePanel {...defaultProps} selectedRequirementId={null} />)

      expect(screen.getByText('投票决策')).toBeInTheDocument()
      expect(screen.getByText('请从左侧选择一个需求进行投票')).toBeInTheDocument()
    })

    it('不应该显示投票选项（未选择需求时）', () => {
      renderWithProviders(<VotePanel {...defaultProps} selectedRequirementId={null} />)

      expect(screen.queryByText('支持通过')).not.toBeInTheDocument()
      expect(screen.queryByText('反对拒绝')).not.toBeInTheDocument()
      expect(screen.queryByText('弃权')).not.toBeInTheDocument()
    })
  })

  describe('TDD Phase 2: 投票完成状态', () => {
    it('应该显示投票完成状态', () => {
      renderWithProviders(<VotePanel {...defaultProps} isVotingComplete={true} />)

      expect(screen.getByText('所有投票已完成')).toBeInTheDocument()
      expect(screen.getByText('该需求的所有投票人已完成投票，请查看投票统计结果')).toBeInTheDocument()
    })

    it('应该显示完成图标', () => {
      render(<VotePanel {...defaultProps} isVotingComplete={true} />)

      const checkIcon = document.querySelector('.anticon-check-circle')
      expect(checkIcon).toBeInTheDocument()
    })

    it('不应该显示投票按钮（投票完成后）', () => {
      render(<VotePanel {...defaultProps} isVotingComplete={true} />)

      expect(screen.queryByText('提交投票')).not.toBeInTheDocument()
      expect(screen.queryByText('支持通过')).not.toBeInTheDocument()
    })
  })

  describe('TDD Phase 3: 投票选项显示', () => {
    it('应该显示三种投票选项', () => {
      render(<VotePanel {...defaultProps} />)

      expect(screen.getByText('支持通过')).toBeInTheDocument()
      expect(screen.getByText('反对拒绝')).toBeInTheDocument()
      expect(screen.getByText('弃权')).toBeInTheDocument()
    })

    it('应该显示评审意见输入框', () => {
      render(<VotePanel {...defaultProps} />)

      expect(screen.getByText('评审意见（可选）：')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('请输入您的评审意见...')).toBeInTheDocument()
    })

    it('应该显示提交按钮', () => {
      render(<VotePanel {...defaultProps} />)

      expect(screen.getByText('提交投票')).toBeInTheDocument()
    })

    it('应该显示"请选择您的立场"提示', () => {
      render(<VotePanel {...defaultProps} />)

      expect(screen.getByText('请选择您的立场：')).toBeInTheDocument()
    })
  })

  describe('TDD Phase 4: 已投票状态', () => {
    it('应该显示"已投票"标签（已投票时）', () => {
      render(<VotePanel {...defaultProps} existingVote="approve" />)

      expect(screen.getByText('已投票')).toBeInTheDocument()
    })

    it('应该禁用提交按钮（已投票后）', () => {
      render(<VotePanel {...defaultProps} existingVote="approve" />)

      const submitButton = screen.getByText('已投票')
      expect(submitButton).toBeDisabled()
    })

    it('应该禁用投票选项（已投票后）', () => {
      render(<VotePanel {...defaultProps} existingVote="approve" />)

      const approveRadio = screen.getByLabelText('支持通过')
      expect(approveRadio).toBeDisabled()
    })

    it('应该显示已选中的投票选项', () => {
      render(<VotePanel {...defaultProps} existingVote="approve" />)

      const approveRadio = screen.getByLabelText('支持通过')
      expect(approveRadio).toBeChecked()
    })
  })

  describe('TDD Phase 5: 当前投票人显示', () => {
    const mockCurrentVoter: CurrentVoter = {
      voter_id: 123,
      voter_name: 'John Doe',
      full_name: 'John Doe',
      started_at: '2026-02-05T10:00:00Z',
    }

    it('应该显示当前投票人信息', () => {
      render(
        <VotePanel {...defaultProps} currentVoter={mockCurrentVoter} currentUserId={123} />
      )

      expect(screen.getByText('轮到您投票了')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('应该显示"当前投票人"（非当前用户时）', () => {
      render(
        <VotePanel {...defaultProps} currentVoter={mockCurrentVoter} currentUserId={456} />
      )

      expect(screen.getByText('当前投票人')).toBeInTheDocument()
      expect(screen.getByText(/请等待.*John Doe.*完成投票/)).toBeInTheDocument()
    })

    it('应该高亮当前投票人名称', () => {
      render(
        <VotePanel {...defaultProps} currentVoter={mockCurrentVoter} currentUserId={123} />
      )

      const voterName = screen.getByText('John Doe')
      expect(voterName).toHaveStyle({ color: '#1890ff' })
    })
  })

  describe('TDD Phase 6: 投票禁用状态', () => {
    const mockCurrentVoter: CurrentVoter = {
      voter_id: 123,
      voter_name: 'John Doe',
      started_at: '2026-02-05T10:00:00Z',
    }

    it('应该禁用投票（非当前投票人）', () => {
      render(
        <VotePanel
          {...defaultProps}
          currentVoter={mockCurrentVoter}
          currentUserId={456}
          meetingStatus="in_progress"
        />
      )

      const approveRadio = screen.getByLabelText('支持通过')
      expect(approveRadio).toBeDisabled()
    })

    it('应该显示等待提示（非当前投票人）', () => {
      render(
        <VotePanel
          {...defaultProps}
          currentVoter={mockCurrentVoter}
          currentUserId={456}
          meetingStatus="in_progress"
        />
      )

      expect(screen.getByText(/请等待.*完成投票/)).toBeInTheDocument()
    })

    it('应该允许Admin投票（非当前投票人）', () => {
      render(
        <VotePanel
          {...defaultProps}
          currentVoter={mockCurrentVoter}
          currentUserId={456}
          isAdmin={true}
        />
      )

      const approveRadio = screen.getByLabelText('支持通过')
      expect(approveRadio).not.toBeDisabled()
    })

    it('应该禁用投票（会议未开始）', () => {
      render(
        <VotePanel
          {...defaultProps}
          currentVoter={mockCurrentVoter}
          currentUserId={123}
          meetingStatus="scheduled"
        />
      )

      const submitButton = screen.getByText('提交投票')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('TDD Phase 7: 投票提交功能', () => {
    it('应该阻止未选择选项的提交', async () => {
      const { antdMessage } = await import('antd')
      render(<VotePanel {...defaultProps} />)

      const submitButton = screen.getByText('提交投票')
      await userEvent.click(submitButton)

      expect(antdMessage.warning).toHaveBeenCalledWith('请选择投票选项')
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('应该成功提交通过投票', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      render(<VotePanel {...defaultProps} />)

      const approveRadio = screen.getByLabelText('支持通过')
      await userEvent.click(approveRadio)

      const submitButton = screen.getByText('提交投票')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('approve', undefined)
      })
    })

    it('应该成功提交拒绝投票', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      render(<VotePanel {...defaultProps} />)

      const rejectRadio = screen.getByLabelText('反对拒绝')
      await userEvent.click(rejectRadio)

      const submitButton = screen.getByText('提交投票')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('reject', undefined)
      })
    })

    it('应该成功提交弃权投票', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      render(<VotePanel {...defaultProps} />)

      const abstainRadio = screen.getByLabelText('弃权')
      await userEvent.click(abstainRadio)

      const submitButton = screen.getByText('提交投票')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('abstain', undefined)
      })
    })

    it('应该提交带评论的投票', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      render(<VotePanel {...defaultProps} />)

      const approveRadio = screen.getByLabelText('支持通过')
      await userEvent.click(approveRadio)

      const commentInput = screen.getByPlaceholderText('请输入您的评审意见...')
      await userEvent.type(commentInput, 'This is a test comment')

      const submitButton = screen.getByText('提交投票')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('approve', 'This is a test comment')
      })
    })

    it('应该显示加载状态（提交中）', async () => {
      mockOnSubmit.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<VotePanel {...defaultProps} />)

      const approveRadio = screen.getByLabelText('支持通过')
      await userEvent.click(approveRadio)

      const submitButton = screen.getByText('提交投票')
      await userEvent.click(submitButton)

      // Button should show loading state
      expect(submitButton).toHaveClass('ant-btn-loading')
    })

    it('应该处理提交失败', async () => {
      const { antdMessage } = await import('antd')
      const error = new Error('投票失败')
      mockOnSubmit.mockRejectedValueOnce(error)

      render(<VotePanel {...defaultProps} />)

      const approveRadio = screen.getByLabelText('支持通过')
      await userEvent.click(approveRadio)

      const submitButton = screen.getByText('提交投票')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(antdMessage.error).toHaveBeenCalledWith('投票失败')
      })
    })
  })

  describe('TDD Phase 8: 主持人控制', () => {
    it('应该显示"下一位"按钮（主持人）', () => {
      render(
        <VotePanel
          {...defaultProps}
          isModerator={true}
          currentVoter={{
            voter_id: 123,
            voter_name: 'John Doe',
            started_at: '2026-02-05T10:00:00Z',
          }}
        />
      )

      expect(screen.getByText('下一位投票人')).toBeInTheDocument()
    })

    it('不应该显示"下一位"按钮（非主持人）', () => {
      render(
        <VotePanel
          {...defaultProps}
          isModerator={false}
          currentVoter={{
            voter_id: 123,
            voter_name: 'John Doe',
            started_at: '2026-02-05T10:00:00Z',
          }}
        />
      )

      expect(screen.queryByText('下一位投票人')).not.toBeInTheDocument()
    })

    it('应该调用onNextVoter（点击"下一位"按钮时）', async () => {
      render(
        <VotePanel
          {...defaultProps}
          isModerator={true}
          currentVoter={{
            voter_id: 123,
            voter_name: 'John Doe',
            started_at: '2026-02-05T10:00:00Z',
          }}
        />
      )

      const nextButton = screen.getByText('下一位投票人')
      await userEvent.click(nextButton)

      expect(mockOnNextVoter).toHaveBeenCalled()
    })
  })

  describe('TDD Phase 9: 评论输入', () => {
    it('应该接受评论输入', async () => {
      render(<VotePanel {...defaultProps} />)

      const commentInput = screen.getByPlaceholderText('请输入您的评审意见...')
      await userEvent.type(commentInput, 'Test comment')

      expect(commentInput).toHaveValue('Test comment')
    })

    it('应该显示字符计数', () => {
      render(<VotePanel {...defaultProps} />)

      const commentInput = screen.getByPlaceholderText('请输入您的评审意见...')
      expect(commentInput).toHaveAttribute('maxLength', '500')
    })

    it('应该保留已有评论（切换需求时）', () => {
      const { rerender } = render(
        <VotePanel {...defaultProps} existingComment="Previous comment" />
      )

      const commentInput = screen.getByPlaceholderText('请输入您的评审意见...')
      expect(commentInput).toHaveValue('Previous comment')

      // Simulate prop change
      rerender(<VotePanel {...defaultProps} existingComment="Updated comment" />)
      expect(commentInput).toHaveValue('Updated comment')
    })
  })

  describe('TDD Phase 10: 边界情况', () => {
    it('应该处理空评论（提交时应该发送undefined）', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      render(<VotePanel {...defaultProps} />)

      const approveRadio = screen.getByLabelText('支持通过')
      await userEvent.click(approveRadio)

      const commentInput = screen.getByPlaceholderText('请输入您的评审意见...')
      await userEvent.type(commentInput, '   ') // Only spaces

      const submitButton = screen.getByText('提交投票')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('approve', undefined)
      })
    })

    it('应该处理disabled prop（全局禁用）', () => {
      render(<VotePanel {...defaultProps} disabled={true} />)

      const submitButton = screen.getByText('提交投票')
      expect(submitButton).toBeDisabled()

      const approveRadio = screen.getByLabelText('支持通过')
      expect(approveRadio).toBeDisabled()
    })

    it('应该正确同步existingVote和existingComment（prop变化时）', () => {
      const { rerender } = render(<VotePanel {...defaultProps} />)

      // Initially no vote
      expect(screen.getByLabelText('支持通过')).not.toBeChecked()

      // Update with existing vote
      rerender(
        <VotePanel
          {...defaultProps}
          existingVote="reject"
          existingComment="My reason"
        />
      )

      expect(screen.getByLabelText('反对拒绝')).toBeChecked()
      expect(screen.getByPlaceholderText('请输入您的评审意见...')).toHaveValue('My reason')
    })
  })
})

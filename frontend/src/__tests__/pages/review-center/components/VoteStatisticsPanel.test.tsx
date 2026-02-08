import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VoteStatisticsPanel } from '@/pages/review-center/components/VoteStatisticsPanel'
import type { VoteStatistics } from '@/types/review-meeting'

describe('VoteStatisticsPanel Component', () => {
  const mockStatistics: VoteStatistics = {
    requirement_id: 1,
    total_votes: 10,
    approve_count: 6,
    approve_percentage: 60.0,
    reject_count: 2,
    reject_percentage: 20.0,
    abstain_count: 2,
    abstain_percentage: 20.0,
    completion_percentage: 100.0,
    votes: [
      {
        voter_id: 1,
        voter_name: 'Alice Wang',
        vote_option: 'approve',
        comment: 'Good requirement',
        voted_at: '2026-02-05T10:00:00Z',
      },
      {
        voter_id: 2,
        voter_name: 'Bob Chen',
        vote_option: 'reject',
        comment: 'Needs clarification',
        voted_at: '2026-02-05T10:01:00Z',
      },
      {
        voter_id: 3,
        voter_name: 'Charlie Li',
        vote_option: 'abstain',
        voted_at: '2026-02-05T10:02:00Z',
      },
    ],
  }

  describe('TDD Phase 1: 空状态', () => {
    it('应该显示"暂无投票"（没有投票时）', () => {
      const emptyStats: VoteStatistics = {
        requirement_id: 1,
        total_votes: 0,
        approve_count: 0,
        approve_percentage: 0,
        reject_count: 0,
        reject_percentage: 0,
        abstain_count: 0,
        abstain_percentage: 0,
        completion_percentage: 0,
        votes: [],
      }

      render(<VoteStatisticsPanel statistics={emptyStats} />)

      expect(screen.getByText('暂无投票')).toBeInTheDocument()
    })

    it('不应该显示投票详情（空状态时）', () => {
      const emptyStats: VoteStatistics = {
        requirement_id: 1,
        total_votes: 0,
        approve_count: 0,
        approve_percentage: 0,
        reject_count: 0,
        reject_percentage: 0,
        abstain_count: 0,
        abstain_percentage: 0,
        completion_percentage: 0,
        votes: [],
      }

      render(<VoteStatisticsPanel statistics={emptyStats} />)

      expect(screen.queryByText('投票详情')).not.toBeInTheDocument()
      expect(screen.queryByText('支持通过')).not.toBeInTheDocument()
    })
  })

  describe('TDD Phase 2: 投票统计显示', () => {
    it('应该显示总票数', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      expect(screen.getByText('共 10 票')).toBeInTheDocument()
    })

    it('应该显示"投票统计"标题', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      expect(screen.getByText('投票统计')).toBeInTheDocument()
    })

    it('应该显示三种投票类型的统计', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      expect(screen.getByText(/支持通过.*\(6\)/)).toBeInTheDocument()
      expect(screen.getByText(/反对拒绝.*\(2\)/)).toBeInTheDocument()
      expect(screen.getByText(/弃权.*\(2\)/)).toBeInTheDocument()
    })

    it('应该显示百分比', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      expect(screen.getByText('60.0%')).toBeInTheDocument()
      expect(screen.getByText('20.0%')).toBeInTheDocument()
      // 20.0% appears twice (reject and abstain)
      const percentages = screen.getAllByText('20.0%')
      expect(percentages).toHaveLength(2)
    })
  })

  describe('TDD Phase 3: 进度条显示', () => {
    it('应该显示三个进度条', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      const progressBars = document.querySelectorAll('.ant-progress')
      expect(progressBars.length).toBe(3)
    })

    it('应该正确显示进度条百分比', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      const progressBars = document.querySelectorAll('.ant-progress')
      const firstBar = progressBars[0]

      // Check if the progress bar has the correct percent
      expect(firstBar.getAttribute('aria-valuenow')).toBe('60')
    })

    it('应该使用正确的颜色（通过=绿色）', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      const approveText = screen.getByText(/支持通过/)
      expect(approveText.closest('div')).toHaveStyle({ color: '#52c41a' })
    })

    it('应该使用正确的颜色（拒绝=红色）', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      const rejectText = screen.getByText(/反对拒绝/)
      expect(rejectText.closest('div')).toHaveStyle({ color: '#ff4d4f' })
    })

    it('应该使用正确的颜色（弃权=黄色）', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      const abstainText = screen.getByText(/弃权/)
      expect(abstainText.closest('div')).toHaveStyle({ color: '#faad14' })
    })
  })

  describe('TDD Phase 4: 投票详情列表', () => {
    it('应该显示"投票详情"标题', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      expect(screen.getByText('投票详情')).toBeInTheDocument()
    })

    it('应该显示所有投票人', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      expect(screen.getByText('Alice Wang')).toBeInTheDocument()
      expect(screen.getByText('Bob Chen')).toBeInTheDocument()
      expect(screen.getByText('Charlie Li')).toBeInTheDocument()
    })

    it('应该显示投票标签', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      expect(screen.getByText('支持通过')).toBeInTheDocument()
      expect(screen.getByText('反对拒绝')).toBeInTheDocument()
      expect(screen.getByText('弃权')).toBeInTheDocument()
    })

    it('应该显示评论（有评论时）', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      expect(screen.getByText('Good requirement')).toBeInTheDocument()
      expect(screen.getByText('Needs clarification')).toBeInTheDocument()
    })

    it('应该显示"无意见"（没有评论时）', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      expect(screen.getByText('无意见')).toBeInTheDocument()
    })

    it('应该显示投票人头像（首字母）', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      // Alice Wang -> A
      const aliceAvatar = screen.getByText('A')
      expect(aliceAvatar).toBeInTheDocument()

      // Bob Chen -> B
      const bobAvatar = screen.getByText('B')
      expect(bobAvatar).toBeInTheDocument()
    })
  })

  describe('TDD Phase 5: 边界情况', () => {
    it('应该处理只有一种投票类型的情况', () => {
      const singleTypeStats: VoteStatistics = {
        requirement_id: 1,
        total_votes: 5,
        approve_count: 5,
        approve_percentage: 100.0,
        reject_count: 0,
        reject_percentage: 0,
        abstain_count: 0,
        abstain_percentage: 0,
        completion_percentage: 100.0,
        votes: [
          {
            voter_id: 1,
            voter_name: 'Alice',
            vote_option: 'approve',
            voted_at: '2026-02-05T10:00:00Z',
          },
        ],
      }

      render(<VoteStatisticsPanel statistics={singleTypeStats} />)

      expect(screen.getByText('100.0%')).toBeInTheDocument()
      expect(screen.getByText(/支持通过.*\(5\)/)).toBeInTheDocument()
    })

    it('应该处理小数百分比（非整数）', () => {
      const decimalStats: VoteStatistics = {
        ...mockStatistics,
        approve_percentage: 66.666666,
        reject_percentage: 16.666666,
        abstain_percentage: 16.666668,
      }

      render(<VoteStatisticsPanel statistics={decimalStats} />)

      expect(screen.getByText('66.7%')).toBeInTheDocument()
      expect(screen.getByText('16.7%')).toBeInTheDocument()
    })

    it('应该处理没有投票人姓名的情况', () => {
      const noNameStats: VoteStatistics = {
        ...mockStatistics,
        votes: [
          {
            voter_id: 1,
            voter_name: '',
            vote_option: 'approve',
            voted_at: '2026-02-05T10:00:00Z',
          },
        ],
      }

      render(<VoteStatisticsPanel statistics={noNameStats} />)

      const avatar = screen.getByText('?')
      expect(avatar).toBeInTheDocument()
    })

    it('应该处理超长评论（显示截断）', () => {
      const longCommentStats: VoteStatistics = {
        ...mockStatistics,
        votes: [
          {
            voter_id: 1,
            voter_name: 'Alice',
            vote_option: 'approve',
            comment: 'A'.repeat(500),
            voted_at: '2026-02-05T10:00:00Z',
          },
        ],
      }

      render(<VoteStatisticsPanel statistics={longCommentStats} />)

      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument()
    })
  })

  describe('TDD Phase 6: Props响应性', () => {
    it('应该更新统计（props变化时）', () => {
      const { rerender } = render(<VoteStatisticsPanel statistics={mockStatistics} />)

      expect(screen.getByText('共 10 票')).toBeInTheDocument()

      const updatedStats: VoteStatistics = {
        ...mockStatistics,
        total_votes: 15,
        approve_count: 10,
        approve_percentage: 66.666666,
      }

      rerender(<VoteStatisticsPanel statistics={updatedStats} />)

      expect(screen.getByText('共 15 票')).toBeInTheDocument()
      expect(screen.getByText('66.7%')).toBeInTheDocument()
    })

    it('应该从空状态转换到有数据状态', () => {
      const emptyStats: VoteStatistics = {
        requirement_id: 1,
        total_votes: 0,
        approve_count: 0,
        approve_percentage: 0,
        reject_count: 0,
        reject_percentage: 0,
        abstain_count: 0,
        abstain_percentage: 0,
        completion_percentage: 0,
        votes: [],
      }

      const { rerender } = render(<VoteStatisticsPanel statistics={emptyStats} />)

      expect(screen.getByText('暂无投票')).toBeInTheDocument()

      rerender(<VoteStatisticsPanel statistics={mockStatistics} />)

      expect(screen.queryByText('暂无投票')).not.toBeInTheDocument()
      expect(screen.getByText('投票详情')).toBeInTheDocument()
    })
  })

  describe('TDD Phase 7: 列表项样式', () => {
    it('应该正确渲染头像颜色（通过投票）', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      // Alice voted approve (green)
      const avatars = document.querySelectorAll('.ant-avatar')
      const aliceAvatar = Array.from(avatars).find(a => a.textContent === 'A')
      expect(aliceAvatar).toHaveStyle({ backgroundColor: '#52c41a' })
    })

    it('应该正确渲染头像颜色（拒绝投票）', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      // Bob voted reject (red)
      const avatars = document.querySelectorAll('.ant-avatar')
      const bobAvatar = Array.from(avatars).find(a => a.textContent === 'B')
      expect(bobAvatar).toHaveStyle({ backgroundColor: '#ff4d4f' })
    })

    it('应该正确渲染头像颜色（弃权投票）', () => {
      render(<VoteStatisticsPanel statistics={mockStatistics} />)

      // Charlie voted abstain (yellow)
      const avatars = document.querySelectorAll('.ant-avatar')
      const charlieAvatar = Array.from(avatars).find(a => a.textContent === 'C')
      expect(charlieAvatar).toHaveStyle({ backgroundColor: '#faad14' })
    })
  })

  describe('TDD Phase 8: 特殊字符处理', () => {
    it('应该处理投票人姓名中的特殊字符', () => {
      const specialCharsStats: VoteStatistics = {
        ...mockStatistics,
        votes: [
          {
            voter_id: 1,
            voter_name: '张三-Test',
            vote_option: 'approve',
            comment: 'Special chars: @#$%',
            voted_at: '2026-02-05T10:00:00Z',
          },
        ],
      }

      render(<VoteStatisticsPanel statistics={specialCharsStats} />)

      expect(screen.getByText('张三-Test')).toBeInTheDocument()
      expect(screen.getByText(/Special chars:/)).toBeInTheDocument()
    })

    it('应该处理投票人姓名为null或undefined', () => {
      const nullNameStats: VoteStatistics = {
        ...mockStatistics,
        votes: [
          {
            voter_id: 1,
            voter_name: null as unknown as string,
            vote_option: 'approve',
            voted_at: '2026-02-05T10:00:00Z',
          },
        ],
      }

      render(<VoteStatisticsPanel statistics={nullNameStats} />)

      // Should show '?' for null name
      const avatar = screen.getByText('?')
      expect(avatar).toBeInTheDocument()
    })
  })
})

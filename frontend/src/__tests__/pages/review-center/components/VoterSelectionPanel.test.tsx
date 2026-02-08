import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoterSelectionPanel } from '@/pages/review-center/components/VoterSelectionPanel'
import type { Attendee } from '@/types/review-meeting'
import reviewMeetingService from '@/services/reviewMeeting.service'
import { renderWithProviders } from '@/test/utils/render'

// Mock the service
vi.mock('@/services/reviewMeeting.service', () => ({
  default: {
    getVoterStatus: vi.fn(),
    updateAssignedVoters: vi.fn(),
  },
}))

describe('VoterSelectionPanel Component', () => {
  const mockAttendees: Attendee[] = [
    {
      id: 1,
      meeting_id: 1,
      attendee_id: 101,
      attendance_status: 'attended',
      tenant_id: 1,
      created_at: '2026-02-05T10:00:00Z',
      updated_at: '2026-02-05T10:00:00Z',
      user: {
        id: 101,
        username: 'alice',
        email: 'alice@example.com',
        full_name: 'Alice Wang',
      },
    },
    {
      id: 2,
      meeting_id: 1,
      attendee_id: 102,
      attendance_status: 'attended',
      tenant_id: 1,
      created_at: '2026-02-05T10:00:00Z',
      updated_at: '2026-02-05T10:00:00Z',
      user: {
        id: 102,
        username: 'bob',
        email: 'bob@example.com',
        full_name: 'Bob Chen',
      },
    },
    {
      id: 3,
      meeting_id: 1,
      attendee_id: 103,
      attendance_status: 'attended',
      tenant_id: 1,
      created_at: '2026-02-05T10:00:00Z',
      updated_at: '2026-02-05T10:00:00Z',
      user: {
        id: 103,
        username: 'charlie',
        email: 'charlie@example.com',
        full_name: 'Charlie Li',
      },
    },
  ]

  const mockVoterStatusData = {
    requirement_id: 1,
    assigned_voter_ids: [101, 102],
    voters: [
      {
        attendee_id: 101,
        username: 'alice',
        full_name: 'Alice Wang',
        has_voted: true,
        vote_option: 'approve',
        voted_at: '2026-02-05T10:00:00Z',
      },
      {
        attendee_id: 102,
        username: 'bob',
        full_name: 'Bob Chen',
        has_voted: false,
      },
      {
        attendee_id: 103,
        username: 'charlie',
        full_name: 'Charlie Li',
        has_voted: false,
      },
    ],
    total_assigned: 2,
    total_voted: 1,
    is_complete: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(reviewMeetingService.getVoterStatus).mockResolvedValue({
      success: true,
      data: mockVoterStatusData,
    })

    vi.mocked(reviewMeetingService.updateAssignedVoters).mockResolvedValue({
      success: true,
      data: mockVoterStatusData,
    })
  })

  describe('TDD Phase 1: 未选择需求状态', () => {
    it('应该显示"请先选择需求"提示（未选择需求时）', () => {
      renderWithProviders(
        <VoterSelectionPanel
          meetingId={1}
          requirementId={null}
          attendees={mockAttendees}
          canControl={true}
        />
      )

      expect(screen.getByText('投票人员')).toBeInTheDocument()
      expect(screen.getByText('请先选择一个需求')).toBeInTheDocument()
    })
  })

  describe('TDD Phase 2: 加载状态', () => {
    it('应该显示加载动画（数据加载中）', () => {
      vi.mocked(reviewMeetingService.getVoterStatus).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      const spinner = document.querySelector('.ant-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('TDD Phase 3: 投票人员显示', () => {
    it('应该显示投票进度', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('投票进度')).toBeInTheDocument()
      })

      const progressBar = document.querySelector('.ant-progress')
      expect(progressBar).toBeInTheDocument()
    })

    it('应该显示已投票/总数标签', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('1/2')).toBeInTheDocument()
      })
    })

    it('应该显示所有投票人员', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('Alice Wang')).toBeInTheDocument()
        expect(screen.getByText('Bob Chen')).toBeInTheDocument()
      })
    })

    it('应该显示队列序号', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('1/2')).toBeInTheDocument()
        expect(screen.getByText('2/2')).toBeInTheDocument()
      })
    })
  })

  describe('TDD Phase 4: 投票状态显示', () => {
    it('应该显示"已投票"标签（已投票的用户）', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('通过')).toBeInTheDocument()
      })
    })

    it('应该显示"等待中"标签（未投票的用户）', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        const waitingTags = screen.getAllByText('等待中')
        expect(waitingTags.length).toBeGreaterThan(0)
      })
    })

    it('应该显示"投票中"标签（当前投票人）', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
            currentVoterId={102}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('投票中')).toBeInTheDocument()
      })
    })

    it('应该高亮当前投票人', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
            currentVoterId={102}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('Bob Chen (当前)')).toBeInTheDocument()
      })
    })
  })

  describe('TDD Phase 5: 投票完成状态', () => {
    it('应该显示"投票完成"标签（所有投票完成后）', async () => {
      const completedData = {
        ...mockVoterStatusData,
        is_complete: true,
        total_voted: 2,
        voters: mockVoterStatusData.voters.map(v => ({
          ...v,
          has_voted: true,
          vote_option: 'approve',
        })),
      }

      vi.mocked(reviewMeetingService.getVoterStatus).mockResolvedValue({
        success: true,
        data: completedData,
      })

      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('投票完成')).toBeInTheDocument()
      })
    })

    it('应该显示成功进度条（投票完成后）', async () => {
      const completedData = {
        ...mockVoterStatusData,
        is_complete: true,
        total_voted: 2,
        voters: mockVoterStatusData.voters.map(v => ({
          ...v,
          has_voted: true,
          vote_option: 'approve',
        })),
      }

      vi.mocked(reviewMeetingService.getVoterStatus).mockResolvedValue({
        success: true,
        data: completedData,
      })

      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        const progressBar = document.querySelector('.ant-progress-status-success')
        expect(progressBar).toBeInTheDocument()
      })
    })
  })

  describe('TDD Phase 6: 投票人员选择功能', () => {
    it('应该允许主持人选择投票人员', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('Alice Wang')).toBeInTheDocument()
      })

      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('不应该显示复选框（非主持人）', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={false}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('Alice Wang')).toBeInTheDocument()
      })

      // No checkboxes for non-moderator
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(0)
    })

    it('应该禁用已投票用户的复选框', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('Alice Wang')).toBeInTheDocument()
      })

      // Alice has voted, her checkbox should be disabled
      const checkboxes = document.querySelectorAll('input[type="checkbox"]:disabled')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('应该调用updateAssignedVoters（点击复选框时）', async () => {
      const { antdMessage } = await import('antd')

      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('Alice Wang')).toBeInTheDocument()
      })

      const checkbox = document.querySelectorAll('input[type="checkbox"]')[0]
      if (checkbox && !checkbox.disabled) {
        await userEvent.click(checkbox)

        await waitFor(() => {
          expect(reviewMeetingService.updateAssignedVoters).toHaveBeenCalled()
        })
      }
    })
  })

  describe('TDD Phase 7: 尚未设置投票人员状态', () => {
    it('应该显示"尚未设置投票人员"（没有投票人员时）', async () => {
      const emptyData = {
        ...mockVoterStatusData,
        assigned_voter_ids: [],
        voters: [],
        total_assigned: 0,
        total_voted: 0,
      }

      vi.mocked(reviewMeetingService.getVoterStatus).mockResolvedValue({
        success: true,
        data: emptyData,
      })

      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('尚未设置投票人员')).toBeInTheDocument()
      })
    })

    it('应该显示参会人员列表（主持人未设置投票人员时）', async () => {
      const emptyData = {
        ...mockVoterStatusData,
        assigned_voter_ids: [],
        voters: [],
        total_assigned: 0,
        total_voted: 0,
      }

      vi.mocked(reviewMeetingService.getVoterStatus).mockResolvedValue({
        success: true,
        data: emptyData,
      })

      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('参会人员列表：')).toBeInTheDocument()
        expect(screen.getByText('Alice Wang')).toBeInTheDocument()
      })
    })

    it('应该显示"请等待主持人设置投票人员"（非主持人）', async () => {
      const emptyData = {
        ...mockVoterStatusData,
        assigned_voter_ids: [],
        voters: [],
        total_assigned: 0,
        total_voted: 0,
      }

      vi.mocked(reviewMeetingService.getVoterStatus).mockResolvedValue({
        success: true,
        data: emptyData,
      })

      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={false}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('请等待主持人设置投票人员')).toBeInTheDocument()
      })
    })
  })

  describe('TDD Phase 8: 错误处理', () => {
    it('应该处理API调用失败', async () => {
      const { antdMessage } = await import('antd')

      vi.mocked(reviewMeetingService.updateAssignedVoters).mockRejectedValue(
        new Error('更新失败')
      )

      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText('Alice Wang')).toBeInTheDocument()
      })

      const checkbox = document.querySelectorAll('input[type="checkbox"]')[1]
      if (checkbox && !checkbox.disabled) {
        await userEvent.click(checkbox)

        await waitFor(() => {
          expect(antdMessage.error).toHaveBeenCalledWith('更新失败')
        }, { timeout: 3000 })
      }
    })
  })

  describe('TDD Phase 9: 实时更新', () => {
    it('应该每5秒刷新一次投票状态', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(reviewMeetingService.getVoterStatus).toHaveBeenCalled()
      })

      // Wait for refetch (5 seconds)
      await waitFor(
        () => {
          expect(reviewMeetingService.getVoterStatus).toHaveBeenCalledTimes(2)
        },
        { timeout: 6000 }
      )
    })
  })

  describe('TDD Phase 10: 提示信息', () => {
    it('应该显示操作提示（主持人）', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={true}
          />
        )

      await waitFor(() => {
        expect(screen.getByText(/提示：勾选参会人员设为投票人员/)).toBeInTheDocument()
      })
    })

    it('不应该显示操作提示（非主持人）', async () => {
      renderWithProviders(
          <VoterSelectionPanel
            meetingId={1}
            requirementId={1}
            attendees={mockAttendees}
            canControl={false}
          />
        )

      await waitFor(() => {
        expect(screen.queryByText(/提示：勾选参会人员设为投票人员/)).not.toBeInTheDocument()
      })
    })
  })
})

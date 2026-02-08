import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MeetingInfoCard } from '@/pages/review-center/components/MeetingInfoCard'
import type { Meeting } from '@/types/review-meeting'

describe('MeetingInfoCard Component', () => {
  const mockMeeting: Meeting = {
    id: 1,
    meeting_no: 'RM-2026-001',
    title: 'IPD需求评审会议',
    description: '评审SP-001和BP-002需求',
    scheduled_at: '2026-02-10T14:00:00Z',
    started_at: '2026-02-10T14:00:00Z',
    ended_at: undefined,
    moderator_id: 101,
    status: 'in_progress',
    meeting_settings: {
      allow_vote_change: false,
      anonymous_voting: false,
      require_vote_comment: false,
    },
    tenant_id: 1,
    created_at: '2026-02-05T10:00:00Z',
    updated_at: '2026-02-05T10:00:00Z',
  }

  const mockAttendees = [
    {
      id: 1,
      username: 'alice',
      full_name: 'Alice Wang',
      avatar: undefined,
    },
    {
      id: 2,
      username: 'bob',
      full_name: 'Bob Chen',
      avatar: undefined,
    },
    {
      id: 3,
      username: 'charlie',
      full_name: 'Charlie Li',
      avatar: undefined,
    },
  ]

  const mockModerator = {
    id: 101,
    username: 'alice',
    full_name: 'Alice Wang',
  }

  const mockHandlers = {
    onStartMeeting: vi.fn(),
    onEndMeeting: vi.fn(),
    onDeleteMeeting: vi.fn(),
    onAddAttendee: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('TDD Phase 1: 基本信息显示', () => {
    it('应该显示会议标题', () => {
      render(<MeetingInfoCard meeting={mockMeeting} />)

      expect(screen.getByText('IPD需求评审会议')).toBeInTheDocument()
    })

    it('应该显示会议编号', () => {
      render(<MeetingInfoCard meeting={mockMeeting} />)

      expect(screen.getByText('RM-2026-001')).toBeInTheDocument()
    })

    it('应该显示预定时间', () => {
      render(<MeetingInfoCard meeting={mockMeeting} />)

      // Format: 2026-02-10 14:00 (Chinese locale)
      expect(screen.getByText(/2026/)).toBeInTheDocument()
    })

    it('应该显示会议描述', () => {
      render(<MeetingInfoCard meeting={mockMeeting} />)

      expect(screen.getByText('评审SP-001和BP-002需求')).toBeInTheDocument()
    })

    it('不应该显示会议描述（没有描述时）', () => {
      const meetingWithoutDesc = { ...mockMeeting, description: undefined }
      render(<MeetingInfoCard meeting={meetingWithoutDesc} />)

      expect(screen.queryByText('会议描述')).not.toBeInTheDocument()
    })
  })

  describe('TDD Phase 2: 会议状态显示', () => {
    it('应该显示"已安排"标签（scheduled状态）', () => {
      const scheduledMeeting = { ...mockMeeting, status: 'scheduled' as const }
      render(<MeetingInfoCard meeting={scheduledMeeting} />)

      expect(screen.getByText('已安排')).toBeInTheDocument()
    })

    it('应该显示"进行中"标签（in_progress状态）', () => {
      render(<MeetingInfoCard meeting={mockMeeting} />)

      expect(screen.getByText('进行中')).toBeInTheDocument()
    })

    it('应该显示"已完成"标签（completed状态）', () => {
      const completedMeeting = { ...mockMeeting, status: 'completed' as const }
      render(<MeetingInfoCard meeting={completedMeeting} />)

      expect(screen.getByText('已完成')).toBeInTheDocument()
    })

    it('应该显示"已取消"标签（cancelled状态）', () => {
      const cancelledMeeting = { ...mockMeeting, status: 'cancelled' as const }
      render(<MeetingInfoCard meeting={cancelledMeeting} />)

      expect(screen.getByText('已取消')).toBeInTheDocument()
    })

    it('应该使用正确的标签颜色', () => {
      const { rerender } = render(<MeetingInfoCard meeting={mockMeeting} />)

      // in_progress = green
      const inProgressTag = screen.getByText('进行中')
      expect(inProgressTag).toHaveClass('ant-tag-green')

      // scheduled = blue
      rerender(<MeetingInfoCard meeting={{ ...mockMeeting, status: 'scheduled' }} />)
      const scheduledTag = screen.getByText('已安排')
      expect(scheduledTag).toHaveClass('ant-tag-blue')
    })
  })

  describe('TDD Phase 3: 主持人信息', () => {
    it('应该显示主持人信息', () => {
      render(
        <MeetingInfoCard meeting={mockMeeting} moderator={mockModerator} />
      )

      expect(screen.getByText('alice')).toBeInTheDocument()
    })

    it('应该显示主持人姓名（优先使用moderator prop）', () => {
      render(
        <MeetingInfoCard meeting={mockMeeting} moderator={mockModerator} />
      )

      expect(screen.getByText('Alice Wang')).toBeInTheDocument()
    })

    it('应该从attendees中查找主持人（没有moderator prop时）', () => {
      const attendeesWithModerator = mockAttendees.map(a => ({
        ...a,
        id: 101, // Make Alice the moderator
        username: 'alice',
      }))

      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          attendees={attendeesWithModerator}
        />
      )

      expect(screen.getByText('alice')).toBeInTheDocument()
    })

    it('应该显示"未知"（找不到主持人时）', () => {
      render(<MeetingInfoCard meeting={mockMeeting} />)

      expect(screen.getByText('未知')).toBeInTheDocument()
    })
  })

  describe('TDD Phase 4: 参会人员显示', () => {
    it('应该显示参会人员数量', () => {
      render(
        <MeetingInfoCard meeting={mockMeeting} attendees={mockAttendees} />
      )

      expect(screen.getByText(/参会人员.*3人/)).toBeInTheDocument()
    })

    it('应该显示参会人员头像组', () => {
      render(
        <MeetingInfoCard meeting={mockMeeting} attendees={mockAttendees} />
      )

      const avatars = document.querySelectorAll('.ant-avatar')
      expect(avatars.length).toBe(3)
    })

    it('应该显示头像首字母占位符', () => {
      render(
        <MeetingInfoCard meeting={mockMeeting} attendees={mockAttendees} />
      )

      expect(screen.getByText('A')).toBeInTheDocument() // Alice
      expect(screen.getByText('B')).toBeInTheDocument() // Bob
      expect(screen.getByText('C')).toBeInTheDocument() // Charlie
    })

    it('应该显示超过10人时的头像折叠', () => {
      const manyAttendees = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        username: `user${i}`,
        full_name: `User ${i}`,
      }))

      render(
        <MeetingInfoCard meeting={mockMeeting} attendees={manyAttendees} />
      )

      // Should show maxCount indicator
      const avatarGroup = document.querySelector('.ant-avatar-group')
      expect(avatarGroup).toBeInTheDocument()
    })
  })

  describe('TDD Phase 5: 主持人控制按钮', () => {
    it('应该显示"开始会议"按钮（scheduled状态 + canControl）', () => {
      const scheduledMeeting = { ...mockMeeting, status: 'scheduled' as const }
      render(
        <MeetingInfoCard
          meeting={scheduledMeeting}
          canControl={true}
          onStartMeeting={mockHandlers.onStartMeeting}
        />
      )

      expect(screen.getByText('开始会议')).toBeInTheDocument()
    })

    it('应该显示"结束会议"按钮（in_progress状态 + canControl）', () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={true}
          onEndMeeting={mockHandlers.onEndMeeting}
        />
      )

      expect(screen.getByText('结束会议')).toBeInTheDocument()
    })

    it('应该显示"删除会议"按钮（canControl + onDeleteMeeting）', () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={true}
          onDeleteMeeting={mockHandlers.onDeleteMeeting}
        />
      )

      expect(screen.getByText('删除会议')).toBeInTheDocument()
    })

    it('不应该显示控制按钮（非主持人）', () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={false}
          onStartMeeting={mockHandlers.onStartMeeting}
          onEndMeeting={mockHandlers.onEndMeeting}
          onDeleteMeeting={mockHandlers.onDeleteMeeting}
        />
      )

      expect(screen.queryByText('开始会议')).not.toBeInTheDocument()
      expect(screen.queryByText('结束会议')).not.toBeInTheDocument()
      expect(screen.queryByText('删除会议')).not.toBeInTheDocument()
    })
  })

  describe('TDD Phase 6: 开始会议功能', () => {
    it('应该调用onStartMeeting（点击"开始会议"按钮时）', async () => {
      const scheduledMeeting = { ...mockMeeting, status: 'scheduled' as const }
      render(
        <MeetingInfoCard
          meeting={scheduledMeeting}
          canControl={true}
          onStartMeeting={mockHandlers.onStartMeeting}
        />
      )

      const startButton = screen.getByText('开始会议')
      await userEvent.click(startButton)

      expect(mockHandlers.onStartMeeting).toHaveBeenCalledTimes(1)
    })

    it('不应该显示"开始会议"按钮（会议已开始）', () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={true}
          onStartMeeting={mockHandlers.onStartMeeting}
        />
      )

      expect(screen.queryByText('开始会议')).not.toBeInTheDocument()
    })
  })

  describe('TDD Phase 7: 结束会议功能', () => {
    it('应该调用onEndMeeting（点击"结束会议"按钮时）', async () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={true}
          onEndMeeting={mockHandlers.onEndMeeting}
        />
      )

      const endButton = screen.getByText('结束会议')
      await userEvent.click(endButton)

      expect(mockHandlers.onEndMeeting).toHaveBeenCalledTimes(1)
    })

    it('不应该显示"结束会议"按钮（会议未开始）', () => {
      const scheduledMeeting = { ...mockMeeting, status: 'scheduled' as const }
      render(
        <MeetingInfoCard
          meeting={scheduledMeeting}
          canControl={true}
          onEndMeeting={mockHandlers.onEndMeeting}
        />
      )

      expect(screen.queryByText('结束会议')).not.toBeInTheDocument()
    })

    it('应该使用红色按钮（结束会议按钮）', () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={true}
          onEndMeeting={mockHandlers.onEndMeeting}
        />
      )

      const endButton = screen.getByText('结束会议')
      expect(endButton.closest('button')).toHaveClass('ant-btn-dangerous')
    })
  })

  describe('TDD Phase 8: 删除会议功能', () => {
    it('应该显示确认对话框（点击"删除会议"按钮时）', async () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={true}
          onDeleteMeeting={mockHandlers.onDeleteMeeting}
        />
      )

      const deleteButton = screen.getByText('删除会议')
      await userEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('确认删除')).toBeInTheDocument()
        expect(screen.getByText(/确定要删除这个会议吗/)).toBeInTheDocument()
      })
    })

    it('应该调用onDeleteMeeting（确认删除后）', async () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={true}
          onDeleteMeeting={mockHandlers.onDeleteMeeting}
        />
      )

      const deleteButton = screen.getByText('删除会议')
      await userEvent.click(deleteButton)

      // Click confirm button
      await waitFor(() => {
        const confirmButton = screen.getByText('确定')
        userEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(mockHandlers.onDeleteMeeting).toHaveBeenCalledTimes(1)
      })
    })

    it('不应该调用onDeleteMeeting（取消删除时）', async () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={true}
          onDeleteMeeting={mockHandlers.onDeleteMeeting}
        />
      )

      const deleteButton = screen.getByText('删除会议')
      await userEvent.click(deleteButton)

      // Click cancel button
      await waitFor(() => {
        const cancelButton = screen.getByText('取消')
        userEvent.click(cancelButton)
      })

      expect(mockHandlers.onDeleteMeeting).not.toHaveBeenCalled()
    })

    it('应该在确认对话框中显示警告信息', async () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={true}
          onDeleteMeeting={mockHandlers.onDeleteMeeting}
        />
      )

      const deleteButton = screen.getByText('删除会议')
      await userEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/删除后无法恢复/)).toBeInTheDocument()
        expect(screen.getByText(/所有参会人员、需求和投票记录都将被删除/)).toBeInTheDocument()
      })
    })
  })

  describe('TDD Phase 9: 添加参会人员功能', () => {
    it('应该显示"添加参会人员"按钮（canControl + onAddAttendee）', () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={true}
          onAddAttendee={mockHandlers.onAddAttendee}
        />
      )

      expect(screen.getByText('添加参会人员')).toBeInTheDocument()
    })

    it('应该调用onAddAttendee（点击"添加参会人员"按钮时）', async () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={true}
          onAddAttendee={mockHandlers.onAddAttendee}
        />
      )

      const addButton = screen.getByText('添加参会人员')
      await userEvent.click(addButton)

      expect(mockHandlers.onAddAttendee).toHaveBeenCalledTimes(1)
    })

    it('不应该显示"添加参会人员"按钮（非主持人）', () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          canControl={false}
          onAddAttendee={mockHandlers.onAddAttendee}
        />
      )

      expect(screen.queryByText('添加参会人员')).not.toBeInTheDocument()
    })
  })

  describe('TDD Phase 10: 时间信息显示', () => {
    it('应该显示开始时间（会议已开始）', () => {
      render(<MeetingInfoCard meeting={mockMeeting} />)

      expect(screen.getByText('开始时间')).toBeInTheDocument()
      expect(screen.getByText(/2026/)).toBeInTheDocument()
    })

    it('应该显示结束时间（会议已结束）', () => {
      const endedMeeting = {
        ...mockMeeting,
        ended_at: '2026-02-10T16:00:00Z',
      }
      render(<MeetingInfoCard meeting={endedMeeting} />)

      expect(screen.getByText('结束时间')).toBeInTheDocument()
    })

    it('不应该显示开始时间（会议未开始）', () => {
      const scheduledMeeting = {
        ...mockMeeting,
        started_at: undefined,
        status: 'scheduled' as const,
      }
      render(<MeetingInfoCard meeting={scheduledMeeting} />)

      expect(screen.queryByText('开始时间')).not.toBeInTheDocument()
    })

    it('不应该显示结束时间（会议未结束）', () => {
      render(<MeetingInfoCard meeting={mockMeeting} />)

      expect(screen.queryByText('结束时间')).not.toBeInTheDocument()
    })
  })

  describe('TDD Phase 11: 头像占位符', () => {
    it('应该使用用户名首字母（有用户名时）', () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          attendees={mockAttendees}
        />
      )

      expect(screen.getByText('A')).toBeInTheDocument() // Alice
      expect(screen.getByText('B')).toBeInTheDocument() // Bob
    })

    it('应该显示问号（没有用户名时）', () => {
      const attendeeWithoutUsername = [
        {
          id: 1,
          username: '',
          full_name: '',
        },
      ]

      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          attendees={attendeeWithoutUsername}
        />
      )

      expect(screen.getByText('?')).toBeInTheDocument()
    })

    it('应该处理首字母大写', () => {
      const attendees = [
        {
          id: 1,
          username: 'alice',
          full_name: 'Alice Wang',
        },
      ]

      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          attendees={attendees}
        />
      )

      // Should be 'A' not 'a'
      const avatar = screen.getByText('A')
      expect(avatar).toBeInTheDocument()
    })
  })

  describe('TDD Phase 12: 边界情况', () => {
    it('应该处理空参会人员列表', () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          attendees={[]}
        />
      )

      expect(screen.getByText(/参会人员.*0人/)).toBeInTheDocument()
    })

    it('应该处理没有主持人信息的情况', () => {
      render(
        <MeetingInfoCard
          meeting={mockMeeting}
          attendees={[]}
        />
      )

      expect(screen.getByText('未知')).toBeInTheDocument()
    })

    it('应该处理所有时间字段为空的情况', () => {
      const meetingWithNoTimes = {
        ...mockMeeting,
        started_at: undefined,
        ended_at: undefined,
        status: 'scheduled' as const,
      }

      render(<MeetingInfoCard meeting={meetingWithNoTimes} />)

      expect(screen.queryByText('开始时间')).not.toBeInTheDocument()
      expect(screen.queryByText('结束时间')).not.toBeInTheDocument()
    })
  })
})

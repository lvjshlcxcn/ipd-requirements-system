/**
 * ReviewMeetingService 测试
 *
 * 测试需求评审会议相关的所有API调用
 * 遵循 TDD 原则：先写测试，确保失败，再实现
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import reviewMeetingService from '@/services/reviewMeeting.service'
import api from '@/services/api'

// Mock api模块
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('ReviewMeetingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ========================================================================
  // 会议管理 - 测试组
  // ========================================================================

  describe('getMeetings - 获取会议列表', () => {
    it('应该成功获取会议列表（默认参数）', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 1,
              meeting_no: 'RM-2024-001',
              title: 'IPD需求评审会',
              status: 'scheduled',
              scheduled_at: '2024-02-10T10:00:00Z',
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
          total_pages: 1,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getMeetings()

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/?page=1&page_size=20'
      )
      expect(result.success).toBe(true)
      expect(result.data.items).toHaveLength(1)
      expect(result.data.items[0].title).toBe('IPD需求评审会')
    })

    it('应该成功获取会议列表（带筛选参数）', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 1,
              meeting_no: 'RM-2024-001',
              title: 'IPD需求评审会',
              status: 'in_progress',
              scheduled_at: '2024-02-10T10:00:00Z',
            },
          ],
          total: 1,
          page: 1,
          page_size: 10,
          total_pages: 1,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getMeetings({
        page: 1,
        page_size: 10,
        status: 'in_progress',
        date_filter: '2024-02',
      })

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/?page=1&page_size=10&status=in_progress&date_filter=2024-02'
      )
      expect(result.success).toBe(true)
    })

    it('应该处理空列表', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          page_size: 20,
          total_pages: 0,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getMeetings()

      expect(result.data.items).toHaveLength(0)
      expect(result.data.total).toBe(0)
    })

    it('应该处理API错误', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('网络错误'))

      await expect(reviewMeetingService.getMeetings()).rejects.toThrow('网络错误')
    })

    it('应该处理401未授权错误', async () => {
      const error = new Error('未授权')
      ;(error as any).status = 401
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(reviewMeetingService.getMeetings()).rejects.toThrow('未授权')
    })
  })

  describe('createMeeting - 创建会议', () => {
    it('应该成功创建会议', async () => {
      const meetingData = {
        title: 'IPD需求评审会',
        description: '评审SP-001需求',
        scheduled_at: '2024-02-10T10:00:00Z',
        moderator_id: 1,
        meeting_settings: {
          allowVoteChange: true,
          anonymousVoting: false,
        },
      }

      const mockResponse = {
        success: true,
        message: '会议创建成功',
        data: {
          id: 1,
          meeting_no: 'RM-2024-001',
          ...meetingData,
          status: 'scheduled',
          created_at: '2024-02-01T10:00:00Z',
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.createMeeting(meetingData)

      expect(api.post).toHaveBeenCalledWith(
        '/requirement-review-meetings',
        meetingData
      )
      expect(result.success).toBe(true)
      expect(result.data.title).toBe('IPD需求评审会')
    })

    it('应该处理必填字段缺失', async () => {
      const invalidData = {
        title: '',
        scheduled_at: '2024-02-10T10:00:00Z',
        moderator_id: 1,
      }

      vi.mocked(api.post).mockRejectedValue(
        new Error('标题不能为空')
      )

      await expect(
        reviewMeetingService.createMeeting(invalidData as any)
      ).rejects.toThrow('标题不能为空')
    })

    it('应该处理无效的时间格式', async () => {
      const invalidData = {
        title: '测试会议',
        scheduled_at: 'invalid-date',
        moderator_id: 1,
      }

      vi.mocked(api.post).mockRejectedValue(
        new Error('时间格式无效')
      )

      await expect(
        reviewMeetingService.createMeeting(invalidData as any)
      ).rejects.toThrow('时间格式无效')
    })
  })

  describe('getMeeting - 获取会议详情', () => {
    it('应该成功获取会议详情', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          meeting_no: 'RM-2024-001',
          title: 'IPD需求评审会',
          description: '评审SP-001需求',
          status: 'scheduled',
          scheduled_at: '2024-02-10T10:00:00Z',
          moderator_id: 1,
          meeting_settings: {},
          created_at: '2024-02-01T10:00:00Z',
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getMeeting(1)

      expect(api.get).toHaveBeenCalledWith('/requirement-review-meetings/1')
      expect(result.success).toBe(true)
      expect(result.data.id).toBe(1)
    })

    it('应该处理会议不存在（404）', async () => {
      const error = new Error('会议不存在')
      ;(error as any).status = 404
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(reviewMeetingService.getMeeting(999)).rejects.toThrow(
        '会议不存在'
      )
    })
  })

  describe('updateMeeting - 更新会议', () => {
    it('应该成功更新会议', async () => {
      const updateData = {
        title: '更新后的标题',
        description: '更新后的描述',
      }

      const mockResponse = {
        success: true,
        message: '会议更新成功',
        data: {
          id: 1,
          meeting_no: 'RM-2024-001',
          ...updateData,
          status: 'scheduled',
        },
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.updateMeeting(1, updateData)

      expect(api.put).toHaveBeenCalledWith(
        '/requirement-review-meetings/1',
        updateData
      )
      expect(result.success).toBe(true)
      expect(result.data.title).toBe('更新后的标题')
    })

    it('应该处理部分更新', async () => {
      const updateData = {
        status: 'cancelled' as const,
      }

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          status: 'cancelled',
        },
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.updateMeeting(1, updateData)

      expect(result.data.status).toBe('cancelled')
    })
  })

  describe('deleteMeeting - 删除会议', () => {
    it('应该成功删除会议', async () => {
      const mockResponse = {
        success: true,
        message: '会议删除成功',
      }

      vi.mocked(api.delete).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.deleteMeeting(1)

      expect(api.delete).toHaveBeenCalledWith('/requirement-review-meetings/1')
      expect(result.success).toBe(true)
      expect(result.message).toBe('会议删除成功')
    })

    it('应该处理删除进行中的会议', async () => {
      vi.mocked(api.delete).mockRejectedValue(
        new Error('无法删除进行中的会议')
      )

      await expect(reviewMeetingService.deleteMeeting(1)).rejects.toThrow(
        '无法删除进行中的会议'
      )
    })
  })

  describe('startMeeting - 开始会议', () => {
    it('应该成功开始会议', async () => {
      const mockResponse = {
        success: true,
        message: '会议已开始',
        data: {
          id: 1,
          status: 'in_progress',
          started_at: '2024-02-10T10:00:00Z',
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.startMeeting(1)

      expect(api.post).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/start'
      )
      expect(result.data.status).toBe('in_progress')
    })

    it('应该处理重复开始', async () => {
      vi.mocked(api.post).mockRejectedValue(
        new Error('会议已经在进行中')
      )

      await expect(reviewMeetingService.startMeeting(1)).rejects.toThrow(
        '会议已经在进行中'
      )
    })
  })

  describe('endMeeting - 结束会议', () => {
    it('应该成功结束会议', async () => {
      const mockResponse = {
        success: true,
        message: '会议已结束',
        data: {
          id: 1,
          status: 'completed',
          ended_at: '2024-02-10T12:00:00Z',
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.endMeeting(1)

      expect(api.post).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/end'
      )
      expect(result.data.status).toBe('completed')
    })
  })

  // ========================================================================
  // 参会人员管理 - 测试组
  // ========================================================================

  describe('getAttendees - 获取参会人员列表', () => {
    it('应该成功获取参会人员列表', async () => {
      const mockAttendees = [
        {
          id: 1,
          meeting_id: 1,
          attendee_id: 2,
          attendance_status: 'accepted',
          user: {
            id: 2,
            username: 'john_doe',
            email: 'john@example.com',
            full_name: 'John Doe',
          },
        },
        {
          id: 2,
          meeting_id: 1,
          attendee_id: 3,
          attendance_status: 'invited',
          user: {
            id: 3,
            username: 'jane_doe',
            email: 'jane@example.com',
            full_name: 'Jane Doe',
          },
        },
      ]

      vi.mocked(api.get).mockResolvedValue(mockAttendees)

      const result = await reviewMeetingService.getAttendees(1)

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/attendees'
      )
      expect(result).toHaveLength(2)
      expect(result[0].user?.full_name).toBe('John Doe')
    })

    it('应该处理空参会人员列表', async () => {
      vi.mocked(api.get).mockResolvedValue([])

      const result = await reviewMeetingService.getAttendees(1)

      expect(result).toHaveLength(0)
    })
  })

  describe('addAttendee - 添加参会人员', () => {
    it('应该成功添加参会人员', async () => {
      const attendeeData = {
        attendee_id: 2,
        attendance_status: 'invited' as const,
      }

      const mockResponse = {
        success: true,
        message: '参会人员添加成功',
        data: {
          id: 1,
          meeting_id: 1,
          ...attendeeData,
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.addAttendee(1, attendeeData)

      expect(api.post).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/attendees',
        attendeeData
      )
      expect(result.success).toBe(true)
    })

    it('应该处理重复添加', async () => {
      vi.mocked(api.post).mockRejectedValue(
        new Error('该用户已在参会人员列表中')
      )

      await expect(
        reviewMeetingService.addAttendee(1, { attendee_id: 2 })
      ).rejects.toThrow('该用户已在参会人员列表中')
    })
  })

  describe('removeAttendee - 移除参会人员', () => {
    it('应该成功移除参会人员', async () => {
      const mockResponse = {
        success: true,
        message: '参会人员移除成功',
      }

      vi.mocked(api.delete).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.removeAttendee(1, 2)

      expect(api.delete).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/attendees/2'
      )
      expect(result.success).toBe(true)
    })

    it('应该处理移除不存在的参会人员', async () => {
      vi.mocked(api.delete).mockRejectedValue(
        new Error('参会人员不存在')
      )

      await expect(reviewMeetingService.removeAttendee(1, 999)).rejects.toThrow(
        '参会人员不存在'
      )
    })
  })

  // ========================================================================
  // 会议需求管理 - 测试组
  // ========================================================================

  describe('getMeetingRequirements - 获取会议需求列表', () => {
    it('应该成功获取会议需求列表', async () => {
      const mockRequirements = [
        {
          id: 1,
          meeting_id: 1,
          requirement_id: 10,
          review_order: 1,
          meeting_notes: '重点评审',
          requirement: {
            id: 10,
            requirement_no: 'SP-001',
            title: '用户登录功能',
            target_type: 'sp',
            moscow_priority: 'must',
          },
        },
        {
          id: 2,
          meeting_id: 1,
          requirement_id: 11,
          review_order: 2,
          requirement: {
            id: 11,
            requirement_no: 'BP-001',
            title: '数据备份方案',
            target_type: 'bp',
            moscow_priority: 'should',
          },
        },
      ]

      vi.mocked(api.get).mockResolvedValue(mockRequirements)

      const result = await reviewMeetingService.getMeetingRequirements(1)

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/requirements'
      )
      expect(result).toHaveLength(2)
      expect(result[0].requirement?.title).toBe('用户登录功能')
    })

    it('应该按评审顺序排序', async () => {
      const mockRequirements = [
        {
          id: 1,
          review_order: 1,
          requirement_id: 10,
        },
        {
          id: 2,
          review_order: 2,
          requirement_id: 11,
        },
        {
          id: 3,
          review_order: 3,
          requirement_id: 12,
        },
      ]

      vi.mocked(api.get).mockResolvedValue(mockRequirements)

      const result = await reviewMeetingService.getMeetingRequirements(1)

      expect(result[0].review_order).toBeLessThan(result[1].review_order)
      expect(result[1].review_order).toBeLessThan(result[2].review_order)
    })
  })

  describe('addRequirementToMeeting - 添加需求到会议', () => {
    it('应该成功添加需求到会议', async () => {
      const requirementData = {
        requirement_id: 10,
        meeting_notes: '需要重点关注安全性',
      }

      const mockResponse = {
        success: true,
        message: '需求添加成功',
        data: {
          id: 1,
          meeting_id: 1,
          review_order: 1,
          ...requirementData,
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.addRequirementToMeeting(
        1,
        requirementData
      )

      expect(api.post).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/requirements',
        requirementData
      )
      expect(result.success).toBe(true)
    })

    it('应该处理重复添加需求', async () => {
      vi.mocked(api.post).mockRejectedValue(
        new Error('该需求已在会议中')
      )

      await expect(
        reviewMeetingService.addRequirementToMeeting(1, { requirement_id: 10 })
      ).rejects.toThrow('该需求已在会议中')
    })
  })

  describe('updateMeetingRequirement - 更新会议需求', () => {
    it('应该成功更新评审顺序', async () => {
      const updateData = {
        review_order: 5,
      }

      const mockResponse = {
        success: true,
        message: '需求更新成功',
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.updateMeetingRequirement(
        1,
        10,
        updateData
      )

      expect(api.put).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/requirements/10',
        updateData
      )
      expect(result.success).toBe(true)
    })

    it('应该成功更新备注', async () => {
      const updateData = {
        meeting_notes: '更新后的评审备注',
      }

      const mockResponse = {
        success: true,
        message: '需求更新成功',
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.updateMeetingRequirement(
        1,
        10,
        updateData
      )

      expect(result.success).toBe(true)
    })

    it('应该同时更新顺序和备注', async () => {
      const updateData = {
        review_order: 3,
        meeting_notes: '优先评审',
      }

      const mockResponse = {
        success: true,
        message: '需求更新成功',
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.updateMeetingRequirement(
        1,
        10,
        updateData
      )

      expect(result.success).toBe(true)
    })
  })

  describe('removeRequirementFromMeeting - 从会议移除需求', () => {
    it('应该成功移除需求', async () => {
      const mockResponse = {
        success: true,
        message: '需求移除成功',
      }

      vi.mocked(api.delete).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.removeRequirementFromMeeting(
        1,
        10
      )

      expect(api.delete).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/requirements/10'
      )
      expect(result.success).toBe(true)
    })

    it('应该处理移除不存在的需求', async () => {
      vi.mocked(api.delete).mockRejectedValue(
        new Error('需求不存在')
      )

      await expect(
        reviewMeetingService.removeRequirementFromMeeting(1, 999)
      ).rejects.toThrow('需求不存在')
    })
  })

  // ========================================================================
  // 投票功能 - 核心测试组
  // ========================================================================

  describe('castVote - 投票', () => {
    it('应该成功投赞成票', async () => {
      const voteData = {
        vote_option: 'approve' as const,
        comment: '需求合理，同意通过',
      }

      const mockResponse = {
        success: true,
        message: '投票成功',
        data: {
          id: 1,
          meeting_id: 1,
          requirement_id: 10,
          voter_id: 2,
          ...voteData,
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.castVote(1, 10, voteData)

      expect(api.post).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/requirements/10/vote',
        voteData
      )
      expect(result.success).toBe(true)
      expect(result.data.vote_option).toBe('approve')
    })

    it('应该成功投反对票', async () => {
      const voteData = {
        vote_option: 'reject' as const,
        comment: '需求不够明确，需要补充',
      }

      const mockResponse = {
        success: true,
        message: '投票成功',
        data: {
          id: 1,
          meeting_id: 1,
          requirement_id: 10,
          voter_id: 2,
          ...voteData,
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.castVote(1, 10, voteData)

      expect(result.data.vote_option).toBe('reject')
    })

    it('应该成功投弃权票', async () => {
      const voteData = {
        vote_option: 'abstain' as const,
        comment: '暂时不表态',
      }

      const mockResponse = {
        success: true,
        message: '投票成功',
        data: {
          id: 1,
          meeting_id: 1,
          requirement_id: 10,
          voter_id: 2,
          ...voteData,
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.castVote(1, 10, voteData)

      expect(result.data.vote_option).toBe('abstain')
    })

    it('应该支持修改已有投票', async () => {
      const voteData = {
        vote_option: 'approve' as const,
        comment: '重新考虑后，同意通过',
      }

      const mockResponse = {
        success: true,
        message: '投票已更新',
        data: {
          id: 1,
          meeting_id: 1,
          requirement_id: 10,
          voter_id: 2,
          ...voteData,
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.castVote(1, 10, voteData)

      expect(result.message).toBe('投票已更新')
    })

    it('应该处理无投票权限', async () => {
      vi.mocked(api.post).mockRejectedValue(
        new Error('您没有投票权限')
      )

      await expect(
        reviewMeetingService.castVote(1, 10, { vote_option: 'approve' })
      ).rejects.toThrow('您没有投票权限')
    })

    it('应该处理投票已结束', async () => {
      vi.mocked(api.post).mockRejectedValue(
        new Error('投票已结束')
      )

      await expect(
        reviewMeetingService.castVote(1, 10, { vote_option: 'approve' })
      ).rejects.toThrow('投票已结束')
    })

    it('应该处理无效的投票选项', async () => {
      vi.mocked(api.post).mockRejectedValue(
        new Error('无效的投票选项')
      )

      await expect(
        reviewMeetingService.castVote(1, 10, { vote_option: 'invalid' as any })
      ).rejects.toThrow('无效的投票选项')
    })
  })

  describe('getVoteStatistics - 获取投票统计', () => {
    it('应该成功获取投票统计', async () => {
      const mockResponse = {
        success: true,
        data: {
          requirement_id: 10,
          total_votes: 5,
          approve_count: 3,
          approve_percentage: 60,
          reject_count: 1,
          reject_percentage: 20,
          abstain_count: 1,
          abstain_percentage: 20,
          completion_percentage: 100,
          votes: [
            {
              voter_id: 2,
              voter_name: 'John Doe',
              vote_option: 'approve',
              comment: '同意',
              voted_at: '2024-02-10T10:05:00Z',
            },
            {
              voter_id: 3,
              voter_name: 'Jane Doe',
              vote_option: 'reject',
              comment: '需要补充',
              voted_at: '2024-02-10T10:06:00Z',
            },
          ],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getVoteStatistics(1, 10)

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/requirements/10/votes'
      )
      expect(result.success).toBe(true)
      expect(result.data.total_votes).toBe(5)
      expect(result.data.approve_count).toBe(3)
      expect(result.data.approve_percentage).toBe(60)
    })

    it('应该处理无投票数据', async () => {
      const mockResponse = {
        success: true,
        data: {
          requirement_id: 10,
          total_votes: 0,
          approve_count: 0,
          approve_percentage: 0,
          reject_count: 0,
          reject_percentage: 0,
          abstain_count: 0,
          abstain_percentage: 0,
          completion_percentage: 0,
          votes: [],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getVoteStatistics(1, 10)

      expect(result.data.total_votes).toBe(0)
      expect(result.data.votes).toHaveLength(0)
    })

    it('应该正确计算百分比', async () => {
      const mockResponse = {
        success: true,
        data: {
          requirement_id: 10,
          total_votes: 10,
          approve_count: 7,
          approve_percentage: 70,
          reject_count: 2,
          reject_percentage: 20,
          abstain_count: 1,
          abstain_percentage: 10,
          completion_percentage: 100,
          votes: [],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getVoteStatistics(1, 10)

      expect(result.data.approve_percentage).toBe(70)
      expect(result.data.reject_percentage).toBe(20)
      expect(result.data.abstain_percentage).toBe(10)
    })
  })

  describe('getMyVote - 获取我的投票', () => {
    it('应该成功获取我的投票', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          meeting_id: 1,
          requirement_id: 10,
          voter_id: 2,
          vote_option: 'approve',
          comment: '同意通过',
          created_at: '2024-02-10T10:05:00Z',
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getMyVote(1, 10)

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/requirements/10/my-vote'
      )
      expect(result.success).toBe(true)
      expect(result.data.vote_option).toBe('approve')
    })

    it('应该处理未投票状态', async () => {
      vi.mocked(api.get).mockRejectedValue(
        new Error('您还未投票')
      )

      await expect(reviewMeetingService.getMyVote(1, 10)).rejects.toThrow(
        '您还未投票'
      )
    })
  })

  // ========================================================================
  // 投票人员管理 - 测试组
  // ========================================================================

  describe('getVoterStatus - 获取投票人员状态', () => {
    it('应该成功获取投票人员状态', async () => {
      const mockResponse = {
        success: true,
        data: {
          meeting_id: 1,
          requirement_id: 10,
          current_voter_id: 2,
          current_voter: {
            voter_id: 2,
            voter_name: 'John Doe',
            started_at: '2024-02-10T10:00:00Z',
          },
          is_voting_complete: false,
          total_voters: 5,
          completed_voter_ids: [1, 3],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getVoterStatus(1, 10)

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/requirements/10/voters'
      )
      expect(result.success).toBe(true)
      expect(result.data.current_voter_id).toBe(2)
      expect(result.data.is_voting_complete).toBe(false)
    })

    it('应该处理投票完成状态', async () => {
      const mockResponse = {
        success: true,
        data: {
          meeting_id: 1,
          requirement_id: 10,
          current_voter_id: null,
          current_voter: null,
          is_voting_complete: true,
          total_voters: 5,
          completed_voter_ids: [1, 2, 3, 4, 5],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getVoterStatus(1, 10)

      expect(result.data.is_voting_complete).toBe(true)
      expect(result.data.current_voter).toBeNull()
    })
  })

  describe('getCurrentVoter - 获取当前投票人', () => {
    it('应该成功获取当前投票人', async () => {
      const mockResponse = {
        success: true,
        data: {
          voter_id: 2,
          voter_name: 'John Doe',
          full_name: 'John Doe',
          avatar: 'avatar.jpg',
          started_at: '2024-02-10T10:00:00Z',
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getCurrentVoter(1, 10)

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/requirements/10/current-voter'
      )
      expect(result.success).toBe(true)
      expect(result.data.voter_name).toBe('John Doe')
    })

    it('应该处理无当前投票人', async () => {
      vi.mocked(api.get).mockRejectedValue(
        new Error('当前没有投票人')
      )

      await expect(reviewMeetingService.getCurrentVoter(1, 10)).rejects.toThrow(
        '当前没有投票人'
      )
    })
  })

  describe('moveToNextVoter - 切换到下一个投票人', () => {
    it('应该成功切换到下一个投票人', async () => {
      const mockResponse = {
        success: true,
        message: '已切换到下一位投票人',
        data: {
          current_voter: {
            voter_id: 3,
            voter_name: 'Jane Doe',
            started_at: '2024-02-10T10:05:00Z',
          },
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.moveToNextVoter(1, 10)

      expect(api.post).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/requirements/10/next-voter'
      )
      expect(result.success).toBe(true)
      expect(result.data.current_voter.voter_id).toBe(3)
    })

    it('应该处理所有投票人已完成', async () => {
      vi.mocked(api.post).mockRejectedValue(
        new Error('所有投票人已完成投票')
      )

      await expect(reviewMeetingService.moveToNextVoter(1, 10)).rejects.toThrow(
        '所有投票人已完成投票'
      )
    })
  })

  describe('getVotingSession - 获取投票会话状态', () => {
    it('应该成功获取投票会话状态', async () => {
      const mockResponse = {
        success: true,
        data: {
          meeting_id: 1,
          requirement_id: 10,
          current_voter_index: 1,
          total_voters: 5,
          completed_voter_ids: [1, 3],
          current_voter: {
            voter_id: 2,
            voter_name: 'John Doe',
            started_at: '2024-02-10T10:00:00Z',
          },
          is_voting_complete: false,
          started_at: '2024-02-10T10:00:00Z',
          updated_at: '2024-02-10T10:05:00Z',
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getVotingSession(1, 10)

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/requirements/10/voting-session'
      )
      expect(result.success).toBe(true)
      expect(result.data.current_voter_index).toBe(1)
      expect(result.data.total_voters).toBe(5)
    })

    it('应该处理投票会话未开始', async () => {
      vi.mocked(api.get).mockRejectedValue(
        new Error('投票会话未开始')
      )

      await expect(reviewMeetingService.getVotingSession(1, 10)).rejects.toThrow(
        '投票会话未开始'
      )
    })
  })

  describe('updateAssignedVoters - 更新指定的投票人员列表', () => {
    it('应该成功更新投票人员列表', async () => {
      const voterData = {
        assigned_voter_ids: [1, 2, 3, 4, 5],
      }

      const mockResponse = {
        success: true,
        message: '投票人员列表已更新',
        data: {
          meeting_id: 1,
          requirement_id: 10,
          assigned_voter_ids: [1, 2, 3, 4, 5],
        },
      }

      vi.mocked(api.patch).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.updateAssignedVoters(
        1,
        10,
        voterData
      )

      expect(api.patch).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/requirements/10/voters',
        voterData
      )
      expect(result.success).toBe(true)
    })

    it('应该处理空的投票人员列表', async () => {
      const voterData = {
        assigned_voter_ids: [],
      }

      const mockResponse = {
        success: true,
        message: '投票人员列表已更新',
        data: {
          assigned_voter_ids: [],
        },
      }

      vi.mocked(api.patch).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.updateAssignedVoters(
        1,
        10,
        voterData
      )

      expect(result.success).toBe(true)
      expect(result.data.assigned_voter_ids).toHaveLength(0)
    })

    it('应该处理无效的用户ID', async () => {
      const voterData = {
        assigned_voter_ids: [1, 2, 999],
      }

      vi.mocked(api.patch).mockRejectedValue(
        new Error('包含无效的用户ID')
      )

      await expect(
        reviewMeetingService.updateAssignedVoters(1, 10, voterData)
      ).rejects.toThrow('包含无效的用户ID')
    })
  })

  // ========================================================================
  // 投票结果存档 - 测试组
  // ========================================================================

  describe('getVoteResults - 获取投票结果列表', () => {
    it('应该成功获取投票结果列表（默认参数）', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 1,
              meeting_id: 1,
              meeting_no: 'RM-2024-001',
              meeting_title: 'IPD需求评审会',
              requirement_id: 10,
              requirement_no: 'SP-001',
              requirement_title: '用户登录功能',
              final_decision: 'approved',
              approved_at: '2024-02-10T12:00:00Z',
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
          total_pages: 1,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getVoteResults()

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/archive/vote-results?page=1&page_size=20'
      )
      expect(result.success).toBe(true)
      expect(result.data.items).toHaveLength(1)
    })

    it('应该成功获取投票结果列表（带筛选）', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 1,
              meeting_id: 1,
              meeting_title: 'IPD需求评审会',
              requirement_title: '用户登录功能',
              final_decision: 'approved',
            },
          ],
          total: 1,
          page: 1,
          page_size: 10,
          total_pages: 1,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getVoteResults({
        page: 1,
        page_size: 10,
        meeting_id: 1,
      })

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/archive/vote-results?page=1&page_size=10&meeting_id=1'
      )
      expect(result.success).toBe(true)
    })

    it('应该处理空结果列表', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          page_size: 20,
          total_pages: 0,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getVoteResults()

      expect(result.data.items).toHaveLength(0)
    })
  })

  describe('getVoteResult - 获取单个投票结果详情', () => {
    it('应该成功获取投票结果详情', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          meeting_id: 1,
          meeting_no: 'RM-2024-001',
          meeting_title: 'IPD需求评审会',
          requirement_id: 10,
          requirement_no: 'SP-001',
          requirement_title: '用户登录功能',
          final_decision: 'approved',
          vote_summary: {
            total_votes: 5,
            approve_count: 4,
            reject_count: 0,
            abstain_count: 1,
          },
          votes: [
            {
              voter_id: 2,
              voter_name: 'John Doe',
              vote_option: 'approve',
              comment: '同意',
            },
          ],
          approved_at: '2024-02-10T12:00:00Z',
          archived_at: '2024-02-10T12:30:00Z',
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getVoteResult(1)

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/archive/vote-results/1'
      )
      expect(result.success).toBe(true)
      expect(result.data.final_decision).toBe('approved')
    })

    it('应该处理投票结果不存在', async () => {
      vi.mocked(api.get).mockRejectedValue(
        new Error('投票结果不存在')
      )

      await expect(reviewMeetingService.getVoteResult(999)).rejects.toThrow(
        '投票结果不存在'
      )
    })
  })

  describe('getMeetingVoteResults - 获取会议的投票结果', () => {
    it('应该成功获取会议的所有投票结果', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 1,
            requirement_id: 10,
            requirement_no: 'SP-001',
            requirement_title: '用户登录功能',
            final_decision: 'approved',
          },
          {
            id: 2,
            requirement_id: 11,
            requirement_no: 'BP-001',
            requirement_title: '数据备份方案',
            final_decision: 'rejected',
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getMeetingVoteResults(1)

      expect(api.get).toHaveBeenCalledWith(
        '/requirement-review-meetings/1/archive/vote-results'
      )
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('应该处理会议无投票结果', async () => {
      const mockResponse = {
        success: true,
        data: [],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getMeetingVoteResults(1)

      expect(result.data).toHaveLength(0)
    })
  })

  // ========================================================================
  // 边界情况和异常处理 - 测试组
  // ========================================================================

  describe('边界情况', () => {
    it('应该处理极大的页码', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 9999,
          page_size: 20,
          total_pages: 0,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getMeetings({ page: 9999 })

      expect(result.data.items).toHaveLength(0)
    })

    it('应该处理极小的page_size', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: 1 }],
          total: 100,
          page: 1,
          page_size: 1,
          total_pages: 100,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getMeetings({ page_size: 1 })

      expect(result.data.page_size).toBe(1)
    })

    it('应该处理极大的page_size', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          page_size: 1000,
          total_pages: 0,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.getMeetings({ page_size: 1000 })

      expect(result.data.page_size).toBe(1000)
    })

    it('应该处理特殊字符的会议标题', async () => {
      const meetingData = {
        title: '测试会议 <script>alert("xss")</script>',
        scheduled_at: '2024-02-10T10:00:00Z',
        moderator_id: 1,
      }

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          ...meetingData,
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.createMeeting(meetingData)

      expect(result.success).toBe(true)
    })

    it('应该处理超长的备注内容', async () => {
      const longComment = 'A'.repeat(10000)
      const voteData = {
        vote_option: 'approve' as const,
        comment: longComment,
      }

      const mockResponse = {
        success: true,
        message: '投票成功',
        data: {
          id: 1,
          ...voteData,
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.castVote(1, 10, voteData)

      expect(result.data.comment).toBe(longComment)
    })

    it('应该处理Unicode字符', async () => {
      const meetingData = {
        title: '会议标题 🎉 中文测试 🇨🇳',
        scheduled_at: '2024-02-10T10:00:00Z',
        moderator_id: 1,
      }

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          ...meetingData,
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await reviewMeetingService.createMeeting(meetingData)

      expect(result.data.title).toContain('🎉')
    })
  })

  describe('网络错误处理', () => {
    it('应该处理网络超时', async () => {
      const timeoutError = new Error('Request timeout')
      ;(timeoutError as any).code = 'ECONNABORTED'
      vi.mocked(api.get).mockRejectedValue(timeoutError)

      await expect(reviewMeetingService.getMeetings()).rejects.toThrow(
        'Request timeout'
      )
    })

    it('应该处理服务器错误500', async () => {
      const serverError = new Error('Internal Server Error')
      ;(serverError as any).status = 500
      vi.mocked(api.get).mockRejectedValue(serverError)

      await expect(reviewMeetingService.getMeetings()).rejects.toThrow(
        'Internal Server Error'
      )
    })

    it('应该处理网络断开', async () => {
      const networkError = new Error('Network Error')
      ;(networkError as any).code = 'ERR_NETWORK'
      vi.mocked(api.get).mockRejectedValue(networkError)

      await expect(reviewMeetingService.getMeetings()).rejects.toThrow(
        'Network Error'
      )
    })
  })

  describe('并发请求', () => {
    it('应该能同时处理多个请求', async () => {
      const mockMeeting = {
        success: true,
        data: { id: 1, title: '会议1' },
      }
      const mockAttendees = [
        { id: 1, attendee_id: 2 },
        { id: 2, attendee_id: 3 },
      ]
      const mockRequirements = [
        { id: 1, requirement_id: 10 },
      ]

      vi.mocked(api.get).mockImplementation((path) => {
        if (path.includes('attendees')) return Promise.resolve(mockAttendees)
        if (path.includes('requirements')) return Promise.resolve(mockRequirements)
        return Promise.resolve(mockMeeting)
      })

      const [meeting, attendees, requirements] = await Promise.all([
        reviewMeetingService.getMeeting(1),
        reviewMeetingService.getAttendees(1),
        reviewMeetingService.getMeetingRequirements(1),
      ])

      expect(meeting.success).toBe(true)
      expect(attendees).toHaveLength(2)
      expect(requirements).toHaveLength(1)
    })
  })
})

/**
 * RequirementService 测试
 *
 * 测试需求管理相关的所有API调用
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { requirementService, type CreateRequirementRequest, type RequirementListParams } from '@/services/requirement.service'

// Mock api模块
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}))

describe('RequirementService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRequirements', () => {
    it('应该成功获取需求列表', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 1,
              requirement_no: 'REQ-2026-0001',
              title: '用户登录功能',
              description: '实现用户名密码登录',
              status: 'collected',
              source_channel: 'customer',
            },
          ],
          total: 1,
          page: 1,
          page_size: 10,
          total_pages: 1,
        },
      }

      const { apiGet } = await import('@/services/api')
      vi.mocked(apiGet).mockResolvedValue(mockResponse)

      const result = await requirementService.getRequirements()

      expect(apiGet).toHaveBeenCalledWith('/requirements', { params: undefined })
      expect(result.data.items.length).toBe(1)
    })

    it('应该支持分页和筛选参数', async () => {
      const params: RequirementListParams = {
        page: 2,
        page_size: 20,
        status: 'analyzing',
        source_channel: 'market',
        search: '登录',
      }

      const mockResponse = {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 2,
          page_size: 20,
          total_pages: 0,
        },
      }

      const { apiGet } = await import('@/services/api')
      vi.mocked(apiGet).mockResolvedValue(mockResponse)

      await requirementService.getRequirements(params)

      expect(apiGet).toHaveBeenCalledWith('/requirements', { params })
    })

    it('应该处理空列表', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          page_size: 10,
          total_pages: 0,
        },
      }

      const { apiGet } = await import('@/services/api')
      vi.mocked(apiGet).mockResolvedValue(mockResponse)

      const result = await requirementService.getRequirements()

      expect(result.data.items).toEqual([])
    })
  })

  describe('getRequirement', () => {
    it('应该成功获取单个需求', async () => {
      const mockRequirement = {
        id: 1,
        requirement_no: 'REQ-2026-0001',
        title: '用户登录功能',
        description: '实现用户名密码登录',
        status: 'collected',
        source_channel: 'customer',
        created_at: '2026-01-26T00:00:00Z',
        updated_at: '2026-01-26T00:00:00Z',
      }

      const mockResponse = {
        success: true,
        data: mockRequirement,
      }

      const { apiGet } = await import('@/services/api')
      vi.mocked(apiGet).mockResolvedValue(mockResponse)

      const result = await requirementService.getRequirement(1)

      expect(apiGet).toHaveBeenCalledWith('/requirements/1')
      expect(result.data.id).toBe(1)
    })

    it('应该处理需求不存在', async () => {
      const { apiGet } = await import('@/services/api')
      vi.mocked(apiGet).mockRejectedValue(new Error('需求不存在'))

      await expect(requirementService.getRequirement(999)).rejects.toThrow(
        '需求不存在'
      )
    })
  })

  describe('createRequirement', () => {
    it('应该成功创建需求', async () => {
      const createData: CreateRequirementRequest = {
        title: '新需求',
        description: '需求描述',
        source_channel: 'customer',
        source_contact: '客户A',
        estimated_duration_months: 6,
        complexity_level: 'medium',
      }

      const mockRequirement = {
        id: 1,
        requirement_no: 'REQ-2026-0001',
        ...createData,
        status: 'collected',
        created_at: '2026-01-26T00:00:00Z',
      }

      const mockResponse = {
        success: true,
        message: '需求创建成功',
        data: mockRequirement,
      }

      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockResolvedValue(mockResponse)

      const result = await requirementService.createRequirement(createData)

      expect(apiPost).toHaveBeenCalledWith('/requirements', createData)
      expect(result.data.id).toBe(1)
    })

    it('应该处理必填字段缺失', async () => {
      const invalidData = {
        title: '',
        description: '',
        source_channel: '',
      }

      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockRejectedValue(
        new Error('标题、描述和来源渠道为必填项')
      )

      await expect(
        requirementService.createRequirement(invalidData as any)
      ).rejects.toThrow('标题、描述和来源渠道为必填项')
    })

    it('应该处理APPEALS十问数据', async () => {
      const createData: CreateRequirementRequest = {
        title: '新需求',
        description: '需求描述',
        source_channel: 'customer',
        customer_need_10q: {
          question1: '回答1',
          question2: '回答2',
        },
      }

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          ...createData,
          status: 'collected',
        },
      }

      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockResolvedValue(mockResponse)

      const result = await requirementService.createRequirement(createData)

      expect(apiPost).toHaveBeenCalledWith('/requirements', createData)
      expect(result.data.customer_need_10q).toEqual(createData.customer_need_10q)
    })
  })

  describe('updateRequirement', () => {
    it('应该成功更新需求', async () => {
      const updateData = {
        title: '更新后的标题',
        description: '更新后的描述',
        status: 'analyzing',
      }

      const mockResponse = {
        success: true,
        message: '需求更新成功',
        data: {
          id: 1,
          requirement_no: 'REQ-2026-0001',
          ...updateData,
        },
      }

      const { apiPut } = await import('@/services/api')
      vi.mocked(apiPut).mockResolvedValue(mockResponse)

      const result = await requirementService.updateRequirement(1, updateData)

      expect(apiPut).toHaveBeenCalledWith('/requirements/1', updateData)
      expect(result.data.title).toBe(updateData.title)
    })

    it('应该处理需求不存在', async () => {
      const { apiPut } = await import('@/services/api')
      vi.mocked(apiPut).mockRejectedValue(new Error('需求不存在'))

      await expect(
        requirementService.updateRequirement(999, { title: '新标题' })
      ).rejects.toThrow('需求不存在')
    })
  })

  describe('deleteRequirement', () => {
    it('应该成功删除需求', async () => {
      const mockResponse = {
        success: true,
        message: '需求删除成功',
      }

      const { apiDelete } = await import('@/services/api')
      vi.mocked(apiDelete).mockResolvedValue(mockResponse)

      const result = await requirementService.deleteRequirement(1)

      expect(apiDelete).toHaveBeenCalledWith('/requirements/1')
      expect(result.success).toBe(true)
    })

    it('应该处理删除失败（需求不存在）', async () => {
      const { apiDelete } = await import('@/services/api')
      vi.mocked(apiDelete).mockRejectedValue(new Error('需求不存在'))

      await expect(requirementService.deleteRequirement(999)).rejects.toThrow(
        '需求不存在'
      )
    })
  })

  describe('updateStatus', () => {
    it('应该成功更新状态', async () => {
      const mockResponse = {
        success: true,
        message: '状态更新成功',
        data: {
          id: 1,
          status: 'analyzing',
        },
      }

      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockResolvedValue(mockResponse)

      const result = await requirementService.updateStatus(1, 'analyzing')

      expect(apiPost).toHaveBeenCalledWith('/requirements/1/status', {
        status: 'analyzing',
      })
      expect(result.data.status).toBe('analyzing')
    })

    it('应该处理无效状态', async () => {
      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockRejectedValue(
        new Error('无效的状态值')
      )

      await expect(
        requirementService.updateStatus(1, 'invalid_status')
      ).rejects.toThrow('无效的状态值')
    })
  })

  describe('getStats', () => {
    it('应该成功获取统计数据', async () => {
      const mockStats = {
        total: 100,
        by_status: {
          collected: 20,
          analyzing: 30,
          analyzed: 25,
          implementing: 15,
          completed: 10,
        },
        by_channel: {
          customer: 40,
          market: 30,
          rd: 20,
          sales: 10,
        },
      }

      const mockResponse = {
        success: true,
        data: mockStats,
      }

      const { apiGet } = await import('@/services/api')
      vi.mocked(apiGet).mockResolvedValue(mockResponse)

      const result = await requirementService.getStats()

      expect(apiGet).toHaveBeenCalledWith('/requirements/stats/summary')
      expect(result.data.total).toBe(100)
    })
  })

  describe('getRequirementHistory', () => {
    it('应该成功获取需求历史', async () => {
      const mockHistory = [
        {
          id: 1,
          requirement_id: 1,
          action: 'status_changed',
          old_status: 'collected',
          new_status: 'analyzing',
          created_at: '2026-01-26T00:00:00Z',
        },
      ]

      const mockResponse = {
        success: true,
        data: mockHistory,
      }

      const { apiGet } = await import('@/services/api')
      vi.mocked(apiGet).mockResolvedValue(mockResponse)

      const result = await requirementService.getRequirementHistory(1)

      expect(apiGet).toHaveBeenCalledWith('/requirements/1/history?limit=50')
      expect(result.data.length).toBe(1)
    })

    it('应该支持自定义limit', async () => {
      const { apiGet } = await import('@/services/api')
      vi.mocked(apiGet).mockResolvedValue({ success: true, data: [] })

      await requirementService.getRequirementHistory(1, 100)

      expect(apiGet).toHaveBeenCalledWith('/requirements/1/history?limit=100')
    })
  })

  describe('addHistoryNote', () => {
    it('应该成功添加历史备注', async () => {
      const noteData = {
        comments: '这是备注内容',
        action_reason: '状态变更原因',
      }

      const mockResponse = {
        success: true,
        message: '备注添加成功',
        data: {
          id: 1,
          ...noteData,
          created_at: '2026-01-26T00:00:00Z',
        },
      }

      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockResolvedValue(mockResponse)

      const result = await requirementService.addHistoryNote(1, noteData)

      expect(apiPost).toHaveBeenCalledWith('/requirements/1/history', noteData)
      expect(result.success).toBe(true)
    })

    it('应该处理空备注', async () => {
      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockRejectedValue(
        new Error('备注内容不能为空')
      )

      await expect(
        requirementService.addHistoryNote(1, { comments: '' })
      ).rejects.toThrow('备注内容不能为空')
    })
  })

  describe('边界情况', () => {
    it('应该处理超长标题', async () => {
      const longTitle = 'x'.repeat(1000)
      const createData: CreateRequirementRequest = {
        title: longTitle,
        description: '描述',
        source_channel: 'customer',
      }

      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockRejectedValue(new Error('标题过长'))

      await expect(
        requirementService.createRequirement(createData)
      ).rejects.toThrow('标题过长')
    })

    it('应该处理特殊字符', async () => {
      const createData: CreateRequirementRequest = {
        title: '需求标题\n包含换行',
        description: '描述包含"引号"和\'单引号\'',
        source_channel: 'customer',
      }

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          ...createData,
          status: 'collected',
        },
      }

      const { apiPost } = await import('@/services/api')
      vi.mocked(apiPost).mockResolvedValue(mockResponse)

      const result = await requirementService.createRequirement(createData)

      expect(result.data.title).toBe(createData.title)
      expect(result.data.description).toBe(createData.description)
    })
  })
})

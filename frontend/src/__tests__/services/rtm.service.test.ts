import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rtmService } from '@/services/rtm.service'

// Mock api module
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock fetch for exportMatrix
;(globalThis as any).fetch = vi.fn()

import api from '@/services/api'

describe('RTM Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('mock-token')
  })

  describe('getTraceabilityMatrix', () => {
    it('应该成功获取追溯矩阵', async () => {
      const mockData = [
        {
          requirement_id: 1,
          requirement_title: '用户登录功能',
          design_items: [{ id: 1, design_id: 'DESIGN-001' }],
          code_items: [],
          test_items: [],
        },
      ]

      vi.mocked(api.get).mockResolvedValue({ data: mockData })

      const result = await rtmService.getTraceabilityMatrix()

      expect(api.get).toHaveBeenCalledWith('/rtm/matrix', { params: undefined })
      expect(result.data).toEqual(mockData)
    })

    it('应该支持过滤参数', async () => {
      const filters = { status: 'complete' }
      vi.mocked(api.get).mockResolvedValue({ data: [] })

      await rtmService.getTraceabilityMatrix(filters)

      expect(api.get).toHaveBeenCalledWith('/rtm/matrix', { params: filters })
    })

    it('应该处理API错误', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      await expect(rtmService.getTraceabilityMatrix()).rejects.toThrow('Network error')
    })
  })

  describe('getRequirementTraceability', () => {
    it('应该成功获取单个需求的追溯信息', async () => {
      const mockData = {
        requirement_id: 1,
        requirement_title: '用户登录功能',
        design_items: [{ id: 1, design_id: 'DESIGN-001' }],
        code_items: [],
        test_items: [],
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockData })

      const result = await rtmService.getRequirementTraceability(1)

      expect(api.get).toHaveBeenCalledWith('/rtm/requirements/1')
      expect(result.data).toEqual(mockData)
    })

    it('应该处理不存在的需求', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: null })

      const result = await rtmService.getRequirementTraceability(999)

      expect(result.data).toBeNull()
    })
  })

  describe('createLink', () => {
    it('应该成功创建追溯关联', async () => {
      const newLink = {
        requirement_id: 1,
        design_id: 'DESIGN-001',
        code_id: 'CODE-001',
        test_id: 'TEST-001',
      }

      const mockCreated = {
        id: 1,
        ...newLink,
        status: 'active',
        notes: null,
        created_at: '2026-01-18',
        updated_at: '2026-01-18',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockCreated })

      const result = await rtmService.createLink(newLink)

      expect(api.post).toHaveBeenCalledWith('/rtm/links', newLink)
      expect(result.data).toEqual(mockCreated)
    })

    it('应该支持创建部分追溯关联', async () => {
      const partialLink = {
        requirement_id: 1,
        design_id: 'DESIGN-001',
      }

      const mockCreated = {
        id: 1,
        ...partialLink,
        code_id: null,
        test_id: null,
        status: 'active',
        notes: null,
        created_at: '2026-01-18',
        updated_at: '2026-01-18',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockCreated })

      const result = await rtmService.createLink(partialLink)

      expect(api.post).toHaveBeenCalledWith('/rtm/links', partialLink)
      expect(result.data).toEqual(mockCreated)
    })

    it('应该处理创建失败', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('创建失败'))

      await expect(
        rtmService.createLink({ requirement_id: 999, design_id: 'DESIGN-001' })
      ).rejects.toThrow('创建失败')
    })
  })

  describe('updateLink', () => {
    it('应该成功更新追溯关联', async () => {
      const updateData = {
        design_id: 'DESIGN-002',
        notes: '更新后的备注',
      }

      const mockUpdated = {
        id: 1,
        requirement_id: 1,
        design_id: 'DESIGN-002',
        code_id: 'CODE-001',
        test_id: 'TEST-001',
        status: 'active',
        notes: '更新后的备注',
        created_at: '2026-01-18',
        updated_at: '2026-01-18',
      }

      vi.mocked(api.put).mockResolvedValue({ data: mockUpdated })

      const result = await rtmService.updateLink(1, updateData)

      expect(api.put).toHaveBeenCalledWith('/rtm/links/1', updateData)
      expect(result.data).toEqual(mockUpdated)
    })

    it('应该处理不存在的关联', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('关联不存在'))

      await expect(
        rtmService.updateLink(999, { design_id: 'DESIGN-002' })
      ).rejects.toThrow('关联不存在')
    })
  })

  describe('deleteLink', () => {
    it('应该成功删除追溯关联', async () => {
      vi.mocked(api.delete).mockResolvedValue({ message: '删除成功' })

      const result = await rtmService.deleteLink(1)

      expect(api.delete).toHaveBeenCalledWith('/rtm/links/1')
      expect(result.message).toBe('删除成功')
    })

    it('应该处理不存在的关联', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('关联不存在'))

      await expect(rtmService.deleteLink(999)).rejects.toThrow('关联不存在')
    })
  })

  describe('exportMatrix', () => {
    const API_BASE_URL = 'http://localhost:8000/api/v1'

    beforeEach(() => {
      // Mock fetch
      ;(globalThis as any).fetch = vi.fn()
      // Reset environment
      vi.stubGlobal('import', {
        meta: {
          env: {
            VITE_API_URL: API_BASE_URL,
          },
        },
      })
    })

    it('应该成功导出Excel格式', async () => {
      const mockBlob = new Blob(['test'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      vi.mocked((globalThis as any).fetch).mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      } as Response)

      const result = await rtmService.exportMatrix('excel')

      expect((globalThis as any).fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/rtm/export?format=excel`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'X-Tenant-ID': '1',
          }),
        })
      )
      expect(result.data).toEqual(mockBlob)
    })

    it('应该成功导出PDF格式', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' })

      vi.mocked((globalThis as any).fetch).mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      } as Response)

      const result = await rtmService.exportMatrix('pdf')

      expect((globalThis as any).fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/rtm/export?format=pdf`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'X-Tenant-ID': '1',
          }),
        })
      )
      expect(result.data).toEqual(mockBlob)
    })

    it('默认应该导出Excel格式', async () => {
      const mockBlob = new Blob(['test'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      vi.mocked((globalThis as any).fetch).mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      } as Response)

      await rtmService.exportMatrix()

      expect((globalThis as any).fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/rtm/export?format=excel`,
        expect.any(Object)
      )
    })

    it('应该处理导出失败', async () => {
      vi.mocked((globalThis as any).fetch).mockResolvedValue({
        ok: false,
      } as Response)

      await expect(rtmService.exportMatrix('excel')).rejects.toThrow('导出失败')
    })

    it('应该处理网络错误', async () => {
      vi.mocked((globalThis as any).fetch).mockRejectedValue(new Error('Network error'))

      await expect(rtmService.exportMatrix('excel')).rejects.toThrow('Network error')
    })
  })
})

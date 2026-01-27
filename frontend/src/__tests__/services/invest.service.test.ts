/**
 * INVESTService 测试
 *
 * 测试 INVEST 分析相关的所有 API 调用
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { investService, type INVESTAnalysisData, type INVESTAnalysisResponse } from '@/services/invest.service'

// Mock api模块
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('INVESTService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getINVESTAnalysis', () => {
    it('应该成功获取 INVEST 分析数据', async () => {
      const mockData: INVESTAnalysisResponse = {
        requirement_id: 1,
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        passed_count: 5,
        total_count: 6,
        notes: 'Good requirement',
        analyzed_at: '2026-01-28T10:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.get).mockResolvedValue({
        success: true,
        data: mockData,
      })

      const result = await investService.getINVESTAnalysis(1)

      expect(result).toEqual(mockData)
      expect(api.default.get).toHaveBeenCalledWith('/requirements/1/invest')
    })

    it('应该处理空数据返回 null', async () => {
      const api = await import('@/services/api')
      vi.mocked(api.default.get).mockResolvedValue({
        success: true,
        data: null,
      })

      const result = await investService.getINVESTAnalysis(1)

      expect(result).toBeNull()
    })

    it('应该处理 API 错误', async () => {
      const api = await import('@/services/api')
      vi.mocked(api.default.get).mockRejectedValue(new Error('Network error'))

      await expect(investService.getINVESTAnalysis(1)).rejects.toThrow('Network error')
    })

    it('应该正确解析所有字段为 true 的情况', async () => {
      const mockData: INVESTAnalysisResponse = {
        requirement_id: 2,
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: true,
        testable: true,
        passed_count: 6,
        total_count: 6,
        notes: 'Perfect requirement',
        analyzed_at: '2026-01-28T11:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.get).mockResolvedValue({
        success: true,
        data: mockData,
      })

      const result = await investService.getINVESTAnalysis(2)

      expect(result?.passed_count).toBe(6)
      expect(result?.total_count).toBe(6)
    })

    it('应该正确解析所有字段为 false 的情况', async () => {
      const mockData: INVESTAnalysisResponse = {
        requirement_id: 3,
        independent: false,
        negotiable: false,
        valuable: false,
        estimable: false,
        small: false,
        testable: false,
        passed_count: 0,
        total_count: 6,
        notes: 'Poor requirement',
        analyzed_at: '2026-01-28T12:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.get).mockResolvedValue({
        success: true,
        data: mockData,
      })

      const result = await investService.getINVESTAnalysis(3)

      expect(result?.passed_count).toBe(0)
      expect(result?.independent).toBe(false)
    })

    it('应该正确解析混合布尔值的情况', async () => {
      const mockData: INVESTAnalysisResponse = {
        requirement_id: 4,
        independent: true,
        negotiable: false,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        passed_count: 4,
        total_count: 6,
        notes: 'Partial requirement',
        analyzed_at: '2026-01-28T13:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.get).mockResolvedValue({
        success: true,
        data: mockData,
      })

      const result = await investService.getINVESTAnalysis(4)

      expect(result?.passed_count).toBe(4)
      expect(result?.negotiable).toBe(false)
      expect(result?.small).toBe(false)
    })
  })

  describe('saveINVESTAnalysis', () => {
    it('应该成功保存 INVEST 分析数据', async () => {
      const inputData: INVESTAnalysisData = {
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        notes: 'Test requirement',
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 1,
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        passed_count: 5,
        total_count: 6,
        notes: 'Test requirement',
        analyzed_at: '2026-01-28T14:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await investService.saveINVESTAnalysis(1, inputData)

      expect(result).toEqual(mockResponse)
      expect(api.default.post).toHaveBeenCalledWith('/requirements/1/invest', inputData)
    })

    it('应该正确保存所有字段为 true 的情况', async () => {
      const inputData: INVESTAnalysisData = {
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: true,
        testable: true,
        notes: 'Perfect',
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 2,
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: true,
        testable: true,
        passed_count: 6,
        total_count: 6,
        notes: 'Perfect',
        analyzed_at: '2026-01-28T15:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await investService.saveINVESTAnalysis(2, inputData)

      expect(result?.passed_count).toBe(6)
    })

    it('应该正确保存所有字段为 false 的情况', async () => {
      const inputData: INVESTAnalysisData = {
        independent: false,
        negotiable: false,
        valuable: false,
        estimable: false,
        small: false,
        testable: false,
        notes: 'Needs improvement',
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 3,
        independent: false,
        negotiable: false,
        valuable: false,
        estimable: false,
        small: false,
        testable: false,
        passed_count: 0,
        total_count: 6,
        notes: 'Needs improvement',
        analyzed_at: '2026-01-28T16:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await investService.saveINVESTAnalysis(3, inputData)

      expect(result?.passed_count).toBe(0)
    })

    it('应该正确保存混合布尔值的情况', async () => {
      const inputData: INVESTAnalysisData = {
        independent: true,
        negotiable: false,
        valuable: true,
        estimable: false,
        small: true,
        testable: false,
        notes: 'Mixed',
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 4,
        independent: true,
        negotiable: false,
        valuable: true,
        estimable: false,
        small: true,
        testable: false,
        passed_count: 3,
        total_count: 6,
        notes: 'Mixed',
        analyzed_at: '2026-01-28T17:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await investService.saveINVESTAnalysis(4, inputData)

      expect(result?.passed_count).toBe(3)
    })

    it('应该正确保存不带 notes 的情况', async () => {
      const inputData: INVESTAnalysisData = {
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: true,
        testable: true,
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 5,
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: true,
        testable: true,
        passed_count: 6,
        total_count: 6,
        analyzed_at: '2026-01-28T18:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await investService.saveINVESTAnalysis(5, inputData)

      expect(result?.notes).toBeUndefined()
      expect(result?.passed_count).toBe(6)
    })

    it('应该处理保存失败的错误', async () => {
      const inputData: INVESTAnalysisData = {
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: true,
        testable: true,
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockRejectedValue(new Error('Save failed'))

      await expect(investService.saveINVESTAnalysis(1, inputData)).rejects.toThrow('Save failed')
    })

    it('应该验证数据结构完整性', async () => {
      const inputData: INVESTAnalysisData = {
        independent: true,
        negotiable: false,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        notes: 'Structure test',
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 6,
        independent: true,
        negotiable: false,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        passed_count: 4,
        total_count: 6,
        notes: 'Structure test',
        analyzed_at: '2026-01-28T19:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await investService.saveINVESTAnalysis(6, inputData)

      // 验证响应包含所有必需字段
      expect(result).toHaveProperty('requirement_id')
      expect(result).toHaveProperty('independent')
      expect(result).toHaveProperty('negotiable')
      expect(result).toHaveProperty('valuable')
      expect(result).toHaveProperty('estimable')
      expect(result).toHaveProperty('small')
      expect(result).toHaveProperty('testable')
      expect(result).toHaveProperty('passed_count')
      expect(result).toHaveProperty('total_count')
      expect(result).toHaveProperty('analyzed_at')
    })
  })

  describe('INVESTAnalysisData 接口', () => {
    it('应该正确定义 INVESTAnalysisData 接口', () => {
      const data: INVESTAnalysisData = {
        independent: true,
        negotiable: false,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        notes: 'Test',
        passedCount: 4,
      }

      expect(data.independent).toBe(true)
      expect(data.negotiable).toBe(false)
      expect(data.passedCount).toBe(4)
    })
  })

  describe('INVESTAnalysisResponse 接口', () => {
    it('应该正确定义 INVESTAnalysisResponse 接口', () => {
      const response: INVESTAnalysisResponse = {
        requirement_id: 1,
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: true,
        testable: true,
        passed_count: 6,
        total_count: 6,
        notes: 'Test',
        analyzed_at: '2026-01-28T10:00:00',
      }

      expect(response.requirement_id).toBe(1)
      expect(response.passed_count).toBe(6)
      expect(response.total_count).toBe(6)
    })
  })
})

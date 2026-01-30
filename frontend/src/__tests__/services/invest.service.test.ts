/**
 * INVESTService 测试 - 评分系统
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
    it('应该成功获取 INVEST 分析数据（评分系统）', async () => {
      const mockData: INVESTAnalysisResponse = {
        requirement_id: 1,
        independent: 85,
        negotiable: 60,
        valuable: 90,
        estimable: 75,
        small: 70,
        testable: 80,
        total_score: 460,
        average_score: 76.67,
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

    it('应该正确解析满分（100分）的情况', async () => {
      const mockData: INVESTAnalysisResponse = {
        requirement_id: 2,
        independent: 100,
        negotiable: 100,
        valuable: 100,
        estimable: 100,
        small: 100,
        testable: 100,
        total_score: 600,
        average_score: 100.00,
        notes: 'Perfect requirement',
        analyzed_at: '2026-01-28T11:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.get).mockResolvedValue({
        success: true,
        data: mockData,
      })

      const result = await investService.getINVESTAnalysis(2)

      expect(result?.total_score).toBe(600)
      expect(result?.average_score).toBe(100.00)
    })

    it('应该正确解析低分的情况', async () => {
      const mockData: INVESTAnalysisResponse = {
        requirement_id: 3,
        independent: 30,
        negotiable: 40,
        valuable: 35,
        estimable: 25,
        small: 45,
        testable: 30,
        total_score: 205,
        average_score: 34.17,
        notes: 'Poor requirement',
        analyzed_at: '2026-01-28T12:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.get).mockResolvedValue({
        success: true,
        data: mockData,
      })

      const result = await investService.getINVESTAnalysis(3)

      expect(result?.total_score).toBe(205)
      expect(result?.independent).toBe(30)
    })

    it('应该正确解析中等分数的情况', async () => {
      const mockData: INVESTAnalysisResponse = {
        requirement_id: 4,
        independent: 85,
        negotiable: 40,
        valuable: 75,
        estimable: 90,
        small: 55,
        testable: 70,
        total_score: 415,
        average_score: 69.17,
        notes: 'Average requirement',
        analyzed_at: '2026-01-28T13:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.get).mockResolvedValue({
        success: true,
        data: mockData,
      })

      const result = await investService.getINVESTAnalysis(4)

      expect(result?.total_score).toBe(415)
      expect(result?.negotiable).toBe(40)
      expect(result?.small).toBe(55)
    })

    it('应该验证平均分计算精度', async () => {
      const mockData: INVESTAnalysisResponse = {
        requirement_id: 5,
        independent: 85,
        negotiable: 85,
        valuable: 85,
        estimable: 85,
        small: 85,
        testable: 85,
        total_score: 510,
        average_score: 85.00,
        notes: 'Consistent scores',
        analyzed_at: '2026-01-28T14:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.get).mockResolvedValue({
        success: true,
        data: mockData,
      })

      const result = await investService.getINVESTAnalysis(5)

      expect(result?.average_score).toBe(85.00)
      expect(result?.total_score / 6).toBe(85)
    })
  })

  describe('saveINVESTAnalysis', () => {
    it('应该成功保存 INVEST 分析数据（评分系统）', async () => {
      const inputData: INVESTAnalysisData = {
        independent: 85,
        negotiable: 60,
        valuable: 90,
        estimable: 75,
        small: 70,
        testable: 80,
        notes: 'Test requirement',
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 1,
        independent: 85,
        negotiable: 60,
        valuable: 90,
        estimable: 75,
        small: 70,
        testable: 80,
        total_score: 460,
        average_score: 76.67,
        notes: 'Test requirement',
        analyzed_at: '2026-01-28T15:00:00',
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

    it('应该正确保存满分的情况', async () => {
      const inputData: INVESTAnalysisData = {
        independent: 100,
        negotiable: 100,
        valuable: 100,
        estimable: 100,
        small: 100,
        testable: 100,
        notes: 'Perfect',
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 2,
        independent: 100,
        negotiable: 100,
        valuable: 100,
        estimable: 100,
        small: 100,
        testable: 100,
        total_score: 600,
        average_score: 100.00,
        notes: 'Perfect',
        analyzed_at: '2026-01-28T16:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await investService.saveINVESTAnalysis(2, inputData)

      expect(result?.total_score).toBe(600)
      expect(result?.average_score).toBe(100.00)
    })

    it('应该正确保存零分的情况', async () => {
      const inputData: INVESTAnalysisData = {
        independent: 0,
        negotiable: 0,
        valuable: 0,
        estimable: 0,
        small: 0,
        testable: 0,
        notes: 'Needs improvement',
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 3,
        independent: 0,
        negotiable: 0,
        valuable: 0,
        estimable: 0,
        small: 0,
        testable: 0,
        total_score: 0,
        average_score: 0.00,
        notes: 'Needs improvement',
        analyzed_at: '2026-01-28T17:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await investService.saveINVESTAnalysis(3, inputData)

      expect(result?.total_score).toBe(0)
      expect(result?.average_score).toBe(0.00)
    })

    it('应该正确保存中等分数的情况', async () => {
      const inputData: INVESTAnalysisData = {
        independent: 50,
        negotiable: 60,
        valuable: 70,
        estimable: 55,
        small: 65,
        testable: 50,
        notes: 'Average',
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 4,
        independent: 50,
        negotiable: 60,
        valuable: 70,
        estimable: 55,
        small: 65,
        testable: 50,
        total_score: 350,
        average_score: 58.33,
        notes: 'Average',
        analyzed_at: '2026-01-28T18:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await investService.saveINVESTAnalysis(4, inputData)

      expect(result?.total_score).toBe(350)
      expect(result?.average_score).toBeCloseTo(58.33, 1)
    })

    it('应该正确保存不带 notes 的情况', async () => {
      const inputData: INVESTAnalysisData = {
        independent: 75,
        negotiable: 80,
        valuable: 85,
        estimable: 90,
        small: 70,
        testable: 80,
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 5,
        independent: 75,
        negotiable: 80,
        valuable: 85,
        estimable: 90,
        small: 70,
        testable: 80,
        total_score: 480,
        average_score: 80.00,
        analyzed_at: '2026-01-28T19:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await investService.saveINVESTAnalysis(5, inputData)

      expect(result?.notes).toBeUndefined()
      expect(result?.total_score).toBe(480)
    })

    it('应该处理保存失败的错误', async () => {
      const inputData: INVESTAnalysisData = {
        independent: 50,
        negotiable: 50,
        valuable: 50,
        estimable: 50,
        small: 50,
        testable: 50,
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockRejectedValue(new Error('Save failed'))

      await expect(investService.saveINVESTAnalysis(1, inputData)).rejects.toThrow('Save failed')
    })

    it('应该验证数据结构完整性', async () => {
      const inputData: INVESTAnalysisData = {
        independent: 85,
        negotiable: 40,
        valuable: 75,
        estimable: 90,
        small: 55,
        testable: 70,
        notes: 'Structure test',
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 6,
        independent: 85,
        negotiable: 40,
        valuable: 75,
        estimable: 90,
        small: 55,
        testable: 70,
        total_score: 415,
        average_score: 69.17,
        notes: 'Structure test',
        analyzed_at: '2026-01-28T20:00:00',
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
      expect(result).toHaveProperty('total_score')
      expect(result).toHaveProperty('average_score')
      expect(result).toHaveProperty('analyzed_at')
    })

    it('应该验证评分范围（0-100）', async () => {
      const inputData: INVESTAnalysisData = {
        independent: 0,
        negotiable: 100,
        valuable: 50,
        estimable: 25,
        small: 75,
        testable: 99,
        notes: 'Boundary test',
      }

      const mockResponse: INVESTAnalysisResponse = {
        requirement_id: 7,
        independent: 0,
        negotiable: 100,
        valuable: 50,
        estimable: 25,
        small: 75,
        testable: 99,
        total_score: 349,
        average_score: 58.17,
        notes: 'Boundary test',
        analyzed_at: '2026-01-28T21:00:00',
      }

      const api = await import('@/services/api')
      vi.mocked(api.default.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await investService.saveINVESTAnalysis(7, inputData)

      // 验证边界值
      expect(result?.independent).toBe(0)
      expect(result?.negotiable).toBe(100)
      expect(result?.testable).toBe(99)
    })
  })

  describe('INVESTAnalysisData 接口', () => {
    it('应该正确定义 INVESTAnalysisData 接口（评分系统）', () => {
      const data: INVESTAnalysisData = {
        independent: 85,
        negotiable: 60,
        valuable: 90,
        estimable: 75,
        small: 70,
        testable: 80,
        notes: 'Test',
      }

      expect(data.independent).toBe(85)
      expect(data.negotiable).toBe(60)
      expect(typeof data.independent).toBe('number')
    })
  })

  describe('INVESTAnalysisResponse 接口', () => {
    it('应该正确定义 INVESTAnalysisResponse 接口（评分系统）', () => {
      const response: INVESTAnalysisResponse = {
        requirement_id: 1,
        independent: 85,
        negotiable: 60,
        valuable: 90,
        estimable: 75,
        small: 70,
        testable: 80,
        total_score: 460,
        average_score: 76.67,
        notes: 'Test',
        analyzed_at: '2026-01-28T10:00:00',
      }

      expect(response.requirement_id).toBe(1)
      expect(response.total_score).toBe(460)
      expect(response.average_score).toBe(76.67)
      expect(typeof response.total_score).toBe('number')
      expect(typeof response.average_score).toBe('number')
    })
  })
})

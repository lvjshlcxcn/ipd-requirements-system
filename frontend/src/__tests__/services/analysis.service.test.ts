/**
 * AnalysisService 测试
 *
 * 测试分析服务相关的所有API调用
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { analysisService } from '@/services/analysis.service'
import api from '@/services/api'

// Mock api模块
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('AnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAnalysis', () => {
    it('应该成功获取分析结果', async () => {
      const mockAnalysis = {
        id: 1,
        requirement_id: 1,
        invest_analysis: {
          independent: true,
          negotiable: true,
          valuable: true,
          estimable: true,
          small: true,
          testable: true,
        },
        moscow_priority: 'must_have',
        kano_category: 'performance',
        rice_score: {
          reach: 8,
          impact: 9,
          confidence: 7,
          effort: 5,
          score: 12.6,
        },
        overall_score: 8.5,
        analyzed_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockAnalysis })

      const result = await analysisService.getAnalysis(1)

      expect(api.get).toHaveBeenCalledWith('/requirements/1/analysis')
      expect(result.data).toEqual(mockAnalysis)
    })

    it('应该处理分析不存在', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('分析不存在'))

      await expect(analysisService.getAnalysis(999)).rejects.toThrow('分析不存在')
    })
  })

  describe('saveAnalysis', () => {
    it('应该成功保存分析', async () => {
      const analysisData = {
        invest: {
          independent: true,
          negotiable: true,
          valuable: true,
          estimable: true,
          small: true,
          testable: true,
        },
        moscow: {
          priority: 'must_have' as const,
        },
        kano_category: 'performance' as const,
        rice: {
          reach: 8,
          impact: 9,
          confidence: 7,
          effort: 5,
        },
      }

      const mockResult = {
        id: 1,
        ...analysisData,
        overall_score: 8.5,
        analyzed_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockResult })

      const result = await analysisService.saveAnalysis(1, analysisData)

      expect(api.post).toHaveBeenCalledWith('/requirements/1/analysis', analysisData)
      expect(result.data).toEqual(mockResult)
    })

    it('应该处理保存失败', async () => {
      const analysisData = {
        invest: {
          independent: true,
          negotiable: true,
          valuable: true,
          estimable: true,
          small: true,
          testable: true,
        },
        moscow: { priority: 'must_have' },
        kano_category: 'performance',
        rice: { reach: 8, impact: 9, confidence: 7, effort: 5 },
      }

      vi.mocked(api.post).mockRejectedValue(new Error('保存失败'))

      await expect(
        analysisService.saveAnalysis(1, analysisData)
      ).rejects.toThrow('保存失败')
    })
  })
})

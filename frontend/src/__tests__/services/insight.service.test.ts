/**
 * InsightService 测试
 *
 * 测试洞察(Insight)相关的所有API调用
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import insightService from '@/services/insight.service'
import api from '@/services/api'
import type { Insight, InsightAnalysisResult } from '@/types/insight'

// Mock api模块
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('InsightService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzeText', () => {
    it('应该成功分析文本洞察', async () => {
      const requestData = {
        input_text: '这是一个产品需求描述',
        input_source: 'manual',
        analysis_mode: 'full',
      }

      const mockInsight: Insight = {
        id: 1,
        requirement_id: null,
        insight_type: 'appeals',
        title: 'APPEALS分析结果',
        summary: '该需求在性能方面表现优秀',
        details: {
          score: 8.5,
          dimensions: {
            price: { score: 8, weight: 0.8 },
            performance: { score: 9, weight: 0.9 },
          },
        },
        analysis_result: {
          overall_score: 8.5,
          recommendations: ['建议优先实施'],
        },
        created_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue(mockInsight as any)

      const result = await insightService.analyzeText(requestData)

      expect(api.post).toHaveBeenCalledWith('/insights/analyze', requestData)
      expect(result.id).toBe(1)
      expect(result.insight_type).toBe('appeals')
    })

    it('应该处理快速分析模式', async () => {
      const requestData = {
        input_text: '简短描述',
        analysis_mode: 'quick',
      }

      const mockInsight: Insight = {
        id: 1,
        requirement_id: null,
        insight_type: 'quick',
        title: '快速分析',
        summary: '快速分析结果',
        details: {},
        created_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue(mockInsight as any)

      const result = await insightService.analyzeText(requestData)

      expect(api.post).toHaveBeenCalledWith('/insights/analyze', requestData)
      expect(result.insight_type).toBe('quick')
    })

    it('应该处理分析失败', async () => {
      const requestData = {
        input_text: '',
      }

      vi.mocked(api.post).mockRejectedValue(
        new Error('分析失败：文本为空')
      )

      await expect(
        insightService.analyzeText(requestData)
      ).rejects.toThrow('分析失败：文本为空')
    })
  })

  describe('listInsights', () => {
    it('应该成功获取洞察列表', async () => {
      const mockInsights: Insight[] = [
        {
          id: 1,
          requirement_id: 1,
          insight_type: 'appeals',
          title: 'APPEALS分析',
          summary: '分析完成',
          details: {},
          created_at: '2026-01-26T00:00:00Z',
        },
        {
          id: 2,
          requirement_id: 1,
          insight_type: 'user_feedback',
          title: '用户反馈',
          summary: '收到15条反馈',
          details: {},
          created_at: '2026-01-26T01:00:00:00Z',
        },
      ]

      vi.mocked(api.get).mockResolvedValue(mockInsights as any)

      const result = await insightService.listInsights()

      expect(api.get).toHaveBeenCalledWith('/insights', {
        params: undefined,
      })
      expect(result.length).toBe(2)
      expect(result[0].insight_type).toBe('appeals')
    })

    it('应该支持分页参数', async () => {
      const params = {
        skip: 10,
        limit: 20,
        status: 'active',
      }

      vi.mocked(api.get).mockResolvedValue([] as any)

      await insightService.listInsights(params)

      expect(api.get).toHaveBeenCalledWith('/insights', { params })
    })

    it('应该处理空列表', async () => {
      vi.mocked(api.get).mockResolvedValue([] as any)

      const result = await insightService.listInsights()

      expect(result).toEqual([])
    })
  })

  describe('getInsight', () => {
    it('应该成功获取单个洞察', async () => {
      const mockInsight: Insight = {
        id: 1,
        requirement_id: 1,
        insight_type: 'appeals',
        title: 'APPEALS分析',
        summary: '分析完成',
        details: {},
        analysis_result: {
          overall_score: 8.5,
        },
        created_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.get).mockResolvedValue(mockInsight as any)

      const result = await insightService.getInsight(1)

      expect(api.get).toHaveBeenCalledWith('/insights/1')
      expect(result.id).toBe(1)
    })

    it('应该处理洞察不存在', async () => {
      vi.mocked(api.get).mockRejectedValue(
        new Error('洞察不存在')
      )

      await expect(insightService.getInsight(999)).rejects.toThrow(
        '洞察不存在'
      )
    })
  })

  describe('updateInsight', () => {
    it('应该成功更新洞察分析结果', async () => {
      const analysisResult: InsightAnalysisResult = {
        overall_score: 8.5,
        dimensions: {
          price: { score: 8, weight: 0.8 },
          performance: { score: 9, weight: 0.9 },
        },
        recommendations: ['建议1', '建议2'],
      }

      const mockInsight: Insight = {
        id: 1,
        requirement_id: 1,
        insight_type: 'appeals',
        title: 'APPEALS分析',
        summary: '更新后的分析',
        details: {},
        analysis_result: analysisResult,
        created_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.put).mockResolvedValue(mockInsight as any)

      const result = await insightService.updateInsight(1, analysisResult)

      expect(api.put).toHaveBeenCalledWith(
        '/insights/1',
        analysisResult
      )
      expect(result.analysis_result).toEqual(analysisResult)
    })

    it('应该处理更新失败', async () => {
      const analysisResult = {
        overall_score: 8.5,
        recommendations: [],
      }

      vi.mocked(api.put).mockRejectedValue(
        new Error('更新失败：洞察不存在')
      )

      await expect(
        insightService.updateInsight(999, analysisResult)
      ).rejects.toThrow('更新失败：洞察不存在')
    })
  })

  describe('linkToRequirement', () => {
    it('应该成功关联到需求', async () => {
      const mockResponse = {
        message: '关联成功',
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse as any)

      const result = await insightService.linkToRequirement(1, 5)

      expect(api.post).toHaveBeenCalledWith('/insights/1/link-requirement', {
        requirement_id: 5,
      })
      expect(result.message).toBe('关联成功')
    })

    it('应该处理关联失败（洞察不存在）', async () => {
      vi.mocked(api.post).mockRejectedValue(
        new Error('洞察不存在')
      )

      await expect(
        insightService.linkToRequirement(999, 5)
      ).rejects.toThrow('洞察不存在')
    })

    it('应该处理关联失败（需求不存在）', async () => {
      vi.mocked(api.post).mockRejectedValue(
        new Error('需求不存在')
      )

      await expect(
        insightService.linkToRequirement(1, 999)
      ).rejects.toThrow('需求不存在')
    })
  })

  describe('deleteInsight', () => {
    it('应该成功删除洞察', async () => {
      vi.mocked(api.delete).mockResolvedValue({})

      await insightService.deleteInsight(1)

      expect(api.delete).toHaveBeenCalledWith('/insights/1')
    })

    it('应该处理删除失败', async () => {
      vi.mocked(api.delete).mockRejectedValue(
        new Error('删除失败：洞察不存在')
      )

      await expect(insightService.deleteInsight(999)).rejects.toThrow(
        '删除失败：洞察不存在'
      )
    })
  })

  describe('边界情况', () => {
    it('应该处理空文本输入', async () => {
      const requestData = {
        input_text: '',
      }

      vi.mocked(api.post).mockRejectedValue(
        new Error('文本不能为空')
      )

      await expect(
        insightService.analyzeText(requestData)
      ).rejects.toThrow('文本不能为空')
    })

    it('应该处理极长的文本输入', async () => {
      const longText = 'x'.repeat(10000)

      const requestData = {
        input_text: longText,
      }

      const mockInsight: Insight = {
        id: 1,
        requirement_id: null,
        insight_type: 'analysis',
        title: '长文本分析',
        summary: '分析完成',
        details: {},
        created_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue(mockInsight as any)

      const result = await insightService.analyzeText(requestData)

      expect(result).not.toBeNull()
    })

    it('应该处理特殊字符的输入', async () => {
      const specialText = '文本包含"引号"和\'单引号\'\n换行\t制表符'

      const requestData = {
        input_text: specialText,
      }

      const mockInsight: Insight = {
        id: 1,
        requirement_id: null,
        insight_type: 'analysis',
        title: '特殊字符分析',
        summary: '分析完成',
        details: {},
        created_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue(mockInsight as any)

      const result = await insightService.analyzeText(requestData)

      expect(result).not.toBeNull()
    })
  })

  describe('不同分析模式', () => {
    it('应该处理完整分析模式', async () => {
      const requestData = {
        input_text: '完整需求描述',
        analysis_mode: 'full',
      }

      const mockInsight: Insight = {
        id: 1,
        requirement_id: null,
        insight_type: 'full_analysis',
        title: '完整分析',
        summary: '8维度分析完成',
        details: {},
        analysis_result: {
          overall_score: 8.5,
        },
        created_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue(mockInsight as any)

      const result = await insightService.analyzeText(requestData)

      expect(result.insight_type).toBe('full_analysis')
    })

    it('应该处理快速分析模式', async () => {
      const requestData = {
        input_text: '简短需求',
        analysis_mode: 'quick',
      }

      const mockInsight: Insight = {
        id: 1,
        requirement_id: null,
        insight_type: 'quick_analysis',
        title: '快速分析',
        summary: '快速分析完成',
        details: {},
        created_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue(mockInsight as any)

      const result = await insightService.analyzeText(requestData)

      expect(result.insight_type).toBe('quick_analysis')
    })

    it('应该处理不同输入来源', async () => {
      const sources: Array<'manual' | 'upload' | 'voice'> = [
        'manual',
        'upload',
        'voice',
      ]

      for (const source of sources) {
        const requestData = {
          input_text: '测试文本',
          input_source: source,
        }

        vi.mocked(api.post).mockResolvedValue({} as any)

        await insightService.analyzeText(requestData)

        expect(api.post).toHaveBeenCalledWith('/insights/analyze', requestData)
      }
    })
  })
})

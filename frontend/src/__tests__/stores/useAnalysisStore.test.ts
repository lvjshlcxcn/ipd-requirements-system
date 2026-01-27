/**
 * useAnalysisStore 测试
 *
 * 测试需求分析Store的所有功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnalysisStore } from '@/stores/useAnalysisStore'
import { analysisService } from '@/services/analysis.service'

// Mock analysisService
vi.mock('@/services/analysis.service', () => ({
  analysisService: {
    getAnalysis: vi.fn(),
    saveAnalysis: vi.fn(),
  },
}))

describe('useAnalysisStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAnalysisStore.setState({
      analysisData: new Map(),
      analysisResults: new Map(),
      currentRequirementAnalysis: null,
      isLoading: false,
    })
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const { result } = renderHook(() => useAnalysisStore())

      expect(result.current.analysisData).toBeInstanceOf(Map)
      expect(result.current.analysisData.size).toBe(0)
      expect(result.current.analysisResults).toBeInstanceOf(Map)
      expect(result.current.analysisResults.size).toBe(0)
      expect(result.current.currentRequirementAnalysis).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('fetchAnalysis', () => {
    it('应该成功获取分析数据', async () => {
      const mockAnalysisResult = {
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

      vi.mocked(analysisService.getAnalysis).mockResolvedValue({
        data: mockAnalysisResult,
      })

      const { result } = renderHook(() => useAnalysisStore())

      await act(async () => {
        await result.current.fetchAnalysis(1)
      })

      expect(result.current.analysisResults.get(1)).toEqual(mockAnalysisResult)
      expect(result.current.currentRequirementAnalysis).toEqual(mockAnalysisResult)
      expect(result.current.isLoading).toBe(false)
    })

    it('应该处理获取失败', async () => {
      vi.mocked(analysisService.getAnalysis).mockRejectedValue(
        new Error('分析数据不存在')
      )

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAnalysisStore())

      await act(async () => {
        await result.current.fetchAnalysis(999)
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch analysis:',
        expect.any(Error)
      )
      expect(result.current.isLoading).toBe(false)

      consoleSpy.mockRestore()
    })

    it('应该在加载期间设置isLoading为true', async () => {
      vi.mocked(analysisService.getAnalysis).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ data: {} })
            }, 100)
          })
      )

      const { result } = renderHook(() => useAnalysisStore())

      act(() => {
        result.current.fetchAnalysis(1)
      })

      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150))
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('saveAnalysis', () => {
    it('应该成功保存分析数据', async () => {
      const analysisData = {
        invest: {
          independent: true,
          negotiable: true,
          valuable: true,
          estimable: true,
          small: true,
          testable: true,
          notes: 'INVEST分析备注',
        },
        moscow: {
          priority: 'must_have',
          notes: 'MoSCoW分析备注',
        },
        kano_category: 'performance',
        rice: {
          reach: 8,
          impact: 9,
          confidence: 7,
          effort: 5,
        },
        notes: '总体分析',
      }

      const mockResult = {
        id: 1,
        requirement_id: 1,
        invest_analysis: analysisData.invest,
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

      vi.mocked(analysisService.saveAnalysis).mockResolvedValue({
        data: mockResult,
      })

      const { result } = renderHook(() => useAnalysisStore())

      await act(async () => {
        await result.current.saveAnalysis(1, analysisData)
      })

      expect(result.current.analysisData.get(1)).toEqual(analysisData)
      expect(result.current.analysisResults.get(1)).toEqual(mockResult)
      expect(result.current.currentRequirementAnalysis).toEqual(mockResult)
      expect(result.current.isLoading).toBe(false)
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
        moscow: {
          priority: 'must_have',
        },
        kano_category: 'performance',
        rice: {
          reach: 8,
          impact: 9,
          confidence: 7,
          effort: 5,
        },
      }

      vi.mocked(analysisService.saveAnalysis).mockRejectedValue(
        new Error('保存失败')
      )

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAnalysisStore())

      await act(async () => {
        await result.current.saveAnalysis(1, analysisData)
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save analysis:',
        expect.any(Error)
      )
      expect(result.current.isLoading).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('setCurrentAnalysis', () => {
    it('应该设置当前分析', () => {
      const { result } = renderHook(() => useAnalysisStore())

      const mockAnalysis = {
        id: 1,
        requirement_id: 1,
        invest_analysis: {},
        moscow_priority: 'must_have',
        kano_category: 'performance',
        rice_score: {},
        overall_score: 8.5,
        analyzed_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentAnalysis(mockAnalysis as any)
      })

      expect(result.current.currentRequirementAnalysis).toEqual(mockAnalysis)
    })

    it('应该清除当前分析', () => {
      const { result } = renderHook(() => useAnalysisStore())

      const mockAnalysis = {
        id: 1,
        requirement_id: 1,
        invest_analysis: {},
        moscow_priority: 'must_have',
        kano_category: 'performance',
        rice_score: {},
        overall_score: 8.5,
        analyzed_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentAnalysis(mockAnalysis as any)
      })

      expect(result.current.currentRequirementAnalysis).toEqual(mockAnalysis)

      act(() => {
        result.current.setCurrentAnalysis(null)
      })

      expect(result.current.currentRequirementAnalysis).toBeNull()
    })
  })

  describe('Map数据结构', () => {
    it('应该正确存储多个分析数据', async () => {
      const mockAnalysis1 = {
        id: 1,
        requirement_id: 1,
        invest_analysis: {},
        moscow_priority: 'must_have',
        kano_category: 'performance',
        rice_score: {},
        overall_score: 8.5,
        analyzed_at: '2026-01-26T00:00:00Z',
      }

      const mockAnalysis2 = {
        id: 2,
        requirement_id: 2,
        invest_analysis: {},
        moscow_priority: 'should_have',
        kano_category: 'basic',
        rice_score: {},
        overall_score: 6.5,
        analyzed_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(analysisService.getAnalysis)
        .mockResolvedValueOnce({ data: mockAnalysis1 })
        .mockResolvedValueOnce({ data: mockAnalysis2 })

      const { result } = renderHook(() => useAnalysisStore())

      await act(async () => {
        await result.current.fetchAnalysis(1)
      })

      await act(async () => {
        await result.current.fetchAnalysis(2)
      })

      expect(result.current.analysisResults.size).toBe(2)
      expect(result.current.analysisResults.get(1)).toEqual(mockAnalysis1)
      expect(result.current.analysisResults.get(2)).toEqual(mockAnalysis2)
    })

    it('应该支持覆盖已存在的分析数据', async () => {
      const mockAnalysis1 = {
        id: 1,
        requirement_id: 1,
        invest_analysis: {},
        moscow_priority: 'must_have',
        kano_category: 'performance',
        rice_score: {},
        overall_score: 8.5,
        analyzed_at: '2026-01-26T00:00:00Z',
      }

      const mockAnalysis2 = {
        id: 2,
        requirement_id: 1,
        invest_analysis: {},
        moscow_priority: 'should_have',
        kano_category: 'basic',
        rice_score: {},
        overall_score: 6.5,
        analyzed_at: '2026-01-26T01:00:00Z',
      }

      vi.mocked(analysisService.getAnalysis)
        .mockResolvedValueOnce({ data: mockAnalysis1 })
        .mockResolvedValueOnce({ data: mockAnalysis2 })

      const { result } = renderHook(() => useAnalysisStore())

      await act(async () => {
        await result.current.fetchAnalysis(1)
      })

      expect(result.current.analysisResults.get(1)).toEqual(mockAnalysis1)

      await act(async () => {
        await result.current.fetchAnalysis(1)
      })

      expect(result.current.analysisResults.size).toBe(1)
      expect(result.current.analysisResults.get(1)).toEqual(mockAnalysis2)
    })
  })

  describe('数据分析类型', () => {
    it('应该正确处理INVEST分析', async () => {
      const investData = {
        independent: true,
        negotiable: false,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        notes: '测试备注',
      }

      vi.mocked(analysisService.saveAnalysis).mockResolvedValue({
        data: {
          id: 1,
          requirement_id: 1,
          invest_analysis: investData,
          overall_score: 7.5,
        },
      })

      const { result } = renderHook(() => useAnalysisStore())

      const analysisData = {
        invest: investData,
        moscow: { priority: 'must_have' },
        kano_category: 'performance',
        rice: {
          reach: 8,
          impact: 9,
          confidence: 7,
          effort: 5,
        },
      }

      await act(async () => {
        await result.current.saveAnalysis(1, analysisData)
      })

      const saved = result.current.analysisData.get(1)
      expect(saved?.invest).toEqual(investData)
    })

    it('应该正确处理MoSCoW优先级', async () => {
      const moscowData = {
        priority: 'should_have' as const,
        notes: '重要性适中',
      }

      vi.mocked(analysisService.saveAnalysis).mockResolvedValue({
        data: {
          id: 1,
          requirement_id: 1,
          moscow_priority: 'should_have',
          overall_score: 6.5,
        },
      })

      const { result } = renderHook(() => useAnalysisStore())

      const analysisData = {
        invest: {
          independent: true,
          negotiable: true,
          valuable: true,
          estimable: true,
          small: true,
          testable: true,
        },
        moscow: moscowData,
        kano_category: 'performance',
        rice: {
          reach: 6,
          impact: 7,
          confidence: 8,
          effort: 4,
        },
      }

      await act(async () => {
        await result.current.saveAnalysis(1, analysisData)
      })

      const saved = result.current.analysisData.get(1)
      expect(saved?.moscow).toEqual(moscowData)
    })

    it('应该正确处理RICE评分', async () => {
      const riceData = {
        reach: 9,
        impact: 8,
        confidence: 7,
        effort: 3,
        notes: '高影响低投入',
      }

      vi.mocked(analysisService.saveAnalysis).mockResolvedValue({
        data: {
          id: 1,
          requirement_id: 1,
          rice_score: {
            reach: 9,
            impact: 8,
            confidence: 7,
            effort: 3,
            score: 16.8,
          },
          overall_score: 8.2,
        },
      })

      const { result } = renderHook(() => useAnalysisStore())

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
        kano_category: 'excitement',
        rice: riceData,
      }

      await act(async () => {
        await result.current.saveAnalysis(1, analysisData)
      })

      const saved = result.current.analysisData.get(1)
      expect(saved?.rice).toEqual(riceData)
    })

    it('应该正确处理Kano分类', async () => {
      const kanoCategories = [
        'basic',
        'performance',
        'excitement',
        'indifferent',
        'reverse',
      ] as const

      vi.mocked(analysisService.saveAnalysis).mockResolvedValue({
        data: {
          id: 1,
          requirement_id: 1,
          kano_category: 'excitement',
          overall_score: 8.0,
        },
      })

      const { result } = renderHook(() => useAnalysisStore())

      for (const category of kanoCategories) {
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
          kano_category: category,
          rice: {
            reach: 8,
            impact: 8,
            confidence: 8,
            effort: 5,
          },
        }

        await act(async () => {
          await result.current.saveAnalysis(1, analysisData)
        })

        const saved = result.current.analysisData.get(1)
        expect(saved?.kano_category).toBe(category)
      }
    })
  })

  describe('边界情况', () => {
    it('应该处理空的分析数据', async () => {
      vi.mocked(analysisService.getAnalysis).mockResolvedValue({
        data: {
          id: 1,
          requirement_id: 1,
          invest_analysis: {},
          moscow_priority: '',
          kano_category: '',
          rice_score: {},
          overall_score: 0,
        },
      })

      const { result } = renderHook(() => useAnalysisStore())

      await act(async () => {
        await result.current.fetchAnalysis(1)
      })

      expect(result.current.currentRequirementAnalysis).not.toBeNull()
    })

    it('应该处理极大的RICE评分', async () => {
      const extremeRiceData = {
        reach: 10,
        impact: 10,
        confidence: 10,
        effort: 1,
        notes: '极端值测试',
      }

      vi.mocked(analysisService.saveAnalysis).mockResolvedValue({
        data: {
          id: 1,
          requirement_id: 1,
          rice_score: {
            reach: 10,
            impact: 10,
            confidence: 10,
            effort: 1,
            score: 100,
          },
          overall_score: 10,
        },
      })

      const { result } = renderHook(() => useAnalysisStore())

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
        kano_category: 'excitement',
        rice: extremeRiceData,
      }

      await act(async () => {
        await result.current.saveAnalysis(1, analysisData)
      })

      const saved = result.current.analysisData.get(1)
      expect(saved?.rice).toEqual(extremeRiceData)
    })

    it('应该处理很长的备注内容', async () => {
      const longNotes = 'x'.repeat(1000)

      const analysisData = {
        invest: {
          independent: true,
          negotiable: true,
          valuable: true,
          estimable: true,
          small: true,
          testable: true,
          notes: longNotes,
        },
        moscow: {
          priority: 'must_have',
          notes: longNotes,
        },
        kano_category: 'performance',
        rice: {
          reach: 8,
          impact: 8,
          confidence: 8,
          effort: 5,
        },
        notes: longNotes,
      }

      vi.mocked(analysisService.saveAnalysis).mockResolvedValue({
        data: {
          id: 1,
          requirement_id: 1,
        },
      })

      const { result } = renderHook(() => useAnalysisStore())

      await act(async () => {
        await result.current.saveAnalysis(1, analysisData)
      })

      const saved = result.current.analysisData.get(1)
      expect(saved?.invest.notes).toBe(longNotes)
      expect(saved?.moscow.notes).toBe(longNotes)
      expect(saved?.notes).toBe(longNotes)
    })
  })
})

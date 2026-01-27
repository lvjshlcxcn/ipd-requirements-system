/**
 * useInsightStore 测试
 *
 * 测试洞察Store的所有功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInsightStore } from '@/stores/useInsightStore'

describe('useInsightStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useInsightStore.setState({
      currentInsight: null,
      analysisResult: null,
      isAnalyzing: false,
      error: null,
    })
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const { result } = renderHook(() => useInsightStore())

      expect(result.current.currentInsight).toBeNull()
      expect(result.current.analysisResult).toBeNull()
      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('setCurrentInsight', () => {
    it('应该设置当前洞察', () => {
      const { result } = renderHook(() => useInsightStore())

      const mockInsight = {
        id: 1,
        requirement_id: 1,
        insight_type: 'appeals',
        title: 'APPEALS分析',
        summary: '该需求在性能方面表现优秀',
        details: {
          score: 8.5,
          recommendations: ['建议优先实施'],
        },
        analysis_result: {
          overall_score: 8.5,
          dimensions: {
            price: { score: 8, weight: 0.8 },
            performance: { score: 9, weight: 0.9 },
          },
        },
        created_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentInsight(mockInsight as any)
      })

      expect(result.current.currentInsight).toEqual(mockInsight)
      expect(result.current.analysisResult).toEqual(mockInsight.analysis_result)
      expect(result.current.error).toBeNull()
    })

    it('应该清除当前洞察', () => {
      const { result } = renderHook(() => useInsightStore())

      const mockInsight = {
        id: 1,
        requirement_id: 1,
        insight_type: 'test',
        title: '测试洞察',
        summary: '测试',
        details: {},
        created_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentInsight(mockInsight as any)
      })

      expect(result.current.currentInsight).not.toBeNull()

      act(() => {
        result.current.setCurrentInsight(null)
      })

      expect(result.current.currentInsight).toBeNull()
      expect(result.current.analysisResult).toBeNull()
    })

    it('应该自动设置analysis_result', () => {
      const { result } = renderHook(() => useInsightStore())

      const mockInsight = {
        id: 1,
        requirement_id: 1,
        insight_type: 'appeals',
        title: 'APPEALS分析',
        summary: '测试',
        details: {},
        analysis_result: {
          overall_score: 8.5,
          recommendations: ['建议1'],
        },
        created_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentInsight(mockInsight as any)
      })

      expect(result.current.analysisResult).toEqual(mockInsight.analysis_result)
    })

    it('应该处理没有analysis_result的洞察', () => {
      const { result } = renderHook(() => useInsightStore())

      const mockInsight = {
        id: 1,
        requirement_id: 1,
        insight_type: 'user_feedback',
        title: '用户反馈',
        summary: '用户说好',
        details: {
          feedback_count: 15,
          sentiment: 'positive',
        },
        created_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentInsight(mockInsight as any)
      })

      expect(result.current.analysisResult).toBeNull()
    })
  })

  describe('setAnalysisResult', () => {
    it('应该设置分析结果', () => {
      const { result } = renderHook(() => useInsightStore())

      const mockAnalysisResult = {
        overall_score: 8.5,
        dimensions: {
          price: { score: 8, weight: 0.8 },
          performance: { score: 9, weight: 0.9 },
        },
        recommendations: ['建议1', '建议2'],
      }

      act(() => {
        result.current.setAnalysisResult(mockAnalysisResult as any)
      })

      expect(result.current.analysisResult).toEqual(mockAnalysisResult)
    })

    it('应该覆盖已有的分析结果', () => {
      const { result } = renderHook(() => useInsightStore())

      const oldResult = {
        overall_score: 6.5,
        recommendations: ['旧建议'],
      }

      const newResult = {
        overall_score: 8.5,
        recommendations: ['新建议'],
      }

      act(() => {
        result.current.setAnalysisResult(oldResult as any)
      })

      expect(result.current.analysisResult).toEqual(oldResult)

      act(() => {
        result.current.setAnalysisResult(newResult as any)
      })

      expect(result.current.analysisResult).toEqual(newResult)
    })

    it('应该清除分析结果', () => {
      const { result } = renderHook(() => useInsightStore())

      const mockResult = {
        overall_score: 8.5,
        recommendations: [],
      }

      act(() => {
        result.current.setAnalysisResult(mockResult as any)
      })

      expect(result.current.analysisResult).not.toBeNull()

      act(() => {
        result.current.setAnalysisResult(null)
      })

      expect(result.current.analysisResult).toBeNull()
    })
  })

  describe('setIsAnalyzing', () => {
    it('应该设置分析状态', () => {
      const { result } = renderHook(() => useInsightStore())

      expect(result.current.isAnalyzing).toBe(false)

      act(() => {
        result.current.setIsAnalyzing(true)
      })

      expect(result.current.isAnalyzing).toBe(true)

      act(() => {
        result.current.setIsAnalyzing(false)
      })

      expect(result.current.isAnalyzing).toBe(false)
    })

    it('应该支持多次切换状态', () => {
      const { result } = renderHook(() => useInsightStore())

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.setIsAnalyzing(i % 2 === 0)
        })
        expect(result.current.isAnalyzing).toBe(i % 2 === 0)
      }
    })
  })

  describe('setError', () => {
    it('应该设置错误信息', () => {
      const { result } = renderHook(() => useInsightStore())

      const errorMessage = '分析失败：网络错误'

      act(() => {
        result.current.setError(errorMessage)
      })

      expect(result.current.error).toBe(errorMessage)
    })

    it('应该清除错误信息', () => {
      const { result } = renderHook(() => useInsightStore())

      act(() => {
        result.current.setError('测试错误')
      })

      expect(result.current.error).toBe('测试错误')

      act(() => {
        result.current.setError(null)
      })

      expect(result.current.error).toBeNull()
    })

    it('应该处理空字符串错误', () => {
      const { result } = renderHook(() => useInsightStore())

      act(() => {
        result.current.setError('')
      })

      expect(result.current.error).toBe('')
    })
  })

  describe('reset', () => {
    it('应该重置所有状态', () => {
      const { result } = renderHook(() => useInsightStore())

      const mockInsight = {
        id: 1,
        requirement_id: 1,
        insight_type: 'test',
        title: '测试',
        summary: '测试',
        details: {},
        analysis_result: {
          overall_score: 8.5,
        },
        created_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentInsight(mockInsight as any)
        result.current.setIsAnalyzing(true)
        result.current.setError('测试错误')
      })

      expect(result.current.currentInsight).not.toBeNull()
      expect(result.current.analysisResult).not.toBeNull()
      expect(result.current.isAnalyzing).toBe(true)
      expect(result.current.error).toBe('测试错误')

      act(() => {
        result.current.reset()
      })

      expect(result.current.currentInsight).toBeNull()
      expect(result.current.analysisResult).toBeNull()
      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('应该在设置新洞察时自动清除错误', () => {
      const { result } = renderHook(() => useInsightStore())

      act(() => {
        result.current.setError('之前的错误')
      })

      expect(result.current.error).toBe('之前的错误')

      const mockInsight = {
        id: 1,
        requirement_id: 1,
        insight_type: 'test',
        title: '新洞察',
        summary: '新',
        details: {},
        created_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentInsight(mockInsight as any)
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('状态协调', () => {
    it('应该正确协调分析状态和结果', () => {
      const { result } = renderHook(() => useInsightStore())

      act(() => {
        result.current.setIsAnalyzing(true)
      })

      expect(result.current.isAnalyzing).toBe(true)

      const mockAnalysisResult = {
        overall_score: 8.5,
        recommendations: [],
      }

      act(() => {
        result.current.setAnalysisResult(mockAnalysisResult as any)
        result.current.setIsAnalyzing(false)
      })

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.analysisResult).toEqual(mockAnalysisResult)
    })

    it('应该在分析失败时设置错误', () => {
      const { result } = renderHook(() => useInsightStore())

      act(() => {
        result.current.setIsAnalyzing(true)
      })

      const errorMessage = '分析超时'

      act(() => {
        result.current.setError(errorMessage)
        result.current.setIsAnalyzing(false)
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.isAnalyzing).toBe(false)
    })
  })

  describe('不同类型的洞察', () => {
    it('应该处理APPEALS类型的洞察', () => {
      const { result } = renderHook(() => useInsightStore())

      const appealsInsight = {
        id: 1,
        requirement_id: 1,
        insight_type: 'appeals',
        title: 'APPEALS分析',
        summary: '8维度评分完成',
        details: {
          dimensions: {
            price: { score: 8, weight: 0.8 },
            performance: { score: 9, weight: 0.9 },
          },
          total_weighted_score: 428.0,
        },
        created_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentInsight(appealsInsight as any)
      })

      expect(result.current.currentInsight.insight_type).toBe('appeals')
    })

    it('应该处理用户反馈类型的洞察', () => {
      const { result } = renderHook(() => useInsightStore())

      const feedbackInsight = {
        id: 2,
        requirement_id: 1,
        insight_type: 'user_feedback',
        title: '用户反馈汇总',
        summary: '收到15条反馈',
        details: {
          feedback_count: 15,
          sentiment: 'positive',
          top_keywords: ['好用', '快速'],
        },
        created_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentInsight(feedbackInsight as any)
      })

      expect(result.current.currentInsight.insight_type).toBe('user_feedback')
      expect(result.current.analysisResult).toBeNull() // 用户反馈没有analysis_result
    })

    it('应该处理市场分析类型的洞察', () => {
      const { result } = renderHook(() => useInsightStore())

      const marketInsight = {
        id: 3,
        requirement_id: 2,
        insight_type: 'market_analysis',
        title: '市场分析',
        summary: '竞品分析结果',
        details: {
          competitors: ['A公司', 'B公司'],
          market_size: '1亿',
          growth_rate: '15%',
        },
        created_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentInsight(marketInsight as any)
      })

      expect(result.current.currentInsight.insight_type).toBe('market_analysis')
    })
  })

  describe('边界情况', () => {
    it('应该处理空的分析结果', () => {
      const { result } = renderHook(() => useInsightStore())

      const mockInsight = {
        id: 1,
        requirement_id: 1,
        insight_type: 'test',
        title: '测试',
        summary: '测试',
        details: {},
        analysis_result: null,
        created_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentInsight(mockInsight as any)
      })

      expect(result.current.analysisResult).toBeNull()
    })

    it('应该处理极长的推荐列表', () => {
      const { result } = renderHook(() => useInsightStore())

      const longRecommendations = Array.from(
        { length: 100 },
        (_, i) => `推荐建议${i + 1}`
      )

      const mockResult = {
        overall_score: 8.5,
        recommendations: longRecommendations,
      }

      act(() => {
        result.current.setAnalysisResult(mockResult as any)
      })

      expect(result.current.analysisResult?.recommendations).toHaveLength(100)
    })

    it('应该处理特殊字符的洞察内容', () => {
      const { result } = renderHook(() => useInsightStore())

      const specialInsight = {
        id: 1,
        requirement_id: 1,
        insight_type: 'test',
        title: '标题包含特殊字符!@#$%^&*()',
        summary: '摘要包含"引号"和\'单引号\'',
        details: {
          special: '换行\n和制表符\t',
        },
        created_at: '2026-01-26T00:00:00Z',
      }

      act(() => {
        result.current.setCurrentInsight(specialInsight as any)
      })

      expect(result.current.currentInsight.title).toContain('!@#$%^&*()')
      expect(result.current.currentInsight.summary).toContain('"')
      expect(result.current.currentInsight.summary).toContain('\'')
    })
  })
})

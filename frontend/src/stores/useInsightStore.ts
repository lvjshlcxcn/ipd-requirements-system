import { create } from 'zustand'
import type { Insight, InsightAnalysisResult } from '@/types/insight'

interface InsightState {
  // 状态
  currentInsight: Insight | null
  analysisResult: InsightAnalysisResult | null
  isAnalyzing: boolean
  error: string | null

  // Actions
  setCurrentInsight: (insight: Insight | null) => void
  setAnalysisResult: (result: InsightAnalysisResult | null) => void
  setIsAnalyzing: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useInsightStore = create<InsightState>()((set) => ({
  // 初始状态
  currentInsight: null,
  analysisResult: null,
  isAnalyzing: false,
  error: null,

  // Actions
  setCurrentInsight: (insight) =>
    set({
      currentInsight: insight,
      analysisResult: insight?.analysis_result || null,
      error: null
    }),

  setAnalysisResult: (result) =>
    set({ analysisResult: result }),

  setIsAnalyzing: (loading) =>
    set({ isAnalyzing: loading }),

  setError: (error) =>
    set({ error: error }),

  reset: () =>
    set({
      currentInsight: null,
      analysisResult: null,
      isAnalyzing: false,
      error: null
    }),
}))

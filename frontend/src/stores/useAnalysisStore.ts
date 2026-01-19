import { create } from 'zustand'
import { analysisService } from '@/services/analysis.service'

interface INVESTAnalysis {
  independent: boolean
  negotiable: boolean
  valuable: boolean
  estimable: boolean
  small: boolean
  testable: boolean
  notes?: string
}

interface MoSCoWAnalysis {
  priority: 'must_have' | 'should_have' | 'could_have' | 'wont_have'
  notes?: string
}

interface RICEAnalysis {
  reach: number
  impact: number
  confidence: number
  effort: number
  notes?: string
}

interface AnalysisData {
  invest: INVESTAnalysis
  moscow: MoSCoWAnalysis
  kano_category: 'basic' | 'performance' | 'excitement' | 'indifferent' | 'reverse'
  rice: RICEAnalysis
  notes?: string
}

interface AnalysisResult {
  id: number
  requirement_id: number
  invest_analysis: Record<string, any>
  moscow_priority: string
  kano_category: string
  rice_score: Record<string, any>
  overall_score: number
  analyzed_by?: number
  analyzed_at: string
}

interface AnalysisState {
  analysisData: Map<number, AnalysisData>
  analysisResults: Map<number, AnalysisResult>
  currentRequirementAnalysis: AnalysisResult | null
  isLoading: boolean

  // Actions
  fetchAnalysis: (requirementId: number) => Promise<void>
  saveAnalysis: (requirementId: number, data: AnalysisData) => Promise<void>
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void
}

export const useAnalysisStore = create<AnalysisState>()(
  (set) => ({
    analysisData: new Map(),
    analysisResults: new Map(),
    currentRequirementAnalysis: null,
    isLoading: false,

    fetchAnalysis: async (requirementId: number) => {
      set({ isLoading: true })
      try {
        const { data } = await analysisService.getAnalysis(requirementId)
        set((state) => ({
          analysisResults: new Map(state.analysisResults).set(requirementId, data),
          currentRequirementAnalysis: data,
          isLoading: false
        }))
      } catch (error) {
        console.error('Failed to fetch analysis:', error)
        set({ isLoading: false })
      }
    },

    saveAnalysis: async (requirementId: number, data: AnalysisData) => {
      set({ isLoading: true })
      try {
        const { data: result } = await analysisService.saveAnalysis(requirementId, data)
        set((state) => ({
          analysisData: new Map(state.analysisData).set(requirementId, data),
          analysisResults: new Map(state.analysisResults).set(requirementId, result),
          currentRequirementAnalysis: result,
          isLoading: false
        }))
      } catch (error) {
        console.error('Failed to save analysis:', error)
        set({ isLoading: false })
      }
    },

    setCurrentAnalysis: (analysis: AnalysisResult | null) => {
      set({ currentRequirementAnalysis: analysis })
    },
  })
)

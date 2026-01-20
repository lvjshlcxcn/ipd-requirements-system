import api from './api'

export interface INVESTAnalysis {
  independent: boolean
  negotiable: boolean
  valuable: boolean
  estimable: boolean
  small: boolean
  testable: boolean
  notes?: string
}

export interface MoSCoWAnalysis {
  priority: 'must_have' | 'should_have' | 'could_have' | 'wont_have'
  notes?: string
}

export interface RICEAnalysis {
  reach: number
  impact: number
  confidence: number
  effort: number
  notes?: string
}

export interface AnalysisData {
  invest: INVESTAnalysis
  moscow: MoSCoWAnalysis
  kano_category: 'basic' | 'performance' | 'excitement' | 'indifferent' | 'reverse'
  rice: RICEAnalysis
  notes?: string
}

export interface AnalysisResult {
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

export interface AnalysisSummary {
  total_requirements: number
  analyzed_requirements: number
  by_kano: Record<string, number>
  by_moscow: Record<string, number>
  average_rice_score: number
}

export const analysisService = {
  // Get analysis for a requirement
  getAnalysis: (requirementId: number) => {
    return api.get(`/requirements/${requirementId}/analysis`)
  },

  // Save analysis for a requirement
  saveAnalysis: (requirementId: number, data: AnalysisData) => {
    return api.post(`/requirements/${requirementId}/analysis`, data)
  },

  // Get analysis summary
  getAnalysisSummary: () => {
    return api.get('/requirements/0/analysis/summary')
  },
}

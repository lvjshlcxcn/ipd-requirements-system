import api from '@/services/api'

export interface IPDTenQuestions {
  q1_who: string
  q2_why: string
  q3_what_problem: string
  q4_current_solution?: string
  q5_current_issues?: string
  q6_ideal_solution: string
  q7_priority: 'high' | 'medium' | 'low'
  q8_frequency: 'daily' | 'weekly' | 'monthly' | 'occasional'
  q9_expected_value?: string
  q10_success_metrics?: string
}

export interface GeneratedUserStory {
  id?: number
  title: string
  role: string
  action: string
  benefit: string
  acceptanceCriteria: string[]
  priority?: string
}

export interface INVESTScoreData {
  independent: number
  negotiable: number
  valuable: number
  estimable: number
  small: number
  testable: number
}

export interface INVESTAnalysis {
  id?: number
  storyId?: number
  scores: INVESTScoreData
  totalScore: number
  suggestions: string[]
  createdAt?: string
}

export interface IPDStoryFlow {
  id?: string
  ipdData: IPDTenQuestions
  userStory: GeneratedUserStory
  investAnalysis?: INVESTAnalysis
  createdAt?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    data: T[]
    total: number
  }
  message?: string
}

const ipdStoryService = {
  async generateStory(ipdData: IPDTenQuestions): Promise<ApiResponse<GeneratedUserStory>> {
    return api.post('/ipd-story/generate', ipdData)
  },

  async analyzeINVEST(storyId: number | null, scores: INVESTScoreData): Promise<ApiResponse<INVESTAnalysis>> {
    return api.post('/ipd-story/invest-analyze', { story_id: storyId, scores })
  },

  async saveWorkflow(data: {
    ipd_data: IPDTenQuestions
    user_story: GeneratedUserStory
    invest_analysis?: INVESTAnalysis
  }): Promise<ApiResponse<IPDStoryFlow>> {
    return api.post('/ipd-story/workflow', data)
  },

  async getWorkflow(workflowId: string): Promise<ApiResponse<IPDStoryFlow>> {
    return api.get('/ipd-story/workflow/' + workflowId)
  },

  async listWorkflows(params: {
    skip?: number
    limit?: number
    priority?: string
  } = {}): Promise<PaginatedResponse<IPDStoryFlow>> {
    return api.get('/ipd-story/workflows', { params })
  },
}

export default ipdStoryService

import api from '@/services/api'

/**
 * INVEST分析数据接口
 */
export interface INVESTAnalysisData {
  independent: boolean
  negotiable: boolean
  valuable: boolean
  estimable: boolean
  small: boolean
  testable: boolean
  notes?: string
  passedCount?: number
}

/**
 * INVEST分析响应接口
 */
export interface INVESTAnalysisResponse {
  requirement_id: number
  independent: boolean
  negotiable: boolean
  valuable: boolean
  estimable: boolean
  small: boolean
  testable: boolean
  passed_count: number
  total_count: number
  notes?: string
  analyzed_at: string
}

/**
 * INVEST分析服务
 */
export const investService = {
  /**
   * 获取需求的INVEST分析数据
   * @param requirementId 需求ID
   * @returns Promise<INVESTAnalysisResponse | null>
   */
  getINVESTAnalysis: async (requirementId: number): Promise<INVESTAnalysisResponse | null> => {
    const response = await api.get<any>(`/requirements/${requirementId}/invest`)
    return response?.data || null
  },

  /**
   * 保存需求的INVEST分析数据
   * @param requirementId 需求ID
   * @param data INVEST分析数据
   * @returns Promise<INVESTAnalysisResponse>
   */
  saveINVESTAnalysis: async (
    requirementId: number,
    data: INVESTAnalysisData
  ): Promise<INVESTAnalysisResponse> => {
    const response = await api.post<any>(`/requirements/${requirementId}/invest`, data)
    return response?.data
  },
}

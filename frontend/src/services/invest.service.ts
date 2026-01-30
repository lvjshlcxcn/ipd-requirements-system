import api from '@/services/api'

/**
 * INVEST分析数据接口 - 评分系统
 */
export interface INVESTAnalysisData {
  independent: number  // 0-100
  negotiable: number
  valuable: number
  estimable: number
  small: number
  testable: number
  notes?: string
}

/**
 * INVEST分析响应接口
 */
export interface INVESTAnalysisResponse {
  requirement_id: number
  independent: number
  negotiable: number
  valuable: number
  estimable: number
  small: number
  testable: number
  total_score: number
  average_score: number
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
   * @param data INVEST分析数据（评分 0-100）
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

import api from '@/services/api'

/**
 * RICE分析数据接口
 */
export interface RICEAnalysisData {
  reach: number
  impact: number
  confidence: number
  effort: number
  notes?: string
  score?: number
}

/**
 * RICE分析响应接口
 */
export interface RICEAnalysisResponse {
  requirement_id: number
  reach: number
  impact: number
  confidence: number
  effort: number
  score: number
  notes?: string
  analyzed_at: string
}

/**
 * RICE分析服务
 */
export const riceService = {
  /**
   * 获取需求的RICE分析数据
   * @param requirementId 需求ID
   * @returns Promise<RICEAnalysisResponse | null>
   */
  getRICEAnalysis: async (requirementId: number): Promise<RICEAnalysisResponse | null> => {
    const response = await api.get<any>(`/requirements/${requirementId}/rice`)
    return response?.data || null
  },

  /**
   * 保存需求的RICE分析数据
   * @param requirementId 需求ID
   * @param data RICE分析数据
   * @returns Promise<RICEAnalysisResponse>
   */
  saveRICEAnalysis: async (
    requirementId: number,
    data: RICEAnalysisData
  ): Promise<RICEAnalysisResponse> => {
    const response = await api.post<any>(`/requirements/${requirementId}/rice`, data)
    return response?.data
  },
}

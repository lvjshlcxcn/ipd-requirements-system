import api from './api'
import type { Insight, InsightAnalysisResult } from '@/types/insight'

export interface AnalyzeInsightRequest {
  input_text: string
  input_source?: 'manual' | 'upload' | 'voice'
  analysis_mode?: 'full' | 'quick'
}

export interface CreateStoryboardRequest {
  insight_id: number
  title: string
  description?: string
  card_style?: string
}

const insightService = {
  /**
   * 分析文本洞察
   */
  async analyzeText(request: AnalyzeInsightRequest): Promise<Insight> {
    const response = await api.post<Insight>('/insights/analyze', request)
    return response as unknown as Insight
  },

  /**
   * 获取洞察列表
   */
  async listInsights(params?: {
    skip?: number
    limit?: number
    status?: string
  }): Promise<Insight[]> {
    const response = await api.get<Insight[]>('/insights', { params })
    return response as unknown as Insight[]
  },

  /**
   * 获取洞察详情
   */
  async getInsight(insightId: number): Promise<Insight> {
    const response = await api.get<Insight>(`/insights/${insightId}`)
    return response as unknown as Insight
  },

  /**
   * 更新洞察分析结果
   */
  async updateInsight(
    insightId: number,
    analysisResult: InsightAnalysisResult
  ): Promise<Insight> {
    const response = await api.put<Insight>(
      `/insights/${insightId}`,
      analysisResult
    )
    return response as unknown as Insight
  },

  /**
   * 关联到需求
   */
  async linkToRequirement(
    insightId: number,
    requirementId: number
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      `/insights/${insightId}/link-requirement`,
      { requirement_id: requirementId }
    )
    return response as unknown as { message: string }
  },

  /**
   * 删除洞察分析
   */
  async deleteInsight(insightId: number): Promise<void> {
    await api.delete(`/insights/${insightId}`)
  },
}

export default insightService

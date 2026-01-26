import api from './api'
import type {
  PromptTemplate,
  PromptTemplateCreate,
  PromptTemplateUpdate,
} from '@/types/prompt'

const promptTemplateService = {
  /**
   * List all prompt templates
   */
  async listTemplates(templateKey?: string): Promise<PromptTemplate[]> {
    const params = templateKey ? { template_key: templateKey } : {}
    console.log('[PromptTemplateService] 列表查询，参数:', params)
    const response = await api.get<{ success: boolean; data: PromptTemplate[]; total: number }>(
      '/prompt-templates/',
      { params }
    ) as unknown as { success: boolean; data: PromptTemplate[]; total: number }
    console.log('[PromptTemplateService] 列表响应:', response)
    // api interceptor already returns response.data, so response is { success, data, total }
    return response.data || []
  },

  /**
   * Get template by ID
   */
  async getTemplate(templateId: number): Promise<PromptTemplate> {
    console.log('[PromptTemplateService] 获取模板，ID:', templateId)
    const response = await api.get<PromptTemplate>(`/prompt-templates/${templateId}/`) as unknown as PromptTemplate
    console.log('[PromptTemplateService] 获取响应:', response)
    return response
  },

  /**
   * Create new template (admin only)
   */
  async createTemplate(data: PromptTemplateCreate): Promise<PromptTemplate> {
    console.log('[PromptTemplateService] 创建模板，数据:', data)
    try {
      const response = await api.post<PromptTemplate>('/prompt-templates/', data) as unknown as PromptTemplate
      console.log('[PromptTemplateService] 创建响应:', response)
      return response
    } catch (error) {
      console.error('[PromptTemplateService] 创建失败，错误:', error)
      throw error
    }
  },

  /**
   * Update template (creates new version, admin only)
   */
  async updateTemplate(templateId: number, data: PromptTemplateUpdate): Promise<PromptTemplate> {
    console.log('[PromptTemplateService] 更新模板，ID:', templateId, '数据:', data)
    const response = await api.put<PromptTemplate>(`/prompt-templates/${templateId}/`, data) as unknown as PromptTemplate
    console.log('[PromptTemplateService] 更新响应:', response)
    return response
  },

  /**
   * Delete template (admin only)
   */
  async deleteTemplate(templateId: number): Promise<void> {
    console.log('[PromptTemplateService] 删除模板，ID:', templateId)
    await api.delete(`/prompt-templates/${templateId}/`)
  },
}

export default promptTemplateService

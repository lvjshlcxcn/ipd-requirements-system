/** Prompt template types */

export type TemplateKey = 'ipd_ten_questions' | 'quick_insight'

export interface PromptTemplate {
  id: number
  template_key: TemplateKey
  version: string
  is_active: boolean
  name: string
  description?: string
  content: string
  variables?: string[]
  created_at: string
  updated_at: string
}

export interface PromptTemplateCreate {
  template_key: TemplateKey
  name: string
  content: string
  description?: string
  variables?: string[]
}

export interface PromptTemplateUpdate {
  content: string
  name?: string
  description?: string
  variables?: string[]
}

export interface PromptTemplateListResponse {
  success: boolean
  data: PromptTemplate[]
  total: number
}

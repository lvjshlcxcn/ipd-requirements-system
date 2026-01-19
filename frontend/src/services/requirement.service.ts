import api, { apiGet, apiPost, apiPut, apiDelete } from './api'

export interface Requirement {
  id: number
  requirement_no: string
  title: string
  description: string
  source_channel: string
  source_contact?: string
  status: string
  priority_score?: number
  priority_rank?: number
  collected_at: string
  created_at: string
}

export interface CreateRequirementRequest {
  title: string
  description: string
  source_channel: string
  source_contact?: string
  customer_need_10q?: Record<string, string>
  estimated_duration_months?: number
  complexity_level?: string
}

export interface RequirementListParams {
  page?: number
  page_size?: number
  status?: string
  source_channel?: string
  search?: string
}

export const requirementService = {
  /**
   * Get requirements list
   */
  getRequirements: async (params?: RequirementListParams) => {
    return apiGet('/requirements', { params })
  },

  /**
   * Get requirement detail
   */
  getRequirement: async (id: number) => {
    return apiGet(`/requirements/${id}`)
  },

  /**
   * Create new requirement
   */
  createRequirement: async (data: CreateRequirementRequest) => {
    return apiPost('/requirements', data)
  },

  /**
   * Update requirement
   */
  updateRequirement: async (id: number, data: Partial<Requirement>) => {
    return apiPut(`/requirements/${id}`, data)
  },

  /**
   * Delete requirement
   */
  deleteRequirement: async (id: number) => {
    return apiDelete(`/requirements/${id}`)
  },

  /**
   * Update requirement status
   */
  updateStatus: async (id: number, status: string) => {
    return apiPost(`/requirements/${id}/status`, { status })
  },

  /**
   * Get requirement statistics
   */
  getStats: async () => {
    return apiGet('/requirements/stats/summary')
  },

  /**
   * Get requirement history
   */
  getRequirementHistory: async (id: number, limit: number = 50) => {
    return apiGet(`/requirements/${id}/history?limit=${limit}`)
  },

  /**
   * Add history note
   */
  addHistoryNote: async (id: number, data: { comments: string; action_reason?: string }) => {
    return apiPost(`/requirements/${id}/history`, data)
  },

  /**
   * Get requirement attachments
   */
  getAttachments: async (requirementId: number) => {
    return apiGet(`/attachments/requirements/${requirementId}`)
  },

  /**
   * Upload attachment
   */
  uploadAttachment: async (requirementId: number, file: File, description?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }
    return api.post(`/attachments/requirements/${requirementId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  /**
   * Delete attachment
   */
  deleteAttachment: async (attachmentId: number) => {
    return apiDelete(`/attachments/${attachmentId}`)
  },

  /**
   * Get attachment download URL
   */
  getAttachmentDownloadUrl: (attachmentId: number) => {
    return `/api/v1/attachments/${attachmentId}/download`
  },
}

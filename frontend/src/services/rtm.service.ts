import api from './api'

export interface TraceabilityLink {
  id: number
  requirement_id: number
  design_id?: string
  code_id?: string
  test_id?: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface TraceabilityMatrix {
  requirement_id: number
  requirement_title: string
  design_items: TraceabilityLink[]
  code_items: TraceabilityLink[]
  test_items: TraceabilityLink[]
}

export const rtmService = {
  // Get traceability matrix for all requirements
  getTraceabilityMatrix: async (filters?: Record<string, any>) => {
    return api.get<TraceabilityMatrix[]>('/rtm/matrix', { params: filters })
  },

  // Get traceability for a specific requirement
  getRequirementTraceability: async (requirementId: number) => {
    return api.get<TraceabilityMatrix>(`/rtm/requirements/${requirementId}`)
  },

  // Create traceability link
  createLink: async (data: Partial<TraceabilityLink>) => {
    return api.post<TraceabilityLink>('/rtm/links', data)
  },

  // Update traceability link
  updateLink: async (linkId: number, data: Partial<TraceabilityLink>) => {
    return api.put<TraceabilityLink>(`/rtm/links/${linkId}`, data)
  },

  // Delete traceability link
  deleteLink: async (linkId: number) => {
    return api.delete(`/rtm/links/${linkId}`)
  },

  // Export traceability matrix
  exportMatrix: async (format: 'excel' | 'pdf' = 'excel') => {
    const token = localStorage.getItem('access_token')
    const baseURL = import.meta.env.VITE_API_URL || '/api/v1'
    const url = `${baseURL}/rtm/export?format=${format}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': '1'
      }
    })

    if (!response.ok) {
      throw new Error('导出失败')
    }

    const blob = await response.blob()
    return { data: blob }
  },
}

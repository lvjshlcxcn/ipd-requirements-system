import api from './api'

export interface AttachmentInfo {
  id: number
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  mime_type?: string
}

export interface TraceabilityLink {
  id: number
  requirement_id: number
  design_id?: string
  code_id?: string
  test_id?: string
  design_attachment_id?: number
  code_attachment_id?: number
  test_attachment_id?: number
  design_attachment?: AttachmentInfo
  code_attachment?: AttachmentInfo
  test_attachment?: AttachmentInfo
  status: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface TraceabilityItem {
  id: number
  design_id?: string
  code_id?: string
  test_id?: string
  design_attachment_id?: number
  code_attachment_id?: number
  test_attachment_id?: number
  design_attachment?: AttachmentInfo
  code_attachment?: AttachmentInfo
  test_attachment?: AttachmentInfo
}

export interface TraceabilityMatrix {
  requirement_id: number
  requirement_no: string
  requirement_title: string
  design_items: TraceabilityItem[]
  code_items: TraceabilityItem[]
  test_items: TraceabilityItem[]
}

/**
 * 生成文档ID
 * @param type 文档类型 design | code | test
 * @returns 生成的ID，如 DESIGN-20260131-001
 */
function generateDocumentId(type: 'design' | 'code' | 'test'): string {
  const prefix = type === 'design' ? 'DESIGN' : type === 'code' ? 'CODE' : 'TEST'
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${date}-${random}`
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

  /**
   * 上传RTM文档并创建关联
   * @param requirementId 需求ID
   * @param type 文档类型 design | code | test
   * @param file 上传的文件
   * @returns 创建的关联信息
   */
  uploadDocumentAndLink: async (
    requirementId: number,
    type: 'design' | 'code' | 'test',
    file: File
  ) => {
    // 1. 先上传附件
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entity_type', 'rtm')
    formData.append('entity_id', requirementId.toString())

    // 调试：打印FormData内容
    console.log('准备上传附件:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      requirementId,
      docType: type
    })

    // api响应拦截器已经自动解包response.data，所以uploadResponse直接是数据
    const uploadResponse: any = await api.post('/attachments/upload', formData)
    console.log('上传附件响应:', uploadResponse)

    // 根据后端AttachmentResponse schema，响应直接包含attachment对象
    const attachmentId = uploadResponse.id || uploadResponse.data?.id
    if (!attachmentId) {
      console.error('响应结构异常:', uploadResponse)
      throw new Error('上传失败：未获取到附件ID')
    }

    const docId = generateDocumentId(type)

    // 2. 创建追溯关联
    const linkData: Partial<TraceabilityLink> = {
      requirement_id: requirementId,
      [`${type}_id`]: docId,
      [`${type}_attachment_id`]: attachmentId,
    }

    return api.post<TraceabilityLink>('/rtm/links', linkData)
  },

  /**
   * 获取附件下载URL
   * @param attachmentId 附件ID
   * @returns 下载URL
   */
  getAttachmentDownloadUrl: (attachmentId: number) => {
    return `/api/v1/attachments/${attachmentId}/download`
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

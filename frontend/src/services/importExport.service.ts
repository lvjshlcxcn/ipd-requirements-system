import api from './api'

export interface ImportJob {
  id: number
  tenant_id: number
  imported_by: number
  import_type: string
  file_name: string
  file_path: string
  status: string
  total_records: number
  success_count: number
  failed_count: number
  error_log: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ExportJob {
  id: number
  tenant_id: number
  exported_by: number
  export_type: string
  filters: Record<string, any>
  status: string
  file_path: string
  file_size: number
  download_url: string
  created_at: string
  updated_at: string
}

export interface ExportFilters {
  status?: string
  moscow_priority?: string
  kano_category?: string
  date_from?: string
  date_to?: string
  include_analysis?: boolean
  include_history?: boolean
}

export interface ImportResult {
  total_rows: number
  success_count: number
  failed_count: number
  errors: Array<{ row: number; field: string; message: string }>
}

export const importExportService = {
  // Import from Excel
  importExcel: async (file: File, skipHeader: boolean = true) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('skip_header', String(skipHeader))

    return api.post<ImportJob>('/import-export/import/excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Get import jobs
  getImportJobs: async (skip: number = 0, limit: number = 20) => {
    return api.get<ImportJob[]>('/import-export/import/jobs', {
      params: { skip, limit },
    })
  },

  // Get specific import job
  getImportJob: async (jobId: number) => {
    return api.get<ImportJob>(`/import-export/import/jobs/${jobId}`)
  },

  // Export data
  exportData: async (
    exportType: 'excel' | 'pdf',
    filters: ExportFilters
  ) => {
    return api.post<ExportJob>('/import-export/export', {
      export_type: exportType,
      filters,
    })
  },

  // Get export jobs
  getExportJobs: async (skip: number = 0, limit: number = 20) => {
    return api.get<ExportJob[]>('/import-export/export/jobs', {
      params: { skip, limit },
    })
  },

  // Get specific export job
  getExportJob: async (jobId: number) => {
    return api.get<ExportJob>(`/export/jobs/${jobId}`)
  },

  // Download exported file
  downloadExport: async (jobId: number) => {
    return api.get(`/import-export/export/jobs/${jobId}/download`, {
      responseType: 'blob',
    })
  },

  // Download Excel template
  downloadTemplate: async () => {
    return api.get('/import-export/template', {
      responseType: 'blob',
    })
  },
}

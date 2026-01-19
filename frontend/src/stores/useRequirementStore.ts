import { create } from 'zustand'
import { requirementService, type Requirement, type CreateRequirementRequest } from '@/services/requirement.service'

interface RequirementFilters {
  status?: string
  source_channel?: string
  search?: string
}

interface RequirementState {
  requirements: Requirement[]
  selectedRequirement: Requirement | null
  filters: RequirementFilters
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  isLoading: boolean
  error: string | null

  // Actions
  fetchRequirements: (filters?: RequirementFilters) => Promise<void>
  fetchRequirement: (id: number) => Promise<void>
  createRequirement: (data: CreateRequirementRequest) => Promise<void>
  updateRequirement: (id: number, data: Partial<Requirement>) => Promise<void>
  deleteRequirement: (id: number) => Promise<void>
  setFilters: (filters: Partial<RequirementFilters>) => void
  setSelectedRequirement: (requirement: Requirement | null) => void
  clearError: () => void
}

export const useRequirementStore = create<RequirementState>((set, get) => ({
  requirements: [],
  selectedRequirement: null,
  filters: {},
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
  isLoading: false,
  error: null,

  fetchRequirements: async (filters) => {
    set({ isLoading: true, error: null })
    try {
      const { page, pageSize } = get().pagination
      const response = await requirementService.getRequirements({
        page,
        page_size: pageSize,
        ...filters,
      })

      set({
        requirements: response.data.items || response.data,
        pagination: {
          ...get().pagination,
          total: response.data.total || 0,
        },
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch requirements',
        isLoading: false,
      })
    }
  },

  fetchRequirement: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await requirementService.getRequirement(id)
      set({
        selectedRequirement: response.data,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch requirement',
        isLoading: false,
      })
    }
  },

  createRequirement: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await requirementService.createRequirement(data)
      // Refresh list
      await get().fetchRequirements(get().filters)
      set({ isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create requirement',
        isLoading: false,
      })
      throw error
    }
  },

  updateRequirement: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await requirementService.updateRequirement(id, data)
      // Refresh list
      await get().fetchRequirements(get().filters)
      set({ isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update requirement',
        isLoading: false,
      })
      throw error
    }
  },

  deleteRequirement: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await requirementService.deleteRequirement(id)
      // Refresh list
      await get().fetchRequirements(get().filters)
      set({ isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete requirement',
        isLoading: false,
      })
      throw error
    }
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters }, pagination: { ...get().pagination, page: 1 } })
  },

  setSelectedRequirement: (requirement) => {
    set({ selectedRequirement: requirement })
  },

  clearError: () => {
    set({ error: null })
  },
}))

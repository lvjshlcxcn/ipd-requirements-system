import { describe, it, expect, vi } from 'vitest'

// Mock API service
export const mockApi = {
  // Auth endpoints
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  
  // Requirement endpoints
  getRequirements: vi.fn(),
  getRequirement: vi.fn(),
  createRequirement: vi.fn(),
  updateRequirement: vi.fn(),
  deleteRequirement: vi.fn(),
  updateRequirementStatus: vi.fn(),
  
  // APPEALS endpoints
  getAppealsAnalysis: vi.fn(),
  saveAppealsAnalysis: vi.fn(),
  getAppealsSummary: vi.fn(),
  
  // Statistics endpoints
  getRequirementStats: vi.fn(),
}

// Helper to create a successful response
export const createSuccessResponse = (data: any) => ({
  success: true,
  data,
  message: 'Success',
})

// Helper to create an error response
export const createErrorResponse = (message: string) => ({
  success: false,
  message,
})

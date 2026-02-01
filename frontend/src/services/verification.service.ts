/** 需求验证服务 */
import api from './api';

export interface ChecklistItem {
  id: string;
  item: string;
  checked: boolean;
  notes?: string;
}

export interface VerificationChecklist {
  id: number;
  requirement_id: number;
  verification_type: 'fat' | 'sat' | 'uat' | 'prototype' | 'test';
  checklist_name: string;
  checklist_items: ChecklistItem[];
  result: 'not_started' | 'in_progress' | 'passed' | 'failed' | 'partial_passed' | 'blocked';
  evidence_attachments?: Record<string, any>;
  customer_feedback?: string;
  issues_found?: string;
  verified_by?: number;
  reviewed_by?: number;
  created_at: string;
  updated_at: string;
}

export interface VerificationChecklistCreate {
  verification_type: 'fat' | 'sat' | 'uat' | 'prototype' | 'test';
  checklist_name: string;
  checklist_items: ChecklistItem[];
}

export interface VerificationChecklistUpdate {
  checklist_items: ChecklistItem[];
}

export interface VerificationChecklistSubmit {
  result: 'passed' | 'failed' | 'partial_passed';
  evidence_attachments?: Record<string, any>;
  customer_feedback?: string;
  issues_found?: string;
}

export interface VerificationSummary {
  requirement_id: number;
  total_checklists: number;
  passed: number;
  failed: number;
  in_progress: number;
  not_started: number;
}

export interface VerificationListResponse {
  data: VerificationChecklist[];
  total: number;
  skip: number;
  limit: number;
  page: number;
  pages: number;
}

class VerificationService {
  /**
   * 获取需求的所有验证清单（带分页）
   */
  async getVerifications(
    requirementId: number,
    options?: {
      verificationType?: string;
      skip?: number;
      limit?: number;
    }
  ): Promise<VerificationListResponse> {
    const params: Record<string, any> = {};
    if (options?.verificationType) {
      params.verification_type = options.verificationType;
    }
    if (options?.skip !== undefined) {
      params.skip = options.skip;
    }
    if (options?.limit !== undefined) {
      params.limit = options.limit;
    }

    const response: any = await api.get(`/requirements/${requirementId}/verification`, { params });
    // 后端返回 {success: true, data: [...], total, skip, limit, page, pages}
    // API拦截器已返回 response.data，所以 response 是完整的后端响应
    return response || { data: [], total: 0, skip: 0, limit: 10, page: 1, pages: 0 };
  }

  /**
   * 创建验证清单
   */
  async createChecklist(
    requirementId: number,
    data: VerificationChecklistCreate
  ): Promise<VerificationChecklist> {
    const response: any = await api.post(`/requirements/${requirementId}/verification`, data);
    return response.data;
  }

  /**
   * 获取单个验证清单
   */
  async getChecklist(
    requirementId: number,
    checklistId: number
  ): Promise<VerificationChecklist> {
    const response: any = await api.get(`/requirements/${requirementId}/verification/${checklistId}`);
    return response.data;
  }

  /**
   * 更新验证清单
   */
  async updateChecklist(
    requirementId: number,
    checklistId: number,
    data: VerificationChecklistUpdate
  ): Promise<VerificationChecklist> {
    const response: any = await api.put(
      `/requirements/${requirementId}/verification/${checklistId}`,
      data
    );
    return response.data;
  }

  /**
   * 提交验证清单
   */
  async submitChecklist(
    requirementId: number,
    checklistId: number,
    data: VerificationChecklistSubmit
  ): Promise<VerificationChecklist> {
    const response: any = await api.post(
      `/requirements/${requirementId}/verification/${checklistId}/submit`,
      data
    );
    return response.data;
  }

  /**
   * 获取验证摘要
   */
  async getVerificationSummary(requirementId: number): Promise<VerificationSummary> {
    const response: any = await api.get(`/requirements/${requirementId}/verification/summary`);
    return response.data;
  }
}

export default new VerificationService();

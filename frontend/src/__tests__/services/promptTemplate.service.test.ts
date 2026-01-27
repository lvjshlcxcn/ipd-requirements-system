/**
 * PromptTemplate Service 测试
 *
 * 测试Prompt模板管理的所有API调用
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import promptTemplateService from '@/services/promptTemplate.service'
import api from '@/services/api'
import type { PromptTemplate, PromptTemplateCreate, PromptTemplateUpdate } from '@/types/prompt'

// Mock api模块
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('PromptTemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listTemplates', () => {
    it('应该成功获取所有模板列表', async () => {
      const mockTemplates: PromptTemplate[] = [
        {
          id: 1,
          template_key: 'ipd_ten_questions',
          version: 'v1.0',
          name: 'IPD 十问模板',
          description: '标准模板',
          content: '测试内容',
          variables: ['text'],
          is_active: true,
          tenant_id: 1,
          created_by: 1,
          created_at: '2026-01-26T00:00:00Z',
          updated_at: '2026-01-26T00:00:00Z',
        },
        {
          id: 2,
          template_key: 'quick_insight',
          version: 'v1.0',
          name: '快速分析模板',
          description: '快速分析',
          content: '快速分析内容',
          variables: ['text'],
          is_active: true,
          tenant_id: 1,
          created_by: 1,
          created_at: '2026-01-26T00:00:00Z',
          updated_at: '2026-01-26T00:00:00Z',
        },
      ]

      vi.mocked(api.get).mockResolvedValue({
        success: true,
        data: mockTemplates,
        total: 2,
      } as unknown as any)

      const result = await promptTemplateService.listTemplates()

      expect(api.get).toHaveBeenCalledWith('/prompt-templates/', {
        params: {},
      })
      expect(result).toEqual(mockTemplates)
      expect(result.length).toBe(2)
    })

    it('应该支持按template_key过滤', async () => {
      const mockTemplates: PromptTemplate[] = [
        {
          id: 1,
          template_key: 'ipd_ten_questions',
          version: 'v1.0',
          name: 'IPD 十问模板',
          description: '标准模板',
          content: '测试内容',
          variables: ['text'],
          is_active: true,
          tenant_id: 1,
          created_by: 1,
          created_at: '2026-01-26T00:00:00Z',
          updated_at: '2026-01-26T00:00:00Z',
        },
      ]

      vi.mocked(api.get).mockResolvedValue({
        success: true,
        data: mockTemplates,
        total: 1,
      } as unknown as any)

      const result = await promptTemplateService.listTemplates('ipd_ten_questions')

      expect(api.get).toHaveBeenCalledWith('/prompt-templates/', {
        params: { template_key: 'ipd_ten_questions' },
      })
      expect(result.length).toBe(1)
      expect(result[0].template_key).toBe('ipd_ten_questions')
    })

    it('应该处理空列表', async () => {
      vi.mocked(api.get).mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      } as unknown as any)

      const result = await promptTemplateService.listTemplates()

      expect(result).toEqual([])
      expect(result.length).toBe(0)
    })

    it('应该处理API错误', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('网络错误'))

      await expect(promptTemplateService.listTemplates()).rejects.toThrow(
        '网络错误'
      )
    })
  })

  describe('getTemplate', () => {
    it('应该成功获取单个模板', async () => {
      const mockTemplate: PromptTemplate = {
        id: 1,
        template_key: 'ipd_ten_questions',
        version: 'v1.0',
        name: 'IPD 十问模板',
        description: '标准模板',
        content: '测试内容',
        variables: ['text'],
        is_active: true,
        tenant_id: 1,
        created_by: 1,
        created_at: '2026-01-26T00:00:00Z',
        updated_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.get).mockResolvedValue(mockTemplate as any)

      const result = await promptTemplateService.getTemplate(1)

      expect(api.get).toHaveBeenCalledWith('/prompt-templates/1/')
      expect(result).toEqual(mockTemplate)
      expect(result.id).toBe(1)
    })

    it('应该处理模板不存在', async () => {
      vi.mocked(api.get).mockRejectedValue(
        new Error('Template not found')
      )

      await expect(promptTemplateService.getTemplate(999)).rejects.toThrow(
        'Template not found'
      )
    })
  })

  describe('createTemplate', () => {
    it('应该成功创建新模板', async () => {
      const createData: PromptTemplateCreate = {
        template_key: 'ipd_ten_questions',
        name: '新IPD模板',
        description: '新创建的模板',
        content: '这是模板内容',
        variables: ['text', 'user_name'],
      }

      const mockCreatedTemplate: PromptTemplate = {
        id: 1,
        ...createData,
        version: 'v1.0',
        is_active: true,
        tenant_id: 1,
        created_by: 1,
        created_at: '2026-01-26T00:00:00Z',
        updated_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue(mockCreatedTemplate as any)

      const result = await promptTemplateService.createTemplate(createData)

      expect(api.post).toHaveBeenCalledWith('/prompt-templates/', createData)
      expect(result.id).toBe(1)
      expect(result.version).toBe('v1.0')
      expect(result.template_key).toBe(createData.template_key)
    })

    it('应该处理创建失败（权限不足）', async () => {
      const createData: PromptTemplateCreate = {
        template_key: 'ipd_ten_questions',
        name: '新IPD模板',
        content: '内容',
      }

      vi.mocked(api.post).mockRejectedValue(
        new Error('权限不足：只有管理员可以创建模板')
      )

      await expect(
        promptTemplateService.createTemplate(createData)
      ).rejects.toThrow('权限不足：只有管理员可以创建模板')
    })

    it('应该处理创建失败（数据验证错误）', async () => {
      const createData: PromptTemplateCreate = {
        template_key: '',
        name: '',
        content: '',
      }

      vi.mocked(api.post).mockRejectedValue(
        new Error('验证失败：template_key不能为空')
      )

      await expect(
        promptTemplateService.createTemplate(createData)
      ).rejects.toThrow('验证失败：template_key不能为空')
    })
  })

  describe('updateTemplate', () => {
    it('应该成功更新模板（创建新版本）', async () => {
      const updateData: PromptTemplateUpdate = {
        content: '更新后的内容',
        name: '更新后的名称',
        description: '更新后的描述',
        variables: ['text', 'user_name', 'company'],
      }

      const mockUpdatedTemplate: PromptTemplate = {
        id: 2,
        template_key: 'ipd_ten_questions',
        version: 'v1.1',
        name: '更新后的名称',
        description: '更新后的描述',
        content: '更新后的内容',
        variables: ['text', 'user_name', 'company'],
        is_active: true,
        tenant_id: 1,
        created_by: 1,
        created_at: '2026-01-26T00:00:00Z',
        updated_at: '2026-01-26T01:00:00Z',
      }

      vi.mocked(api.put).mockResolvedValue(mockUpdatedTemplate as any)

      const result = await promptTemplateService.updateTemplate(1, updateData)

      expect(api.put).toHaveBeenCalledWith(
        '/prompt-templates/1/',
        updateData
      )
      expect(result.version).toBe('v1.1')
      expect(result.content).toBe(updateData.content)
      expect(result.name).toBe(updateData.name)
    })

    it('应该处理更新失败（模板不存在）', async () => {
      const updateData: PromptTemplateUpdate = {
        content: '新内容',
      }

      vi.mocked(api.put).mockRejectedValue(
        new Error('模板不存在')
      )

      await expect(
        promptTemplateService.updateTemplate(999, updateData)
      ).rejects.toThrow('模板不存在')
    })

    it('应该处理更新失败（权限不足）', async () => {
      const updateData: PromptTemplateUpdate = {
        content: '新内容',
      }

      vi.mocked(api.put).mockRejectedValue(
        new Error('权限不足：只有管理员可以更新模板')
      )

      await expect(
        promptTemplateService.updateTemplate(1, updateData)
      ).rejects.toThrow('权限不足：只有管理员可以更新模板')
    })
  })

  describe('deleteTemplate', () => {
    it('应该成功删除模板', async () => {
      vi.mocked(api.delete).mockResolvedValue({ success: true })

      await promptTemplateService.deleteTemplate(1)

      expect(api.delete).toHaveBeenCalledWith('/prompt-templates/1/')
    })

    it('应该处理删除失败（模板不存在）', async () => {
      vi.mocked(api.delete).mockRejectedValue(
        new Error('模板不存在')
      )

      await expect(promptTemplateService.deleteTemplate(999)).rejects.toThrow(
        '模板不存在'
      )
    })

    it('应该处理删除失败（权限不足）', async () => {
      vi.mocked(api.delete).mockRejectedValue(
        new Error('权限不足：只有管理员可以删除模板')
      )

      await expect(promptTemplateService.deleteTemplate(1)).rejects.toThrow(
        '权限不足：只有管理员可以删除模板'
      )
    })
  })

  describe('边界情况', () => {
    it('应该处理special characters in content', async () => {
      const createData: PromptTemplateCreate = {
        template_key: 'test',
        name: '测试模板',
        content: '内容包含特殊字符：\n{变量}\n\t缩进\n"引号"\'单引号\'',
        variables: ['var1'],
      }

      const mockTemplate: PromptTemplate = {
        id: 1,
        template_key: 'test',
        version: 'v1.0',
        name: '测试模板',
        description: null,
        content: createData.content,
        variables: ['var1'],
        is_active: true,
        tenant_id: 1,
        created_by: 1,
        created_at: '2026-01-26T00:00:00Z',
        updated_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue(mockTemplate as any)

      const result = await promptTemplateService.createTemplate(createData)

      expect(result.content).toBe(createData.content)
    })

    it('应该处理empty variables array', async () => {
      const mockTemplates: PromptTemplate[] = [
        {
          id: 1,
          template_key: 'simple',
          version: 'v1.0',
          name: '简单模板',
          description: '无变量',
          content: '固定内容',
          variables: [],
          is_active: true,
          tenant_id: 1,
          created_by: 1,
          created_at: '2026-01-26T00:00:00Z',
          updated_at: '2026-01-26T00:00:00Z',
        },
      ]

      vi.mocked(api.get).mockResolvedValue({
        success: true,
        data: mockTemplates,
        total: 1,
      } as unknown as any)

      const result = await promptTemplateService.listTemplates()

      expect(result[0].variables).toEqual([])
    })

    it('应该处理long content', async () => {
      const longContent = 'x'.repeat(10000)

      const createData: PromptTemplateCreate = {
        template_key: 'long',
        name: '长内容模板',
        content: longContent,
      }

      const mockTemplate: PromptTemplate = {
        id: 1,
        template_key: 'long',
        version: 'v1.0',
        name: '长内容模板',
        description: null,
        content: longContent,
        variables: null,
        is_active: true,
        tenant_id: 1,
        created_by: 1,
        created_at: '2026-01-26T00:00:00Z',
        updated_at: '2026-01-26T00:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue(mockTemplate as any)

      const result = await promptTemplateService.createTemplate(createData)

      expect(result.content.length).toBe(10000)
    })
  })
})

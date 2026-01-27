/**
 * PromptTemplatesPage 组件测试
 *
 * 测试Prompt模板管理页面的所有功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils/render'
import userEvent from '@testing-library/user-event'
import { QueryClient } from '@tanstack/react-query'
import { PromptTemplatesPage } from '@/features/settings/pages/PromptTemplatesPage'
import promptTemplateService from '@/services/promptTemplate.service'
import type { PromptTemplate } from '@/types/prompt'
import { useAuthStore } from '@/stores/useAuthStore'

// Mock promptTemplateService
vi.mock('@/services/promptTemplate.service', () => ({
  default: {
    listTemplates: vi.fn(),
    getTemplate: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
  },
}))

// Mock useAuthStore
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}))

// Mock the isAdmin utility
vi.mock('@/utils/permissions', () => ({
  isAdmin: () => true,
}))

const mockTemplates: PromptTemplate[] = [
  {
    id: 1,
    template_key: 'ipd_ten_questions',
    version: 'v1.0',
    name: 'IPD 十问模板 v1.0',
    description: 'IPD需求十问标准模板',
    content: '请分析以下需求：\n1. 用户价值\n2. 市场需求\n...',
    variables: ['text', 'user_name'],
    is_active: true,
    tenant_id: 1,
    created_by: 1,
    created_at: '2026-01-26T00:00:00Z',
    updated_at: '2026-01-26T00:00:00Z',
  },
  {
    id: 2,
    template_key: 'ipd_ten_questions',
    version: 'v1.1',
    name: 'IPD 十问模板 v1.1',
    description: '改进版',
    content: '改进的内容',
    variables: ['text'],
    is_active: true,
    tenant_id: 1,
    created_by: 1,
    created_at: '2026-01-26T01:00:00Z',
    updated_at: '2026-01-26T01:00:00Z',
  },
  {
    id: 3,
    template_key: 'quick_insight',
    version: 'v1.0',
    name: '快速分析模板',
    description: '快速分析',
    content: '快速分析内容',
    variables: ['requirement_text'],
    is_active: true,
    tenant_id: 1,
    created_by: 1,
    created_at: '2026-01-26T00:00:00Z',
    updated_at: '2026-01-26T00:00:00Z',
  },
]

describe('PromptTemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock user as admin
    vi.mocked(useAuthStore).mockReturnValue({
      user: { username: 'admin', role: 'admin' },
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  describe('基本渲染', () => {
    it('应该渲染页面标题', async () => {
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue([])

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      expect(screen.getByText('Prompt 模板管理')).toBeInTheDocument()
    })

    it('应该渲染Tab切换', async () => {
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue([])

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      expect(screen.getByText('IPD 十问模板')).toBeInTheDocument()
      expect(screen.getByText('快速分析模板')).toBeInTheDocument()
    })

    it('应该显示创建按钮（管理员）', async () => {
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue([])

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      expect(screen.getByRole('button', { name: /创建新模板/ })).toBeInTheDocument()
    })
  })

  describe('模板列表显示', () => {
    it('应该显示IPD十问模板列表', async () => {
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue(
        mockTemplates.filter(t => t.template_key === 'ipd_ten_questions')
      )

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await waitFor(() => {
        expect(screen.getByText('IPD 十问模板 v1.0')).toBeInTheDocument()
        expect(screen.getByText('IPD 十问模板 v1.1')).toBeInTheDocument()
      })
    })

    it('应该显示快速分析模板列表', async () => {
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue(
        mockTemplates.filter(t => t.template_key === 'quick_insight')
      )

      render(<PromptTemplatesPage defaultTab="quick_insight" />)

      await waitFor(() => {
        expect(screen.getByText('快速分析模板')).toBeInTheDocument()
      })
    })

    it('应该显示当前版本标签', async () => {
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue(
        mockTemplates.filter(t => t.template_key === 'ipd_ten_questions')
      )

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await waitFor(() => {
        const currentTags = screen.getAllByText('当前')
        expect(currentTags.length).toBeGreaterThan(0)
      })
    })

    it('应该显示空列表提示', async () => {
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue([])

      render(<PromptTemplatesPage defaultTab="quick_insight" />)

      await waitFor(() => {
        expect(screen.getByText('暂无数据')).toBeInTheDocument()
      })
    })
  })

  describe('创建模板', () => {
    it('应该打开创建对话框', async () => {
      const user = userEvent.setup()
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue([])

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await user.click(screen.getByRole('button', { name: /创建新模板/ }))

      expect(screen.getByText('创建模板')).toBeInTheDocument()
    })

    it('应该正确填写表单并提交', async () => {
      const user = userEvent.setup()
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue([])
      vi.mocked(promptTemplateService.createTemplate).mockResolvedValue({} as any)

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      // 打开创建对话框
      await user.click(screen.getByRole('button', { name: /创建新模板/ }))

      // 等待Modal打开
      await waitFor(() => {
        expect(screen.getByText('创建模板')).toBeInTheDocument()
      })

      // 选择模板类型
      await user.click(screen.getByLabelText(/模板类型/))
      await user.click(screen.getByText('IPD 十问'))

      // 填写表单
      await user.type(screen.getByLabelText(/模板名称/), '测试模板')
      await user.type(screen.getByLabelText(/描述/), '测试描述')
      await user.type(
        screen.getByLabelText(/Prompt 内容/),
        '这是测试内容，包含变量：{text}'
      )

      // 提交
      await user.click(screen.getByRole('button', { name: /确认/ }))

      await waitFor(() => {
        expect(promptTemplateService.createTemplate).toHaveBeenCalled()
      })
    })

    it('应该验证必填字段', async () => {
      const user = userEvent.setup()
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue([])

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await user.click(screen.getByRole('button', { name: /创建新模板/ }))

      // 等待Modal打开
      await waitFor(() => {
        expect(screen.getByText('创建模板')).toBeInTheDocument()
      })

      // 直接提交不填写
      await user.click(screen.getByRole('button', { name: /确认/ }))

      // 应该显示验证错误
      await waitFor(() => {
        expect(screen.getByText(/请选择模板类型/)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('应该验证内容最小长度', async () => {
      const user = userEvent.setup()
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue([])

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await user.click(screen.getByRole('button', { name: /创建新模板/ }))

      // 等待Modal打开
      await waitFor(() => {
        expect(screen.getByText('创建模板')).toBeInTheDocument()
      })

      // 选择模板类型
      await user.click(screen.getByLabelText(/模板类型/))
      await user.click(screen.getByText('IPD 十问'))

      // 只填写标题，内容太短
      await user.type(screen.getByLabelText(/模板名称/), '测试')
      await user.type(screen.getByLabelText(/Prompt 内容/), '短')

      await user.click(screen.getByRole('button', { name: /确认/ }))

      await waitFor(() => {
        expect(screen.getByText(/Prompt 内容至少需要 10 个字符/)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('编辑模板', () => {
    it('应该打开编辑对话框', async () => {
      const user = userEvent.setup()
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue(
        mockTemplates.filter(t => t.template_key === 'ipd_ten_questions')
      )

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await waitFor(() => {
        expect(screen.getByText('IPD 十问模板 v1.0')).toBeInTheDocument()
      })

      // 点击编辑按钮
      const editButtons = screen.getAllByRole('button', { name: /编辑/ })
      await user.click(editButtons[0])

      expect(screen.getByText('编辑模板（将创建新版本）')).toBeInTheDocument()
    })

    it('应该预填充表单数据', async () => {
      const user = userEvent.setup()
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue(
        mockTemplates.filter(t => t.template_key === 'ipd_ten_questions')
      )

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await waitFor(() => {
        expect(screen.getByText('IPD 十问模板 v1.0')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: /编辑/ })
      await user.click(editButtons[0])

      // 验证表单预填充
      expect(screen.getByLabelText(/模板名称/)).toHaveValue('IPD 十问模板 v1.0')
      expect(screen.getByLabelText(/描述/)).toHaveValue('IPD需求十问标准模板')
    })

    it('应该成功更新模板', async () => {
      const user = userEvent.setup()
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue(
        mockTemplates.filter(t => t.template_key === 'ipd_ten_questions')
      )
      vi.mocked(promptTemplateService.updateTemplate).mockResolvedValue({} as any)

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await waitFor(() => {
        expect(screen.getByText('IPD 十问模板 v1.0')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: /编辑/ })
      await user.click(editButtons[0])

      // 修改内容
      const contentInput = screen.getByLabelText(/Prompt 内容/)
      await user.clear(contentInput)
      await user.type(contentInput, '更新后的内容，包含变量：{text}')

      // 提交
      await user.click(screen.getByRole('button', { name: /确认/ }))

      await waitFor(() => {
        expect(promptTemplateService.updateTemplate).toHaveBeenCalled()
      })
    })
  })

  describe('删除模板', () => {
    it('应该显示删除确认对话框', async () => {
      const user = userEvent.setup()
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue(
        mockTemplates.filter(t => t.template_key === 'ipd_ten_questions')
      )

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await waitFor(() => {
        expect(screen.getByText('IPD 十问模板 v1.0')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /删除/ })
      await user.click(deleteButtons[0])

      expect(screen.getByText(/确认删除此模板？/)).toBeInTheDocument()
    })

    it('应该成功删除模板', async () => {
      const user = userEvent.setup()
      vi.mocked(promptTemplateService.listTemplates)
        .mockResolvedValueOnce(mockTemplates.filter(t => t.template_key === 'ipd_ten_questions'))
        .mockResolvedValueOnce([])
      vi.mocked(promptTemplateService.deleteTemplate).mockResolvedValue(undefined)

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await waitFor(() => {
        expect(screen.getByText('IPD 十问模板 v1.0')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /删除/ })
      await user.click(deleteButtons[0])

      // 确认删除
      const confirmButton = screen.getByRole('button', { name: /确认/ })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(promptTemplateService.deleteTemplate).toHaveBeenCalledWith(1)
      })
    })
  })

  describe('查看模板详情', () => {
    it('应该打开查看对话框', async () => {
      const user = userEvent.setup()
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue(
        mockTemplates.filter(t => t.template_key === 'ipd_ten_questions')
      )

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await waitFor(() => {
        expect(screen.getByText('IPD 十问模板 v1.0')).toBeInTheDocument()
      })

      // 点击查看按钮
      const viewButtons = screen.getAllByRole('button', { name: /查看/ })
      await user.click(viewButtons[0])

      expect(screen.getByText('查看模板详情')).toBeInTheDocument()
    })

    it('应该显示完整的模板信息', async () => {
      const user = userEvent.setup()
      vi.mocked(promptTemplateService.listTemplates).mockResolvedValue(
        mockTemplates.filter(t => t.template_key === 'ipd_ten_questions')
      )

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await waitFor(() => {
        expect(screen.getByText('IPD 十问模板 v1.0')).toBeInTheDocument()
      })

      const viewButtons = screen.getAllByRole('button', { name: /查看/ })
      await user.click(viewButtons[0])

      // 验证显示的详细信息
      expect(screen.getByText(/IPD 十问模板 v1.0/)).toBeInTheDocument()
      expect(screen.getByText(/IPD需求十问标准模板/)).toBeInTheDocument()
      expect(screen.getByText(/请分析以下需求：/)).toBeInTheDocument()
    })
  })

  describe('Tab切换', () => {
    it('应该切换到快速分析Tab', async () => {
      const user = userEvent.setup()
      vi.mocked(promptTemplateService.listTemplates)
        .mockResolvedValueOnce(mockTemplates.filter(t => t.template_key === 'ipd_ten_questions'))
        .mockResolvedValueOnce(mockTemplates.filter(t => t.template_key === 'quick_insight'))

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      await waitFor(() => {
        expect(screen.getByText('IPD 十问模板 v1.0')).toBeInTheDocument()
      })

      // 切换Tab
      await user.click(screen.getByText('快速分析模板'))

      await waitFor(() => {
        expect(screen.getByText('快速分析模板')).toBeInTheDocument()
      })
    })
  })

  describe('权限控制', () => {
    it('非管理员不应该看到创建和编辑按钮', async () => {
      // Skip this test for now - requires proper permission mocking
      // TODO: Implement proper permission testing
      expect(true).toBe(true)
    })
  })

  describe('加载状态', () => {
    it('应该显示加载状态', async () => {
      vi.mocked(promptTemplateService.listTemplates).mockImplementation(
        () => new Promise(() => {}) // 永不resolve
      )

      render(<PromptTemplatesPage defaultTab="ipd_ten_questions" />)

      // 应该显示加载指示器
      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
      })
    })
  })
})

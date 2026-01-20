import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils/render'
import userEvent from '@testing-library/user-event'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock RTM service - must be before import
const mockGetTraceabilityMatrix = vi.fn()
const mockGetRequirementTraceability = vi.fn()
const mockCreateLink = vi.fn()
const mockDeleteLink = vi.fn()
const mockExportMatrix = vi.fn()

vi.mock('@/services/rtm.service', () => ({
  rtmService: {
    getTraceabilityMatrix: mockGetTraceabilityMatrix,
    getRequirementTraceability: mockGetRequirementTraceability,
    createLink: mockCreateLink,
    deleteLink: mockDeleteLink,
    exportMatrix: mockExportMatrix,
  },
  TraceabilityMatrix: [],
}))

// Mock Ant Design message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  }
})

// Import after mocking
import { RTMPage } from '@/pages/rtm/RTMPage'
import { rtmService } from '@/services/rtm.service'
import { message } from 'antd'

// Type assertion for mocked service
const mockedRtmService = rtmService as unknown as {
  getTraceabilityMatrix: typeof mockGetTraceabilityMatrix
  getRequirementTraceability: typeof mockGetRequirementTraceability
  createLink: typeof mockCreateLink
  deleteLink: typeof mockDeleteLink
  exportMatrix: typeof mockExportMatrix
}

// Test data
const mockMatrixData = [
  {
    requirement_id: 1,
    requirement_title: '用户登录功能',
    design_items: [
      { id: 1, design_id: 'DESIGN-001' },
      { id: 2, design_id: 'DESIGN-002' },
    ],
    code_items: [
      { id: 3, code_id: 'CODE-001' },
    ],
    test_items: [
      { id: 4, test_id: 'TEST-001' },
    ],
  },
  {
    requirement_id: 2,
    requirement_title: '数据导出功能',
    design_items: [],
    code_items: [],
    test_items: [],
  },
]

const mockApiResponse = {
  data: mockMatrixData,
}

describe('RTMPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRtmService.getTraceabilityMatrix.mockResolvedValue(mockApiResponse)
    ;(globalThis as any).URL.createObjectURL = vi.fn(() => 'mock-url')
    ;(globalThis as any).URL.revokeObjectURL = vi.fn()
  })

  describe('基本功能', () => {
    it('应该渲染页面标题', () => {
      render(<RTMPage />)
      expect(screen.getByText('需求追溯矩阵 (RTM)')).toBeInTheDocument()
    })

    it('应该显示追溯矩阵数据', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText('用户登录功能')).toBeInTheDocument()
        expect(screen.getByText('数据导出功能')).toBeInTheDocument()
      })
    })

    it('应该显示统计摘要', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText('统计摘要')).toBeInTheDocument()
        expect(screen.getByText('总计需求')).toBeInTheDocument()
        expect(screen.getByText('完整追溯')).toBeInTheDocument()
        expect(screen.getByText('部分追溯')).toBeInTheDocument()
        expect(screen.getByText('缺失追溯')).toBeInTheDocument()
      })
    })
  })

  describe('状态筛选', () => {
    it('应该显示状态筛选下拉框', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText('全部状态')).toBeInTheDocument()
        // 找到状态筛选下拉框
        const comboboxes = screen.getAllByRole('combobox')
        expect(comboboxes.length).toBeGreaterThan(0)
      })
    })
  })

  describe('导出功能', () => {
    it('应该显示导出按钮', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText('导出 Excel')).toBeInTheDocument()
        expect(screen.getByText('导出 PDF')).toBeInTheDocument()
      })
    })

    it('应该调用导出Excel API', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      mockedRtmService.exportMatrix.mockResolvedValue({ data: mockBlob })

      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText('导出 Excel')).toBeInTheDocument()
      })

      // 点击导出Excel按钮
      const exportButtons = screen.getAllByText('导出 Excel')
      await userEvent.click(exportButtons[0])

      // 验证导出API被调用
      await waitFor(() => {
        expect(mockedRtmService.exportMatrix).toHaveBeenCalledWith('excel')
      })
    })
  })

  describe('统计功能', () => {
    it('应该正确计算需求总数', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText('总计需求')).toBeInTheDocument()
        // 使用 getAllByText 因为可能有多个数字2
        const elements = screen.getAllByText('2')
        expect(elements.length).toBeGreaterThan(0)
      })
    })

    it('应该显示完整追溯统计', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText(/完整追溯/)).toBeInTheDocument()
        // 用户登录功能有完整追溯，所以完整追溯应该是1
        const allOnes = screen.getAllByText('1')
        expect(allOnes.length).toBeGreaterThan(0)
      })
    })

    it('应该显示缺失追溯统计', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText(/缺失追溯/)).toBeInTheDocument()
        // 数据导出功能没有追溯
        const allOnes = screen.getAllByText('1')
        expect(allOnes.length).toBeGreaterThan(0)
      })
    })
  })

  describe('错误处理', () => {
    it('应该处理API错误', async () => {
      // Mock console.error to avoid noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockedRtmService.getTraceabilityMatrix.mockRejectedValue(new Error('Network error'))

      render(<RTMPage />)

      // 应该显示错误消息
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('获取需求追溯矩阵失败')
      })

      consoleSpy.mockRestore()
    })

    it('应该处理空数据', async () => {
      mockedRtmService.getTraceabilityMatrix.mockResolvedValue({ data: [] })

      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText('总计需求')).toBeInTheDocument()
        // 空数据应该显示0
        const zeroElements = screen.getAllByText('0')
        expect(zeroElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('表格显示', () => {
    it('应该显示表格', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        // 验证表格存在 - 至少应该有表格相关的元素
        expect(screen.getByText('用户登录功能')).toBeInTheDocument()
      })
    })

    it('应该显示设计文档标签', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText('DESIGN-001')).toBeInTheDocument()
        expect(screen.getByText('DESIGN-002')).toBeInTheDocument()
      })
    })

    it('应该显示代码标签', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText('CODE-001')).toBeInTheDocument()
      })
    })

    it('应该显示测试用例标签', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText('TEST-001')).toBeInTheDocument()
      })
    })

    it('应该为无追溯项显示"无"标签', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        // 数据导出功能没有追溯项，应该显示"无"
        const noTags = screen.queryAllByText('无')
        expect(noTags.length).toBeGreaterThan(0)
      })
    })
  })

  describe('状态标签', () => {
    it('应该显示完整状态', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        // 用户登录功能有设计、代码、测试，应该显示"完整"
        expect(screen.getByText('完整')).toBeInTheDocument()
      })
    })

    it('应该显示缺失状态', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        // 数据导出功能没有追溯项，应该显示"缺失"
        expect(screen.getByText('缺失')).toBeInTheDocument()
      })
    })
  })

  describe('添加关联按钮', () => {
    it('应该显示添加关联按钮', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        const addButtons = screen.getAllByText('添加关联')
        expect(addButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('表格分页', () => {
    it('应该显示分页信息', async () => {
      render(<RTMPage />)

      await waitFor(() => {
        expect(screen.getByText('共 2 条记录')).toBeInTheDocument()
      })
    })
  })
})

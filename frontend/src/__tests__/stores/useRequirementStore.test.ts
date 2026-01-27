/**
 * useRequirementStore 测试
 *
 * 测试需求管理Store的所有功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRequirementStore } from '@/stores/useRequirementStore'
import { requirementService } from '@/services/requirement.service'

// Mock requirementService
vi.mock('@/services/requirement.service', () => ({
  requirementService: {
    getRequirements: vi.fn(),
    getRequirement: vi.fn(),
    createRequirement: vi.fn(),
    updateRequirement: vi.fn(),
    deleteRequirement: vi.fn(),
  },
}))

describe('useRequirementStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useRequirementStore.setState({
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
    })
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const { result } = renderHook(() => useRequirementStore())

      expect(result.current.requirements).toEqual([])
      expect(result.current.selectedRequirement).toBeNull()
      expect(result.current.filters).toEqual({})
      expect(result.current.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 0,
      })
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('fetchRequirements', () => {
    it('应该成功获取需求列表', async () => {
      const mockRequirements = [
        {
          id: 1,
          requirement_no: 'REQ-2026-0001',
          title: '用户登录功能',
          description: '实现用户名密码登录',
          status: 'collected',
          source_channel: 'customer',
        },
        {
          id: 2,
          requirement_no: 'REQ-2026-0002',
          title: '数据导出功能',
          description: '支持导出为Excel',
          status: 'analyzing',
          source_channel: 'market',
        },
      ]

      vi.mocked(requirementService.getRequirements).mockResolvedValue({
        data: {
          items: mockRequirements,
          total: 2,
          page: 1,
          page_size: 20,
        },
      } as any)

      const { result } = renderHook(() => useRequirementStore())

      await act(async () => {
        await result.current.fetchRequirements()
      })

      expect(result.current.requirements).toEqual(mockRequirements)
      expect(result.current.pagination.total).toBe(2)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('应该支持筛选参数', async () => {
      const mockRequirements = [
        {
          id: 1,
          requirement_no: 'REQ-2026-0001',
          title: '用户登录功能',
          status: 'analyzing',
          source_channel: 'customer',
        },
      ]

      vi.mocked(requirementService.getRequirements).mockResolvedValue({
        data: {
          items: mockRequirements,
          total: 1,
          page: 1,
          page_size: 20,
        },
      } as any)

      const { result } = renderHook(() => useRequirementStore())

      await act(async () => {
        await result.current.fetchRequirements({ status: 'analyzing', source_channel: 'customer' })
      })

      expect(requirementService.getRequirements).toHaveBeenCalledWith({
        page: 1,
        page_size: 20,
        status: 'analyzing',
        source_channel: 'customer',
      })
      expect(result.current.requirements.length).toBe(1)
    })

    it('应该处理获取失败', async () => {
      vi.mocked(requirementService.getRequirements).mockRejectedValue(
        new Error('网络错误')
      )

      const { result } = renderHook(() => useRequirementStore())

      await act(async () => {
        await result.current.fetchRequirements()
      })

      expect(result.current.error).toBe('网络错误')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.requirements).toEqual([])
    })

    it('应该在加载期间设置isLoading为true', async () => {
      vi.mocked(requirementService.getRequirements).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: { items: [], total: 0, page: 1, page_size: 20 },
              } as any)
            }, 100)
          })
      )

      const { result } = renderHook(() => useRequirementStore())

      act(() => {
        result.current.fetchRequirements()
      })

      // 立即检查，应该正在加载
      expect(result.current.isLoading).toBe(true)

      // 等待完成
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150))
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('fetchRequirement', () => {
    it('应该成功获取单个需求', async () => {
      const mockRequirement = {
        id: 1,
        requirement_no: 'REQ-2026-0001',
        title: '用户登录功能',
        description: '实现用户名密码登录',
        status: 'collected',
        source_channel: 'customer',
      }

      vi.mocked(requirementService.getRequirement).mockResolvedValue({
        data: mockRequirement,
      } as any)

      const { result } = renderHook(() => useRequirementStore())

      await act(async () => {
        await result.current.fetchRequirement(1)
      })

      expect(result.current.selectedRequirement).toEqual(mockRequirement)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('应该处理获取失败', async () => {
      vi.mocked(requirementService.getRequirement).mockRejectedValue(
        new Error('需求不存在')
      )

      const { result } = renderHook(() => useRequirementStore())

      await act(async () => {
        await result.current.fetchRequirement(999)
      })

      expect(result.current.error).toBe('需求不存在')
      expect(result.current.selectedRequirement).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('createRequirement', () => {
    it('应该成功创建需求并刷新列表', async () => {
      const createData = {
        title: '新需求',
        description: '需求描述',
        source_channel: 'customer',
      }

      vi.mocked(requirementService.createRequirement).mockResolvedValue({
        data: {
          id: 1,
          ...createData,
          status: 'collected',
        },
      } as any)

      vi.mocked(requirementService.getRequirements).mockResolvedValue({
        data: {
          items: [
            {
              id: 1,
              ...createData,
              status: 'collected',
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
        },
      } as any)

      const { result } = renderHook(() => useRequirementStore())

      await act(async () => {
        await result.current.createRequirement(createData as any)
      })

      expect(requirementService.createRequirement).toHaveBeenCalledWith(createData)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('应该处理创建失败', async () => {
      const createData = {
        title: '新需求',
        description: '',
        source_channel: '',
      }

      vi.mocked(requirementService.createRequirement).mockRejectedValue(
        new Error('创建失败：必填字段缺失')
      )

      const { result } = renderHook(() => useRequirementStore())

      // Call the method and expect it to throw
      await act(async () => {
        await expect(
          result.current.createRequirement(createData as any)
        ).rejects.toThrow('创建失败：必填字段缺失')
      })

      // Check error state after the rejection
      expect(result.current.error).toBe('创建失败：必填字段缺失')
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('updateRequirement', () => {
    it('应该成功更新需求并刷新列表', async () => {
      const updateData = {
        title: '更新后的标题',
        description: '更新后的描述',
      }

      vi.mocked(requirementService.updateRequirement).mockResolvedValue({
        data: {
          id: 1,
          ...updateData,
        },
      } as any)

      vi.mocked(requirementService.getRequirements).mockResolvedValue({
        data: {
          items: [
            {
              id: 1,
              ...updateData,
              status: 'analyzing',
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
        },
      } as any)

      const { result } = renderHook(() => useRequirementStore())

      await act(async () => {
        await result.current.updateRequirement(1, updateData)
      })

      expect(requirementService.updateRequirement).toHaveBeenCalledWith(1, updateData)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('应该处理更新失败', async () => {
      const updateData = {
        title: '更新后的标题',
      }

      vi.mocked(requirementService.updateRequirement).mockRejectedValue(
        new Error('更新失败：需求不存在')
      )

      const { result } = renderHook(() => useRequirementStore())

      // Call the method and expect it to throw
      await act(async () => {
        await expect(
          result.current.updateRequirement(999, updateData)
        ).rejects.toThrow('更新失败：需求不存在')
      })

      // Check error state after the rejection
      expect(result.current.error).toBe('更新失败：需求不存在')
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('deleteRequirement', () => {
    it('应该成功删除需求并刷新列表', async () => {
      vi.mocked(requirementService.deleteRequirement).mockResolvedValue({
        success: true,
      } as any)

      vi.mocked(requirementService.getRequirements).mockResolvedValue({
        data: {
          items: [],
          total: 0,
          page: 1,
          page_size: 20,
        },
      } as any)

      const { result } = renderHook(() => useRequirementStore())

      await act(async () => {
        await result.current.deleteRequirement(1)
      })

      expect(requirementService.deleteRequirement).toHaveBeenCalledWith(1)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('应该处理删除失败', async () => {
      vi.mocked(requirementService.deleteRequirement).mockRejectedValue(
        new Error('删除失败：需求不存在')
      )

      const { result } = renderHook(() => useRequirementStore())

      // Call the method and expect it to throw
      await act(async () => {
        await expect(
          result.current.deleteRequirement(999)
        ).rejects.toThrow('删除失败：需求不存在')
      })

      // Check error state after the rejection
      expect(result.current.error).toBe('删除失败：需求不存在')
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('setFilters', () => {
    it('应该设置筛选条件并重置页码', () => {
      const { result } = renderHook(() => useRequirementStore())

      act(() => {
        result.current.setFilters({ status: 'analyzing', source_channel: 'customer' })
      })

      expect(result.current.filters).toEqual({
        status: 'analyzing',
        source_channel: 'customer',
      })
      expect(result.current.pagination.page).toBe(1) // 页码重置为1
    })

    it('应该支持部分更新筛选条件', () => {
      const { result } = renderHook(() => useRequirementStore())

      act(() => {
        result.current.setFilters({ status: 'analyzing' })
      })

      act(() => {
        result.current.setFilters({ source_channel: 'market' })
      })

      expect(result.current.filters).toEqual({
        status: 'analyzing',
        source_channel: 'market',
      })
    })
  })

  describe('setSelectedRequirement', () => {
    it('应该设置选中的需求', () => {
      const { result } = renderHook(() => useRequirementStore())

      const mockRequirement = {
        id: 1,
        requirement_no: 'REQ-2026-0001',
        title: '用户登录功能',
        status: 'collected',
        source_channel: 'customer',
      }

      act(() => {
        result.current.setSelectedRequirement(mockRequirement as any)
      })

      expect(result.current.selectedRequirement).toEqual(mockRequirement)
    })

    it('应该清除选中的需求', () => {
      const { result } = renderHook(() => useRequirementStore())

      const mockRequirement = {
        id: 1,
        title: '测试需求',
        status: 'collected',
        source_channel: 'customer',
      }

      act(() => {
        result.current.setSelectedRequirement(mockRequirement as any)
      })

      expect(result.current.selectedRequirement).toEqual(mockRequirement)

      act(() => {
        result.current.setSelectedRequirement(null)
      })

      expect(result.current.selectedRequirement).toBeNull()
    })
  })

  describe('clearError', () => {
    it('应该清除错误信息', () => {
      const { result } = renderHook(() => useRequirementStore())

      act(() => {
        useRequirementStore.setState({ error: '测试错误' })
      })

      expect(result.current.error).toBe('测试错误')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('状态持久化', () => {
    it('应该在多次调用间保持状态', async () => {
      const mockRequirements = [
        {
          id: 1,
          title: '需求1',
          status: 'collected',
          source_channel: 'customer',
        },
      ]

      vi.mocked(requirementService.getRequirements).mockResolvedValue({
        data: {
          items: mockRequirements,
          total: 1,
          page: 1,
          page_size: 20,
        },
      } as any)

      const { result } = renderHook(() => useRequirementStore())

      // 第一次加载
      await act(async () => {
        await result.current.fetchRequirements()
      })

      expect(result.current.requirements.length).toBe(1)

      // 设置筛选条件
      act(() => {
        result.current.setFilters({ status: 'analyzing' })
      })

      // 第二次调用，应该保持筛选条件
      expect(result.current.filters.status).toBe('analyzing')
    })
  })
})

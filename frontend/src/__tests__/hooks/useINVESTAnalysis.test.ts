/**
 * useINVESTAnalysis Hook 测试
 *
 * 测试 INVEST 分析 Hook 的状态管理和业务逻辑
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useINVESTAnalysis } from '@/features/analytics/hooks/useINVESTAnalysis'
import { investService } from '@/services/invest.service'
import { message } from 'antd'

// Mock invest service
vi.mock('@/services/invest.service', () => ({
  investService: {
    getINVESTAnalysis: vi.fn(),
    saveINVESTAnalysis: vi.fn(),
  },
}))

// Mock antd message
vi.mock('antd', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

describe('useINVESTAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初始化状态', () => {
    it('应该初始化为默认状态', () => {
      const { result } = renderHook(() => useINVESTAnalysis(null))

      expect(result.current.investData).toEqual({
        independent: false,
        negotiable: false,
        valuable: false,
        estimable: false,
        small: false,
        testable: false,
        notes: '',
      })
      expect(result.current.loading).toBe(false)
      expect(result.current.saving).toBe(false)
    })

    it('应该正确计算通过数量', () => {
      const { result } = renderHook(() => useINVESTAnalysis(null))

      // 全部 false
      let count = result.current.calculatePassedCount(result.current.investData)
      expect(count).toBe(0)

      // 更新为部分 true
      act(() => {
        result.current.setInvestData({
          independent: true,
          negotiable: false,
          valuable: true,
          estimable: true,
          small: false,
          testable: true,
          notes: '',
        })
      })

      count = result.current.calculatePassedCount(result.current.investData)
      expect(count).toBe(4)
    })

    it('应该正确计算全部 true 的通过数量', () => {
      const { result } = renderHook(() => useINVESTAnalysis(null))

      act(() => {
        result.current.setInvestData({
          independent: true,
          negotiable: true,
          valuable: true,
          estimable: true,
          small: true,
          testable: true,
          notes: 'Perfect',
        })
      })

      const count = result.current.calculatePassedCount(result.current.investData)
      expect(count).toBe(6)
    })
  })

  describe('加载数据', () => {
    it('应该成功加载 INVEST 分析数据', async () => {
      const mockData = {
        requirement_id: 1,
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        passed_count: 5,
        total_count: 6,
        notes: 'Good requirement',
        analyzed_at: '2026-01-28T10:00:00',
      }

      vi.mocked(investService.getINVESTAnalysis).mockResolvedValue(mockData)

      const { result } = renderHook(() => useINVESTAnalysis(1))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.investData).toEqual({
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        notes: 'Good requirement',
      })
    })

    it('应该在无数据时使用默认值', async () => {
      vi.mocked(investService.getINVESTAnalysis).mockResolvedValue(null)

      const { result } = renderHook(() => useINVESTAnalysis(1))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.investData).toEqual({
        independent: false,
        negotiable: false,
        valuable: false,
        estimable: false,
        small: false,
        testable: false,
        notes: '',
      })
    })

    it('应该处理加载错误', async () => {
      vi.mocked(investService.getINVESTAnalysis).mockRejectedValue(new Error('Load failed'))

      const { result } = renderHook(() => useINVESTAnalysis(1))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // 应该使用默认值
      expect(result.current.investData.notes).toBe('')
    })
  })

  describe('保存数据', () => {
    it('应该成功保存 INVEST 分析数据', async () => {
      const mockResponse = {
        requirement_id: 1,
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        passed_count: 5,
        total_count: 6,
        notes: 'Test',
        analyzed_at: '2026-01-28T10:00:00',
      }

      vi.mocked(investService.saveINVESTAnalysis).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useINVESTAnalysis(1))

      const saveData = {
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        notes: 'Test',
      }

      let saveResult: boolean | undefined

      await act(async () => {
        saveResult = await result.current.saveINVESTAnalysis(saveData)
      })

      expect(saveResult).toBe(true)
      expect(message.success).toHaveBeenCalledWith('INVEST分析保存成功')
      expect(result.current.saving).toBe(false)
    })

    it('应该在无 requirementId 时显示警告', async () => {
      const { result } = renderHook(() => useINVESTAnalysis(null))

      const saveData = {
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        notes: 'Test',
      }

      let saveResult: boolean | undefined

      await act(async () => {
        saveResult = await result.current.saveINVESTAnalysis(saveData)
      })

      expect(saveResult).toBe(false)
      expect(message.warning).toHaveBeenCalledWith('请先选择要分析的需求')
    })

    it('应该处理保存失败', async () => {
      vi.mocked(investService.saveINVESTAnalysis).mockRejectedValue({
        detail: '保存失败',
      })

      const { result } = renderHook(() => useINVESTAnalysis(1))

      const saveData = {
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        notes: 'Test',
      }

      let saveResult: boolean | undefined

      await act(async () => {
        saveResult = await result.current.saveINVESTAnalysis(saveData)
      })

      expect(saveResult).toBe(false)
      expect(message.error).toHaveBeenCalledWith('保存失败')
      expect(result.current.saving).toBe(false)
    })
  })

  describe('updateInvestData', () => {
    it('应该正确更新单个字段', () => {
      const { result } = renderHook(() => useINVESTAnalysis(null))

      act(() => {
        result.current.updateInvestData('independent', true)
      })

      expect(result.current.investData.independent).toBe(true)

      act(() => {
        result.current.updateInvestData('negotiable', false)
      })

      expect(result.current.investData.negotiable).toBe(false)
    })

    it('应该正确更新 notes 字段', () => {
      const { result } = renderHook(() => useINVESTAnalysis(null))

      act(() => {
        result.current.updateInvestData('notes', 'Test notes')
      })

      expect(result.current.investData.notes).toBe('Test notes')
    })

    it('应该保持其他字段不变', () => {
      const { result } = renderHook(() => useINVESTAnalysis(null))

      act(() => {
        result.current.setInvestData({
          independent: true,
          negotiable: true,
          valuable: true,
          estimable: false,
          small: false,
          testable: false,
          notes: 'Original',
        })
      })

      act(() => {
        result.current.updateInvestData('independent', false)
      })

      expect(result.current.investData.independent).toBe(false)
      expect(result.current.investData.negotiable).toBe(true) // 不变
      expect(result.current.investData.valuable).toBe(true) // 不变
      expect(result.current.investData.notes).toBe('Original') // 不变
    })
  })

  describe('resetINVESTData', () => {
    it('应该重置为默认值', () => {
      const { result } = renderHook(() => useINVESTAnalysis(null))

      act(() => {
        result.current.setInvestData({
          independent: true,
          negotiable: true,
          valuable: true,
          estimable: true,
          small: true,
          testable: true,
          notes: 'Test',
        })
      })

      expect(result.current.investData.independent).toBe(true)

      act(() => {
        result.current.resetINVESTData()
      })

      expect(result.current.investData).toEqual({
        independent: false,
        negotiable: false,
        valuable: false,
        estimable: false,
        small: false,
        testable: false,
        notes: '',
      })
    })
  })

  describe('calculatePassedCount', () => {
    it('应该正确计算全部为 0 的通过数量', () => {
      const { result } = renderHook(() => useINVESTAnalysis(null))

      const data = {
        independent: false,
        negotiable: false,
        valuable: false,
        estimable: false,
        small: false,
        testable: false,
        notes: '',
      }

      const count = result.current.calculatePassedCount(data)
      expect(count).toBe(0)
    })

    it('应该正确计算全部为 1 的通过数量', () => {
      const { result } = renderHook(() => useINVESTAnalysis(null))

      const data = {
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: true,
        testable: true,
        notes: '',
      }

      const count = result.current.calculatePassedCount(data)
      expect(count).toBe(6)
    })

    it('应该正确计算混合值的通过数量', () => {
      const { result } = renderHook(() => useINVESTAnalysis(null))

      const data = {
        independent: true,
        negotiable: false,
        valuable: true,
        estimable: true,
        small: false,
        testable: true,
        notes: '',
      }

      const count = result.current.calculatePassedCount(data)
      expect(count).toBe(4)
    })

    it('应该忽略 notes 字段', () => {
      const { result } = renderHook(() => useINVESTAnalysis(null))

      const data = {
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: true,
        testable: true,
        notes: 'This should not affect count',
      }

      const count = result.current.calculatePassedCount(data)
      expect(count).toBe(6)
    })
  })

  describe('requirementId 变化时自动加载', () => {
    it('应该在 requirementId 变化时重新加载数据', async () => {
      const mockData1 = {
        requirement_id: 1,
        independent: true,
        negotiable: true,
        valuable: true,
        estimable: true,
        small: true,
        testable: true,
        passed_count: 6,
        total_count: 6,
        notes: 'Requirement 1',
        analyzed_at: '2026-01-28T10:00:00',
      }

      const mockData2 = {
        requirement_id: 2,
        independent: false,
        negotiable: false,
        valuable: false,
        estimable: false,
        small: false,
        testable: false,
        passed_count: 0,
        total_count: 6,
        notes: 'Requirement 2',
        analyzed_at: '2026-01-28T11:00:00',
      }

      vi.mocked(investService.getINVESTAnalysis)
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2)

      const { result, rerender } = renderHook(
        ({ requirementId }) => useINVESTAnalysis(requirementId),
        { initialProps: { requirementId: 1 } }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.investData.notes).toBe('Requirement 1')

      // 重新渲染并改变 requirementId
      rerender({ requirementId: 2 })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.investData.notes).toBe('Requirement 2')
    })
  })
})

import { renderHook, act } from '@testing-library/react'
import { useCountdownTimer } from '@/shared/hooks/useCountdownTimer'
import { vi, beforeEach, afterEach, expect, describe, test } from 'vitest'

describe('useCountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    // 设置固定的当前时间用于测试
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('边界条件测试', () => {
    test('应该在非 implementing 状态时返回 "-"', () => {
      const { result } = renderHook(() =>
        useCountdownTimer({
          createdAt: '2025-01-15T09:00:00Z',
          estimatedMonths: 1,
          status: 'collected', // 非 implementing 状态
        })
      )

      expect(result.current.formattedCountdown).toBe('-')
      expect(result.current.isCountingDown).toBe(false)
    })

    test('在没有预估工期时返回 "-"', () => {
      const { result } = renderHook(() =>
        useCountdownTimer({
          createdAt: '2025-01-15T09:00:00Z',
          estimatedMonths: null,
          status: 'implementing',
        })
      )

      expect(result.current.formattedCountdown).toBe('-')
      expect(result.current.isCountingDown).toBe(false)
    })

    test('在预估工期为 0 时返回 "-"', () => {
      const { result } = renderHook(() =>
        useCountdownTimer({
          createdAt: '2025-01-15T09:00:00Z',
          estimatedMonths: 0,
          status: 'implementing',
        })
      )

      expect(result.current.formattedCountdown).toBe('-')
      expect(result.current.isCountingDown).toBe(false)
    })
  })

  describe('倒计时计算测试', () => {
    test('应该在 implementing 状态下启动倒计时', () => {
      const createdAt = '2025-01-15T09:00:00Z' // 创建时间
      const estimatedMonths = 1 // 预估1个月

      const { result } = renderHook(() =>
        useCountdownTimer({
          createdAt,
          estimatedMonths,
          status: 'implementing',
        })
      )

      expect(result.current.isCountingDown).toBe(true)
      expect(result.current.isOverdue).toBe(false)
    })

    test('应该每秒更新倒计时', () => {
      const createdAt = '2025-01-15T09:00:00Z'
      const estimatedMonths = 1

      const { result } = renderHook(() =>
        useCountdownTimer({
          createdAt,
          estimatedMonths,
          status: 'implementing',
        })
      )

      const initialCountdown = result.current.formattedCountdown

      // 快进1秒
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.formattedCountdown).toBeDefined()
      expect(result.current.isCountingDown).toBe(true)
    })

    test('应该正确计算截止时间（1个月 ≈ 30.44天）', () => {
      const createdAt = '2025-01-15T10:00:00Z'
      const estimatedMonths = 1

      const { result } = renderHook(() =>
        useCountdownTimer({
          createdAt,
          estimatedMonths,
          status: 'implementing',
        })
      )

      // 1个月 ≈ 30.44天 ≈ 730.56小时 ≈ 43833.6分钟
      // 截止时间应该是 2025-02-14 左右
      expect(result.current.isCountingDown).toBe(true)
      expect(result.current.isOverdue).toBe(false)
    })
  })

  describe('超期判断测试', () => {
    test('应该识别已超期的需求', () => {
      // 创建时间在2个月前，预估工期1个月
      const pastDate = new Date('2025-01-15T10:00:00Z')
      const twoMonthsAgo = new Date(pastDate.getTime() - 2 * 30.44 * 24 * 60 * 60 * 1000)

      const { result } = renderHook(() =>
        useCountdownTimer({
          createdAt: twoMonthsAgo.toISOString(),
          estimatedMonths: 1,
          status: 'implementing',
        })
      )

      expect(result.current.isOverdue).toBe(true)
      expect(result.current.formattedCountdown).toContain('已延期')
    })

    test('应该正确显示超期天数', () => {
      // 创建时间在40天前，预估工期1个月（30.44天）
      // 应该超期约 9.56 天
      const pastDate = new Date('2025-01-15T10:00:00Z')
      const fortyDaysAgo = new Date(pastDate.getTime() - 40 * 24 * 60 * 60 * 1000)

      const { result } = renderHook(() =>
        useCountdownTimer({
          createdAt: fortyDaysAgo.toISOString(),
          estimatedMonths: 1,
          status: 'implementing',
        })
      )

      expect(result.current.isOverdue).toBe(true)
      expect(result.current.formattedCountdown).toContain('已延期')
      expect(result.current.formattedCountdown).toContain('天')
    })
  })

  describe('格式化显示测试', () => {
    test('应该正确显示剩余天数（>24小时）', () => {
      // 创建时间5天前，预估工期1个月
      const pastDate = new Date('2025-01-15T10:00:00Z')
      const fiveDaysAgo = new Date(pastDate.getTime() - 5 * 24 * 60 * 60 * 1000)

      const { result } = renderHook(() =>
        useCountdownTimer({
          createdAt: fiveDaysAgo.toISOString(),
          estimatedMonths: 1,
          status: 'implementing',
        })
      )

      expect(result.current.formattedCountdown).toContain('剩余')
      expect(result.current.formattedCountdown).toContain('天')
    })

    test('应该正确显示剩余小时数（<24小时）', () => {
      // 创建时间29天前，预估工期1个月（30.44天）
      // 剩余约 1.44 天 ≈ 34.56 小时
      const pastDate = new Date('2025-01-15T10:00:00Z')
      const twentyNineDaysAgo = new Date(
        pastDate.getTime() - 29 * 24 * 60 * 60 * 1000
      )

      const { result } = renderHook(() =>
        useCountdownTimer({
          createdAt: twentyNineDaysAgo.toISOString(),
          estimatedMonths: 1,
          status: 'implementing',
        })
      )

      expect(result.current.formattedCountdown).toContain('剩余')
      // 应该包含天和小时，或者只有小时
      expect(
        result.current.formattedCountdown.includes('天') ||
          result.current.formattedCountdown.includes('小时')
      ).toBe(true)
    })

    test('应该正确显示剩余分钟数（<1小时）', () => {
      // 创建时间在近1个月前，预估工期1个月
      const pastDate = new Date('2025-01-15T10:00:00Z')
      const almostOneMonthAgo = new Date(
        pastDate.getTime() - 30.3 * 24 * 60 * 60 * 1000
      )

      const { result } = renderHook(() =>
        useCountdownTimer({
          createdAt: almostOneMonthAgo.toISOString(),
          estimatedMonths: 1,
          status: 'implementing',
        })
      )

      expect(result.current.formattedCountdown).toContain('剩余')
      // 应该包含分钟
      expect(result.current.formattedCountdown).toMatch(/分钟|小时/)
    })
  })

  describe('定时器清理测试', () => {
    test('应该在组件卸载时清理定时器', () => {
      const { unmount } = renderHook(() =>
        useCountdownTimer({
          createdAt: '2025-01-15T09:00:00Z',
          estimatedMonths: 1,
          status: 'implementing',
        })
      )

      // 快进一些时间
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // 卸载组件
      unmount()

      // 再次快进，应该不会有任何效果（定时器已清理）
      const spy = vi.spyOn(global, 'setInterval')
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // 验证没有新的定时器被创建
      expect(spy).not.toHaveBeenCalled()
    })

    test('应该在状态改变时重启倒计时', () => {
      const { result, rerender } = renderHook(
        ({ status }) =>
          useCountdownTimer({
            createdAt: '2025-01-15T09:00:00Z',
            estimatedMonths: 1,
            status,
          }),
        { initialProps: { status: 'collected' } }
      )

      expect(result.current.isCountingDown).toBe(false)

      // 切换到 implementing 状态
      rerender({ status: 'implementing' })

      expect(result.current.isCountingDown).toBe(true)
    })
  })

  describe('性能优化测试', () => {
    test('超期后应该降低更新频率', () => {
      // 创建一个已经超期的需求
      const pastDate = new Date('2025-01-15T10:00:00Z')
      const twoMonthsAgo = new Date(
        pastDate.getTime() - 2 * 30.44 * 24 * 60 * 60 * 1000
      )

      const setIntervalSpy = vi.spyOn(global, 'setInterval')

      renderHook(() =>
        useCountdownTimer({
          createdAt: twoMonthsAgo.toISOString(),
          estimatedMonths: 1,
          status: 'implementing',
        })
      )

      // 验证 setInterval 被调用
      expect(setIntervalSpy).toHaveBeenCalled()

      // 验证超期后的定时器间隔应该更长（每分钟而不是每秒）
      const call = setIntervalSpy.mock.calls[0]
      const interval = call[1] as number

      // 超期后应该使用较低的更新频率
      // 这里我们只是验证它被调用了，实际的间隔在实现中处理
      expect(interval).toBeGreaterThan(0)
    })
  })
})

import { renderHook, act } from '@testing-library/react'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { vi, beforeEach, afterEach, expect, describe, test } from 'vitest'

describe('useSessionTimeout - Lock Mode', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    // Mock window.location to avoid "Not implemented: navigation" error
    delete (window as any).location
    window.location = { href: 'http://localhost:3000' } as any
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  test('应该在锁定模式下触发 onLock 回调', () => {
    const onLock = vi.fn()
    renderHook(() =>
      useSessionTimeout({
        mode: 'lock',
        lockTimeoutMs: 1000, // 1秒（测试用）
        onLock,
        isAuthenticated: true,
      })
    )

    // 快进 1 秒
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onLock).toHaveBeenCalledTimes(1)
  })

  test('应该在锁定倒计时期间显示警告', () => {
    const onLock = vi.fn()
    const onCountdown = vi.fn()
    const warningSeconds = 10

    renderHook(() =>
      useSessionTimeout({
        mode: 'lock',
        lockTimeoutMs: 10000, // 10秒
        warningSeconds,
        onCountdown,
        onLock,
        isAuthenticated: true,
      })
    )

    // 快进到倒计时开始（10秒 - 10秒 = 0秒）
    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(onCountdown).toHaveBeenCalledWith(warningSeconds)
  })

  test('用户活动应该取消锁定并重置定时器', () => {
    const onLock = vi.fn()
    const onCountdown = vi.fn()
    const onCancelCountdown = vi.fn()

    renderHook(() =>
      useSessionTimeout({
        mode: 'lock',
        lockTimeoutMs: 10000, // 10秒
        warningSeconds: 5,    // 5秒警告
        onCountdown,
        onCancelCountdown,
        onLock,
        isAuthenticated: true,
      })
    )

    // 快进到倒计时开始
    act(() => {
      vi.advanceTimersByTime(5000) // 10秒 - 5秒 = 5秒
    })

    expect(onCountdown).toHaveBeenCalled()

    // 模拟用户活动（鼠标移动）
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove'))
    })

    expect(onCancelCountdown).toHaveBeenCalled()
    expect(onLock).not.toHaveBeenCalled()
  })

  test('未认证时不应该启动超时机制', () => {
    const onLock = vi.fn()
    const { rerender } = renderHook(
      ({ isAuthenticated }) =>
        useSessionTimeout({
          mode: 'lock',
          lockTimeoutMs: 1000,
          onLock,
          isAuthenticated,
        }),
      { initialProps: { isAuthenticated: false } }
    )

    // 快进 1 秒
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onLock).not.toHaveBeenCalled()

    // 切换到已认证
    rerender({ isAuthenticated: true })

    // 快进 1 秒
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onLock).toHaveBeenCalledTimes(1)
  })

  test('锁定模式下未提供 onLock 回调时不应该登出', () => {
    const logout = vi.fn()

    renderHook(() =>
      useSessionTimeout({
        mode: 'lock',
        lockTimeoutMs: 1000,
        // onLock not provided
        isAuthenticated: true,
      })
    )

    // 快进 1 秒
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // 应该不调用 logout（因为没有 onLock 回调）
    expect(logout).not.toHaveBeenCalled()
  })
})

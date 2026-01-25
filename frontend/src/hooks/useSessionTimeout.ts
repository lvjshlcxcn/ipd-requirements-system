import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

interface SessionTimeoutOptions {
  /** 超时时间（毫秒），默认 3 分钟 */
  timeoutMs?: number
  /** 是否启用调试日志 */
  debug?: boolean
  /** 倒计时剩余多少秒时显示警告（默认 30 秒） */
  warningSeconds?: number
  /** 倒计时回调 */
  onCountdown?: (remainingSeconds: number) => void
  /** 取消倒计时的回调（用户点击"继续工作"时调用） */
  onCancelCountdown?: () => void
  /** 超时模式：锁定或登出 */
  mode?: 'lock' | 'logout'
  /** 锁定回调（mode 为 'lock' 时调用） */
  onLock?: () => void
  /** 锁定超时时间（毫秒），默认 1 分钟 */
  lockTimeoutMs?: number
  /** 用户认证状态（控制是否启动超时） */
  isAuthenticated?: boolean
}

/**
 * 会话超时 Hook
 *
 * 监听用户活动，如果在指定时间内无活动则自动登出或锁定屏幕
 *
 * @example
 * ```tsx
 * // 基础使用：3 分钟无活动自动登出
 * useSessionTimeout()
 *
 * // 锁定模式：1 分钟无活动锁定屏幕
 * useSessionTimeout({
 *   mode: 'lock',
 *   lockTimeoutMs: 1 * 60 * 1000,
 *   onLock: () => console.log('屏幕已锁定')
 * })
 *
 * // 自定义超时时间和倒计时提示
 * useSessionTimeout({
 *   timeoutMs: 5 * 60 * 1000, // 5 分钟
 *   warningSeconds: 60, // 提前 60 秒警告
 *   onCountdown: (seconds) => console.log(`剩余 ${seconds} 秒`)
 * })
 * ```
 */
export function useSessionTimeout(options: SessionTimeoutOptions = {}) {
  const {
    timeoutMs = 3 * 60 * 1000, // 默认 3 分钟
    debug = false,
    warningSeconds = 30,
    onCountdown,
    onCancelCountdown,
    mode = 'logout', // 默认登出模式
    onLock,
    lockTimeoutMs = 1 * 60 * 1000, // 默认 1 分钟锁定
    isAuthenticated: isAuthenticatedProp,
  } = options

  const logout = useAuthStore((state) => state.logout)
  const isAuthenticatedFromStore = useAuthStore((state) => state.isAuthenticated)

  // 优先使用传入的 isAuthenticated，否则从 store 获取
  const isAuthenticated = isAuthenticatedProp !== undefined ? isAuthenticatedProp : isAuthenticatedFromStore

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isCountingDownRef = useRef(false) // 新增：跟踪是否正在倒计时

  const log = useCallback((...args: unknown[]) => {
    if (debug) {
      console.log('[SessionTimeout]', ...args)
    }
  }, [debug])

  /** 清除所有定时器 */
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
      warningTimeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    isCountingDownRef.current = false // 清除倒计时状态
  }, [])

  /** 执行超时操作（登出或锁定） */
  const performAction = useCallback(() => {
    if (mode === 'lock') {
      if (onLock) {
        log('执行屏幕锁定')
        clearTimers()
        onLock()
      } else {
        log('警告：锁定模式未提供 onLock 回调，跳过锁定操作')
        clearTimers()
      }
    } else {
      log('执行自动登出')
      clearTimers()
      // 登出模式：调用传入的登出函数
      // 注意：保持向后兼容
      logout()
      window.location.href = '/login'
    }
  }, [mode, onLock, logout, clearTimers, log])

  /** 重置超时定时器 */
  const resetTimeout = useCallback(() => {
    clearTimers()

    // 根据模式选择超时时间
    const actualTimeout = mode === 'lock' ? lockTimeoutMs : timeoutMs
    log('重置超时定时器', { mode, actualTimeout })

    // 设置超时定时器
    timeoutRef.current = setTimeout(() => {
      performAction()
    }, actualTimeout)

    // 如果有倒计时警告，设置警告定时器
    if (warningSeconds > 0 && onCountdown) {
      const warningTime = Math.max(0, actualTimeout - warningSeconds * 1000)
      warningTimeoutRef.current = setTimeout(() => {
        log('开始倒计时警告', { warningSeconds })
        isCountingDownRef.current = true // 标记倒计时开始

        let remaining = warningSeconds
        onCountdown(remaining)

        countdownIntervalRef.current = setInterval(() => {
          remaining--
          if (remaining <= 0) {
            clearTimers()
            // 倒计时结束，执行锁定或登出操作
            log('倒计时结束，执行超时操作', { mode })
            performAction()
          } else {
            onCountdown(remaining)
          }
        }, 1000)
      }, warningTime)
    }
  }, [mode, lockTimeoutMs, timeoutMs, warningSeconds, onCountdown, clearTimers, performAction, log])

  /** 处理用户活动事件 */
  const handleActivity = useCallback(() => {
    // 如果正在倒计时，取消倒计时并重置超时
    if (isCountingDownRef.current) {
      log('检测到用户活动，取消倒计时并重置超时')
      isCountingDownRef.current = false
      clearTimers()
      if (onCancelCountdown) {
        onCancelCountdown()
      }
      resetTimeout()
      return
    }
    log('检测到用户活动')
    resetTimeout()
  }, [resetTimeout, clearTimers, log, onCancelCountdown])

  useEffect(() => {
    // 如果用户未认证，不启动超时机制
    if (!isAuthenticated) {
      log('用户未认证，跳过会话超时设置')
      return
    }

    const actualTimeout = mode === 'lock' ? lockTimeoutMs : timeoutMs
    log('启动会话超时机制', { mode, actualTimeout, warningSeconds })

    // 监听的用户活动事件
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ]

    // 添加事件监听器
    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    // 初始化定时器
    resetTimeout()

    // 清理函数
    return () => {
      log('清理会话超时机制')
      clearTimers()
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [isAuthenticated, handleActivity, resetTimeout, clearTimers, log, mode, lockTimeoutMs, timeoutMs, warningSeconds])

  return {
    /** 手动重置超时 */
    resetTimeout,
    /** 清除超时机制 */
    clearTimers,
  }
}

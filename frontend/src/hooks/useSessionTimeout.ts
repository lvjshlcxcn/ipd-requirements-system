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
}

/**
 * 会话超时 Hook
 *
 * 监听用户活动，如果在指定时间内无活动则自动登出
 *
 * @example
 * ```tsx
 * // 基础使用：3 分钟无活动自动登出
 * useSessionTimeout()
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
  } = options

  const logout = useAuthStore((state) => state.logout)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

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

  /** 执行登出 */
  const performLogout = useCallback(() => {
    log('执行自动登出')
    clearTimers()

    // 清除认证状态
    logout()

    // 跳转到登录页
    window.location.href = '/login'
  }, [logout, clearTimers, log])

  /** 重置超时定时器 */
  const resetTimeout = useCallback(() => {
    clearTimers()
    log('重置超时定时器', { timeoutMs })

    // 设置超时定时器
    timeoutRef.current = setTimeout(() => {
      performLogout()
    }, timeoutMs)

    // 如果有倒计时警告，设置警告定时器
    if (warningSeconds > 0 && onCountdown) {
      const warningTime = Math.max(0, timeoutMs - warningSeconds * 1000)
      warningTimeoutRef.current = setTimeout(() => {
        log('开始倒计时警告', { warningSeconds })
        isCountingDownRef.current = true // 标记倒计时开始

        let remaining = warningSeconds
        onCountdown(remaining)

        countdownIntervalRef.current = setInterval(() => {
          remaining--
          if (remaining <= 0) {
            clearTimers()
          } else {
            onCountdown(remaining)
          }
        }, 1000)
      }, warningTime)
    }
  }, [timeoutMs, warningSeconds, onCountdown, clearTimers, performLogout, log])

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
    // 如果用户未登录，不启动超时机制
    if (!isAuthenticated) {
      log('用户未登录，跳过会话超时设置')
      return
    }

    log('启动会话超时机制', { timeoutMs, warningSeconds })

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
  }, [isAuthenticated, handleActivity, resetTimeout, clearTimers, log, timeoutMs, warningSeconds])

  return {
    /** 手动重置超时 */
    resetTimeout,
    /** 清除超时机制 */
    clearTimers,
  }
}

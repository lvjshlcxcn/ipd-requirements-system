import { useState, useEffect, useRef, useCallback } from 'react'

export interface CountdownTimerOptions {
  /** 需求创建时间（ISO 8601 格式） */
  createdAt: string
  /** 需求分发时间（ISO 8601 格式）- 如果提供则使用分发时间计算倒计时 */
  distributedAt?: string
  /** 预估工期（月）- 已废弃，请使用 estimatedDays */
  estimatedMonths?: number | null
  /** 预估工期（天）- 优先使用此参数 */
  estimatedDays?: number | null
  /** 需求状态 */
  status: string
}

export interface CountdownTimerResult {
  /** 格式化的倒计时文本 */
  formattedCountdown: string
  /** 是否正在倒计时 */
  isCountingDown: boolean
  /** 是否已超期 */
  isOverdue: boolean
}

/**
 * 倒计时 Hook
 *
 * 计算需求开发倒计时，基于创建时间和预估工期
 * 截止时间 = created_at + estimated_duration_months
 *
 * @example
 * ```tsx
 * const countdown = useCountdownTimer({
 *   createdAt: '2025-01-15T10:00:00Z',
 *   estimatedMonths: 1,
 *   status: 'implementing'
 * })
 *
 * console.log(countdown.formattedCountdown) // "剩余 25天 3小时"
 * console.log(countdown.isOverdue) // false
 * ```
 */
export function useCountdownTimer(
  options: CountdownTimerOptions
): CountdownTimerResult {
  const { createdAt, distributedAt, estimatedMonths, estimatedDays, status } = options

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [remainingMs, setRemainingMs] = useState<number>(0)

  /**
   * 计算截止时间（毫秒）
   *
   * 优先使用 estimatedDays（天），如果没有则使用 estimatedMonths（月）
   * 平均每月天数: 30.44 天 (365.25 / 12)
   *
   * 如果提供了分发时间（distributedAt），则使用分发时间计算
   * 否则使用创建时间（createdAt）
   */
  const calculateDeadline = useCallback(() => {
    // 优先使用分发时间，如果没有则使用创建时间
    const baseTime = distributedAt || createdAt
    const base = new Date(baseTime).getTime()

    // 优先使用天数，如果没有则使用月份
    let durationInMs = 0
    if (estimatedDays !== undefined && estimatedDays !== null) {
      // 使用天数计算
      durationInMs = estimatedDays * 24 * 60 * 60 * 1000
    } else if (estimatedMonths !== undefined && estimatedMonths !== null) {
      // 使用月数计算（向后兼容）
      durationInMs = estimatedMonths * 30.44 * 24 * 60 * 60 * 1000
    }

    return base + durationInMs
  }, [createdAt, distributedAt, estimatedMonths, estimatedDays])

  /**
   * 计算剩余时间（毫秒）
   */
  const calculateRemaining = useCallback(() => {
    const now = Date.now()
    const deadline = calculateDeadline()
    return deadline - now
  }, [calculateDeadline])

  /**
   * 格式化倒计时显示
   */
  const formatCountdown = useCallback(
    (remaining: number): string => {
      const isOverdue = remaining <= 0
      const absRemaining = Math.abs(remaining)

      // 计算天、小时、分钟、秒
      const days = Math.floor(absRemaining / (24 * 60 * 60 * 1000))
      const hours = Math.floor(
        (absRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
      )
      const minutes = Math.floor(
        (absRemaining % (60 * 60 * 1000)) / (60 * 1000)
      )

      if (isOverdue) {
        // 已超期
        if (days > 0) {
          return `已延期 ${days}天`
        } else if (hours > 0) {
          return `已延期 ${hours}小时`
        } else {
          return `已延期 ${minutes}分钟`
        }
      } else {
        // 正常倒计时
        if (days > 0) {
          if (hours > 0) {
            return `剩余 ${days}天 ${hours}小时`
          } else {
            return `剩余 ${days}天`
          }
        } else if (hours > 0) {
          if (minutes > 0) {
            return `剩余 ${hours}小时 ${minutes}分钟`
          } else {
            return `剩余 ${hours}小时`
          }
        } else {
          return `剩余 ${minutes}分钟`
        }
      }
    },
    []
  )

  /**
   * 获取格式化的倒计时文本
   */
  const getFormattedCountdown = useCallback((): string => {
    // 只在 implementing 或 distributed 状态且有效工期内显示倒计时
    const isActiveStatus = status === 'implementing' || status === 'distributed'
    const hasValidDuration =
      (estimatedDays !== undefined && estimatedDays !== null && estimatedDays > 0) ||
      (estimatedMonths !== undefined && estimatedMonths !== null && estimatedMonths > 0)

    if (!isActiveStatus || !hasValidDuration) {
      return '-'
    }

    const remaining = calculateRemaining()
    return formatCountdown(remaining)
  }, [status, estimatedDays, estimatedMonths, calculateRemaining, formatCountdown])

  /**
   * 启动倒计时定时器
   */
  useEffect(() => {
    // 只在 implementing 或 distributed 状态且有效工期内启动倒计时
    const isActiveStatus = status === 'implementing' || status === 'distributed'
    const hasValidDuration =
      (estimatedDays !== undefined && estimatedDays !== null && estimatedDays > 0) ||
      (estimatedMonths !== undefined && estimatedMonths !== null && estimatedMonths > 0)

    if (!isActiveStatus || !hasValidDuration) {
      return
    }

    // 初始化剩余时间
    setRemainingMs(calculateRemaining())

    // 判断是否超期
    const isOverdue = calculateRemaining() <= 0

    // 超期后降低更新频率（每分钟更新一次，避免不必要的计算）
    // 未超期时每秒更新
    const updateInterval = isOverdue ? 60 * 1000 : 1000

    intervalRef.current = setInterval(() => {
      setRemainingMs(calculateRemaining())
    }, updateInterval)

    // 清理函数
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status, estimatedDays, estimatedMonths, calculateRemaining])

  const isOverdue = remainingMs <= 0
  const isActiveStatus = status === 'implementing' || status === 'distributed'
  const hasValidDuration =
    (estimatedDays !== undefined && estimatedDays !== null && estimatedDays > 0) ||
    (estimatedMonths !== undefined && estimatedMonths !== null && estimatedMonths > 0)
  const isCountingDown = isActiveStatus && hasValidDuration

  return {
    formattedCountdown: getFormattedCountdown(),
    isCountingDown,
    isOverdue,
  }
}

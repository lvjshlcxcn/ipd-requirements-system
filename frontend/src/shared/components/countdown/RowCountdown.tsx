import React from 'react'
import { useCountdownTimer } from '@/shared/hooks/useCountdownTimer'
import { CountdownDisplay } from '@/shared/components/countdown/CountdownDisplay'

interface RowCountdownProps {
  /** 原始 ISO 格式创建时间 */
  createdAt: string
  /** 原始 ISO 格式分发时间（可选）- 如果提供则使用分发时间计算倒计时 */
  distributedAt?: string
  /** 预估工期（月）- 已废弃，请使用 estimatedDays */
  estimatedMonths?: number | null
  /** 预估工期（天）- 优先使用此参数 */
  estimatedDays?: number | null
  /** 需求状态 */
  status: string
}

/**
 * 表格行倒计时组件
 *
 * 专门用于在表格列中显示倒计时，正确处理 Hook 的使用
 *
 * @example
 * ```tsx
 * // 使用创建时间计算
 * <RowCountdown
 *   createdAt={record.createdAtRaw}
 *   estimatedMonths={record.estimatedDurationMonths}
 *   status={record.status}
 * />
 *
 * // 使用分发时间计算
 * <RowCountdown
 *   createdAt={record.createdAtRaw}
 *   distributedAt={record.updatedAtRaw}
 *   estimatedMonths={record.estimatedDurationMonths}
 *   status={record.status}
 * />
 * ```
 */
export const RowCountdown: React.FC<RowCountdownProps> = React.memo(
  ({ createdAt, distributedAt, estimatedMonths, estimatedDays, status }) => {
    const countdown = useCountdownTimer({
      createdAt,
      distributedAt,
      estimatedMonths,
      estimatedDays,
      status,
    })

    return <CountdownDisplay {...countdown} />
  }
)

RowCountdown.displayName = 'RowCountdown'

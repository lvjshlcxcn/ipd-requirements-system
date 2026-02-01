import React from 'react'
import { Tag } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'

export interface CountdownDisplayProps {
  /** 格式化的倒计时文本 */
  formattedCountdown: string
  /** 是否正在倒计时 */
  isCountingDown: boolean
  /** 是否已超期 */
  isOverdue: boolean
}

/**
 * 倒计时显示组件
 *
 * 根据倒计时状态显示不同颜色和样式
 * - 绿色: 正常倒计时
 * - 橙色: 临期警告（剩余 < 3天）
 * - 红色: 已延期（使用 Tag 组件）
 * - 灰色: 非倒计时状态
 *
 * @example
 * ```tsx
 * <CountdownDisplay
 *   formattedCountdown="剩余 25天 3小时"
 *   isCountingDown={true}
 *   isOverdue={false}
 * />
 * ```
 */
export const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
  formattedCountdown,
  isCountingDown,
  isOverdue,
}) => {
  // 非倒计时状态显示灰色 "-"
  if (!isCountingDown || formattedCountdown === '-') {
    return <span style={{ color: '#999' }}>-</span>
  }

  // 解析剩余天数，判断是否临期（< 3天）
  const parseDays = (text: string): number => {
    const match = text.match(/剩余\s*(\d+)\s*天/)
    return match ? parseInt(match[1], 10) : 0
  }

  const days = parseDays(formattedCountdown)
  const isUrgent = days > 0 && days < 3

  // 已超期：使用红色 Tag
  if (isOverdue) {
    return (
      <Tag
        color="error"
        icon={<ClockCircleOutlined />}
        style={{
          fontWeight: 'bold',
          margin: 0,
        }}
      >
        {formattedCountdown}
      </Tag>
    )
  }

  // 正常倒计时：根据临期状态显示不同颜色
  const color = isUrgent ? '#faad14' : '#52c41a'

  return (
    <span style={{ color, display: 'flex', alignItems: 'center', gap: 4 }}>
      <ClockCircleOutlined />
      {formattedCountdown}
    </span>
  )
}

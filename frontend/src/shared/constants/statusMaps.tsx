import { Tag } from 'antd'

export const SOURCE_CHANNEL_MAP: Record<string, string> = {
  customer: '客户',
  market: '市场',
  sales: '销售',
  rd: '技术',
  after_sales: '售后',
} as const

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  collected: { label: '已收集', color: 'blue' },
  analyzing: { label: '分析中', color: 'processing' },
  analyzed: { label: '已分析', color: 'cyan' },
  distributed: { label: '已分发', color: 'lime' },
  implementing: { label: '开发中', color: 'gold' },
  completed: { label: '已完成', color: 'green' },
  rejected: { label: '已拒绝', color: 'red' },
} as const

export const MOSCOW_MAP: Record<string, { label: string; color: string }> = {
  must_have: { label: 'Must', color: 'red' },
  should_have: { label: 'Should', color: 'orange' },
  could_have: { label: 'Could', color: 'blue' },
  wont_have: { label: "Won't", color: 'default' },
} as const

export const PRIORITY_MAP: Record<number, { label: string; color: string }> = {
  90: { label: '高', color: 'red' },
  60: { label: '中', color: 'orange' },
  30: { label: '低', color: 'green' },
} as const

export const renderSourceChannel = (source: string) => {
  return SOURCE_CHANNEL_MAP[source] || source
}

export const renderStatus = (status: string) => {
  const config = STATUS_MAP[status]
  if (!config) return status
  return <Tag color={config.color}>{config.label}</Tag>
}

export const renderMoSCoW = (moscow: string | undefined) => {
  if (!moscow) return <span style={{ color: '#999' }}>-</span>
  const config = MOSCOW_MAP[moscow]
  if (!config) return moscow
  return <Tag color={config.color}>{config.label}</Tag>
}

export const renderPriority = (priority: number) => {
  const config = PRIORITY_MAP[priority]
  if (!config) return <span>{priority}</span>
  return <Tag color={config.color}>{config.label}</Tag>
}

/**
 * 需求状态常量
 */

/**
 * 状态映射表
 * 定义了所有需求状态及其显示文本和颜色
 */
export const STATUS_MAP: Record<string, { text: string; color: string }> = {
  collected: { text: '已收集', color: 'blue' },
  analyzing: { text: '分析中', color: 'processing' },
  analyzed: { text: '已分析', color: 'default' },
  distributing: { text: '分发中', color: 'orange' },
  distributed: { text: '已分发', color: 'lime' },
  implementing: { text: '实现中', color: 'purple' },
  verifying: { text: '验证中', color: 'gold' },
  completed: { text: '已完成', color: 'green' },
  rejected: { text: '已拒绝', color: 'red' },
} as const

/**
 * 历史记录操作类型映射表
 */
export const HISTORY_ACTION_MAP: Record<string, string> = {
  status_changed: '状态变更',
  note_added: '添加备注',
  created: '创建需求',
  updated: '更新需求',
} as const

/**
 * 需求来源映射表
 */
export const SOURCE_MAP: Record<string, string> = {
  customer: '客户',
  market: '市场',
  competition: '竞争',
  sales: '销售',
  after_sales: '售后',
  rd: '研发',
} as const

/**
 * KANO分类映射表
 */
export const KANO_MAP: Record<string, string> = {
  basic: '基本型',
  performance: '期望型',
  excitement: '兴奋型',
} as const

/**
 * 复杂度映射表
 */
export const COMPLEXITY_MAP: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  very_high: '非常高',
} as const

/**
 * 分发目标类型映射表
 */
export const TARGET_MAP: Record<string, string> = {
  sp: '战略规划(SP)',
  bp: '业务计划(BP)',
  charter: '项目任务书',
  pcr: '变更请求(PCR)',
} as const

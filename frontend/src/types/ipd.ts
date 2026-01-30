/**
 * IPD 需求十问相关类型定义
 */

/**
 * IPD 需求十问表单数据
 */
export interface IPDTenQuestions {
  q1_who: string // 谁关心这个需求
  q2_why: string // 为什么关心
  q3_what_problem: string // 什么问题
  q4_current_solution?: string // 当前怎么解决的
  q5_current_issues?: string // 有什么问题
  q6_ideal_solution: string // 理想方案是什么
  q7_priority: 'high' | 'medium' | 'low' // 优先级
  q8_frequency: 'daily' | 'weekly' | 'monthly' | 'occasional' // 频次
  q9_impact_scope?: string // 影响范围
  q10_value?: string // 价值衡量
}

/**
 * 生成的用户故事
 */
export interface GeneratedUserStory {
  title: string // 故事标题
  role: string // 用户角色
  action: string // 期望行动
  benefit: string // 预期价值
  priority: 'high' | 'medium' | 'low' // 优先级
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional' // 频次
  acceptanceCriteria: string[] // 验收标准
  metadata?: {
    createdAt: string
    sourceId?: number
  }
}

/**
 * INVEST 评分数据
 */
export interface INVESTScoreData {
  independent: number // 0-100
  negotiable: number // 0-100
  valuable: number // 0-100
  estimable: number // 0-100
  small: number // 0-100
  testable: number // 0-100
  notes?: string
}

/**
 * INVEST 分析结果
 */
export interface INVESTAnalysis {
  scores: INVESTScoreData
  totalScore: number
  averageScore: number
  suggestions: INVESTSuggestion[]
  analyzedAt: string
}

/**
 * INVEST 改进建议
 */
export interface INVESTSuggestion {
  dimension: string // INVEST 维度名称
  priority: 'high' | 'medium' | 'low' // 优先级
  content: string // 建议内容
  example?: string // 示例
}

/**
 * IPD → Story → INVEST 完整流程响应
 */
export interface IPDStoryFlowResponse {
  ipdData: IPDTenQuestions
  userStory: GeneratedUserStory
  investAnalysis?: INVESTAnalysis
  workflowId: string
  createdAt: string
}

/**
 * 频次映射
 */
export const FREQUENCY_MAP: Record<string, string> = {
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
  occasional: '偶尔',
}

/**
 * 优先级映射
 */
export const PRIORITY_MAP: Record<string, { text: string; color: string }> = {
  high: { text: '高', color: '#ff4d4f' },
  medium: { text: '中', color: '#faad14' },
  low: { text: '低', color: '#52c41a' },
}

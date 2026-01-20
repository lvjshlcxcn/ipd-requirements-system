export type SourceChannel = 'customer' | 'market' | 'sales' | 'rd' | 'after_sales'
export type PriorityScore = 90 | 60 | 30
export type RequirementStatus = 'collected' | 'analyzing' | 'analyzed' | 'distributed' | 'implementing' | 'completed' | 'rejected'
export type MoSCoWPriority = 'must_have' | 'should_have' | 'could_have' | 'wont_have'
export type TargetType = 'sp' | 'bp' | 'charter' | 'pcr'

export interface CustomerNeed10Q {
  q1_who_cares?: string
  q2_why_care?: string
  q3_how_often?: string
  q4_current_solution?: string
  q5_pain_points?: string
  q6_expected_outcome?: string
  q7_value_impact?: string
  q8_urgency_level?: string
  q9_budget_willingness?: string
  q10_alternative_solutions?: string
  additional_notes?: string
}

export interface Requirement {
  id: number
  requirement_no: string
  title: string
  description?: string
  source_channel: SourceChannel
  priority_score?: PriorityScore
  status: RequirementStatus
  moscow_priority?: MoSCoWPriority
  moscow_comment?: string
  target_type?: TargetType
  target_id?: number
  customer_need_10q?: CustomerNeed10Q
  created_at: string
  updated_at: string
}

export interface RequirementStats {
  total: number
  by_status: Record<string, number>
  by_channel: Record<string, number>
}

export interface RTMStats {
  total: number
  complete: number
  partial: number
  missing: number
  completion_rate: number
  coverage: {
    design: number
    code: number
    test: number
  }
}

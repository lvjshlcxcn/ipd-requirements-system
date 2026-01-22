/** 洞察分析结果 */
export interface InsightAnalysisResult {
  q1_who: string;
  q2_why: string;
  q3_what_problem: string;
  q4_current_solution: string;
  q5_current_issues: string;
  q6_ideal_solution: string;
  q7_priority: 'high' | 'medium' | 'low';
  q8_frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  q9_impact_scope: string;
  q10_value: string;

  user_persona: UserPersona;
  scenario: Scenario;
  emotional_tags: EmotionalTags;
  summary: string;
}

/** 用户画像 */
export interface UserPersona {
  role: string;
  department: string;
  demographics: string;
  pain_points: string[];
  goals: string[];
}

/** 场景 */
export interface Scenario {
  context: string;
  environment: string;
  trigger: string;
  frequency: string;
}

/** 情感标签 */
export interface EmotionalTags {
  urgency: 'high' | 'medium' | 'low';
  importance: 'high' | 'medium' | 'low';
  sentiment: 'frustrated' | 'neutral' | 'satisfied';
  emotional_keywords: string[];
}

/** 洞察记录 */
export interface Insight {
  id: number;
  insight_number: string;
  input_text: string;
  text_length: number;
  analysis_result: InsightAnalysisResult;
  status: 'draft' | 'confirmed' | 'linked';
  created_at: string;
}

/** 故事板卡片数据 */
export interface StoryboardCardData {
  title: string;
  user: {
    role: string;
    avatar: string;
    department: string;
    description: string;
  };
  scenario: {
    context: string;
    environment: string;
    icon: string;
    frequency: string;
  };
  pain_points: {
    current: string;
    problem: string;
    issues: string;
    flowchart: Array<{
      title: string;
      content: string;
      icon: string;
    }>;
  };
  solution: {
    ideal: string;
    value: string;
    icon: string;
  };
  tags: Array<{
    label: string;
    color: string;
    icon: string;
  }>;
  footer: {
    impact_scope: string;
    priority: string;
    created_at: string;
  };
}

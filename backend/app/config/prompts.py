"""
IPD需求洞察Prompt模板
所有Prompt集中管理,便于优化和版本控制
"""

# IPD需求十问Prompt模板
IPD_TEN_QUESTIONS_PROMPT = """
你是一个专业的产品需求分析师。请从以下客户访谈录音转写文本中,
提取IPD需求十问的信息,并返回JSON格式。

## IPD需求十问说明:
1. 谁关心这个需求?(用户角色、部门、职位)
2. 为什么关心?(动机、背景、KPI压力)
3. 什么问题?(具体痛点、困扰)
4. 当前怎么解决的?(现有方案、工作流程)
5. 有什么问题?(现有方案的不足)
6. 理想方案是什么?(期望的解决方案)
7. 优先级?(紧急程度、重要性)
8. 频次?(问题出现的频率)
9. 影响范围?(涉及多少人、多少业务)
10. 价值衡量?(可量化的收益)

## 客户访谈文本:
{text}

## 请返回JSON格式(严格遵守):
{{
  "q1_who": "用户角色描述",
  "q2_why": "关心原因",
  "q3_what_problem": "具体问题",
  "q4_current_solution": "当前解决方案",
  "q5_current_issues": "当前方案的问题",
  "q6_ideal_solution": "理想方案",
  "q7_priority": "high/medium/low",
  "q8_frequency": "daily/weekly/monthly/occasional",
  "q9_impact_scope": "影响范围描述",
  "q10_value": "可量化的价值",

  "user_persona": {{
    "role": "用户角色",
    "department": "部门",
    "demographics": "人口统计特征",
    "pain_points": ["痛点1", "痛点2", "痛点3"],
    "goals": ["目标1", "目标2"]
  }},

  "scenario": {{
    "context": "场景背景",
    "environment": "环境描述",
    "trigger": "触发条件",
    "frequency": "发生频率"
  }},

  "emotional_tags": {{
    "urgency": "high/medium/low",
    "importance": "high/medium/low",
    "sentiment": "frustrated/neutral/satisfied",
    "emotional_keywords": ["关键词1", "关键词2"]
  }},

  "summary": "一句话总结这个需求洞察"
}}
"""

# 快速分析Prompt(仅提取核心信息)
QUICK_INSIGHT_PROMPT = """
请快速从以下文本中提取核心需求信息(仅前3个问题):

{text}

返回JSON:
{{
  "q1_who": "用户角色",
  "q3_what_problem": "核心问题",
  "q6_ideal_solution": "期望方案",
  "summary": "一句话总结"
}}
"""

def get_prompt_template(template_name: str) -> str:
    """获取Prompt模板"""
    templates = {
        "ipd_ten_questions": IPD_TEN_QUESTIONS_PROMPT,
        "quick_insight": QUICK_INSIGHT_PROMPT,
    }
    return templates.get(template_name, IPD_TEN_QUESTIONS_PROMPT)

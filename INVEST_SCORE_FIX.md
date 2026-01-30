# INVEST 评分显示不一致问题修复报告

## 问题描述

用户反馈卡片显示的 INVEST 总分和实际评分不一致。

## 根本原因分析

### 1. 后端计算错误
**文件**: `backend/app/services/ipd_story_service.py`

**原代码**:
```python
# 计算总分和平均分
total_score = (
    scores.independent +
    scores.negotiable +
    scores.valuable +
    scores.estimable +
    scores.small +
    scores.testable
) // 6  # ❌ 错误：直接除以6

average_score = total_score  # ❌ 错误：等于平均分
```

**问题**:
- `total_score` 计算时直接除以 6，实际存储的是平均值（0-100）而不是总分（0-600）
- `total_score` 和 `average_score` 存储相同的值

### 2. Schema 验证错误
**文件**: `backend/app/schemas/ipd_story.py`

**原代码**:
```python
class INVESTAnalysisBase(BaseModel):
    scores: INVESTScoreData
    total_score: int = Field(..., ge=0, le=100, description="总分")  # ❌ 错误：上限应该是 600
    average_score: float = Field(..., ge=0, le=100, description="平均分")
```

**问题**:
- `total_score` 的最大值限制为 100，但应该是 600（6个维度之和）

### 3. 前端保存错误
**文件**: `frontend/public/ipd-enhancement.js`

**原代码**:
```javascript
const payload = {
    invest_analysis: {
        scores: investScores,
        total_score: calculateTotalScore(),      // ❌ 实际返回的是平均分
        average_score: calculateTotalScore()     // ❌ 实际返回的是平均分
    }
};
```

**问题**:
- `calculateTotalScore()` 函数计算的是平均分，不是总分
- `total_score` 和 `average_score` 使用相同的值

### 4. 前端显示错误
**文件**: `frontend/public/ipd-enhancement.js`

**原代码**:
```javascript
const totalScore = w.invest_analysis ? w.invest_analysis.total_score || 0 : 0;
const scoreColor = totalScore >= 80 ? '#52c41a' : totalScore >= 60 ? '#faad14' : '#ff4d4f';
// ...
<strong>INVEST总分:</strong> <span ...>' + totalScore + '</span>
```

**问题**:
- 显示的是 `total_score`（实际存的是平均值）
- 标签是"INVEST总分"，但值实际上是平均分
- 颜色判断逻辑基于 0-100 的分数，而不是 0-600

## 修复方案

### 1. 修复后端计算逻辑
**文件**: `backend/app/services/ipd_story_service.py`

**修复后**:
```python
# 计算总分（6个维度之和，范围 0-600）
total_score = (
    scores.independent +
    scores.negotiable +
    scores.valuable +
    scores.estimable +
    scores.small +
    scores.testable
)  # 不再除以6

# 计算平均分（范围 0-100）
average_score = round(total_score / 6, 2)
```

### 2. 修复 Schema 验证
**文件**: `backend/app/schemas/ipd_story.py`

**修复后**:
```python
class INVESTAnalysisBase(BaseModel):
    scores: INVESTScoreData
    total_score: int = Field(..., ge=0, le=600, description="总分（6个维度之和，范围 0-600）")
    average_score: float = Field(..., ge=0, le=100, description="平均分（范围 0-100）")
```

### 3. 添加前端总分计算函数
**文件**: `frontend/public/ipd-enhancement.js`

**新增函数**:
```javascript
// 计算 INVEST 总分（6个维度之和，范围 0-600）
function calculateInvestTotalScore() {
    const scores = Object.values(investScores);
    return scores.reduce((a, b) => a + b, 0);
}
```

### 4. 修复前端保存逻辑
**文件**: `frontend/public/ipd-enhancement.js`

**修复后**:
```javascript
const payload = {
    invest_analysis: {
        scores: investScores,
        total_score: calculateInvestTotalScore(),  // 总分（0-600）
        average_score: calculateTotalScore()      // 平均分（0-100）
    }
};
```

### 5. 修复前端显示逻辑
**文件**: `frontend/public/ipd-enhancement.js`

**修复后**:
```javascript
// 显示平均分（0-100），更直观
const averageScore = w.invest_analysis ? w.invest_analysis.average_score || 0 : 0;
const scoreColor = averageScore >= 80 ? '#52c41a' : averageScore >= 60 ? '#faad14' : '#ff4d4f';
// ...
<strong>INVEST评分:</strong> <span ...>' + averageScore + '</span>
```

**说明**:
- 改为显示 `average_score`（平均分），范围 0-100，更直观
- 标签改为"INVEST评分"而不是"INVEST总分"
- 颜色判断基于 0-100 的平均分

## 测试验证

### 集成测试结果
**测试**: `tests/integration/test_ipd_story_integration.py`

**测试数据**:
- 各维度评分: independent=85, negotiable=75, valuable=90, estimable=80, small=70, testable=88

**预期结果**:
- total_score = 85 + 75 + 90 + 80 + 70 + 88 = 488
- average_score = 488 / 6 ≈ 81.33

**实际结果**:
```json
{
  "invest_analysis": {
    "scores": {
      "independent": 85,
      "negotiable": 75,
      "valuable": 90,
      "estimable": 80,
      "small": 70,
      "testable": 88
    },
    "total_score": 488,
    "average_score": 81.33
  }
}
```

**测试结果**: ✅ 2/2 通过

### 手动验证步骤
1. 访问 `http://localhost:5173/ipd-story-flow.html`
2. 填写 IPD 需求十问表单
3. 调整 INVEST 评分滑块（例如：6个维度都设为 80）
4. 点击"💾 保存到数据库"
5. 点击"📋 查看历史记录"

**预期显示**:
- 卡片显示"INVEST评分: 80"（平均分）
- 如果各维度都是 80，则：
  - total_score = 480
  - average_score = 80.0

## 修改文件清单

### 后端文件
1. `backend/app/services/ipd_story_service.py` - 修复 `analyze_invest` 计算逻辑
2. `backend/app/schemas/ipd_story.py` - 修复 `INVESTAnalysisBase` 的 `total_score` 验证约束

### 前端文件
1. `frontend/public/ipd-enhancement.js` - 添加 `calculateInvestTotalScore` 函数，修复保存和显示逻辑
2. `frontend/public/test-workflow-load.html` - 更新测试页面的显示逻辑

## 注意事项

### 旧数据处理
数据库中旧的数据仍然使用错误的计算方式（`total_score` 等于 `average_score`）。

**建议**:
1. 用户重新保存工作流以生成正确的数据
2. 或者编写数据迁移脚本更新旧数据

### 数据迁移 SQL 示例
```sql
-- 更新旧数据的 total_score
UPDATE invest_analyses
SET
  total_score = (
    (scores->>'independent')::int +
    (scores->>'negotiable')::int +
    (scores->>'valuable')::int +
    (scores->>'estimable')::int +
    (scores->>'small')::int +
    (scores->>'testable')::int
  ),
  average_score = (
    (
      (scores->>'independent')::int +
      (scores->>'negotiable')::int +
      (scores->>'valuable')::int +
      (scores->>'estimable')::int +
      (scores->>'small')::int +
      (scores->>'testable')::int
    )::float / 6
  )
WHERE total_score <= 100;  -- 只更新错误的数据
```

## 总结

**问题**: 卡片显示的 INVEST 总分和实际评分不一致
**原因**: 后端计算错误、Schema 验证错误、前端保存和显示逻辑错误
**修复**:
1. 后端正确计算总分（0-600）和平均分（0-100）
2. Schema 验证约束修改为正确范围
3. 前端分别计算和保存总分、平均分
4. 前端显示平均分（更直观）
**验证**: 集成测试全部通过

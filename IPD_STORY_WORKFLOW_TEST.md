# IPD Story Flow 工作流加载功能测试报告

## 问题描述

用户反馈点击故事卡片时加载失败。

## 问题分析

### 根本原因
前端代码在历史记录列表中使用了错误的字段名 `w.id`，但后端 API 返回的字段名是 `workflow_id`。

### 代码位置
- **文件**: `frontend/public/ipd-enhancement.js`
- **行号**: 第 223 行
- **问题代码**:
  ```javascript
  return '<div onclick="window.ipdEnhancement.loadWorkflow(\'' + w.id + '\')" ...>'
  ```
- **正确代码**:
  ```javascript
  return '<div onclick="window.ipdEnhancement.loadWorkflow(\'' + w.workflow_id + '\')" ...>'
  ```

## 修复方案

### 1. 前端修复
修改 `ipd-enhancement.js` 中的点击事件，使用正确的字段名 `workflow_id`。

**修改内容**:
```diff
- return '<div onclick="window.ipdEnhancement.loadWorkflow(\'' + w.id + '\')" ...>'
+ return '<div onclick="window.ipdEnhancement.loadWorkflow(\'' + w.workflow_id + '\')" ...>'
```

### 2. 后端验证
后端已正确实现：
- `create_workflow` 返回的 `workflow_id` 使用 `user_story.id`
- `list_workflows` 返回的每个工作流包含 `workflow_id` 字段
- `get_workflow` 接收 `workflow_id` 参数（实际上是 `user_story.id`）

## 测试验证

### 后端单元测试
创建了 `tests/unit/test_services/test_ipd_story_workflow.py`，包含 3 个测试用例：

#### 1. `test_list_workflows_contains_workflow_id`
**测试内容**: 验证 `list_workflows` 返回的数据包含 `workflow_id` 字段

**测试结果**: ✅ PASSED
```
✓ workflow_id: 1
✓ 序列化后的键: ['workflow_id', 'ipd_data', 'user_story', 'invest_analysis', 'created_at']
```

#### 2. `test_get_workflow_by_workflow_id`
**测试内容**: 验证使用 `workflow_id`（`user_story.id`）可以正确获取工作流详情

**测试结果**: ✅ PASSED
```
✓ 使用 workflow_id 1 成功查询到工作流
✓ 用户故事: 作为用户，我希望查询测试方案
```

#### 3. `test_workflow_serialization_consistency`
**测试内容**: 验证 `list_workflows` 和 `get_workflow` 的序列化结果一致

**测试结果**: ✅ PASSED
```
✓ 列表 workflow_id: 1
✓ 详情 workflow_id: 1
✓ 字段一致
```

### 集成测试
原有集成测试 `tests/integration/test_ipd_story_integration.py` 仍然全部通过：
- ✅ `test_complete_ipd_workflow` - 完整工作流保存和查询
- ✅ `test_save_without_invest` - 不带 INVEST 的保存

**测试结果**: 2 passed

### 前端测试页面
创建了 `frontend/public/test-workflow-load.html` 用于手动测试：

**功能**:
1. 测试列表查询 API
2. 测试获取详情 API
3. 显示工作流列表卡片
4. 点击卡片加载详情

**访问方式**:
```
http://localhost:5173/test-workflow-load.html
```

## 数据结构说明

### API 返回的 Workflow 对象结构
```json
{
  "workflow_id": "1",           // 字符串形式的 user_story.id
  "ipd_data": {
    "id": 1,
    "q1_who": "...",
    "q2_why": "...",
    // ... 其他 IPD 十问字段
    "created_at": "2026-01-29T..."
  },
  "user_story": {
    "id": 1,
    "title": "...",
    "role": "...",
    "action": "...",
    "benefit": "...",
    "acceptance_criteria": [],
    "created_at": "2026-01-29T..."
  },
  "invest_analysis": {
    "id": 1,
    "scores": {
      "independent": 80,
      // ... 其他 INVEST 维度
    },
    "total_score": 80,
    "average_score": 80.0,
    "analyzed_at": "2026-01-29T..."
  },
  "created_at": "2026-01-29T..."
}
```

## 测试清单

### 自动测试
- [x] 后端单元测试 - 3/3 通过
- [x] 后端集成测试 - 2/2 通过

### 手动测试步骤
1. 访问 `http://localhost:5173/ipd-story-flow.html`
2. 填写 IPD 需求十问表单
3. 点击"💾 保存到数据库"
4. 点击"📋 查看历史记录"
5. 点击任意故事卡片
6. 验证数据正确加载到表单中

### 预期结果
- ✅ 历史记录列表正常显示
- ✅ 点击卡片后数据正确加载
- ✅ IPD 十问表单填充正确
- ✅ 用户故事显示正确
- ✅ INVEST 评分滑块更新正确

## 修改文件清单

### 后端文件
- `backend/app/services/ipd_story_service.py` - 修复 `create_workflow` 使用 `user_story.id` 作为 `workflow_id`

### 前端文件
- `frontend/public/ipd-enhancement.js` - 修复点击事件使用 `workflow_id` 而非 `id`

### 测试文件
- `backend/tests/unit/test_services/test_ipd_story_workflow.py` - 新增工作流单元测试
- `backend/tests/integration/test_ipd_story_integration.py` - 现有集成测试
- `frontend/public/test-workflow-load.html` - 新增前端测试页面

## 总结

**问题**: 点击故事卡片加载失败
**原因**: 前端使用了错误的字段名 `w.id` 而非 `w.workflow_id`
**修复**: 修改前端代码使用正确的字段名
**验证**: 单元测试、集成测试全部通过

## 后续建议

1. **TypeScript 类型定义**: 考虑为 `ipd-enhancement.js` 创建 TypeScript 类型定义
2. **错误处理增强**: 添加更详细的错误日志和用户友好的错误提示
3. **加载状态**: 添加加载动画以提升用户体验
4. **缓存优化**: 考虑缓存已加载的工作流数据

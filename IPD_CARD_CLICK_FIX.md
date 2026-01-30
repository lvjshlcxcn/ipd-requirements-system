# IPD 历史卡片点击加载修复报告

## 问题描述

用户反馈：点击历史记录卡片后，无法定位到点击卡片的信息，一直显示的是第一个卡片的数据。

## 问题根因分析

### 1. 全局变量作用域问题
**文件**: `frontend/public/ipd-story-flow.html`

**原代码**:
```javascript
// Global state
let ipdData = {};
let userStory = {};
let investScores = { ... };
```

**问题**:
- 使用 `let` 声明的变量是局部作用域的
- `ipd-enhancement.js` 无法通过 `window` 对象访问这些变量
- 导致数据无法在不同脚本之间共享

### 2. 缺少 IPD 表单填充逻辑
**文件**: `frontend/public/ipd-enhancement.js`

**原代码**:
```javascript
if (workflow.ipd_data) {
    window.ipdData = workflow.ipd_data;
    // 没有填充表单字段！
}
```

**问题**:
- 只设置了 `window.ipdData` 对象
- 但没有将数据填充到 IPD 表单的输入框中
- 导致表单显示为空或默认值

### 3. 页面跳转逻辑问题
**原代码**:
```javascript
// 跳转到步骤2
if (typeof switchSection === 'function') {
    switchSection(2);
}
```

**问题**:
- 跳转到步骤 2（用户故事），而不是步骤 1（IPD 表单）
- 用户无法看到 IPD 数据是否正确填充
- 导致用户以为加载的是错误的数据

## 修复方案

### 1. 修复全局变量作用域
**文件**: `frontend/public/ipd-story-flow.html`

**修复后**:
```javascript
// Global state - 挂载到 window 对象上以便 ipd-enhancement.js 访问
window.ipdData = {};
window.userStory = {};
window.investScores = {
    independent: 70,
    negotiable: 70,
    valuable: 70,
    estimable: 70,
    small: 70,
    testable: 70
};
```

**说明**:
- 将所有全局变量挂载到 `window` 对象上
- 确保不同脚本之间可以共享和修改数据
- 保持原有功能的正常运行

### 2. 添加 IPD 表单填充逻辑
**文件**: `frontend/public/ipd-enhancement.js`

**新增代码**:
```javascript
if (workflow.ipd_data) {
    window.ipdData = workflow.ipd_data;

    // 填充 IPD 表单字段
    const ipdFields = [
        'q1_who', 'q2_why', 'q3_what_problem', 'q4_current_solution',
        'q5_current_issues', 'q6_ideal_solution', 'q9_expected_value', 'q10_success_metrics'
    ];

    ipdFields.forEach(function(fieldId) {
        const input = document.getElementById(fieldId);
        if (input && workflow.ipd_data[fieldId]) {
            input.value = workflow.ipd_data[fieldId];
        }
    });

    // 处理优先级下拉框
    if (workflow.ipd_data.q7_priority) {
        const prioritySelect = document.getElementById('q7_priority');
        if (prioritySelect) {
            prioritySelect.value = workflow.ipd_data.q7_priority;
        }
    }

    // 处理频次下拉框
    if (workflow.ipd_data.q8_frequency) {
        const freqSelect = document.getElementById('q8_frequency');
        if (freqSelect) {
            freqSelect.value = workflow.ipd_data.q8_frequency;
        }
    }
}
```

**功能**:
- 遍历所有 IPD 表单字段并填充数据
- 处理下拉框（优先级、频次）
- 跳过空值字段，保持默认值

### 3. 修复页面跳转逻辑
**文件**: `frontend/public/ipd-enhancement.js`

**修复后**:
```javascript
// 跳转到步骤 1（IPD 表单），让用户可以看到填充的数据
if (typeof switchSection === 'function') {
    switchSection(1);
}

console.log('✅ 数据已加载，workflow_id:', workflowId);
```

**改进**:
- 跳转到步骤 1（IPD 表单）而不是步骤 2
- 用户可以立即看到 IPD 数据是否正确填充
- 移除 `alert` 改为控制台日志，减少干扰
- 添加 workflow_id 日志方便调试

### 4. 添加调试日志
**新增代码**:
```javascript
console.log('加载的工作流数据:', workflow);
```

**用途**:
- 在浏览器控制台中查看加载的数据
- 方便调试和验证数据正确性
- 帮助排查问题

## 修复后的完整流程

### 点击历史卡片后的执行流程

1. **用户点击卡片**
   - 触发 `loadWorkflow(workflowId)` 函数
   - 传递正确的 `workflow_id`

2. **获取工作流数据**
   - 调用 API: `GET /api/v1/ipd-story/workflow/{workflow_id}`
   - 返回完整的工作流数据（IPD + 用户故事 + INVEST）

3. **填充 IPD 表单**
   - 设置 `window.ipdData`
   - 遍历所有表单字段并填充数据
   - 处理下拉框（优先级、频次）

4. **填充用户故事**
   - 设置 `window.userStory`
   - 更新用户故事显示区域

5. **更新 INVEST 评分**
   - 设置 `window.investScores`
   - 更新所有滑块的值
   - 重绘雷达图

6. **关闭模态框并跳转**
   - 关闭历史记录模态框
   - 跳转到步骤 1（IPD 表单）
   - 用户可以立即看到填充的数据

## 验证步骤

### 手动测试
1. 访问 `http://localhost:5173/ipd-story-flow.html`
2. 填写 IPD 表单并保存
3. 填写第二个不同的 IPD 表单并保存
4. 点击"📋 查看历史记录"
5. 点击第二个卡片
6. 验证 IPD 表单显示的是第二个卡片的数据

### 控制台验证
1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 点击任意历史卡片
4. 查看控制台输出：
   ```
   加载的工作流数据: {workflow_id: "xx", ipd_data: {...}, ...}
   ✅ 数据已加载，workflow_id: xx
   ```

## 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `frontend/public/ipd-story-flow.html` | 将全局变量改为 window 对象属性 |
| `frontend/public/ipd-enhancement.js` | 添加 IPD 表单填充逻辑，修复跳转逻辑 |

## 注意事项

### 数据一致性
- 确保 HTML 文件和 ipd-enhancement.js 都使用 `window.ipdData` 等全局变量
- 不要在其他地方重新声明这些变量
- 使用 `window` 对象确保跨脚本访问

### 性能优化
- 表单填充使用 DOM 操作，只在需要时执行
- 使用 `console.log` 而不是 `alert` 避免阻塞用户操作
- 跳转到步骤 1 让用户可以验证数据

### 错误处理
- 添加了详细的错误日志
- 所有填充操作都有空值检查
- API 调用失败有明确的错误提示

## 后续优化建议

1. **加载指示器**: 添加加载动画，提升用户体验
2. **数据验证**: 加载后验证数据的完整性
3. **撤销功能**: 允许用户取消加载操作
4. **快捷操作**: 支持键盘快捷键（ESC 关闭，Enter 确认）
5. **多语言支持**: 考虑中英文切换

# 需求验证逻辑完整分析

## 📊 验证状态类型

验证清单共有 **6 种状态**，分为 3 类：

### 1️⃣ 初始/进行中状态

| 状态 | 代码值 | 说明 | 可编辑 |
|------|--------|------|--------|
| 未开始 | `not_started` | 验证清单刚创建，尚未开始检查 | ✅ 是 |
| 进行中 | `in_progress` | 正在进行检查，部分项已完成 | ✅ 是 |

### 2️⃣ 最终状态（不可编辑）

| 状态 | 代码值 | 说明 | 可编辑 |
|------|--------|------|--------|
| 通过 | `passed` | 所有检查项都符合要求 | ❌ 否 |
| 失败 | `failed` | 关键检查项不符合要求 | ❌ 否 |
| 部分通过 | `partial_passed` | 部分检查项不符合要求，需要改进 | ⚠️ 可编辑 |
| 阻塞 | `blocked` | 验证过程中遇到阻碍，无法继续 | ⚠️ 可编辑 |

---

## 🔄 状态流转规则

### 完整状态流转图

```
创建验证清单
    ↓
not_started (未开始)
    ↓
[开始添加检查项并保存]
    ↓
in_progress (进行中) 或 not_started
    ↓
[提交验证结果]
    ↓
┌───────────────┬───────────────┬───────────────┐
│               │               │               │
↓               ↓               ↓               ↓
passed        partial_passed   failed         blocked
(通过)        (部分通过)       (失败)         (阻塞)
```

### 状态转换条件

#### 1️⃣ 未开始 → 进行中

**自动触发条件：**
- 用户开始添加检查项
- 保存检查项数据

**代码位置：** `VerificationChecklistForm.tsx:170-199`

```typescript
// 保存清单项，状态保持不变
const handleSave = async () => {
  // ...
  updateMutation.mutate({ checklistItems });
  // 状态不改变，但数据已保存
}
```

#### 2️⃣ 进行中/未开始 → 最终状态

**用户手动选择：**
- 用户点击"提交验证结果"按钮
- 在弹窗中选择最终结果（passed/partial_passed/failed）
- 系统更新状态

**代码位置：** `VerificationChecklistForm.tsx:387-396`

```typescript
{(mode === 'edit' || mode === 'view') && checklist && checklist.result === 'in_progress' && (
  <Button type="primary" danger onClick={() => setSubmitModalVisible(true)}>
    提交验证结果
  </Button>
)}
```

---

## ✅ 什么情况下"通过"

### 判断标准

**定义：** 所有检查项都已完成且符合要求

### 触发条件

1. **检查项完成度：** `勾选数量 === 检查项总数`
   ```typescript
   const checkedCount = checklistItems.filter((i) => i.checked).length;
   // checkedCount === checklistItems.length
   ```

2. **用户手动选择：** 用户在提交结果时选择 "通过"
   ```typescript
   <Radio value="passed">
     <Space>
       <CheckCircleOutlined style={{ color: '#52c41a' }} />
       通过 - 所有检查项都符合要求
     </Space>
   </Radio>
   ```

3. **系统验证：** 目前**无自动验证**，完全由用户判断

### 业务场景

- **工厂验收测试 (FAT)**：所有功能点测试通过
- **现场验收测试 (SAT)**：现场安装调试完成，所有指标达标
- **用户验收测试 (UAT)**：用户试用满意，所有需求满足
- **原型验证**：原型功能完整，用户体验良好
- **测试验证**：所有测试用例通过

### 状态特性

- **可编辑性：** ❌ 不可编辑（编辑按钮隐藏）
- **后续操作：** 可查看详情，可查看历史
- **显示样式：** 绿色成功标签

**代码位置：** `VerificationListPage.tsx:217-221`
```typescript
item.result !== 'passed' && item.result !== 'failed' && (
  <Button onClick={() => handleEdit(item.id)}>编辑</Button>
)
```

---

## ❌ 什么情况下"失败"

### 判断标准

**定义：** 关键检查项不符合要求，无法通过验收

### 触发条件

1. **用户手动选择：** 用户在提交结果时选择 "失败"

2. **典型场景：**
   - 核心功能无法实现
   - 关键指标严重不达标
   - 安全问题严重
   - 性能无法接受

3. **业务判断：**
   ```typescript
   <Radio value="failed">
     <Space>
       <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
       失败 - 关键检查项不符合要求
     </Space>
   </Radio>
   ```

### 业务场景

- **FAT失败：** 核心功能缺失或严重缺陷
- **SAT失败：** 现场环境无法满足要求
- **UAT失败：** 用户不接受当前实现
- **原型失败：** 概念验证失败

### 状态特性

- **可编辑性：** ❌ 不可编辑
- **后续操作：** 需求需要重新开发或修改
- **显示样式：** 红色失败标签

### 失败后的流程

1. **记录问题：** 在"发现的问题"字段中详细描述
2. **需求返工：** 相关需求退回到开发阶段
3. **重新验证：** 问题修复后创建新的验证清单

---

## ⚠️ 什么情况下"部分通过"

### 判断标准

**定义：** 部分检查项不符合要求，但整体可接受或有条件通过

### 触发条件

1. **用户手动选择：** 用户在提交结果时选择 "部分通过"

2. **典型场景：**
   - 非关键功能有缺陷
   - 部分指标不达标但可接受
   - 有 workaround 的问题
   - 文档缺失但不影响使用

3. **业务判断：**
   ```typescript
   <Radio value="partial_passed">
     <Space>
       <Tag color="warning">部分通过</Tag>
       部分检查项不符合要求，需要改进
     </Space>
   </Radio>
   ```

### 业务场景

- **FAT部分通过：** 主要功能OK，次要功能有瑕疵
- **SAT部分通过：** 大部分指标达标，少数需后续改进
- **UAT部分通过：** 用户基本满意，有小问题待修复

### 状态特性

- **可编辑性：** ⚠️ 可编辑（与通过/失败不同）
- **后续操作：**
  - 可继续编辑完善
  - 可创建改进计划
  - 可转为最终状态
- **显示样式：** 黄色警告标签

### 部分通过后的处理

1. **记录问题：** 详细描述不符合项
2. **客户反馈：** 记录客户的接受意见
3. **改进计划：** 制定后续改进时间表
4. **最终验证：** 改进完成后可转为"通过"

---

## 🚫 什么情况下"阻塞"

### 判断标准

**定义：** 验证过程中遇到阻碍，无法继续进行

### 触发条件

1. **外部阻碍：**
   - 测试环境不可用
   - 依赖的第三方服务不可用
   - 硬件设备缺失
   - 客户/相关人员不在场

2. **内部阻碍：**
   - 需求变更导致验证无法继续
   - 发现设计缺陷需要重新设计
   - 技术难题需要攻克

### 业务场景

- **SAT阻塞：** 现场条件不具备
- **UAT阻塞：** 客户临时变更需求
- **测试阻塞：** 测试环境故障

### 状态特性

- **可编辑性：** ⚠️ 可编辑
- **后续操作：**
  - 阻塞解除后可继续验证
  - 可转为其他状态
- **显示样式：** 深红色阻塞标签

### 当前实现状态

⚠️ **注意：** 代码中定义了 `blocked` 状态，但：
- 前端提交选项中**未提供**阻塞选项
- 可能是预留状态
- 可能需要通过其他方式设置

---

## 📋 编辑权限矩阵

| 当前状态 | 可以编辑 | 可以保存项 | 可以提交结果 | 说明 |
|---------|---------|-----------|-------------|------|
| `not_started` | ✅ | ✅ | ✅ | 未开始，完全可操作 |
| `in_progress` | ✅ | ✅ | ✅ | 进行中，可继续编辑 |
| `partial_passed` | ✅ | ✅ | ✅ | 部分通过，可继续改进 |
| `blocked` | ✅ | ✅ | ⚠️ | 阻塞，解除后可继续 |
| `passed` | ❌ | ❌ | ❌ | 已通过，不可更改 |
| `failed` | ❌ | ❌ | ❌ | 已失败，不可更改 |

**代码实现：** `VerificationListPage.tsx`
```typescript
// 只有非 passed/failed 状态才显示编辑按钮
item.result !== 'passed' && item.result !== 'failed' && (
  <Button onClick={() => handleEdit(item.id)}>编辑</Button>
)
```

---

## 🔄 完整业务流程

### 场景1：正常通过流程

```
1. 创建验证清单
   状态: not_started
   操作: 添加检查项（10项）

2. 保存清单
   状态: not_started
   操作: 保存，但未提交结果

3. 开始验证
   状态: in_progress
   操作: 逐项检查并勾选

4. 所有项完成
   完成度: 10/10 (100%)
   操作: 点击"提交验证结果"

5. 选择"通过"
   状态: passed ✅
   操作: 填写客户反馈、提交

6. 最终状态
   状态锁定，不可编辑
```

### 场景2：部分通过流程

```
1. 创建验证清单
   状态: not_started

2. 验证发现部分问题
   完成度: 8/10 (80%)
   问题: 2项不符合要求

3. 选择"部分通过"
   状态: partial_passed ⚠️
   操作: 记录问题、制定改进计划

4. 后续改进
   状态: partial_passed (可编辑)
   操作: 修复问题后继续验证

5. 最终通过
   状态: passed ✅
   操作: 所有问题解决后重新提交
```

### 场景3：失败返工流程

```
1. 创建验证清单
   状态: not_started

2. 验证发现严重问题
   完成度: 5/10 (50%)
   问题: 核心功能缺失

3. 选择"失败"
   状态: failed ❌
   操作: 详细记录问题、影响分析

4. 需求返工
   状态: failed (锁定)
   操作: 需求退回开发阶段

5. 重新验证
   操作: 创建新的验证清单
   状态: not_started (重新开始)
```

---

## 💡 验证最佳实践

### 1. 检查项设计原则

✅ **应该：**
- 具体、可度量
- 覆盖核心功能
- 包含验收标准
- 明确通过/失败条件

❌ **不应该：**
- 模糊的描述
- 主观判断标准
- 过于宽泛
- 无法验证

### 2. 状态选择建议

| 验证完成度 | 建议状态 | 条件 |
|-----------|---------|------|
| 100% 全部通过 | `passed` | 所有项完美达标 |
| 80-99% 大部分通过 | `partial_passed` | 少数非关键项不达标 |
| 50-79% 部分通过 | `partial_passed` | 有条件接受 |
| <50% 或关键项失败 | `failed` | 无法接受 |
| 无法继续 | `blocked` | 遇到阻碍 |

### 3. 提交验证前的检查清单

- [ ] 所有检查项都已验证
- [ ] 完成度准确记录
- [ ] 问题详细描述
- [ ] 客户反馈记录
- [ ] 证据附件上传（如有）
- [ ] 验证人信息正确

---

## 🔧 技术实现细节

### 数据库字段

**表名：** `verification_checklists`

```sql
CREATE TYPE checklist_result AS ENUM (
  'not_started',
  'in_progress',
  'passed',
  'failed',
  'partial_passed',
  'blocked'
);

ALTER TABLE verification_checklists
ADD COLUMN result checklist_result DEFAULT 'not_started';
```

### API 端点

| 方法 | 端点 | 功能 |
|------|------|------|
| POST | `/requirements/{id}/verification` | 创建清单 |
| GET | `/requirements/{id}/verification` | 获取清单列表 |
| GET | `/requirements/{id}/verification/{checklist_id}` | 获取单个清单 |
| PUT | `/requirements/{id}/verification/{checklist_id}` | 更新清单项 |
| POST | `/requirements/{id}/verification/{checklist_id}/submit` | 提交验证结果 |
| GET | `/requirements/{id}/verification/summary` | 获取摘要统计 |

### 前端组件

- **VerificationListPage** - 验证清单列表
- **VerificationChecklistForm** - 创建/编辑表单
- **VerificationOverviewPage** - 验证总览

---

## 📊 验证统计指标

系统提供以下统计指标（`getVerificationSummary`）：

```typescript
interface VerificationSummary {
  requirement_id: number;
  total_checklists: number;      // 总清单数
  passed: number;                // 通过数量
  failed: number;                // 失败数量
  in_progress: number;           // 进行中数量
  not_started: number;           // 未开始数量
}
```

---

## 🎯 总结

### 关键要点

1. **状态由用户手动选择** - 系统不自动判断
2. **通过/失败为最终状态** - 不可编辑
3. **部分通过可继续编辑** - 支持迭代改进
4. **编辑权限基于状态** - passed/failed 锁定
5. **完整记录验证过程** - 问题、反馈、证据

### 验证流程的核心价值

- ✅ 质量把关：确保需求正确实现
- ✅ 风险控制：及早发现问题
- ✅ 客户沟通：明确验收标准
- ✅ 过程追溯：完整的验证记录
- ✅ 持续改进：部分通过支持迭代

---

**文档版本：** v1.0
**最后更新：** 2025-02-01
**维护者：** 开发团队

# 验证清单"开始验证"功能分析

## 📌 当前问题

### 问题现象
用户创建验证清单后，状态为 `not_started`（未开始），但**没有按钮或操作可以将其转为 `in_progress`（进行中）**。

### 问题影响
1. **无法提交验证结果**
   - 提交验证结果的按钮只在 `result === 'in_progress'` 时显示
   - 但用户无法达到这个状态

2. **流程卡住**
   - 用户可以编辑和保存检查项
   - 但永远无法提交验证结果
   - 状态永远是 not_started

### 代码证据

**前端显示提交按钮的条件**（`VerificationChecklistForm.tsx:398`）：
```typescript
{(mode === 'edit' || mode === 'view') && checklist && checklist.result === 'in_progress' && (
  <Button type="primary" danger onClick={() => setSubmitModalVisible(true)}>
    提交验证结果
  </Button>
)}
```

**保存清单的逻辑**（`VerificationChecklistForm.tsx:170-199`）：
```typescript
const handleSave = async () => {
  // ...
  if (mode === 'create') {
    createMutation.mutate(data);  // 创建后状态为 not_started
  } else if (mode === 'edit') {
    updateMutation.mutate({ checklistItems });  // 更新但不改变状态
  }
}
```

**后端创建清单**（`verification.py:159-195`）：
```python
checklist = await repo.create(
    # ...
    result="not_started",  # ← 默认状态
)
```

---

## 💡 解决方案

### 方案1：添加"开始验证"按钮（推荐）⭐

**优点：**
- 明确的用户意图
- 符合业务逻辑
- 用户可控

**实现：**
1. 在编辑页面添加"开始验证"按钮
2. 按钮显示条件：`result === 'not_started'`
3. 点击后更新状态为 `in_progress`
4. 隐藏"开始验证"按钮，显示"提交验证结果"按钮

**代码位置：**
- 前端：`VerificationChecklistForm.tsx`
- 后端：添加新的API端点或复用update端点

### 方案2：自动转入进行中

**优点：**
- 用户操作简单
- 自动化流程

**缺点：**
- 可能在用户未准备好时就转入进行中
- 缺少明确的"开始"动作

**实现：**
- 首次保存检查项时自动将状态改为 `in_progress`

### 方案3：移除 in_progress 状态

**优点：**
- 简化状态逻辑
- not_started 可直接提交

**缺点：**
- 丢失"进行中"的语义
- 不符合标准验收流程

---

## 🎯 推荐实现方案：方案1

### 业务流程

```
1. 创建验证清单
   状态: not_started
   显示: "开始验证"按钮

2. 点击"开始验证"
   状态: not_started → in_progress
   显示: "提交验证结果"按钮

3. 编辑检查项并保存
   状态: in_progress (保持)
   显示: "提交验证结果"按钮

4. 点击"提交验证结果"
   状态: in_progress → passed/failed/partial_passed
   显示: 提交结果弹窗
```

### 按钮显示逻辑

```typescript
// 未开始时显示"开始验证"按钮
{checklist && checklist.result === 'not_started' && (
  <Button type="primary" onClick={handleStartVerification}>
    开始验证
  </Button>
)}

// 进行中显示"提交验证结果"按钮
{checklist && checklist.result === 'in_progress' && (
  <Button type="primary" danger onClick={() => setSubmitModalVisible(true)}>
    提交验证结果
  </Button>
)}
```

---

## 🔧 技术实现

### 后端API

**选项1：添加新的开始端点**
```python
@router.post("/{checklist_id}/start")
async def start_verification(
    requirement_id: int,
    checklist_id: int,
    db: AsyncSession = Depends(get_db),
):
    """开始验证，将状态从 not_started 改为 in_progress"""
    repo = BaseRepository(VerificationChecklist, db)

    checklist = await repo.get_by_id(checklist_id)
    if not checklist or checklist.requirement_id != requirement_id:
        raise HTTPException(status_code=404, detail="Checklist not found")

    if checklist.result != "not_started":
        raise HTTPException(status_code=400, detail="Can only start not_started checklists")

    try:
        updated = await repo.update(checklist_id, result="in_progress")
        await db.commit()
        return {"success": True, "data": serialize_checklist(updated)}
    except Exception as e:
        await db.rollback()
        raise
```

**选项2：复用更新端点**
```python
@router.put("/{checklist_id}")
async def update_checklist(...):
    # 现有逻辑...

    # 允许更新 result 字段
    if "result" in checklist_data:
        # 验证状态转换
        current_result = checklist.result
        new_result = checklist_data.result

        # not_started → in_progress ✅
        # in_progress → passed/failed/partial_passed ✅
        # 其他转换 ❌
```

### 前端实现

```typescript
/** 开始验证 */
const handleStartVerification = async () => {
  try {
    setSubmitting(true);

    await verificationService.startVerification(
      parseInt(requirementId!),
      parseInt(checklistId!)
    );

    message.success('已开始验证');
    // 重新加载数据
    await loadChecklist();
  } catch (error) {
    message.error('开始验证失败');
    console.error(error);
  } finally {
    setSubmitting(false);
  }
};
```

### 服务层

```typescript
/**
 * 开始验证
 */
async startVerification(
  requirementId: number,
  checklistId: number
): Promise<VerificationChecklist> {
  const response: any = await api.post(
    `/requirements/${requirementId}/verification/${checklistId}/start`
  );
  return response.data;
}
```

---

## 📊 状态流转图（修复后）

```
创建清单 (not_started)
    ↓
[点击"开始验证"按钮] ← 新增！
    ↓
进行中 (in_progress)
    ↓
[编辑检查项并保存]
    ↓
进行中 (in_progress)
    ↓
[点击"提交验证结果"]
    ↓
passed ✅ | partial_passed ⚠️ | failed ❌
```

---

## ✅ 验证清单

### 功能验收

- [ ] 创建清单后显示"开始验证"按钮
- [ ] 点击"开始验证"后状态变为 in_progress
- [ ] "开始验证"按钮消失，显示"提交验证结果"按钮
- [ ] 可以正常提交验证结果
- [ ] 已通过/失败的清单不显示"开始验证"按钮

### 边界情况

- [ ] not_started → in_progress ✅
- [ ] in_progress → not_started ❌（不允许）
- [ ] passed → in_progress ❌（已锁定）
- [ ] failed → in_progress ❌（已锁定）

---

**建议优先级：高**
**影响范围：所有验证清单**
**实现难度：低**

这个功能对于验证流程的完整性至关重要！

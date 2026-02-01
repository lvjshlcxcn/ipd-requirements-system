# RTM需求ID不一致问题分析报告

## 📌 问题描述

**现象：** 需求追溯矩阵(RTM)中显示的需求ID是新输入需求中的数据库ID（1, 2, 3...），而不是需求编号（REQ-2025-0001格式）。

## 🔍 根本原因

### 字段混淆

数据库中存在两个不同的"需求ID"字段：

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `id` (requirement_id) | INT | 数据库主键ID | 1, 2, 3, ... |
| `requirement_no` | VARCHAR(50) | 业务需求编号 | REQ-2025-0001 |

**RTM页面错误地使用了 `requirement_id`（数据库主键）而不是 `requirement_no`（业务编号）。**

## 📊 代码分析

### 1. RTM后端服务（问题所在）

**文件：** `backend/app/services/rtm.py`

**当前代码（错误）：**
```python
# 第67行和第122行
matrix.append(
    TraceabilityMatrix(
        requirement_id=req.id,  # ❌ 使用了数据库主键ID
        requirement_title=req.title or f"需求 {req.requirement_no}",
        # ...
    )
)
```

**问题：**
- 使用 `req.id`（整数 1, 2, 3...）
- 应该使用 `req.requirement_no`（字符串 REQ-2025-0001）

### 2. RTM Schema定义

**文件：** `backend/app/schemas/rtm.py`

**当前代码：**
```python
class TraceabilityMatrix(BaseModel):
    requirement_id: int  # ❌ 应该是 requirement_no: str
    requirement_title: str
    design_items: List[str]
    code_items: List[str]
    test_items: List[str]
```

### 3. RTM前端页面

**文件：** `frontend/src/pages/rtm/RTMPage.tsx`

**当前代码：**
```typescript
// 第124行
{
  title: '需求ID',
  dataIndex: 'requirement_id',  // ❌ 应该是 'requirement_no'
  key: 'requirement_id',
  // ...
}
```

### 4. 需求编号生成逻辑（正确）

**文件：** `backend/app/repositories/requirement.py`

```python
def _generate_requirement_no(self) -> str:
    """生成唯一的需求编号"""
    year = datetime.utcnow().year
    prefix = f"REQ-{year}-"
    # 查询当年最大序号
    # 生成新序号
    return f"{prefix}{new_seq:04d}"  # REQ-2025-0001
```

**生成示例：**
- REQ-2025-0001
- REQ-2025-0002
- REQ-2025-0003

## 🎯 影响范围

### 1. 用户界面

**当前显示（错误）：**
```
需求ID | 需求标题        | 设计文档 | 代码 | 测试用例
-----|--------------|---------|------|--------
1    | 用户登录功能  | 无      | 无   | 无
2    | 购物车功能    | DESIGN-001| CODE-001| TEST-001
```

**应该显示（正确）：**
```
需求ID          | 需求标题        | 设计文档 | 代码 | 测试用例
--------------|--------------|---------|------|--------
REQ-2025-0001 | 用户登录功能  | 无      | 无   | 无
REQ-2025-0002 | 购物车功能    | DESIGN-001| CODE-001| TEST-001
```

### 2. 数据一致性

- ✅ **需求列表页面**：正确显示 `REQ-2025-0001` 格式
- ✅ **需求详情页面**：正确显示需求编号
- ❌ **RTM页面**：错误显示数字ID
- ✅ **验证清单页面**：使用数据库ID关联（正确）

### 3. 功能影响

1. **用户混淆**
   - 用户在其他页面看到 `REQ-2025-0001`
   - 在RTM页面看到 `1`
   - 不知道这是否是同一个需求

2. **追溯困难**
   - 导出Excel中的需求ID字段无法对应
   - 文档和需求无法正确关联

3. **数据质量**
   - 与需求管理规范不一致
   - 影响专业性

## 💡 解决方案

### 方案1：修改后端（推荐）⭐

**优点：**
- 一次修改，所有前端受益
- 符合业务逻辑
- 数据源头正确

**修改文件：**
1. `backend/app/schemas/rtm.py` - 修改Schema定义
2. `backend/app/services/rtm.py` - 修改数据构造

**实现步骤：**
1. 将 `requirement_id: int` 改为 `requirement_no: str`
2. 使用 `req.requirement_no` 构造矩阵数据
3. 前端自动适配新的字段名

### 方案2：修改前端显示

**优点：**
- 不影响后端
- 改动较小

**缺点：**
- 只修复显示问题
- API接口仍然返回错误数据
- 其他调用者也会有同样问题

### 方案3：双字段显示

**保留两个字段：**
```typescript
{
  title: '需求ID',
  dataIndex: 'requirement_no',
  render: (text, record) => `${text} (ID: ${record.id})`
}
```

**显示效果：**
```
REQ-2025-0001 (ID: 1)
REQ-2025-0002 (ID: 2)
```

## 🔧 技术实现细节

### 数据库表结构

```sql
CREATE TABLE requirements (
    id SERIAL PRIMARY KEY,              -- 数据库主键
    requirement_no VARCHAR(50) UNIQUE NOT NULL,  -- 业务需求编号
    title VARCHAR(200) NOT NULL,
    -- ...
);
```

### 关联关系

**验证清单表：**
```sql
CREATE TABLE verification_checklists (
    id SERIAL PRIMARY KEY,
    requirement_id INTEGER REFERENCES requirements(id),  -- 使用数据库主键关联 ✅
    -- ...
);
```

**关键点：**
- 表之间的外键关联使用 `id`（数据库主键）✅ 正确
- 显示给用户看应该用 `requirement_no`（业务编号）✅ 正确

### 为什么验证清单使用ID是正确的？

验证清单通过 `requirement_id` 外键关联需求表：
- 这是数据库层面的关联
- 使用主键ID是正确的做法
- 不会影响业务逻辑

但RTM是业务展示页面，应该显示业务编号。

## 📋 修复检查清单

- [ ] 修改 `backend/app/schemas/rtm.py` Schema
- [ ] 修改 `backend/app/services/rtm.py` 服务逻辑
- [ ] 修改 `frontend/src/pages/rtm/RTMPage.tsx` 列定义
- [ ] 测试RTM页面显示正确
- [ ] 测试导出功能
- [ ] 验证其他功能不受影响

## 🎯 预期效果

修复后RTM页面应该显示：

```
需求ID          | 需求标题        | 设计文档      | 代码          | 测试用例       | 状态
--------------|--------------|--------------|--------------|---------------|-------
REQ-2025-0001 | 用户登录功能  |              |              |               | 缺失
REQ-2025-0002 | 购物车功能    | DESIGN-001   |              |               | 缺失
REQ-2025-0003 | 订单管理      | DESIGN-002   | CODE-001     |               | 缺失
REQ-2025-0004 | 支付集成      | DESIGN-003   | CODE-002     | TEST-001      | 完整
```

## 📚 相关文档

- 需求模型：`backend/app/models/requirement.py`
- RTM服务：`backend/app/services/rtm.py`
- RTM Schema：`backend/app/schemas/rtm.py`
- RTM页面：`frontend/src/pages/rtm/RTMPage.tsx`

---

**优先级：高**
**影响范围：需求追溯矩阵页面**
**修复难度：低**

这是一个典型的业务字段混淆问题，修复后可以显著提升用户体验和数据一致性！

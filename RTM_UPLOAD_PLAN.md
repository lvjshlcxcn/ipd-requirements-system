# RTM文档上传功能实现方案

## 📋 实现方案

基于现有附件上传功能，为RTM添加文档上传能力。

## 🎯 核心改动

### 当前实现
```
设计文档: [文本输入框] DESIGN-001
代码:      [文本输入框] CODE-001
测试用例:  [文本输入框] TEST-001
```

### 目标实现
```
设计文档: [上传按钮] → 上传文件 → 自动生成ID → 保存关联
代码:      [上传按钮] → 上传文件 → 自动生成ID → 保存关联
测试用例:  [上传按钮] → 上传文件 → 自动生成ID → 保存关联
```

## 🔧 技术实现

### 1. 利用现有附件系统

**已有的附件功能：**
- ✅ Attachment 模型和表
- ✅ 文件上传API
- ✅ UploadAttachmentModal 组件
- ✅ 文件存储和下载

**扩展方式：**
- 附件表已有 `entity_type` 和 `entity_id` 字段
- 可以支持 "rtm" 实体类型
- TraceabilityLink 存储 attachment_id

### 2. 数据库修改

**TraceabilityLink 表扩展：**
```python
# 新增字段
design_attachment_id = Column(Integer, ForeignKey("attachments.id"), nullable=True)
code_attachment_id = Column(Integer, ForeignKey("attachments.id"), nullable=True)
test_attachment_id = Column(Integer, ForeignKey("attachments.id"), nullable=True)
```

### 3. 前端组件复用

**复用 UploadAttachmentModal：**
- 已经实现完整的上传功能
- 支持拖拽、进度、预览
- 支持文件类型验证
- 支持大小限制（50MB）

**集成方式：**
```typescript
<UploadAttachmentModal
  requirementId={requirementId}
  entity_type="rtm"
  autoGenerateId={true}
  typeConfig={{
    accept: '.pdf,.doc,.docx',
    maxSize: 50 * 1024 * 1024
  }}
  onUploaded={(attachment) => {
    // 保存关联关系
    handleSaveLink('design', attachment.id)
  }}
/>
```

### 4. 自动ID生成

**格式：**
- 设计文档：`DESIGN-20250201-001`
- 代码：`CODE-20250201-001`
- 测试：`TEST-20250201-001`

**逻辑：**
```typescript
const generateId = (type: string) => {
  const prefix = type === 'design' ? 'DESIGN' : type === 'code' ? 'CODE' : 'TEST'
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${date}-${random}`
}
```

## 📝 实施清单

### Phase 1: 数据库扩展
- [ ] 添加数据库迁移
- [ ] 扩展 TraceabilityLink 模型
- [ ] 更新 RTM Schema

### Phase 2: 后端API
- [ ] 更新 create_link 方法支持附件
- [ ] 更新 get_all_traceability 返回附件信息
- [ ] 更新 get_requirement_traceability 返回附件信息

### Phase 3: 前端组件
- [ ] 创建文档上传弹窗组件
- [ ] 修改 RTM 页面添加上传按钮
- [ ] 集成 UploadAttachmentModal
- [ ] 更新列表显示支持附件预览

### Phase 4: 测试
- [ ] 上传设计文档
- [ ] 上传代码包
- [ ] 上传测试用例
- [ ] 验证文件下载
- [ ] 验证追溯关系

## 🎨 UI设计

### 上传按钮位置

```
┌─────────────────────────────────────────────────┐
│ 需求追溯矩阵                                    │
├─────────────────────────────────────────────────┤
│ [上传设计文档] [上传代码] [上传测试用例]         │
├─────────────────────────────────────────────────┤
│ 需求ID          │ 需求标题 │ 设计文档 │ 代码 │ 测试 │
├─────────────────────────────────────────────────┤
│ REQ-2025-0001 │ 登录功能 │ 📄设计文档.pdf │      │      │
│ REQ-2025-0002 │ 购物车   │              │ 📦代码.zip │      │
│ REQ-2025-0003 │ 订单管理 │ 📄原型.fig │      │ 📊测试.xlsx │
└─────────────────────────────────────────────────┘
```

### 上传弹窗

```
┌─────────────────────────────────┐
│ 上传设计文档                     │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │     拖拽文件到此处      │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  或                             │
│  [选择文件]                     │
│                                 │
│  支持格式：PDF, DOC, DOCX, TXT   │
│  最大大小：50MB                  │
│                                 │
│          [取消] [上传]          │
└─────────────────────────────────┘
```

## 💡 优势

1. **准确性**：直接关联文件，避免手动输入错误
2. **便捷性**：拖拽上传，操作简单
3. **可追溯性**：文件版本管理，历史可查
4. **一致性**：与需求附件功能使用同一套系统
5. **可维护性**：复用现有代码，减少重复

## ⚠️ 注意事项

1. **向后兼容**：保留原有的 design_id 等字段
2. **数据迁移**：现有数据无需迁移
3. **权限控制**：继承附件系统的权限
4. **存储空间**：监控文件存储使用量

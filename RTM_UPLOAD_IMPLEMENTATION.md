# RTM文档上传功能 - 实施完成报告

## 实施日期
2026-01-31

## 功能概述
为需求追溯矩阵(RTM)添加文档上传功能，支持直接上传设计文档、代码和测试用例文件，并自动建立追溯关联。

## 实施内容

### Phase 1: 数据库扩展 ✅

#### 1.1 更新 TraceabilityLink 模型
**文件**: `backend/app/models/rtm.py`

**更改**:
- 添加 `design_attachment_id` 外键字段
- 添加 `code_attachment_id` 外键字段
- 添加 `test_attachment_id` 外键字段
- 添加附件关联关系（relationships）

```python
# 附件关联字段（新增：用于文件上传）
design_attachment_id = Column(Integer, ForeignKey("attachments.id", ondelete="SET NULL"), nullable=True)
code_attachment_id = Column(Integer, ForeignKey("attachments.id", ondelete="SET NULL"), nullable=True)
test_attachment_id = Column(Integer, ForeignKey("attachments.id", ondelete="SET NULL"), nullable=True)

# Relationships to attachments
design_attachment = relationship("Attachment", foreign_keys=[design_attachment_id])
code_attachment = relationship("Attachment", foreign_keys=[code_attachment_id])
test_attachment = relationship("Attachment", foreign_keys=[test_attachment_id])
```

#### 1.2 创建数据库迁移
**文件**: `backend/alembic/versions/20260131_add_rtm_attachment_fields.py`

**迁移内容**:
- 添加三个附件ID字段到 `traceability_links` 表
- 创建外键约束关联到 `attachments` 表
- 使用 `ON DELETE SET NULL` 确保附件删除时自动置空

**状态**: ✅ 迁移已成功执行

### Phase 2: 后端API更新 ✅

#### 2.1 更新 Schema
**文件**: `backend/app/schemas/rtm.py`

**更改**:
- 添加 `AttachmentInfo` 基础Schema
- 在 `TraceabilityLinkBase` 中添加附件ID字段
- 在 `TraceabilityLinkResponse` 中添加附件详细信息
- 在 `TraceabilityItem` 中添加附件ID和附件信息
- 在 `TraceabilityMatrix` 中添加 `requirement_id` 字段

#### 2.2 更新 RTM Service
**文件**: `backend/app/services/rtm.py`

**更改**:
- `get_traceability_matrix`: 预加载附件信息，构建包含附件的追溯项
- `get_requirement_traceability`: 支持附件信息返回
- `create_link`: 验证附件存在性，支持附件关联
- `update_link`: 支持更新附件关联

#### 2.3 添加通用附件上传端点
**文件**: `backend/app/api/v1/attachments.py`

**新增端点**:
```
POST /api/v1/attachments/upload
```

**参数**:
- `file`: 上传的文件
- `entity_type`: 实体类型（如 'rtm'）
- `entity_id`: 实体ID
- `description`: 可选描述

### Phase 3: 前端组件开发 ✅

#### 3.1 更新 RTM Service
**文件**: `frontend/src/services/rtm.service.ts`

**更改**:
- 添加 `AttachmentInfo` 接口
- 更新 `TraceabilityLink` 接口包含附件字段
- 更新 `TraceabilityItem` 接口包含附件字段
- 更新 `TraceabilityMatrix` 接口包含 `requirement_id`
- 添加 `generateDocumentId` 函数（格式: DESIGN-20260131-001）
- 添加 `uploadDocumentAndLink` 方法（上传文件并创建关联）
- 添加 `getAttachmentDownloadUrl` 方法

#### 3.2 更新 RTM Page
**文件**: `frontend/src/pages/rtm/RTMPage.tsx`

**更改**:
- 添加上传相关状态：`uploadModalVisible`, `selectedRequirementId`, `uploadType`, `uploading`
- 添加 `handleOpenUploadModal` 函数（打开上传模态框）
- 添加 `handleUpload` 函数（处理文件上传）
- 添加 `handleDownloadAttachment` 函数（下载附件）
- 更新表格列显示：
  - 设计文档列：显示附件名称和下载链接，添加上传按钮
  - 代码列：显示附件名称和下载链接，添加上传按钮
  - 测试用例列：显示附件名称和下载链接，添加上传按钮
- 添加上传模态框组件（使用 Upload.Dragger）

**UI效果**:
- 有附件时：显示文件名，可点击下载
- 无附件时：显示"上传XX文档"按钮
- 点击上传按钮：弹出拖拽上传框

## 功能特性

### 1. 自动ID生成
上传文档时自动生成格式化的文档ID：
- 设计文档：`DESIGN-20260131-001`
- 代码：`CODE-20260131-001`
- 测试用例：`TEST-20260131-001`

### 2. 文件上传支持
- 支持拖拽上传
- 文件大小限制：50MB
- 支持格式：PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP, RAR, PNG, JPG, JPEG

### 3. 向后兼容
- 保留原有的 `design_id`, `code_id`, `test_id` 字段
- 支持手动输入文档ID和文件上传两种方式
- 数据库已有数据无需迁移

### 4. 附件管理
- 外键级联删除：附件删除时自动置空关联字段
- 支持附件下载：点击文件名直接下载
- 支持删除关联：可单独删除追溯关联

## 使用流程

### 上传文档
1. 进入"需求追溯矩阵"页面
2. 找到要关联的需求行
3. 点击对应列的"上传XX文档"按钮（设计文档/代码/测试用例）
4. 在弹出的对话框中拖拽或选择文件
5. 点击上传
6. 系统自动：
   - 上传文件到服务器
   - 生成格式化文档ID
   - 创建追溯关联

### 下载附件
- 点击表格中的文件名即可下载

### 删除关联
- 点击关联项旁的删除按钮即可删除追溯关联

## 文件清单

### 后端文件
| 文件 | 更改类型 |
|------|---------|
| `backend/app/models/rtm.py` | 修改 |
| `backend/alembic/versions/20260131_add_rtm_attachment_fields.py` | 新增 |
| `backend/app/schemas/rtm.py` | 修改 |
| `backend/app/services/rtm.py` | 修改 |
| `backend/app/api/v1/attachments.py` | 修改 |

### 前端文件
| 文件 | 更改类型 |
|------|---------|
| `frontend/src/services/rtm.service.ts` | 修改 |
| `frontend/src/pages/rtm/RTMPage.tsx` | 修改 |

## 测试建议

### 1. 单元测试
- [ ] 测试附件上传API
- [ ] 测试RTM关联创建API
- [ ] 测试RTM矩阵获取包含附件信息

### 2. 集成测试
- [ ] 测试完整上传流程
- [ ] 测试附件下载
- [ ] 测试关联删除
- [ ] 测试文件大小限制
- [ ] 测试文件类型限制

### 3. UI测试
- [ ] 测试上传按钮显示
- [ ] 测试上传模态框交互
- [ ] 测试拖拽上传
- [ ] 测试附件下载按钮
- [ ] 测试删除关联按钮

### 测试步骤
1. 准备测试文件（PDF, DOCX, ZIP等）
2. 创建或选择一个需求
3. 点击"上传设计文档"按钮
4. 上传文件并验证成功
5. 检查表格显示文件名
6. 点击文件名下载，验证可正常下载
7. 重复测试代码和测试用例上传
8. 测试删除关联功能

## 注意事项

1. **附件存储路径**: 确保后端配置了正确的文件存储路径
2. **文件大小限制**: 默认50MB，可在附件服务中调整
3. **权限控制**: 当前未实现严格的权限验证，需添加JWT token获取用户信息
4. **错误处理**: 前端已添加基本的错误提示，可根据需要增强

## 未来改进

1. **批量上传**: 支持一次上传多个文件
2. **进度显示**: 添加上传进度条
3. **预览功能**: 支持PDF、图片等文件在线预览
4. **版本管理**: 支持同一文档的多个版本
5. **权限细化**: 添加查看/下载权限控制

## 问题排查

### 上传失败
1. 检查文件大小是否超过50MB
2. 检查文件类型是否被支持
3. 检查网络连接
4. 查看浏览器控制台错误信息

### 下载失败
1. 检查附件是否已被删除
2. 检查文件存储路径是否正确
3. 查看后端日志

### 显示异常
1. 刷新页面重新获取数据
2. 检查后端API响应格式
3. 查看浏览器控制台网络请求

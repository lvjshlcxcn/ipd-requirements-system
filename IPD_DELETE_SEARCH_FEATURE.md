# IPD Story Flow 历史记录删除和搜索功能实现报告

## 功能概述

为 IPD Story Flow 历史记录页面新增：
1. **删除功能** - 删除故事卡（完整工作流）
2. **搜索功能** - 模糊查询故事卡（按标题或角色）

## 功能实现

### 1. 后端 API 实现

#### 1.1 删除工作流 API
**路由**: `DELETE /api/v1/ipd-story/workflow/{workflow_id}`

**文件**: `backend/app/api/v1/ipd_story.py`

**功能说明**:
- 根据 `workflow_id`（实际是 `user_story.id`）删除整个工作流
- 包括 IPD 十问、用户故事和 INVEST 分析
- 删除后返回 404（资源不存在）

**代码**:
```python
@router.delete("/workflow/{workflow_id}", response_model=dict)
async def delete_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    tenant_id: int = Depends(get_tenant_id),
):
    """删除工作流 - 包括 IPD 十问、用户故事和 INVEST 分析"""
    service = IPDStoryService(db)
    success = await service.delete_workflow(workflow_id, tenant_id)

    if not success:
        raise HTTPException(status_code=404, detail="工作流不存在")

    return {"success": True, "message": "工作流删除成功"}
```

#### 1.2 搜索工作流 API
**路由**: `GET /api/v1/ipd-story/workflows?search=关键词`

**文件**: `backend/app/services/ipd_story_service.py`

**功能说明**:
- 支持模糊搜索标题和角色
- 使用 PostgreSQL 的 `ILIKE` 进行不区分大小写的匹配
- 返回匹配的工作流列表

**代码**:
```python
async def list_workflows(
    self,
    tenant_id: int,
    skip: int = 0,
    limit: int = 10,
    search: str = None,  # 新增搜索参数
) -> List[IPDStoryFlowResponse]:
    """列出工作流 - 支持搜索"""
    query = select(UserStoryModel).where(UserStoryModel.tenant_id == tenant_id)

    # 添加搜索条件
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (UserStoryModel.title.ilike(search_pattern)) |
            (UserStoryModel.role.ilike(search_pattern))
        )

    query = query.order_by(UserStoryModel.created_at.desc())\
                      .offset(skip).limit(limit)

    result = await self.db.execute(query)
    stories = result.scalars().all()

    # 构建工作流响应...
```

#### 1.3 删除服务实现
**文件**: `backend/app/services/ipd_story_service.py`

**删除逻辑**:
```python
async def delete_workflow(self, workflow_id: str, tenant_id: int) -> bool:
    """删除工作流 - 包括 INVEST 分析、用户故事和 IPD 十问"""
    story_id = int(workflow_id)

    # 1. 查询用户故事
    story = await self._get_story(story_id, tenant_id)
    if not story:
        return False

    # 2. 删除 INVEST 分析
    await self.db.execute(
        delete(INVESTAnalysisModel).where(
            INVESTAnalysisModel.story_id == story_id,
            INVESTAnalysisModel.tenant_id == tenant_id,
        )
    )

    # 3. 删除用户故事
    await self.db.execute(
        delete(UserStoryModel).where(
            UserStoryModel.id == story_id,
            UserStoryModel.tenant_id == tenant_id,
        )
    )

    # 4. 删除 IPD 十问
    if story.ipd_question_id:
        await self.db.execute(
            delete(IPDTenQuestionsModel).where(
                IPDTenQuestionsModel.id == story.ipd_question_id,
                IPDTenQuestionsModel.tenant_id == tenant_id,
            )
        )

    await self.db.commit()
    return True
```

### 2. 前端实现

#### 2.1 历史记录模态框更新
**文件**: `frontend/public/ipd-enhancement.js`

**新增元素**:
1. 搜索输入框
2. 搜索按钮
3. 清除搜索按钮（搜索后显示）
4. 每个卡片的删除按钮

**代码**:
```javascript
async function showHistoryModal() {
    // 模态框 HTML
    content.innerHTML = '<h2>历史记录</h2>' +
        '<div style="margin-bottom:20px;display:flex;gap:10px;">' +
        '<input type="text" id="searchInput" placeholder="搜索标题或角色..." />' +
        '<button id="searchBtn">🔍 搜索</button>' +
        '<button id="clearSearchBtn" style="display:none;">清除</button>' +
        '</div>' +
        '<div id="historyList">加载中...</div>' +
        '<button id="closeModalBtn">关闭</button>';

    // 搜索功能
    searchBtn.onclick = function() {
        const keyword = searchInput.value.trim();
        loadHistoryList(keyword);
        clearSearchBtn.style.display = 'inline-block';
    };

    clearSearchBtn.onclick = function() {
        searchInput.value = '';
        loadHistoryList();
        clearSearchBtn.style.display = 'none';
    };
}
```

#### 2.2 删除功能实现
```javascript
async function deleteWorkflow(workflowId, title) {
    if (!confirm('确定要删除 "' + title + '" 吗？\n\n此操作将删除整个工作流，包括 IPD 十问、用户故事和 INVEST 分析，无法恢复。')) {
        return;
    }

    const response = await fetch(API_BASE + '/workflow/' + workflowId, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    const result = await response.json();

    if (result.success) {
        alert('删除成功！');
        loadHistoryList();  // 重新加载列表
    } else {
        alert('删除失败: ' + (result.message || '未知错误'));
    }
}
```

#### 2.3 搜索功能实现
```javascript
async function loadHistoryList(searchKeyword = '') {
    let url = '/workflows?skip=0&limit=20';
    if (searchKeyword) {
        url += '&search=' + encodeURIComponent(searchKeyword);
    }

    const response = await fetch(API_BASE + url, {
        headers: getAuthHeaders()
    });

    const result = await response.json();

    // 渲染列表...
}
```

#### 2.4 卡片 UI 更新
每个卡片现在包含：
- 左侧：可点击的卡片内容（加载工作流）
- 右侧：删除按钮（独立事件处理）

```javascript
return '<div style="display:flex;justify-content:space-between;">' +
    '<div style="flex:1;cursor:pointer;" onclick="window.ipdEnhancement.loadWorkflow(...)">' +
    '...卡片内容...' +
    '</div>' +
    '<div style="margin-left:15px;">' +
    '<button onclick="event.stopPropagation();window.ipdEnhancement.deleteWorkflow(...)">' +
    '🗑️ 删除' +
    '</button>' +
    '</div>' +
    '</div>';
```

## 测试验证

### 测试文件
`tests/integration/test_ipd_delete_search.py`

### 测试用例

#### 1. 删除功能测试 (`test_delete_workflow`)
- ✅ 创建测试工作流
- ✅ 验证工作流存在
- ✅ 删除工作流
- ✅ 验证工作流已删除（返回 404）

#### 2. 搜索功能测试 (`test_search_workflows`)
- ✅ 创建包含不同关键词的测试工作流
- ✅ 搜索"产品经理" - 找到匹配记录
- ✅ 搜索"开发人员" - 找到匹配记录
- ✅ 搜索不存在的关键词 - 返回空列表
- ✅ 清理测试数据

### 测试结果
```
========================= 2 passed, 1 warning in 0.09s =========================
```

## 用户使用指南

### 删除故事卡
1. 点击"📋 查看历史记录"按钮
2. 在历史记录列表中找到要删除的卡片
3. 点击卡片右侧的"🗑️ 删除"按钮
4. 在确认对话框中点击"确定"
5. 系统将删除整个工作流（包括 IPD 十问、用户故事和 INVEST 分析）

### 搜索故事卡
1. 点击"📋 查看历史记录"按钮
2. 在搜索框中输入关键词（标题或角色）
3. 点击"🔍 搜索"按钮或按回车键
4. 列表将显示匹配的结果
5. 点击"清除"按钮可重置搜索

## 修改文件清单

### 后端文件
1. `backend/app/api/v1/ipd_story.py` - 添加删除 API 和搜索参数
2. `backend/app/services/ipd_story_service.py` - 实现删除逻辑和搜索功能

### 前端文件
1. `frontend/public/ipd-enhancement.js` - 添加搜索框、删除按钮和逻辑

### 测试文件
1. `backend/tests/integration/test_ipd_delete_search.py` - 删除和搜索功能测试

## 注意事项

### 删除操作
- **不可恢复**: 删除操作会永久删除数据，包括：
  - IPD 需求十问
  - 用户故事
  - INVEST 分析
- **确认对话框**: 用户需要确认后才会执行删除
- **权限控制**: 删除操作受租户隔离保护，只能删除自己租户的数据

### 搜索功能
- **模糊匹配**: 使用 `ILIKE` 进行不区分大小写的模糊匹配
- **搜索范围**: 搜索用户故事的标题和角色字段
- **空结果**: 搜索无匹配时返回空列表而不是错误
- **性能**: 使用数据库索引优化查询性能

### UI/UX
- **事件隔离**: 删除按钮使用 `event.stopPropagation()` 防止触发卡片点击事件
- **视觉反馈**: 删除按钮使用红色突出显示
- **状态管理**: 搜索后显示"清除"按钮，方便重置搜索

## 后续优化建议

1. **批量删除**: 支持选择多个工作流批量删除
2. **高级搜索**: 增加更多搜索条件（日期范围、优先级、评分区间等）
3. **删除确认**: 提供更详细的删除预览信息
4. **回收站**: 实现软删除和回收站功能
5. **搜索历史**: 保存用户的搜索历史
6. **导出搜索结果**: 支持导出搜索结果为 Excel 或 CSV

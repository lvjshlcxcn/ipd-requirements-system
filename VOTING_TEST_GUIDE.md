# 投票人员选择功能测试指南

## 测试时间
2026-02-04

## 功能说明

### 业务流程
1. 创建会议 → 会议开始 → 添加参会人员 → 添加待评审需求 → 点击待评审需求 → 开始投票
2. **投票人员选择**：从参会人员中选择投票人员
3. **投票流程**：选定的投票人员投票，投票后变成灰色（不能修改）
4. **投票完成**：所有投票人员投票完成后，投票流程完成
5. **结果统计**：投票结果自动统计，会议结束时存档

### 技术实现

#### 后端API（已验证✅）
- **GET** `/api/v1/requirement-review-meetings/{meeting_id}/requirements/{requirement_id}/voters`
  - 获取投票人员状态
  - 返回：assigned_voter_ids, voters列表, total_assigned, total_voted, is_complete

- **PATCH** `/api/v1/requirement-review-meetings/{meeting_id}/requirements/{requirement_id}/voters`
  - 更新投票人员列表
  - 请求体：`{"assigned_voter_ids": [2, 3]}`
  - 返回：更新后的会议需求信息

#### 前端组件（已修改✅）
- **组件位置**：`frontend/src/pages/review-center/components/VoterSelectionPanel.tsx`
- **功能**：
  1. 当没有投票人员时（`total_assigned = 0`），显示所有参会人员供选择
  2. 用户勾选参会人员后，自动调用API保存
  3. 显示投票进度条和投票状态
  4. 已投票的人员显示为灰色，不可取消

## 测试数据

### 会议信息
- **会议ID**: 45
- **会议编号**: RM-20260204-003
- **会议标题**: 测试会议-最终正确版本
- **会议状态**: in_progress（进行中）

### 参会人员
1. **attendee_id**: 2
   - **username**: market_pm
   - **full_name**: 市场产品经理
   - **status**: invited

2. **attendee_id**: 3
   - **username**: rd_pm
   - **full_name**: 研发产品经理
   - **status**: invited

### 需求信息
- **requirement_id**: 20
- **requirement_no**: REQ-2026-0016
- **title**: 如何吗我刚问
- **assigned_voter_ids**: [2, 3]（已设置）

## 测试步骤

### 1. 访问会议详情页
1. 打开浏览器：http://localhost:5173
2. 登录系统（如果需要）
3. 进入"评审中心" → 点击会议"RM-20260204-003"

### 2. 选择需求
1. 在会议详情页，点击需求"REQ-2026-0016: 如何吗我刚问"
2. 右侧应该显示"投票人员"面板

### 3. 设置投票人员
**场景A：首次设置（没有投票人员）**
1. "投票人员"面板显示："请勾选参会人员作为投票人员："
2. 显示所有参会人员（市场产品经理、研发产品经理）
3. 勾选想要设为投票人员的人员
4. 自动保存，显示成功提示"投票人员设置成功"

**场景B：已有投票人员**
1. "投票人员"面板显示：
   - 进度条：0/2（0%）
   - 投票人员列表（市场产品经理、研发产品经理）
   - 每人旁边显示"未投票"标签
2. 可以继续勾选/取消勾选（已投票的人不能取消）

### 4. 投票测试
1. 切换到某个投票人员的账号（如市场产品经理）
2. 在投票面板选择投票选项（通过/拒绝/弃权）
3. 点击"提交投票"
4. 刷新页面，该人员应显示为灰色，投票状态显示"通过"

### 5. 结束会议
1. 所有人员投票完成后，主持人点击"结束会议"
2. 系统自动存档投票结果
3. 查看"投票结果"菜单，应能看到存档的投票统计

## API测试命令

### 获取投票人员状态
```bash
curl -s 'http://localhost:8000/api/v1/requirement-review-meetings/45/requirements/20/voters' | python3 -m json.tool
```

### 设置投票人员
```bash
curl -s -X PATCH 'http://localhost:8000/api/v1/requirement-review-meetings/45/requirements/20/voters' \
  -H 'Content-Type: application/json' \
  -d '{"assigned_voter_ids": [2,3]}' | python3 -m json.tool
```

### 获取参会人员
```bash
curl -s 'http://localhost:8000/api/v1/requirement-review-meetings/45/attendees' | python3 -m json.tool
```

## 预期结果

### ✅ 已实现功能
1. 后端API正确返回投票人员状态
2. 前端组件显示所有参会人员供选择
3. 勾选后自动保存投票人员设置
4. 投票人员状态实时更新（每5秒刷新）
5. 投票进度条显示
6. 已投票人员显示为灰色

### 🔍 待验证功能
1. 投票功能是否正常工作
2. 投票后统计是否正确
3. 会议结束后的结果存档
4. 前端UI是否正常显示

## 问题排查

### 如果看不到投票人员面板
1. 检查是否选择了需求
2. 检查浏览器控制台是否有错误
3. 检查API是否返回数据

### 如果保存失败
1. 检查网络请求
2. 检查后端日志
3. 确认会议状态为"in_progress"

### 如果进度不更新
1. 刷新页面
2. 等待5秒自动刷新
3. 检查WebSocket连接（如果实现）

## 相关文件

### 后端
- `backend/app/api/v1/requirement_review_meetings.py` - API路由
- `backend/app/repositories/requirement_review_meeting.py` - 数据访问
- `backend/app/services/requirement_review_meeting.py` - 业务逻辑

### 前端
- `frontend/src/pages/review-center/components/VoterSelectionPanel.tsx` - 投票人员面板组件
- `frontend/src/services/reviewMeeting.service.ts` - API服务
- `frontend/src/types/review-meeting.ts` - 类型定义

## 测试状态
- [x] 后端API验证通过
- [x] 前端组件修改完成
- [ ] 前端UI实际测试（待用户验证）
- [ ] 投票流程完整测试（待用户验证）
- [ ] 结果存档验证（待用户验证）

## 下一步
请按照上述步骤在浏览器中测试，如有问题请反馈。

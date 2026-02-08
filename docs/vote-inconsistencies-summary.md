# 投票功能不一致点 - 快速参考

## 发现的7个不一致点

### P0 - 必须修复 (3个)

#### 1. 修改投票功能矛盾
- **前端**: 显示"修改投票"按钮 (`VotePanel.tsx:223`)
- **后端**: 明确拒绝修改 (`requirement_review_meetings.py:538-543`)
- **影响**: 用户看到修改按钮但点击失败
- **修复**: 要么后端支持修改，要么前端移除按钮

#### 2. 缺失 current-voter API
- **前端**: 调用 `GET /requirements/{id}/current-voter` (`reviewMeeting.service.ts:277`)
- **后端**: ❌ 未实现
- **影响**: 前端定义了不存在的API
- **修复**: 实现该端点或从前端移除

#### 3. 缺失 next-voter API
- **前端**: 调用 `POST /requirements/{id}/next-voter` (`reviewMeeting.service.ts:290`)
- **前端使用**: 主持人点击"下一位投票人"按钮 (`VotePanel.tsx:227`)
- **后端**: ❌ 未实现
- **影响**: 主持人无法切换投票人，核心功能缺失
- **修复**: 必须实现此端点

---

### P1 - 应该修复 (3个)

#### 4. 缺失 voting-session API
- **前端**: 定义了 `getVotingSession` 方法但未使用
- **后端**: ❌ 未实现
- **影响**: 代码混乱
- **修复**: 移除前端方法或实现端点

#### 5. admin投票权限不一致
- **前端**: admin无需参会即可投票 (`ReviewMeetingDetailPage.tsx:238`)
- **后端**: admin必须在参会列表中 (`requirement_review_meeting.py:114`)
- **影响**: admin可能看到投票界面但点击失败
- **修复**: 统一规则（建议都要求参会）

#### 6. 实时更新依赖轮询
- **前端**: 每5秒轮询3个API (`ReviewMeetingDetailPage.tsx:48,57,84`)
- **后端**: 无WebSocket/SSE支持
- **影响**: 延迟高，服务器负载大
- **修复**: 实现WebSocket或使用SSE

---

### P2 - 可以修复 (1个)

#### 7. 缺少投票修改历史
- **当前**: 投票表只有 created_at/updated_at
- **缺失**: 修改历史记录表
- **影响**: 无法审计投票修改
- **修复**: 创建 vote_history 表

---

## 最小可行修复 (MVP)

### 立即修复 (今天)
1. **next-voter API** - 主持人核心功能
2. **修改投票矛盾** - 移除前端"修改投票"按钮

### 本周修复
3. **current-voter API** - 实现或移除
4. **admin权限统一** - 前后端对齐

### 下个迭代
5. **WebSocket支持** - 提升体验
6. **投票历史** - 完善审计

---

## 关键代码位置

### 前端
```
frontend/src/pages/review-center/
  ├── ReviewMeetingDetailPage.tsx:233-239  (admin权限检查)
  └── components/
      └── VotePanel.tsx:223  (修改投票按钮)

frontend/src/services/
  └── reviewMeeting.service.ts
      ├── :277-285  (getCurrentVoter - 缺失后端)
      ├── :290-298  (moveToNextVoter - 缺失后端)
      └── :302-311  (getVotingSession - 未使用)
```

### 后端
```
backend/app/api/v1/
  └── requirement_review_meetings.py
      ├── :524-529  (API文档: no update allowed)
      ├── :538-543  (拒绝修改投票)
      └── :646-670  (get_voter_status 端点)

backend/app/services/
  └── requirement_review_meeting.py
      └── :93-119  (can_vote 权限检查)
```

---

## 测试检查点

修复后需要测试:
- [ ] 普通用户投票
- [ ] admin用户投票 (参会/不参会)
- [ ] 主持人切换投票人
- [ ] 修改已有投票 (如果支持)
- [ ] 实时更新 (轮询/WS)
- [ ] 权限边界检查

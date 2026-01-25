# ✅ 会话超时功能 - 测试指南（已修复）

## 修复内容

### 问题
倒计时在 5 和 4 之间来回跳变

### 根本原因
1. 倒计时期间，用户鼠标移动触发事件重置超时
2. 旧的倒计时 interval 还在运行
3. 新的倒计时从 5 开始
4. 两个倒计时冲突，导致数字跳变

### 解决方案
1. ✅ 在 `useSessionTimeout` 中添加 `isCountingDownRef` 标志
2. ✅ 倒计时开始时设置标志为 `true`
3. ✅ 倒计时期间检测到用户活动时：
   - 取消当前倒计时
   - 重置超时定时器
   - 调用 `onCancelCountdown` 通知 UI 隐藏 Modal
4. ✅ 简化 MainLayout，移除冗余的事件处理

## 当前配置（测试模式）

- ⏱️ **超时时间**: 10 秒
- ⏰ **警告时间**: 5 秒后开始倒计时
- 🐛 **调试模式**: 已开启

## 测试步骤

### 1. 刷新页面
按 `F5` 刷新浏览器

### 2. 确保已登录
查看右下角调试面板的 `isAuthenticated` 应该是 `true`（绿色）

### 3. 测试倒计时
- **保持页面静止** 5 秒
- 应该看到倒计时 Modal 弹出
- 倒计时应该从 5 → 4 → 3 → 2 → 1 → 0 平滑递减 ✅
- **不再跳变！**

### 4. 测试取消倒计时
在倒计时显示时：
- 点击"继续工作"按钮 → 倒计时消失 ✅
- 或任意位置点击 → 倒计时消失 ✅
- 超时重置，重新开始 10 秒计时 ✅

### 5. 测试自动登出
- 保持页面静止
- 等待 10 秒超时
- 应该自动跳转到登录页 ✅

## 预期的控制台日志

```javascript
// 初始化
[MainLayout] 认证状态已初始化
[SessionTimeout] 启动会话超时机制 {timeoutMs: 10000, warningSeconds: 5}

// 用户活动
[SessionTimeout] 检测到用户活动
[SessionTimeout] 重置超时定时器

// 5秒后倒计时开始
[SessionTimeout] 开始倒计时警告 {warningSeconds: 5}
[MainLayout] 倒计时: 5 active: false
[MainLayout] 倒计时: 4 active: true
[MainLayout] 倒计时: 3 active: true
[MainLayout] 倒计时: 2 active: true
[MainLayout] 倒计时: 1 active: true

// 用户点击取消
[SessionTimeout] 检测到用户活动，取消倒计时并重置超时
[MainLayout] 倒计时已取消
[SessionTimeout] 重置超时定时器

// 自动登出
[SessionTimeout] 执行自动登出
```

## 恢复正常配置

测试完成后，修改 `frontend/src/shared/components/layout/MainLayout.tsx` 第 44 行：

```typescript
const TEST_MODE = false // 恢复正常的 3 分钟超时
```

## 功能特性

| 特性 | 说明 |
|------|------|
| **超时时间** | 默认 3 分钟（可自定义） |
| **警告提示** | 提前 30 秒显示倒计时 Modal |
| **倒计时显示** | 大字体动态倒计时（5→4→3→2→1→0） |
| **取消方式** | 点击"继续工作"按钮或任意位置 |
| **视觉效果** | 倒计时 ≤10 秒时变红色 |
| **防抖动** | 倒计时平滑递减，不会跳变 ✅ |

## 技术改进

### Before（有问题的版本）
```typescript
// 每次鼠标移动都重置
onMouseMove={handleActivity}
handleActivity() → resetTimeout() → 倒计时重新开始
❌ 导致数字在 5 和 4 之间跳变
```

### After（修复后的版本）
```typescript
// 倒计时期间有特殊处理
if (isCountingDownRef.current) {
  // 取消倒计时，重置超时
  clearTimers()
  onCancelCountdown()
  resetTimeout()
}
✅ 倒计时平滑递减，用户点击后一次性取消
```

## 文件变更

**修改的文件：**
- `frontend/src/hooks/useSessionTimeout.ts` - 核心逻辑修复
- `frontend/src/shared/components/layout/MainLayout.tsx` - 简化事件处理
- `frontend/src/stores/useAuthStore.ts` - 添加 `initialize` 方法

## 注意事项

1. ✅ 倒计时现在平滑递减
2. ✅ 用户点击"继续工作"按钮立即取消倒计时
3. ✅ 倒计时期间任意点击都会取消并重置
4. ✅ 不再需要手动处理事件，`useSessionTimeout` 内部已处理

# 🧪 会话超时功能测试指南

## 当前配置（测试模式）

- ✅ **超时时间**: 10 秒
- ✅ **警告时间**: 5 秒（倒计时从 5 开始）
- ✅ **调试模式**: 已开启，可在控制台查看日志

## 测试步骤

### 1. 确保已登录
访问 http://localhost:5173 并登录

### 2. 打开浏览器控制台
按 `F12` 或 `Cmd+Option+I` (Mac) 打开开发者工具

### 3. 查看初始化日志
应该看到：
```
[MainLayout] 认证状态已初始化
[SessionTimeout] 启动会话超时机制 {timeoutMs: 10000, warningSeconds: 5}
```

### 4. 保持页面静止（不要移动鼠标、点击或按键）
等待 5 秒...

### 5. 预期结果
- **5 秒后**: 出现倒计时 Modal，显示剩余秒数
- **倒计时**: 5 → 4 → 3 → 2 → 1 → 0
- **颜色变化**: 前 3 秒橙色，最后 2 秥红色

### 6. 测试取消功能
在倒计时期间：
- 点击"继续工作"按钮 → 倒计时消失
- 或点击 Modal 外（无法关闭，必须点击按钮）
- 或移动鼠标 → 倒计时消失

### 7. 测试自动登出
如果倒计时结束：
- 自动跳转到登录页
- token 被清除

## 控制台日志示例

```javascript
// 初始化
[MainLayout] 认证状态已初始化
[SessionTimeout] 启动会话超时机制 {timeoutMs: 10000, warningSeconds: 5}

// 用户活动
[SessionTimeout] 检测到用户活动
[SessionTimeout] 重置超时定时器

// 倒计时开始
[MainLayout] 倒计时: 5
[MainLayout] 倒计时: 4
[MainLayout] 倒计时: 3
...

// 自动登出
[SessionTimeout] 执行自动登出
```

## 恢复正常配置

测试完成后，将 `MainLayout.tsx` 中的 `TEST_MODE` 设置为 `false`：

```typescript
const TEST_MODE = false // 恢复正常的 3 分钟超时
```

## 故障排查

### 问题 1: 没有看到倒计时

**检查认证状态：**
```javascript
// 在控制台运行
localStorage.getItem('auth-storage')
// 应该看到包含 token 和 isAuthenticated: true 的数据
```

**检查用户状态：**
```javascript
// 在控制台运行
localStorage.getItem('access_token')
// 应该有 token 值
```

### 问题 2: 倒计时没有消失

**手动重置：**
刷新页面（F5）或点击"继续工作"按钮

### 问题 3: 一会儿就登出了

**检查是否在测试模式：**
查看 `MainLayout.tsx:42` 行的 `TEST_MODE` 值

## 切换到生产配置

修改 `frontend/src/shared/components/layout/MainLayout.tsx`:

```typescript
const TEST_MODE = false // 关闭测试模式
useSessionTimeout({
  timeoutMs: 3 * 60 * 1000,  // 3 分钟
  warningSeconds: 30,        // 提前 30 秒警告
  debug: false,              // 关闭调试
  onCountdown: (seconds) => {
    if (!countdownVisible) {
      setCountdownVisible(true)
    }
    setCountdownSeconds(seconds)
  },
})
```

## 开发建议

- 开发时使用较长的超时时间（如 30 分钟）
- 生产环境使用 3-5 分钟
- 可在用户设置中添加自定义超时时间功能

# ✅ 会话超时功能 - 已完成

## 功能配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **超时时间** | 3 分钟 | 用户 3 分钟无操作自动登出 |
| **倒计时警告** | 提前 30 秒 | 在 2 分 30 秒时显示倒计时 Modal |
| **倒计时显示** | 30 → 29 → ... → 1 → 0 | 平滑递减，数字 ≤10 时变红色 |
| **取消方式** | 点击"继续工作"按钮或移动鼠标 | 取消倒计时并重置超时 |

## 使用说明

### 用户体验

1. **正常使用**（0-2分30秒）
   - 用户正常操作系统
   - 无任何提示
   - 后台静默计时

2. **倒计时警告**（2分30秒-3分钟）
   - 弹出 Modal 提示
   - 显示大字体倒计时：30 秒
   - 倒计时平滑递减
   - 用户可以：
     - 点击"继续工作"按钮取消倒计时
     - 或移动鼠标取消倒计时
     - 或等待倒计时结束自动登出

3. **自动登出**（3分钟）
   - 清除认证信息
   - 跳转到登录页

### 测试步骤

如果想快速测试功能，可以临时修改配置：

```typescript
// frontend/src/shared/components/layout/MainLayout.tsx
useSessionTimeout({
  timeoutMs: 30 * 1000, // 改为 30 秒测试
  warningSeconds: 5,    // 提前 5 秒警告
  debug: true,          // 开启调试日志
  onCountdown: handleCountdown,
  onCancelCountdown: handleCancelCountdown,
})
```

测试完成后改回：
```typescript
timeoutMs: 3 * 60 * 1000,  // 3 分钟
warningSeconds: 30,        // 提前 30 秒
debug: false,              // 关闭调试
```

## 技术实现

### 核心文件

```
frontend/src/
├── hooks/
│   └── useSessionTimeout.ts          # 会话超时 Hook（核心逻辑）
└── shared/components/layout/
    └── MainLayout.tsx                # 主布局（集成倒计时 Modal）
```

### 关键技术点

1. **使用 useRef 追踪倒计时状态**
   ```typescript
   const countdownActiveRef = useRef(false)
   const isCountingDownRef = useRef(false)
   ```

2. **使用 useCallback 避免循环依赖**
   ```typescript
   const handleCountdown = useCallback((seconds: number) => {
     // ...
   }, []) // 空依赖数组，函数只创建一次
   ```

3. **倒计时期间的特殊处理**
   ```typescript
   if (isCountingDownRef.current) {
     // 取消倒计时，重置超时
     clearTimers()
     onCancelCountdown()
     resetTimeout()
     return
   }
   ```

4. **防止定时器重复设置**
   - 不依赖会变化的状态（如 `countdownVisible`）
   - 使用 ref 而不是 state 来追踪内部状态
   - 清除旧定时器后再创建新的

## 故障排查

### 问题：倒计时不显示

**原因：** 用户未登录或 `isAuthenticated` 为 `false`

**解决：**
1. 检查是否已登录
2. 在控制台运行：`localStorage.getItem('auth-storage')`
3. 确认 `isAuthenticated: true`

### 问题：倒计时数字跳变

**原因：** 已修复！使用了 useCallback 和 ref 避免循环依赖

**如果再次出现：**
1. 检查 `handleCountdown` 是否使用了 `useCallback`
2. 确认依赖数组为空 `[]`
3. 确认使用 ref 而不是 state 来追踪倒计时状态

### 问题：倒计时取消后立即重新出现

**原因：** 用户继续移动鼠标，触发了新的倒计时

**解决：** 这是正常行为。倒计时期间的用户活动会：
1. 取消当前倒计时
2. 重置 3 分钟超时
3. 如果 2 分 30 秒内再次无活动，倒计时会重新出现

## 配置说明

### 修改超时时间

编辑 `frontend/src/shared/components/layout/MainLayout.tsx`:

```typescript
useSessionTimeout({
  timeoutMs: 5 * 60 * 1000,  // 改为 5 分钟
  warningSeconds: 60,        // 提前 1 分钟警告
  debug: false,
  onCountdown: handleCountdown,
  onCancelCountdown: handleCancelCountdown,
})
```

### 启用调试模式

```typescript
useSessionTimeout({
  timeoutMs: 3 * 60 * 1000,
  warningSeconds: 30,
  debug: true,  // 设置为 true
  onCountdown: handleCountdown,
  onCancelCountdown: handleCancelCountdown,
})
```

调试日志示例：
```javascript
[SessionTimeout] 启动会话超时机制 {timeoutMs: 180000, warningSeconds: 30}
[SessionTimeout] 检测到用户活动
[SessionTimeout] 重置超时定时器
[SessionTimeout] 开始倒计时警告 {warningSeconds: 30}
[SessionTimeout] 检测到用户活动，取消倒计时并重置超时
[SessionTimeout] 执行自动登出
```

## 安全建议

### 开发环境
- 设置较长的超时时间（如 30 分钟）
- 方便开发和调试

### 生产环境
- 使用 3-5 分钟超时
- 平衡安全性和用户体验

### 敏感操作
- 支付、删除等操作前可重新验证身份
- 结合后端 token 验证

## 未来优化建议

- [ ] 在用户设置中添加自定义超时时间功能
- [ ] 添加音效提醒
- [ ] 支持"再等 5 分钟"延长会话按钮
- [ ] 记录用户活动日志用于审计
- [ ] 支持多个标签页同步倒计时状态
- [ ] 添加"您即将被登出"的 Toast 提示（提前 1 分钟）

## 总结

✅ **功能已完成：**
- 3 分钟无活动自动登出
- 2 分 30 秒开始 30 秒倒计时
- 平滑的倒计时显示（无跳变）
- 用户可取消倒计时并重置
- 调试面板已移除
- 代码已优化，无循环依赖

✅ **代码质量：**
- 使用 TypeScript 类型安全
- 使用 React Hooks 最佳实践
- 使用 useCallback 避免不必要的重新渲染
- 使用 ref 管理内部状态
- 代码清晰，注释完整

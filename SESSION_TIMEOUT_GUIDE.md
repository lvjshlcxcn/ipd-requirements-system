# 会话超时功能说明

## 功能概述

实现了 **3 分钟无活动自动退出登录** 的安全功能，提升系统安全性，防止用户离开后他人操作。

## 功能特性

### 1. 自动超时
- 用户 **3 分钟** 无任何操作自动登出
- 支持自定义超时时间

### 2. 活动检测
监听以下用户活动事件：
- 鼠标移动
- 鼠标点击
- 键盘输入
- 页面滚动
- 触摸操作

### 3. 倒计时警告
- 超时前 **30 秒** 显示警告提示
- 大字体倒计时显示剩余时间
- 倒计时颜色变化：
  - > 10 秒：橙色警告
  - ≤ 10 秒：红色紧急

### 4. 用户交互
- 任意操作可取消倒计时并重置超时
- 点击"继续工作"按钮可立即取消
- Modal 提示无法通过点击遮罩关闭

## 技术实现

### 文件结构
```
frontend/src/
├── hooks/
│   └── useSessionTimeout.ts          # 会话超时 Hook（核心逻辑）
└── shared/components/layout/
    └── MainLayout.tsx                # 主布局（集成倒计时 Modal）
```

### 核心组件

#### 1. useSessionTimeout Hook
```typescript
// 基础使用
useSessionTimeout()

// 自定义配置
useSessionTimeout({
  timeoutMs: 5 * 60 * 1000,        // 5 分钟超时
  warningSeconds: 60,              // 提前 60 秒警告
  onCountdown: (seconds) => {      // 倒计时回调
    console.log(`剩余 ${seconds} 秒`)
  }
})
```

#### 2. MainLayout 集成
- 在主布局组件中调用 `useSessionTimeout`
- 显示倒计时 Modal
- 监听用户活动并隐藏倒计时

### 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| timeoutMs | number | 180000 (3分钟) | 超时时间（毫秒） |
| warningSeconds | number | 30 | 提前警告时间（秒） |
| onCountdown | function | - | 倒计时回调函数 |
| debug | boolean | false | 启用调试日志 |

## 测试步骤

### 1. 登录系统
```bash
# 启动前端
cd frontend
npm run dev
```

### 2. 测试超时功能
1. 登录后保持页面打开
2. **3 分钟内不进行任何操作**（不要移动鼠标、点击或按键）
3. 等待 **2 分 30 秒** 后应看到倒计时警告
4. 倒计时结束后自动跳转到登录页

### 3. 测试取消功能
1. 出现倒计时后
2. 点击"继续工作"按钮或任意位置
3. 倒计时应消失，超时重置

### 4. 测试活动重置
1. 在倒计时期间移动鼠标或点击
2. 倒计时应立即消失
3. 超时计时器重置

## 自定义配置

### 修改超时时间

编辑 `MainLayout.tsx`:
```typescript
useSessionTimeout({
  timeoutMs: 5 * 60 * 1000,  // 改为 5 分钟
  warningSeconds: 60,        // 提前 1 分钟警告
  onCountdown: (seconds) => {
    setCountdownSeconds(seconds)
    setCountdownVisible(true)
  },
})
```

### 修改警告时间

编辑 `MainLayout.tsx`:
```typescript
useSessionTimeout({
  timeoutMs: 3 * 60 * 1000,
  warningSeconds: 10,  // 改为提前 10 秒警告
  onCountdown: (seconds) => {
    setCountdownSeconds(seconds)
    setCountdownVisible(true)
  },
})
```

## 注意事项

1. **仅在登录状态生效**：未登录时不会启动超时机制
2. **页面切换**：切换浏览器标签页不影响超时计时
3. **调试模式**：可设置 `debug: true` 查看控制台日志
4. **清理机制**：组件卸载时自动清理所有定时器

## 安全建议

- **开发环境**：可以设置更长的超时时间（如 30 分钟）
- **生产环境**：建议使用 3-5 分钟超时
- **敏感操作**：支付、删除等操作前可重新验证身份

## 后续优化

可选的增强功能：
- [ ] 后端配合验证 token 有效性
- [ ] 支持在用户设置中自定义超时时间
- [ ] 添加音效提醒
- [ ] 支持延长会话按钮（"再等 5 分钟"）
- [ ] 记录用户活动日志用于审计

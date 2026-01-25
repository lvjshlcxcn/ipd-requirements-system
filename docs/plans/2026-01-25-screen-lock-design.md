# 屏幕自动锁定功能设计

**日期:** 2026-01-25
**作者:** Claude & User
**状态:** 设计阶段

## 1. 功能概述

实现 **1 分钟无活动自动锁屏** 的安全功能，用户需要输入密码才能继续使用。该功能在现有的会话超时机制基础上扩展，提供用户友好的安全防护。

### 核心需求
- 1 分钟无活动后自动锁定屏幕
- 用户输入密码解锁（无需重新输入用户名）
- 锁定前 10 秒显示倒计时警告
- 密码错误 5 次后强制登出
- 刷新页面后保持锁定状态
- 锁定界面显示用户名

---

## 2. 架构设计

### 2.1 整体架构

采用**双层超时机制**，在现有 `useSessionTimeout` Hook 基础上扩展：

```
┌─────────────────────────────────────────┐
│           用户活动检测                    │
│    (mousemove, keydown, click...)        │
└────────────┬────────────────────────────┘
             │
             ├─→ 1分钟无活动 → 锁定屏幕（主要机制）
             │
             └─→ 3分钟无活动 → 强制登出（安全兜底）
```

**设计理念：**
- 锁屏作为温和的安全措施，用户体验优先
- 强制登出作为最后防线，确保绝对安全

### 2.2 技术栈

- **状态管理:** Zustand (复用现有 `useAuthStore`)
- **持久化:** localStorage (存储锁定状态、失败次数、用户名)
- **UI 组件:** Ant Design Modal + 自定义遮罩层
- **密码验证:** 复用现有登录 API

### 2.3 文件结构

```
frontend/src/
├── hooks/
│   └── useSessionTimeout.ts          # 扩展：支持锁定模式
├── stores/
│   └── useAuthStore.ts               # 扩展：增加锁定状态
├── shared/components/layout/
│   ├── MainLayout.tsx                # 集成锁屏功能
│   └── ScreenLockModal.tsx           # 新建：锁定遮罩组件
└── services/
    └── api.ts                        # 复用：验证密码接口
```

---

## 3. 核心组件设计

### 3.1 扩展 useSessionTimeout Hook

**文件位置:** `frontend/src/hooks/useSessionTimeout.ts`

**新增参数:**
```typescript
interface SessionTimeoutOptions {
  // 现有参数
  timeoutMs?: number                  // 超时时间（毫秒）
  warningSeconds?: number             // 倒计时警告时间（秒）
  onCountdown?: (seconds: number) => void  // 倒计时回调

  // 新增参数
  mode?: 'lock' | 'logout'            // 超时模式
  onLock?: () => void                  // 锁定回调
  lockTimeoutMs?: number               // 锁定超时时间
}
```

**实现逻辑:**
- `mode='lock'` 时，超时调用 `onLock()` 而非 `logout()`
- 支持同时设置两个定时器：
  - 锁屏定时器：1 分钟
  - 登出定时器：3 分钟（安全兜底）
- 锁定倒计时（10秒）与现有倒计时机制复用

**使用示例:**
```typescript
// MainLayout.tsx
useSessionTimeout({
  mode: 'lock',
  lockTimeoutMs: 1 * 60 * 1000,      // 1分钟锁定
  timeoutMs: 3 * 60 * 1000,          // 3分钟登出
  warningSeconds: 10,                // 10秒倒计时
  onLock: () => {
    lockScreen(user?.username || '')
  },
  onCountdown: (seconds) => {
    setShowLockWarning(true)
    setCountdownSeconds(seconds)
  }
})
```

### 3.2 扩展 useAuthStore

**文件位置:** `frontend/src/stores/useAuthStore.ts`

**新增状态:**
```typescript
interface AuthState {
  // 现有状态
  user: User | null
  token: string | null
  isAuthenticated: boolean

  // 新增状态
  isLocked: boolean                   // 是否锁定
  failedPasswordAttempts: number      // 密码错误次数
  lockedUsername: string | null       // 锁定的用户名

  // 现有方法
  login: (username: string, password: string) => Promise<void>
  logout: () => void

  // 新增方法
  lockScreen: (username: string) => void
  unlockScreen: (password: string) => Promise<boolean>
  resetFailedAttempts: () => void
  loadLockState: () => void           // 从 localStorage 恢复
}
```

**实现逻辑:**
```typescript
lockScreen: (username: string) => {
  set({ isLocked: true, lockedUsername: username })
  localStorage.setItem('app_screen_locked', 'true')
  localStorage.setItem('app_locked_username', username)
  localStorage.setItem('app_locked_time', Date.now().toString())
}

unlockScreen: async (password: string) => {
  const state = get()
  const response = await api.verifyPassword(state.lockedUsername, password)

  if (response.success) {
    // 清除锁定状态
    localStorage.removeItem('app_screen_locked')
    localStorage.removeItem('app_locked_username')
    localStorage.removeItem('app_locked_time')
    localStorage.removeItem('app_failed_attempts')

    set({
      isLocked: false,
      lockedUsername: null,
      failedPasswordAttempts: 0
    })
    return true
  } else {
    // 增加失败次数
    const attempts = (state.failedPasswordAttempts || 0) + 1
    localStorage.setItem('app_failed_attempts', attempts.toString())

    if (attempts >= 5) {
      // 5次失败，强制登出
      state.logout()
    } else {
      set({ failedPasswordAttempts: attempts })
    }
    return false
  }
}
```

### 3.3 新建 ScreenLockModal 组件

**文件位置:** `frontend/src/shared/components/layout/ScreenLockModal.tsx`

**组件功能:**
- 全屏遮罩层，覆盖所有内容
- 显示用户名和欢迎语
- 密码输入框 + 解锁按钮
- 错误提示（剩余尝试次数）
- 支持 Enter 键提交
- 不可点击遮罩关闭

**核心代码:**
```typescript
import { Modal, Input, Button, message } from 'antd'
import { useAuthStore } from '@/stores/useAuthStore'
import { useState } from 'react'

export function ScreenLockModal() {
  const { isLocked, lockedUsername, unlockScreen, logout, failedPasswordAttempts } = useAuthStore()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isLocked) return null

  const handleUnlock = async () => {
    setLoading(true)
    setError('')

    const success = await unlockScreen(password)

    if (!success) {
      const remaining = 5 - (failedPasswordAttempts + 1)
      if (remaining > 0) {
        setError(`密码错误，剩余 ${remaining} 次尝试机会`)
      } else {
        message.error('密码错误次数过多，已强制登出')
      }
    }

    setLoading(false)
  }

  return (
    <Modal
      open={true}
      closable={false}
      maskClosable={false}
      centered
      width={400}
      footer={null}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <h2>欢迎回来，{lockedUsername}</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>请输入密码解锁</p>

        <Input.Password
          size="large"
          placeholder="请输入密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={handleUnlock}
          style={{ marginBottom: '20px' }}
        />

        {error && (
          <div style={{ color: '#ff4d4f', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          onClick={handleUnlock}
        >
          解锁
        </Button>
      </div>
    </Modal>
  )
}
```

---

## 4. 数据流和状态管理

### 4.1 localStorage 存储

```typescript
const STORAGE_KEYS = {
  LOCKED: 'app_screen_locked',           // boolean: 是否锁定
  LOCKED_USERNAME: 'app_locked_username', // string: 锁定的用户名
  LOCKED_TIME: 'app_locked_time',         // timestamp: 锁定时间
  FAILED_ATTEMPTS: 'app_failed_attempts'  // number: 失败次数
}
```

### 4.2 核心数据流

#### 正常使用 → 锁定流程
```
用户活动检测 → 1分钟无活动
  → 触发倒计时警告（10秒）
  → 用户无操作 → 触发 onLock()
  → store.lockScreen(username)
  → 保存到 localStorage
  → 显示 ScreenLockModal
```

#### 锁定 → 解锁流程
```
用户输入密码 → 点击解锁
  → 调用 API 验证密码
  → 成功：
    - 清除锁定状态
    - 隐藏 Modal
    - 重置定时器
  → 失败：
    - failedAttempts++
    - < 5次：显示错误提示
    - = 5次：强制 logout()
```

#### 页面刷新流程
```
页面加载 → 检查 localStorage.locked
  → true：
    - 恢复锁定状态
    - 显示 ScreenLockModal
  → false：
    - 正常初始化
```

### 4.3 活动检测复用

现有的活动检测事件无需修改：
- `mousedown`, `mousemove`, `keydown`, `scroll`, `touchstart`, `click`

**特殊处理:**
- 锁定状态下，忽略所有活动事件（不重置定时器）
- 解锁成功后，恢复活动检测

---

## 5. 锁定界面设计

### 5.1 ScreenLockModal UI

```
┌─────────────────────────────────────┐
│         全屏半透明遮罩层               │
│  ┌──────────────────────────┐       │
│  │   欢迎回来，张三           │       │
│  │                          │       │
│  │   [密码输入框]            │       │
│  │   🔒 请输入密码解锁       │       │
│  │                          │       │
│  │   [解锁] 按钮            │       │
│  │                          │       │
│  │   ⚠️ 密码错误，剩余 3 次   │       │  ← 仅错误时显示
│  └──────────────────────────┘       │
└─────────────────────────────────────┘
```

**视觉设计要点:**
- **遮罩层:** `backdrop-filter: blur(8px)` 背景模糊效果
- **模态框:** 居中显示，宽度 400px，圆角卡片设计
- **用户名:** 大字体，醒目显示
- **密码框:** 带锁定图标，占位符提示
- **错误提示:** 红色文字，动态显示剩余次数
- **Modal 配置:** `closable={false}`, `maskClosable={false}`

### 5.2 倒计时警告 Modal

```
┌──────────────────────────┐
│   ⏰ 即将锁定屏幕          │
│                          │
│   剩余 10 秒              │  ← 大字体，倒计时
│                          │
│   [继续工作] 按钮         │
└──────────────────────────┘
```

**交互逻辑:**
- 倒计时期间，任何操作都取消倒计时并重置定时器
- 点击"继续工作"立即取消
- 倒计时结束自动锁定

---

## 6. 安全考虑

### 6.1 安全防护措施

**1. 密码验证安全**
- 使用现有登录 API 验证密码（后端验证）
- 不在前端存储明文密码
- 验证失败不泄露具体错误信息

**2. 防暴力破解**
- 5次失败后强制登出
- 锁定期间禁用所有后台操作
- 每次失败后记录到日志

**3. 状态一致性**
- 锁定状态下禁用所有路由跳转
- 锁定状态下拦截所有 API 请求
- 使用 Zustand 确保全局状态同步

**4. 会话超时兜底**
- 即使锁屏被绕过，3分钟后仍会强制登出
- 后端 token 过期时间保持不变（7天）
- 前端锁屏与后端安全独立运作

### 6.2 错误处理

#### 网络错误（解锁时）
```
用户输入密码 → API 请求失败
  → 显示友好提示："网络连接失败，请重试"
  → 不消耗失败次数
  → 允许重试
```

#### Token 过期（解锁时）
```
验证密码 → 后端返回 401
  → 清除本地认证状态
  → 强制跳转登录页
  → 提示："会话已过期，请重新登录"
```

#### localStorage 被清除
```
用户清除浏览器数据
  → 检测到锁定状态丢失
  → 自动解锁（用户已主动清除数据）
  → 或：保持后端 token 有效，继续正常使用
```

#### 多标签页同步
```
标签页 A 锁定 → localStorage 变化
  → 标签页 B 监听 storage 事件
  → 同步锁定状态
  → 所有标签页同时锁定
```

---

## 7. API 接口需求

### 7.1 验证密码接口

**复用现有登录 API**, 后端可能需要调整：

```typescript
// frontend/src/services/api.ts
export async function verifyPassword(username: string, password: string): Promise<{
  success: boolean
  message?: string
}> {
  // 方式1: 调用登录接口，验证用户名密码
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })

  // 方式2: 新增专门的验证接口（推荐）
  const response = await fetch('/api/v1/auth/verify-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ password })
  })

  return response.json()
}
```

**后端实现建议:**
```python
# backend/app/routes/auth.py
@router.post("/verify-password")
async def verify_password(
    password_data: PasswordVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """验证当前用户密码"""
    if not verify_password(password_data.password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="密码错误")

    return {"success": True}
```

---

## 8. 测试计划

### 8.1 功能测试

| 测试场景 | 预期结果 |
|---------|---------|
| 1分钟无操作 | 自动锁定，显示遮罩层 |
| 锁定前10秒 | 显示倒计时警告 |
| 倒计时期间操作 | 取消倒计时，重置定时器 |
| 输入正确密码 | 解锁成功，继续使用 |
| 输入错误密码 | 显示错误提示，剩余次数-1 |
| 5次密码错误 | 强制登出，跳转登录页 |
| 刷新页面（锁定状态） | 保持锁定，显示遮罩层 |
| 刷新页面（未锁定） | 正常使用 |

### 8.2 边界测试

| 测试场景 | 预期结果 |
|---------|---------|
| 锁定状态下网络断开 | 显示友好错误提示 |
| 锁定状态下 Token 过期 | 提示会话过期，跳转登录 |
| 多标签页同时使用 | 所有标签页同步锁定 |
| 清除 localStorage | 恢复正常或保持后端 token |
| 锁定期间收到通知 | 锁定状态不受影响 |

### 8.3 安全测试

| 测试场景 | 预期结果 |
|---------|---------|
| 尝试绕过前端锁定 | 3分钟后强制登出 |
| 暴力破解密码 | 5次失败后登出 |
| XSS 攻击尝试 | 密码不存储在前端 |
| CSRF 攻击 | 需要有效的 Authorization token |

---

## 9. 实施步骤

### 9.1 前端开发

1. **扩展 useSessionTimeout Hook**
   - 添加 `mode` 参数支持
   - 添加 `onLock` 回调
   - 实现双层定时器（1分钟锁定 + 3分钟登出）

2. **扩展 useAuthStore**
   - 添加锁定相关状态
   - 实现 `lockScreen`, `unlockScreen` 方法
   - 实现 localStorage 持久化逻辑

3. **创建 ScreenLockModal 组件**
   - 实现锁定界面 UI
   - 实现密码验证逻辑
   - 实现错误提示和失败次数限制

4. **集成到 MainLayout**
   - 调用 `useSessionTimeout` 设置锁定模式
   - 渲染 `ScreenLockModal`
   - 实现倒计时警告 Modal

5. **创建路由守卫**
   - 锁定状态下拦截路由跳转
   - 锁定状态下拦截 API 请求

### 9.2 后端开发

1. **新增验证密码接口**（可选）
   - 创建 `/api/v1/auth/verify-password` 端点
   - 验证当前用户密码
   - 返回验证结果

2. **测试现有登录接口**
   - 确认可以复用登录接口验证密码
   - 验证安全性

### 9.3 测试

1. **单元测试**
   - 测试 `useSessionTimeout` 锁定逻辑
   - 测试 `useAuthStore` 状态管理
   - 测试 `ScreenLockModal` 组件

2. **集成测试**
   - 测试完整的锁定/解锁流程
   - 测试持久化恢复
   - 测试多标签页同步

3. **端到端测试**
   - 使用 Playwright 测试用户场景
   - 测试网络错误处理
   - 测试安全性

---

## 10. 后续优化

### 可选功能

- [ ] 支持在用户设置中自定义超时时间
- [ ] 添加 PIN 码快速解锁功能
- [ ] 添加生物识别解锁（指纹、Face ID）
- [ ] 锁定期间显示用户头像
- [ ] 添加"退出登录"按钮到锁定界面
- [ ] 记录锁定/解锁日志用于审计
- [ ] 支持管理员远程解锁用户账户

### 性能优化

- [ ] 使用 Web Worker 处理定时器，避免主线程阻塞
- [ ] 优化 localStorage 读写频率
- [ ] 添加防抖处理用户活动事件

---

## 11. 风险和挑战

### 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 浏览器兼容性问题 | 部分用户无法使用 | 使用标准 API，测试主流浏览器 |
| localStorage 被禁用 | 锁定状态丢失 | 降级到内存存储，页面刷新后不锁定 |
| 性能影响 | 频繁的定时器消耗资源 | 优化事件监听，使用节流 |

### 用户体验风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 锁定太频繁 | 用户厌烦 | 提供可配置的超时时间 |
| 解锁失败 | 用户无法使用 | 提供清晰的错误提示和重试机制 |
| 多标签页不同步 | 混淆用户 | 使用 storage 事件同步所有标签页 |

---

## 12. 总结

本设计方案在现有会话超时机制基础上扩展，实现 1 分钟无活动自动锁屏功能。核心特点：

✅ **用户友好** - 密码快速解锁，无需重新登录
✅ **安全可靠** - 双层超时机制，防暴力破解
✅ **状态持久** - 刷新页面保持锁定
✅ **架构清晰** - 复用现有代码，改动最小
✅ **可扩展性** - 易于添加更多安全功能

该设计平衡了安全性和用户体验，适合需求管理系统的使用场景。

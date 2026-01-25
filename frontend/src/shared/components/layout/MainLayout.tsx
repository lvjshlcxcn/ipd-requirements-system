import { Layout, Menu, Space, Button, Tooltip, Modal, message, Statistic } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MENU_ITEMS } from '@/shared/constants'
import { DeepSeekIcon, ClaudeIcon } from '@/components/AIIcons'
import { UserOutlined, LogoutOutlined, MenuOutlined, ExclamationCircleOutlined, LockOutlined } from '@ant-design/icons'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { useAuthStore } from '@/stores/useAuthStore'
import { ScreenLockModal } from './ScreenLockModal'
// import { SessionTimeoutDebugger } from '@/components/debug/SessionTimeoutDebugger' // 调试面板（已禁用）

const { Header, Sider, Content } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, initialize, lockScreen, user, isLocked } = useAuthStore()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [countdownVisible, setCountdownVisible] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const countdownActiveRef = useRef(false)

  // 锁屏相关状态
  const [lockCountdownVisible, setLockCountdownVisible] = useState(false)
  const [lockCountdownSeconds, setLockCountdownSeconds] = useState(0)
  const lockCountdownActiveRef = useRef(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user_info')
    if (userStr) {
      try {
        setUserInfo(JSON.parse(userStr))
      } catch (e) {
        console.error('Failed to parse user info:', e)
      }
    }

    // 初始化认证状态
    initialize()

    // 加载锁定状态
    useAuthStore.getState().loadLockState()
  }, [initialize])

  // 使用 useCallback 包装回调，防止每次渲染都重新创建
  // 注意：不依赖 countdownVisible，避免循环依赖
  const handleCountdown = useCallback((seconds: number) => {
    if (!countdownActiveRef.current) {
      countdownActiveRef.current = true
      setCountdownVisible(true)
    }
    setCountdownSeconds(seconds)
  }, []) // 空依赖数组，函数只创建一次

  const handleCancelCountdown = useCallback(() => {
    setCountdownVisible(false)
    countdownActiveRef.current = false
  }, [])

  // 锁屏倒计时处理函数
  const handleLockCountdown = useCallback((seconds: number) => {
    console.log('[MainLayout] 锁屏屏倒计时更新:', seconds, '秒')
    if (!lockCountdownActiveRef.current) {
      lockCountdownActiveRef.current = true
      setLockCountdownVisible(true)
      console.log('[MainLayout] 锁屏倒计时 Modal 已显示')
    }
    // 使用函数式更新确保每次都能获取最新值
    setLockCountdownSeconds(seconds)
  }, [])

  const handleCancelLockCountdown = useCallback(() => {
    setLockCountdownVisible(false)
    lockCountdownActiveRef.current = false
  }, [])

  // 锁定回调 - 使用 useCallback 防止每次渲染都重新创建
  const handleLock = useCallback(() => {
    // 优先使用 store 中的 user，其次使用 localStorage，最后使用已保存的 lockedUsername
    let username = user?.username || userInfo?.username

    // 如果当前无法获取用户名，尝试从已保存的锁屏状态中获取
    if (!username) {
      const savedUsername = useAuthStore.getState().lockedUsername ||
                           localStorage.getItem('app_locked_username')
      if (savedUsername) {
        username = savedUsername
        console.log('[MainLayout] 使用已保存的用户名:', username)
      }
    }

    // 如果仍然无法获取用户名，记录错误但不锁定（避免使用虚假用户名）
    if (!username) {
      console.error('[MainLayout] 无法获取用户名，跳过锁屏', {
        'store.user': user,
        'userInfo': userInfo,
        'lockedUsername': useAuthStore.getState().lockedUsername
      })
      return
    }

    console.log('[MainLayout] 执行锁屏，用户名:', username, '(store.user:', user, ')')
    lockScreen(username)
  }, [lockScreen, user, userInfo])

  // 会话超时管理（锁定模式：1分钟无活动自动锁定，3分钟强制登出作为安全兜底）
  // 正式配置：1分钟锁定，提前10秒开始倒计时，3分钟登出作为安全兜底
  const { resetTimeout: resetSessionTimeout } = useSessionTimeout({
    mode: 'lock',
    lockTimeoutMs: 1 * 60 * 1000, // 1 分钟锁定
    timeoutMs: 3 * 60 * 1000, // 3 分钟登出（安全兜底）
    warningSeconds: 10, // 提前 10 秒开始倒计时
    debug: true, // 开启调试日志以诊断倒计时问题
    onLock: handleLock,
    onCountdown: handleLockCountdown,
    onCancelCountdown: handleCancelLockCountdown,
  })

  // 手动取消锁屏倒计时（点击"继续工作"按钮时调用）
  const handleContinueWork = useCallback(() => {
    console.log('[MainLayout] 用户点击"继续工作"按钮（锁屏倒计时）')
    handleCancelLockCountdown()
    resetSessionTimeout()
  }, [handleCancelLockCountdown, resetSessionTimeout])

  // 手动取消登出倒计时（点击"继续工作"按钮时调用）
  const handleContinueLogout = useCallback(() => {
    console.log('[MainLayout] 用户点击"继续工作"按钮（登出倒计时）')
    handleCancelCountdown()
    resetSessionTimeout()
  }, [handleCancelCountdown, resetSessionTimeout])

  // 监听解锁状态变化，解锁成功后重置会话超时
  const prevLockedRef = useRef(isLocked)
  useEffect(() => {
    if (prevLockedRef.current && !isLocked) {
      console.log('[MainLayout] 检测到解锁成功，重置会话超时定时器')
      resetSessionTimeout()
    }
    prevLockedRef.current = isLocked
  }, [isLocked, resetSessionTimeout])

  // 修复: 使用正确的 onClick 签名
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗?',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        logout()
        localStorage.removeItem('user_info')
        message.success('已退出登录')
        navigate('/login')
      },
    })
  }

  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          padding: '16px',
          color: 'white',
          textAlign: 'center',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingLeft: collapsed ? '0' : '24px'
        }}>
          {!collapsed && (
            <h2 style={{ color: 'white', margin: 0, fontSize: '18px' }}>IPD需求管理</h2>
          )}
          {collapsed && (
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>IPD</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={MENU_ITEMS}
          onClick={handleMenuClick}
          inlineCollapsed={collapsed}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleCollapsed}
              style={{ fontSize: '16px', width: 48, height: 48 }}
            />
            <h1 style={{ margin: 0 }}>IPD Requirements Management</h1>
          </Space>
          <Space size="middle">
            <Tooltip title="DeepSeek AI">
              <Button
                type="primary"
                icon={<DeepSeekIcon width={20} height={20} />}
                onClick={() => window.open('https://chat.deepseek.com/', '_blank')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  width: '44px',
                  height: '44px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </Tooltip>
            <Tooltip title="Claude AI">
              <Button
                type="primary"
                icon={<ClaudeIcon width={20} height={20} />}
                onClick={() => window.open('https://claude.ai/', '_blank')}
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                  border: 'none',
                  width: '44px',
                  height: '44px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </Tooltip>
            <span style={{ color: '#666' }}>
              <UserOutlined /> {userInfo?.username || 'User'}
            </span>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              退出
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px', padding: '24px', background: '#fff' }}>
          {children}
        </Content>
      </Layout>

      {/* 屏幕锁定倒计时警告 */}
      <Modal
        title={
          <Space>
            <LockOutlined style={{ color: '#faad14', fontSize: '20px' }} />
            <span>即将锁定屏幕</span>
          </Space>
        }
        open={lockCountdownVisible}
        onCancel={handleContinueWork}
        footer={[
          <Button key="continue" type="primary" onClick={handleContinueWork}>
            继续工作
          </Button>,
        ]}
        maskClosable={false}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '16px', marginBottom: '20px' }}>
            由于长时间未操作，屏幕将在 <strong style={{ color: '#ff4d4f' }}>{lockCountdownSeconds}</strong> 秒后自动锁定
          </p>
          <Statistic
            value={lockCountdownSeconds}
            suffix="秒"
            valueStyle={{ color: lockCountdownSeconds <= 5 ? '#ff4d4f' : '#faad14', fontSize: '48px' }}
          />
          <p style={{ color: '#666', marginTop: '20px' }}>
            点击"继续工作"按钮或移动鼠标可取消锁定
          </p>
        </div>
      </Modal>

      {/* 屏幕锁定 Modal */}
      <ScreenLockModal />

      {/* 会话超时倒计时提示 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '20px' }} />
            <span>会话即将超时</span>
          </Space>
        }
        open={countdownVisible}
        onCancel={handleContinueLogout}
        footer={[
          <Button key="continue" type="primary" onClick={handleContinueLogout}>
            继续工作
          </Button>,
        ]}
        maskClosable={false}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '16px', marginBottom: '20px' }}>
            由于长时间未操作，您的会话即将在 <strong style={{ color: '#ff4d4f' }}>{countdownSeconds}</strong> 秒后自动退出
          </p>
          <Statistic
            value={countdownSeconds}
            suffix="秒"
            valueStyle={{ color: countdownSeconds <= 10 ? '#ff4d4f' : '#faad14', fontSize: '48px' }}
          />
          <p style={{ color: '#666', marginTop: '20px' }}>
            点击"继续工作"按钮或移动鼠标可取消自动退出
          </p>
        </div>
      </Modal>
    </Layout>
  )
}

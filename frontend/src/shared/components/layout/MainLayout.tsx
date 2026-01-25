import { Layout, Menu, Space, Button, Tooltip, Modal, message, Statistic } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MENU_ITEMS } from '@/shared/constants'
import { DeepSeekIcon, ClaudeIcon } from '@/components/AIIcons'
import { UserOutlined, LogoutOutlined, MenuOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { useAuthStore } from '@/stores/useAuthStore'
// import { SessionTimeoutDebugger } from '@/components/debug/SessionTimeoutDebugger' // 调试面板（已禁用）

const { Header, Sider, Content } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, initialize } = useAuthStore()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [countdownVisible, setCountdownVisible] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const countdownActiveRef = useRef(false)

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

  // 会话超时管理（3 分钟无活动自动登出）
  // 正式配置：3分钟超时，提前30秒（2分30秒）开始倒计时
  useSessionTimeout({
    timeoutMs: 3 * 60 * 1000, // 3 分钟超时
    warningSeconds: 30, // 提前 30 秒开始倒计时（即 2分30秒时）
    debug: false, // 关闭调试日志
    onCountdown: handleCountdown,
    onCancelCountdown: handleCancelCountdown,
  })

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

      {/* 会话超时倒计时提示 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '20px' }} />
            <span>会话即将超时</span>
          </Space>
        }
        open={countdownVisible}
        onCancel={() => {}} // 不需要处理，useSessionTimeout 会监听点击事件
        footer={[
          <Button key="continue" type="primary" onClick={() => {}}>
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

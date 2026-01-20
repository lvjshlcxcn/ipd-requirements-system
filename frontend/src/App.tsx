import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Button, Space, Tooltip, message, Modal } from 'antd'
import { useState, useEffect } from 'react'
import { DeepSeekIcon, ClaudeIcon } from '@/components/AIIcons'
import { RTMPage } from '@/pages/rtm/RTMPage'
import VerificationListPage from '@/pages/verifications/VerificationListPage'
import VerificationChecklistForm from '@/pages/verifications/VerificationChecklistForm'
import VerificationOverviewPage from '@/pages/verifications/VerificationOverviewPage'

// Import extracted page components
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { RequirementsListPage } from '@/features/requirements/pages/RequirementsListPage'
import { RequirementEditPage } from '@/features/requirements/pages/RequirementEditPage'
import { AnalyticsPage } from '@/features/analytics/pages/AnalyticsPage'
import { DistributionPage } from '@/features/distribution/pages/DistributionPage'

import {
  DashboardOutlined,
  FileTextOutlined,
  BarChartOutlined,
  PartitionOutlined,
  CheckCircleOutlined,
  SendOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/requirements', icon: <FileTextOutlined />, label: '需求管理' },
  { key: '/verification', icon: <CheckCircleOutlined />, label: '需求验证' },
  { key: '/analytics', icon: <BarChartOutlined />, label: '需求分析' },
  { key: '/distribution', icon: <SendOutlined />, label: '需求分发' },
  { key: '/rtm', icon: <PartitionOutlined />, label: '需求跟踪' },
]

function MainLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user_info')
    if (userStr) {
      try {
        setUserInfo(JSON.parse(userStr))
      } catch (e) {
        console.error('Failed to parse user info:', e)
      }
    }
  }, [])

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        localStorage.removeItem('access_token')
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
          items={menuItems}
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
    </Layout>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default function App() {
  const token = localStorage.getItem('access_token')

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Navigate to="/dashboard" replace />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RequirementsListPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements/new"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RequirementEditPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements/edit/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RequirementEditPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AnalyticsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/distribution"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DistributionPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rtm"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RTMPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/verification"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VerificationOverviewPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements/:requirementId/verification"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VerificationListPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements/:requirementId/verification/create"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VerificationChecklistForm mode="create" />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements/:requirementId/verification/:checklistId"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VerificationChecklistForm mode="view" />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements/:requirementId/verification/:checklistId/edit"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VerificationChecklistForm mode="edit" />
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  BarChartOutlined,
  PartitionOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/requirements', icon: <FileTextOutlined />, label: '需求管理' },
  { key: '/analytics', icon: <BarChartOutlined />, label: '需求分析' },
  { key: '/rtm', icon: <PartitionOutlined />, label: '需求追溯矩阵 (RTM)' },
  { key: '/verifications', icon: <CheckCircleOutlined />, label: '需求验证' },
]

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} theme="dark">
        <div style={{ padding: '16px', color: 'white', textAlign: 'center' }}>
          <h2 style={{ color: 'white', margin: 0 }}>IPD需求管理</h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
          <h1 style={{ fontSize: 20, margin: '16px 0' }}>IPD Requirements Management System</h1>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: '24px' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout

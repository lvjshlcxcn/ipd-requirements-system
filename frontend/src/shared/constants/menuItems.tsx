import { DashboardOutlined, FileTextOutlined, CheckCircleOutlined, BarChartOutlined, SendOutlined, PartitionOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

export const MENU_ITEMS: MenuProps['items'] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/requirements', icon: <FileTextOutlined />, label: '需求管理' },
  { key: '/verification', icon: <CheckCircleOutlined />, label: '需求验证' },
  { key: '/analytics', icon: <BarChartOutlined />, label: '需求分析' },
  { key: '/distribution', icon: <SendOutlined />, label: '需求分发' },
  { key: '/rtm', icon: <PartitionOutlined />, label: '需求跟踪' },
]

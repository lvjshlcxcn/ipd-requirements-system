import { DashboardOutlined, FileTextOutlined, CheckCircleOutlined, BarChartOutlined, SendOutlined, PartitionOutlined, BulbOutlined, SettingOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

export const MENU_ITEMS: MenuProps['items'] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/requirements', icon: <FileTextOutlined />, label: '需求管理' },
  { key: '/ipd-story-flow', icon: <QuestionCircleOutlined />, label: 'IPD需求十问' },
  { key: '/insights', icon: <BulbOutlined />, label: 'AI洞察历史记录' },
  { key: '/analytics', icon: <BarChartOutlined />, label: '需求分析' },
  { key: '/distribution', icon: <SendOutlined />, label: '需求分发' },
  { key: '/rtm', icon: <PartitionOutlined />, label: '需求跟踪' },
  { key: '/verification', icon: <CheckCircleOutlined />, label: '需求验证' },
  { key: '/settings', icon: <SettingOutlined />, label: '配置' },
]

import { DashboardOutlined, FileTextOutlined, CheckCircleOutlined, BarChartOutlined, SendOutlined, PartitionOutlined, BulbOutlined, SettingOutlined, QuestionCircleOutlined, CodeOutlined, AuditOutlined, HistoryOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

export const MENU_ITEMS: MenuProps['items'] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/requirements', icon: <FileTextOutlined />, label: '需求输入' },
  { key: '/ipd-story-flow', icon: <QuestionCircleOutlined />, label: 'IPD需求十问' },
  { key: '/insights', icon: <BulbOutlined />, label: 'AI洞察历史记录' },
  { key: '/analytics', icon: <BarChartOutlined />, label: '需求分析' },
  {
    key: '/review-center-sub',
    icon: <AuditOutlined />,
    label: '评审中心',
    children: [
      { key: '/review-center', label: '会议列表' },
      { key: '/review-center/results', label: '投票结果' },
    ],
  },
  { key: '/distribution', icon: <SendOutlined />, label: '需求分发' },
  { key: '/development', icon: <CodeOutlined />, label: '需求开发' },
  { key: '/rtm', icon: <PartitionOutlined />, label: '需求追溯矩阵 (RTM)' },
  { key: '/verification', icon: <CheckCircleOutlined />, label: '需求验证' },
  { key: '/settings', icon: <SettingOutlined />, label: '配置' },
]

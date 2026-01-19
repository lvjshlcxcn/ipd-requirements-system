import { Card, Row, Col, Statistic, Table, Tag } from 'antd'
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons'

// 示例需求数据
const requirementData = [
  {
    key: '1',
    no: 'REQ-2026-0001',
    title: '示例需求：增强移动端用户体验',
    source: '客户',
    status: '已收集',
    priority: 85,
  },
  {
    key: '2',
    no: 'REQ-2026-0002',
    title: '提升系统性能优化',
    source: '市场',
    status: '分析中',
    priority: 72,
  },
  {
    key: '3',
    no: 'REQ-2026-0003',
    title: '增加数据导出功能',
    source: '销售',
    status: '已分发',
    priority: 65,
  },
]

const columns = [
  {
    title: '需求编号',
    dataIndex: 'no',
    key: 'no',
  },
  {
    title: '需求标题',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: '来源',
    dataIndex: 'source',
    key: 'source',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const colorMap: Record<string, string> = {
        '已收集': 'blue',
        '分析中': 'processing',
        '已分发': 'green',
      }
      return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
    },
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    render: (score: number) => (
      <span style={{ color: score >= 80 ? '#ff4d4f' : score >= 60 ? '#faad14' : '#52c41a' }}>
        {score}
      </span>
    ),
  },
]

function DashboardPage() {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表盘</h2>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总需求数"
              value={156}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={42}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={68}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理"
              value={46}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 最新需求列表 */}
      <Card title="最新需求" bordered={false}>
        <Table
          dataSource={requirementData}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}

export default DashboardPage

import { Card, Row, Col, Statistic, Progress, Table, Tag } from 'antd'
import {
  BarChartOutlined,
  RadarChartOutlined,
  FundViewOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import React from 'react'

// 模拟分析数据
const analysisData = [
  {
    key: '1',
    requirementNo: 'REQ-2026-0001',
    title: '增强移动端用户体验',
    appealsScore: 32.5,
    kanoCategory: 'excitement',
    priority: 85,
    status: 'completed',
  },
  {
    key: '2',
    requirementNo: 'REQ-2026-0002',
    title: '提升系统性能',
    appealsScore: 28.3,
    kanoCategory: 'performance',
    priority: 72,
    status: 'completed',
  },
  {
    key: '3',
    requirementNo: 'REQ-2026-0003',
    title: '增加数据导出功能',
    appealsScore: 24.1,
    kanoCategory: 'basic',
    priority: 65,
    status: 'completed',
  },
  {
    key: '4',
    requirementNo: 'REQ-2026-0004',
    title: '实现实时通知功能',
    appealsScore: 26.8,
    kanoCategory: 'performance',
    priority: 78,
    status: 'completed',
  },
  {
    key: '5',
    requirementNo: 'REQ-2026-0005',
    title: '优化需求收集流程',
    appealsScore: 22.6,
    kanoCategory: 'basic',
    priority: 60,
    status: 'completed',
  },
]

// KANO分布统计
const kanoDistribution = [
  { type: '基本型需求', count: 2, percentage: 40, color: '#ff4d4f' },
  { type: '期望型需求', count: 2, percentage: 40, color: '#faad14' },
  { type: '兴奋型需求', count: 1, percentage: 20, color: '#52c41a' },
]

// APPEALS维度平均分
const appealsAverage = [
  { dimension: '价格', score: 7.2, full: 10 },
  { dimension: '可获得性', score: 6.8, full: 10 },
  { dimension: '包装', score: 5.5, full: 10 },
  { dimension: '性能', score: 8.1, full: 10 },
  { dimension: '易用性', score: 7.8, full: 10 },
  { dimension: '保证', score: 6.9, full: 10 },
  { dimension: '生命周期成本', score: 7.1, full: 10 },
  { dimension: '社会接受度', score: 5.2, full: 10 },
]

const kanoCategoryMap: Record<string, { text: string; color: string }> = {
  basic: { text: '基本型', color: 'red' },
  performance: { text: '期望型', color: 'orange' },
  excitement: { text: '兴奋型', color: 'green' },
}

const columns = [
  {
    title: '需求编号',
    dataIndex: 'requirementNo',
    key: 'requirementNo',
    width: 140,
  },
  {
    title: '需求标题',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
  },
  {
    title: 'APPEALS得分',
    dataIndex: 'appealsScore',
    key: 'appealsScore',
    width: 120,
    render: (score: number) => (
      <span
        style={{
          color: score >= 30 ? '#ff4d4f' : score >= 25 ? '#faad14' : '#52c41a',
          fontWeight: 'bold',
        }}
      >
        {score}
      </span>
    ),
    sorter: (a: any, b: any) => a.appealsScore - b.appealsScore,
  },
  {
    title: 'KANO分类',
    dataIndex: 'kanoCategory',
    key: 'kanoCategory',
    width: 120,
    render: (category: string) => {
      const { text, color } = kanoCategoryMap[category] || { text: category, color: 'default' }
      return <Tag color={color}>{text}</Tag>
    },
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    width: 100,
    render: (score: number) => {
      const color = score >= 80 ? '#ff4d4f' : score >= 60 ? '#faad14' : '#52c41a'
      return <span style={{ color, fontWeight: 'bold' }}>{score}</span>
    },
    sorter: (a: any, b: any) => a.priority - b.priority,
  },
  {
    title: '分析状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: string) => (
      <Tag color={status === 'completed' ? 'success' : 'processing'}>
        {status === 'completed' ? '已完成' : '进行中'}
      </Tag>
    ),
  },
]

function AnalyticsDashboard() {
  const totalScore = analysisData.reduce((sum, item) => sum + item.appealsScore, 0)
  const averageScore = (totalScore / analysisData.length).toFixed(1)
  const highPriorityCount = analysisData.filter((item) => item.priority >= 80).length
  const completedCount = analysisData.filter((item) => item.status === 'completed').length

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>需求分析仪表板</h2>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均APPEALS得分"
              value={averageScore}
              prefix={<BarChartOutlined />}
              suffix="/ 40"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高优先级需求数"
              value={highPriorityCount}
              prefix={<TrophyOutlined />}
              suffix="/ 5"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成分析"
              value={completedCount}
              prefix={<FundViewOutlined />}
              suffix="/ 5"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="需求总数"
              value={analysisData.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* APPEALS维度分析 */}
        <Col span={12}>
          <Card title="APPEALS维度平均分" extra={<BarChartOutlined />}>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {appealsAverage.map((item) => (
                <div key={item.dimension} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{item.dimension}</span>
                    <span style={{ fontSize: 12, fontWeight: 'bold' }}>
                      {item.score} / {item.full}
                    </span>
                  </div>
                  <Progress
                    percent={(item.score / item.full) * 100}
                    strokeColor={
                      item.score >= 8 ? '#52c41a' : item.score >= 6 ? '#faad14' : '#ff4d4f'
                    }
                    size="small"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* KANO分布 */}
        <Col span={12}>
          <Card title="KANO分类分布" extra={<RadarChartOutlined />}>
            <div style={{ marginTop: 24 }}>
              {kanoDistribution.map((item) => (
                <div key={item.type} style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontWeight: 'bold', color: item.color }}>
                      {item.type}
                    </span>
                    <span>
                      {item.count} 个 ({item.percentage}%)
                    </span>
                  </div>
                  <Progress
                    percent={item.percentage}
                    strokeColor={item.color}
                    showInfo={false}
                  />
                </div>
              ))}
            </div>

            <Card type="inner" size="small" title="分布说明" style={{ marginTop: 16 }}>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
                <li>
                  <strong style={{ color: '#ff4d4f' }}>基本型需求</strong>：必须满足的核心需求
                </li>
                <li>
                  <strong style={{ color: '#faad14' }}>期望型需求</strong>：提升竞争力的关键需求
                </li>
                <li>
                  <strong style={{ color: '#52c41a' }}>兴奋型需求</strong>：超出预期的创新需求
                </li>
              </ul>
            </Card>
          </Card>
        </Col>
      </Row>

      {/* 分析结果列表 */}
      <Card title="需求分析详情" style={{ marginTop: 16 }}>
        <Table
          dataSource={analysisData}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}

export default AnalyticsDashboard

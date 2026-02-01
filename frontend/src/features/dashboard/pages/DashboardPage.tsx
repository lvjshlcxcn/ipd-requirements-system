import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Spin, Tag, Space } from 'antd'
import { PartitionOutlined } from '@ant-design/icons'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'
import api from '@/services/api'
import { requirementService } from '@/services/requirement.service'

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [rtmStats, setRtmStats] = useState<any>(null)
  const [inDevelopmentCount, setInDevelopmentCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // 获取需求统计
        const reqResponse = await api.get('/requirements/stats/summary')
        setStats(reqResponse?.data)

        // 获取RTM统计
        const rtmResponse = await api.get('/rtm/statistics')
        setRtmStats(rtmResponse?.data)

        // 获取需求开发模块的统计数据（已分发且目标为charter的需求）
        // 这个数量等于需求开发列表中的总数（status=distributed + target_type=charter）
        console.log('[Dashboard] 开始获取开发中需求数据...')
        const devResponse = await requirementService.getRequirements({
          status: 'distributed',
          target_type: 'charter',
          page: 1,
          page_size: 1,  // 只需要count，不获取实际数据
        })
        console.log('[Dashboard] 完整响应:', devResponse)
        console.log('[Dashboard] 响应数据结构:', JSON.stringify(devResponse, null, 2))

        // 尝试多种方式获取 total
        let totalCount = 0
        if (devResponse && typeof devResponse === 'object') {
          if ((devResponse as any).data?.total !== undefined) {
            totalCount = (devResponse as any).data.total
            console.log('[Dashboard] 方式1 - devResponse.data.total:', totalCount)
          } else if ((devResponse as any).total !== undefined) {
            totalCount = (devResponse as any).total
            console.log('[Dashboard] 方式2 - devResponse.total:', totalCount)
          } else {
            console.warn('[Dashboard] 无法找到 total 字段，devResponse keys:', Object.keys(devResponse))
          }
        }
        console.log('[Dashboard] 最终开发中数量:', totalCount)
        setInDevelopmentCount(totalCount)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        console.error('[Dashboard] 获取开发中数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statusConfig = [
    { key: 'collected', label: '已收集', color: 'blue' },
    { key: 'analyzing', label: '分析中', color: 'processing' },
    { key: 'analyzed', label: '已分析', color: 'cyan' },
    { key: 'distributed', label: '已分发', color: 'lime' },
    { key: 'implementing', label: '开发中', color: 'gold' },
    { key: 'completed', label: '已完成', color: 'green' },
    { key: 'rejected', label: '已拒绝', color: 'red' },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表盘</h2>

      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总需求数" value={stats?.total || 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="已完成" value={stats?.by_status?.completed || 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="进行中"
                value={(stats?.by_status?.analyzing || 0) + inDevelopmentCount}
                suffix={
                  <span style={{ fontSize: 14, color: '#999' }}>
                    (分析中: {stats?.by_status?.analyzing || 0} + 开发中: {inDevelopmentCount})
                  </span>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="待处理" value={stats?.by_status?.collected || 0} />
            </Card>
          </Col>
        </Row>

        <Card title="需求状态分布" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {statusConfig.map((status) => (
              <Col span={8} key={status.key}>
                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color={status.color} style={{ fontSize: 14, padding: '4px 12px' }}>
                        {status.label}
                      </Tag>
                      <Statistic
                        value={stats?.by_status?.[status.key] || 0}
                        valueStyle={{ fontSize: 24 }}
                      />
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card title="需求来源分布">
          <Row gutter={[16, 16]}>
            <Col span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title="客户" value={stats?.by_channel?.customer || 0} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title="市场" value={stats?.by_channel?.market || 0} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title="销售" value={stats?.by_channel?.sales || 0} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title="售后" value={stats?.by_channel?.after_sales || 0} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title="技术" value={stats?.by_channel?.rd || 0} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title="竞争" value={stats?.by_channel?.competition || 0} />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* RTM 追溯矩阵统计 */}
        <Card title={<span><PartitionOutlined style={{ marginRight: 8 }} />需求追溯矩阵统计</span>}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="追溯完成率"
                  value={rtmStats?.completion_rate || 0}
                  suffix="%"
                  valueStyle={{ color: rtmStats?.completion_rate >= 80 ? '#52c41a' : rtmStats?.completion_rate >= 50 ? '#faad14' : '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="完整追溯"
                  value={rtmStats?.complete || 0}
                  valueStyle={{ color: '#52c41a' }}
                  suffix={`/ ${rtmStats?.total || 0}`}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="部分追溯"
                  value={rtmStats?.partial || 0}
                  valueStyle={{ color: '#faad14' }}
                  suffix={`/ ${rtmStats?.total || 0}`}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="缺失追溯"
                  value={rtmStats?.missing || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                  suffix={`/ ${rtmStats?.total || 0}`}
                />
              </Card>
            </Col>
          </Row>

          {/* 追溯覆盖率 */}
          <div style={{ marginTop: 24 }}>
            <h4 style={{ marginBottom: 16 }}>追溯覆盖率</h4>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
                  <Statistic
                    title="设计文档覆盖"
                    value={rtmStats?.coverage?.design || 0}
                    suffix={`/ ${rtmStats?.total || 0}`}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                  <Statistic
                    title="代码文件覆盖"
                    value={rtmStats?.coverage?.code || 0}
                    suffix={`/ ${rtmStats?.total || 0}`}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ backgroundColor: '#fff7e6' }}>
                  <Statistic
                    title="测试用例覆盖"
                    value={rtmStats?.coverage?.test || 0}
                    suffix={`/ ${rtmStats?.total || 0}`}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </Row>
          </div>

          {/* 可视化图表 */}
          <div style={{ marginTop: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="追溯状态分布">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={[
                      { subject: '完整追溯', value: rtmStats?.complete || 0, fullMark: rtmStats?.total || 0 },
                      { subject: '部分追溯', value: rtmStats?.partial || 0, fullMark: rtmStats?.total || 0 },
                      { subject: '缺失追溯', value: rtmStats?.missing || 0, fullMark: rtmStats?.total || 0 },
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis type="category" dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, (rtmStats?.total || 1) * 1.2]} />
                      <Radar name="追溯状态" dataKey="value" fill="#8884d8" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="追溯要素覆盖">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={[
                      { subject: '设计文档', value: rtmStats?.coverage?.design || 0, fullMark: rtmStats?.total || 0 },
                      { subject: '代码文件', value: rtmStats?.coverage?.code || 0, fullMark: rtmStats?.total || 0 },
                      { subject: '测试用例', value: rtmStats?.coverage?.test || 0, fullMark: rtmStats?.total || 0 },
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis type="category" dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, (rtmStats?.total || 1) * 1.2]} />
                      <Radar name="覆盖要素" dataKey="value" fill="#82ca9d" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </div>
        </Card>
      </Spin>
    </div>
  )
}

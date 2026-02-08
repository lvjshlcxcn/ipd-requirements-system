import { useState, useMemo } from 'react'
import {
  Typography,
  Table,
  Card,
  Tag,
  Space,
  Button,
  Row,
  Col,
  Select,
  DatePicker,
  Progress,
  message,
} from 'antd'
import { EyeOutlined, DownloadOutlined, HistoryOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import reviewMeetingService from '@/services/reviewMeeting.service'
import type { ColumnsType } from 'antd/es/table'
import type { VoteResultArchive, VoteResultFilters, VoteOutcome, VoteStatisticsArchive } from '@/types/review-meeting'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
import { exportVoteResultsToExcel } from '@/utils/exportVoteResults'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

export function VoteResultsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState<VoteResultFilters>({
    meeting_id: undefined,
    date_from: undefined,
    date_to: undefined,
    outcome: undefined,
  })

  // 获取投票结果列表
  const { data: resultsData, isLoading } = useQuery({
    queryKey: ['vote-results', page, pageSize, filters.meeting_id],
    queryFn: () =>
      reviewMeetingService.getVoteResults({
        page,
        page_size: pageSize,
        meeting_id: filters.meeting_id,
      }),
  })

  // 投票结果计算逻辑
  const calculateVoteOutcome = (stats: VoteStatisticsArchive): VoteOutcome => {
    // 规则:通过票数 > 拒绝票数 且 通过率 > 50% → 通过
    if (stats.approve_count > stats.reject_count && stats.approve_percentage > 50) {
      return 'approved'
    }
    // 规则:拒绝票数 >= 通过票数 → 拒绝
    if (stats.reject_count >= stats.approve_count) {
      return 'rejected'
    }
    return 'pending'
  }

  // 客户端数据筛选
  const filteredData = useMemo(() => {
    let items = resultsData?.data?.items || []

    // 按日期筛选
    if (filters.date_from) {
      items = items.filter((item) =>
        dayjs(item.archived_at).isSameOrAfter(filters.date_from, 'day')
      )
    }
    if (filters.date_to) {
      items = items.filter((item) =>
        dayjs(item.archived_at).isSameOrBefore(filters.date_to, 'day')
      )
    }

    // 按投票结果筛选
    if (filters.outcome) {
      items = items.filter((item) => {
        const outcome = calculateVoteOutcome(item.vote_statistics)
        return outcome === filters.outcome
      })
    }

    return items
  }, [resultsData?.data?.items, filters])

  const columns: ColumnsType<VoteResultArchive> = [
    {
      title: '存档时间',
      dataIndex: 'archived_at',
      key: 'archived_at',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: true,
    },
    {
      title: '会议编号',
      key: 'meeting_no',
      width: 150,
      render: (_: any, record: VoteResultArchive) => record.meeting_no || `ID:${record.meeting_id}`,
    },
    {
      title: '需求编号',
      key: 'requirement_no',
      width: 150,
      render: (_: any, record: VoteResultArchive) => record.requirement_no || `ID:${record.requirement_id}`,
    },
    {
      title: '需求标题',
      dataIndex: 'requirement_title',
      key: 'requirement_title',
      ellipsis: true,
    },
    {
      title: '投票统计',
      key: 'statistics',
      width: 350,
      render: (_: any, record: VoteResultArchive) => {
        const stats = record.vote_statistics
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Progress
                percent={stats.approve_percentage}
                strokeColor="#52c41a"
                showInfo={false}
                style={{ flex: 1 }}
              />
              <Text style={{ fontSize: 12, minWidth: 80 }}>通过 {stats.approve_count}票</Text>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Progress
                percent={stats.reject_percentage}
                strokeColor="#ff4d4f"
                showInfo={false}
                style={{ flex: 1 }}
              />
              <Text style={{ fontSize: 12, minWidth: 80 }}>拒绝 {stats.reject_count}票</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              总计: {stats.total_votes} 票 | 弃权: {stats.abstain_count} 票
            </Text>
          </Space>
        )
      },
    },
    {
      title: '投票结果',
      key: 'outcome',
      width: 120,
      render: (_: any, record: VoteResultArchive) => {
        const outcome = calculateVoteOutcome(record.vote_statistics)
        const config = {
          approved: { color: 'success', text: '✅ 通过' },
          rejected: { color: 'error', text: '❌ 拒绝' },
          pending: { color: 'default', text: '⏸️ 待定' },
        }
        const { color, text } = config[outcome]
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: VoteResultArchive) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/review-center/results/${record.id}`)}>
          查看详情
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={3} style={{ margin: 0 }}>
              <HistoryOutlined /> 投票结果列表
            </Title>
            <Button type="primary" onClick={() => navigate('/review-center')}>
              返回评审中心
            </Button>
          </Space>

          {/* 筛选组件区 */}
          <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Select
                  placeholder="选择会议"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => setFilters({ ...filters, meeting_id: value })}>
                  {/* 会议列表选项 - TODO: 从会议列表 API 获取 */}
                </Select>
              </Col>
              <Col span={8}>
                <RangePicker
                  placeholder={['开始日期', '结束日期']}
                  style={{ width: '100%' }}
                  onChange={(dates) => {
                    setFilters({
                      ...filters,
                      date_from: dates?.[0]?.format('YYYY-MM-DD'),
                      date_to: dates?.[1]?.format('YYYY-MM-DD'),
                    })
                  }}
                />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="投票结果"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => setFilters({ ...filters, outcome: value })}>
                  <Option value="approved">✅ 通过</Option>
                  <Option value="rejected">❌ 拒绝</Option>
                  <Option value="pending">⏸️ 待定</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Space>
                  <Button
                    onClick={() =>
                      setFilters({
                        meeting_id: undefined,
                        date_from: undefined,
                        date_to: undefined,
                        outcome: undefined,
                      })
                    }>
                    重置
                  </Button>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      const dataToExport = filteredData.length > 0 ? filteredData : (resultsData?.data?.items || [])
                      exportVoteResultsToExcel(dataToExport, {
                        includeDetails: true,
                      })
                      message.success('导出成功')
                    }}>
                    导出Excel
                  </Button>
                </Space>
              </Col>
            </Row>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredData}
            loading={isLoading}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: pageSize,
              total: filteredData.length,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (newPage, newPageSize) => {
                setPage(newPage)
                setPageSize(newPageSize || 20)
              },
            }}
            scroll={{ x: 1200 }}
          />
        </Space>
      </Card>
    </div>
  )
}

export default VoteResultsPage

import { useState } from 'react'
import { Typography, Table, Card, Tag, Space, Button, Row, Col, Select, DatePicker, message } from 'antd'
import { EyeOutlined, HistoryOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import reviewMeetingService from '@/services/reviewMeeting.service'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface VoteResultItem {
  id: number
  meeting_id: number
  requirement_id: number
  requirement_title: string
  vote_statistics: {
    requirement_id: number
    total_votes: number
    approve_count: number
    approve_percentage: number
    reject_count: number
    reject_percentage: number
    abstain_count: number
    abstain_percentage: number
    votes: Array<{
      voter_id: number
      voter_name: string
      vote_option: string
      comment?: string
      voted_at?: string
    }>
  }
  archived_at: string
}

export function VoteResultsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [meetingFilter, setMeetingFilter] = useState<number | undefined>()

  // 获取投票结果列表
  const { data: resultsData, isLoading } = useQuery({
    queryKey: ['vote-results', page, pageSize, meetingFilter],
    queryFn: () =>
      reviewMeetingService.getVoteResults({
        page,
        page_size: pageSize,
        meeting_id: meetingFilter,
      }),
  })

  const columns: ColumnsType<VoteResultItem> = [
    {
      title: '存档时间',
      dataIndex: 'archived_at',
      key: 'archived_at',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '会议ID',
      dataIndex: 'meeting_id',
      key: 'meeting_id',
      width: 100,
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
      width: 300,
      render: (_: any, record: VoteResultItem) => {
        const stats = record.vote_statistics
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space size="small">
              <Tag color="success">通过: {stats.approve_count} ({stats.approve_percentage}%)</Tag>
              <Tag color="error">拒绝: {stats.reject_count} ({stats.reject_percentage}%)</Tag>
              <Tag>弃权: {stats.abstain_count} ({stats.abstain_percentage}%)</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              总计: {stats.total_votes} 票
            </Text>
          </Space>
        )
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: VoteResultItem) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/review-center/results/${record.id}`)}
        >
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

          <Table
            columns={columns}
            dataSource={resultsData?.data?.items || []}
            loading={isLoading}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: pageSize,
              total: resultsData?.data?.total || 0,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (newPage, newPageSize) => {
                setPage(newPage)
                setPageSize(newPageSize || 20)
              },
            }}
            scroll={{ x: 1000 }}
          />
        </Space>
      </Card>
    </div>
  )
}

export default VoteResultsPage

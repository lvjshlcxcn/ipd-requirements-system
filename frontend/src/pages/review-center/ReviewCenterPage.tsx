import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Button, Tag, Space, Typography, Select, DatePicker, message, Modal, Popconfirm } from 'antd'
import { PlusOutlined, CalendarOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import reviewMeetingService from '@/services/reviewMeeting.service'
import type { MeetingStatus } from '@/types/review-meeting'
import { CreateMeetingModal } from './components/CreateMeetingModal'
import { useAuthStore } from '@/stores/useAuthStore'

const { Title, Text } = Typography

/**
 * 会议状态配置
 */
const STATUS_OPTIONS: Array<{ value: MeetingStatus; label: string; color: string }> = [
  { value: 'scheduled', label: '已安排', color: 'blue' },
  { value: 'in_progress', label: '进行中', color: 'green' },
  { value: 'completed', label: '已完成', color: 'default' },
  { value: 'cancelled', label: '已取消', color: 'red' },
]

export function ReviewCenterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | undefined>()
  const [dateFilter, setDateFilter] = useState<string | undefined>()
  const [modalVisible, setModalVisible] = useState(false)

  // 获取会议列表
  const { data: meetingsData, isLoading, error } = useQuery({
    queryKey: ['meetings', page, pageSize, statusFilter, dateFilter],
    queryFn: () =>
      reviewMeetingService.getMeetings({
        page,
        page_size: pageSize,
        status: statusFilter,
        date_filter: dateFilter,
      }),
  })

  // 调试日志
  console.log('[ReviewCenterPage] meetingsData:', meetingsData)
  console.log('[ReviewCenterPage] meetingsData?.data:', meetingsData?.data)
  console.log('[ReviewCenterPage] isLoading:', isLoading)
  console.log('[ReviewCenterPage] error:', error)

  // 错误处理
  if (error) {
    console.error('获取会议列表失败:', error)
    message.error('获取会议列表失败')
  }

  const meetings = meetingsData?.data?.items || []
  const total = meetingsData?.data?.total || 0
  const totalPages = meetingsData?.data?.total_pages || 0

  console.log('[ReviewCenterPage] 解析后的数据:', { meetings, total, totalPages })

  const handleCreateMeeting = () => {
    setModalVisible(true)
  }

  const handleModalCancel = () => {
    setModalVisible(false)
  }

  const handleModalSuccess = () => {
    setModalVisible(false)
    // 刷新会议列表 - 使用 refetchQueries 确保立即重新获取
    queryClient.refetchQueries({
      queryKey: ['meetings', page, pageSize, statusFilter, dateFilter]
    })
  }

  // 删除会议
  const deleteMutation = useMutation({
    mutationFn: (meetingId: number) =>
      reviewMeetingService.deleteMeeting(meetingId),
    onSuccess: () => {
      message.success('会议删除成功')
      // 刷新会议列表
      queryClient.refetchQueries({
        queryKey: ['meetings', page, pageSize, statusFilter, dateFilter]
      })
    },
    onError: (error: any) => {
      message.error(error.message || '删除会议失败')
    },
  })

  const handleDeleteMeeting = (meetingId: number, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发卡片点击
    deleteMutation.mutate(meetingId)
  }

  const handleStatusChange = (value: MeetingStatus | undefined) => {
    setStatusFilter(value)
    setPage(1) // 重置到第一页
  }

  const handleDateChange = (dates: any) => {
    if (dates && dates[0]) {
      setDateFilter(dates[0].format('YYYY-MM-DD'))
    } else {
      setDateFilter(undefined)
    }
    setPage(1)
  }

  const getStatusConfig = (status: MeetingStatus) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0]
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 头部 */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          需求评审中心
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateMeeting}>
          创建会议
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space size="large">
          <div>
            <Text strong style={{ marginRight: '8px' }}>
              会议状态:
            </Text>
            <Select
              style={{ width: 150 }}
              placeholder="全部状态"
              allowClear
              value={statusFilter}
              onChange={handleStatusChange}
            >
              {STATUS_OPTIONS.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div>
            <Text strong style={{ marginRight: '8px' }}>
              会议日期:
            </Text>
            <DatePicker
              style={{ width: 200 }}
              placeholder="选择日期"
              onChange={handleDateChange}
              value={dateFilter ? dayjs(dateFilter) : null}
            />
          </div>
          <div>
            <Text type="secondary">
              共 {total} 个会议
            </Text>
          </div>
        </Space>
      </Card>

      {/* 会议列表 */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>加载中...</div>
      ) : meetings.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              暂无会议，点击右上角创建新会议
            </Text>
          </div>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {meetings.map((meeting) => {
            const statusConfig = getStatusConfig(meeting.status)
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={meeting.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/review-center/${meeting.id}`)}
                  style={{ height: '100%' }}
                  bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <div style={{ flex: 1 }}>
                    {/* 状态标签 */}
                    <div style={{ marginBottom: '12px' }}>
                      <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
                    </div>

                    {/* 会议标题 */}
                    <Title level={5} style={{ marginBottom: '12px' }}>
                      {meeting.title}
                    </Title>

                    {/* 会议编号 */}
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '12px' }}>
                      {meeting.meeting_no}
                    </Text>

                    {/* 会议时间 */}
                    <div style={{ marginBottom: '8px' }}>
                      <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dayjs(meeting.scheduled_at).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </div>

                    {/* 主持人 */}
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        主持人 ID: {meeting.moderator_id}
                      </Text>
                    </div>
                  </div>

                  {/* 底部信息 */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        点击查看详情
                      </Text>
                      {/* 只有主持人可以删除 */}
                      {user && meeting.moderator_id === user.id && (
                        <Popconfirm
                          title="确认删除"
                          description="确定要删除这个会议吗？删除后无法恢复。"
                          onConfirm={(e) => handleDeleteMeeting(meeting.id, e as any)}
                          okText="确定"
                          cancelText="取消"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => e.stopPropagation()}
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Space>
            <Button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <Text>
              第 {page} / {totalPages} 页
            </Text>
            <Button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              下一页
            </Button>
          </Space>
        </div>
      )}

      {/* 创建会议Modal */}
      <CreateMeetingModal
        visible={modalVisible}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

export default ReviewCenterPage

import { Card, Tag, Avatar, Button, Space, Typography, Row, Col, Popconfirm } from 'antd'
import { CalendarOutlined, UserOutlined, TeamOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { Meeting } from '@/types/review-meeting'

const { Text, Title } = Typography

interface MeetingInfoCardProps {
  meeting: Meeting
  attendees?: Array<{ id: number; username: string; full_name?: string; avatar?: string }>
  moderator?: { id: number; username: string; full_name?: string }  // 主持人信息
  onStartMeeting?: () => void
  onEndMeeting?: () => void
  onDeleteMeeting?: () => void
  onAddAttendee?: () => void  // 添加参会人员回调
  canControl?: boolean
  isMeetingInProgress?: boolean  // 会议是否进行中
}

/**
 * 会议状态标签颜色映射
 */
const STATUS_COLORS: Record<string, string> = {
  scheduled: 'blue',
  in_progress: 'green',
  completed: 'default',
  cancelled: 'red',
}

/**
 * 会议状态文本映射
 */
const STATUS_LABELS: Record<string, string> = {
  scheduled: '已安排',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
}

export function MeetingInfoCard({
  meeting,
  attendees = [],
  moderator,
  onStartMeeting,
  onEndMeeting,
  onDeleteMeeting,
  onAddAttendee,
  canControl = false,
  isMeetingInProgress = false,
}: MeetingInfoCardProps) {
  // 格式化日期时间
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 获取用户头像占位符（使用用户名首字母）
  const getAvatarPlaceholder = (username: string) => {
    return username?.charAt(0)?.toUpperCase() || '?'
  }

  return (
    <Card
      title={
        <Space>
          <Tag color={STATUS_COLORS[meeting.status]}>{STATUS_LABELS[meeting.status]}</Tag>
          <Title level={4} style={{ margin: 0 }}>
            {meeting.title}
          </Title>
        </Space>
      }
      extra={
        canControl && (
          <Space>
            {meeting.status === 'scheduled' && onStartMeeting && (
              <Button type="primary" onClick={onStartMeeting}>
                开始会议
              </Button>
            )}
            {meeting.status === 'in_progress' && onEndMeeting && (
              <Button danger onClick={onEndMeeting}>
                结束会议
              </Button>
            )}
            {onDeleteMeeting && (
              <Popconfirm
                title="确认删除"
                description="确定要删除这个会议吗？删除后无法恢复，所有参会人员、需求和投票记录都将被删除。"
                onConfirm={onDeleteMeeting}
                okText="确定"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  删除会议
                </Button>
              </Popconfirm>
            )}
          </Space>
        )
      }
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Space direction="vertical" size="small">
            <Text type="secondary">
              <CalendarOutlined /> 会议编号
            </Text>
            <Text strong>{meeting.meeting_no}</Text>
          </Space>
        </Col>

        <Col span={12}>
          <Space direction="vertical" size="small">
            <Text type="secondary">
              <CalendarOutlined /> 预定时间
            </Text>
            <Text>{formatDateTime(meeting.scheduled_at)}</Text>
          </Space>
        </Col>

        {meeting.started_at && (
          <Col span={12}>
            <Space direction="vertical" size="small">
              <Text type="secondary">开始时间</Text>
              <Text>{formatDateTime(meeting.started_at)}</Text>
            </Space>
          </Col>
        )}

        {meeting.ended_at && (
          <Col span={12}>
            <Space direction="vertical" size="small">
              <Text type="secondary">结束时间</Text>
              <Text>{formatDateTime(meeting.ended_at)}</Text>
            </Space>
          </Col>
        )}

        <Col span={24}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text type="secondary">
              <UserOutlined /> 主持人
            </Text>
            <Text>
              {moderator?.username || attendees.find((a) => a.id === meeting.moderator_id)?.username || '未知'}
            </Text>
          </Space>
        </Col>

        <Col span={24}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">
                <TeamOutlined /> 参会人员 ({attendees.length}人)
              </Text>
              {canControl && onAddAttendee ? (
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={onAddAttendee}
                >
                  添加参会人员
                </Button>
              ) : canControl ? (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  请先开始会议
                </Text>
              ) : null}
            </Space>
            <Avatar.Group maxCount={10} size="large">
              {attendees.map((attendee) => (
                <Avatar
                  key={attendee.id}
                  src={attendee.avatar}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {getAvatarPlaceholder(attendee.username)}
                </Avatar>
              ))}
            </Avatar.Group>
          </Space>
        </Col>

        {meeting.description && (
          <Col span={24}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary">会议描述</Text>
              <Text>{meeting.description}</Text>
            </Space>
          </Col>
        )}
      </Row>
    </Card>
  )
}

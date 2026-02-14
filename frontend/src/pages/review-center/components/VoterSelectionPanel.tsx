import { useEffect, useState } from 'react'
import { Card, Checkbox, Space, Typography, Tag, Avatar, Progress, Empty, Spin, message, Button } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import reviewMeetingService from '@/services/reviewMeeting.service'
import type { Attendee } from '@/types/review-meeting'

const { Text, Title } = Typography

interface VoterSelectionPanelProps {
  meetingId: number
  requirementId: number | null
  attendees: Attendee[]
  canControl: boolean
  isVotingComplete?: boolean
}

interface VoterStatus {
  attendee_id: number
  username: string
  full_name?: string
  has_voted: boolean
  vote_option?: string
  voted_at?: string
}

interface VoterStatusData {
  requirement_id: number
  assigned_voter_ids: number[]
  voters: VoterStatus[]
  total_assigned: number
  total_voted: number
  is_complete: boolean
}

const VOTE_OPTION_LABELS: Record<string, string> = {
  approve: '通过',
  reject: '拒绝',
  abstain: '弃权',
}

const VOTE_OPTION_COLORS: Record<string, string> = {
  approve: 'success',
  reject: 'error',
  abstain: 'default',
}

export function VoterSelectionPanel({
  meetingId,
  requirementId,
  attendees,
  canControl,
  isVotingComplete = false,
}: VoterSelectionPanelProps) {
  const queryClient = useQueryClient()
  const [selectedVoterIds, setSelectedVoterIds] = useState<number[]>([])

  // 获取投票状态
  const { data: voterStatusData, isLoading: statusLoading } = useQuery({
    queryKey: ['voter-status', meetingId, requirementId],
    queryFn: () => reviewMeetingService.getVoterStatus(meetingId, requirementId!),
    enabled: !!requirementId,
    refetchInterval: 5000, // 每5秒刷新
  })

  // 更新投票人员
  const updateVotersMutation = useMutation({
    mutationFn: (voterIds: number[]) =>
      reviewMeetingService.updateAssignedVoters(meetingId, requirementId!, {
        assigned_voter_ids: voterIds,
      }),
    onSuccess: () => {
      message.success('投票人员设置成功')
      queryClient.invalidateQueries({ queryKey: ['voter-status', meetingId, requirementId] })
    },
    onError: (error: any) => {
      message.error(error.message || '设置投票人员失败')
    },
  })

  // 初始化选中的投票人员
  useEffect(() => {
    if (voterStatusData?.data?.assigned_voter_ids) {
      setSelectedVoterIds(voterStatusData.data.assigned_voter_ids)
    }
  }, [voterStatusData])

  const handleVoterToggle = (attendeeId: number) => {
    if (!canControl) return

    const newSelectedIds = selectedVoterIds.includes(attendeeId)
      ? selectedVoterIds.filter((id) => id !== attendeeId)
      : [...selectedVoterIds, attendeeId]

    setSelectedVoterIds(newSelectedIds)

    // 自动保存（防抖可以后续优化）
    updateVotersMutation.mutate(newSelectedIds)
  }

  const status = voterStatusData?.data
  const progress = status ? (status.total_voted / status.total_assigned) * 100 : 0

  if (!requirementId) {
    return (
      <Card title="投票人员">
        <Empty description="请先选择一个需求" />
      </Card>
    )
  }

  if (statusLoading) {
    return (
      <Card title="投票人员">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      </Card>
    )
  }

  return (
    <Card
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            投票人员
          </Title>
          {status && status.total_assigned > 0 && (
            <Tag color={status.is_complete ? 'success' : 'processing'}>
              {status.total_voted}/{status.total_assigned}
            </Tag>
          )}
        </Space>
      }
      extra={
        status?.is_complete && (
          <Tag icon={<CheckCircleOutlined />} color="success">
            投票完成
          </Tag>
        )
      }
    >
      {status && status.total_assigned > 0 && status.voters.length > 0 ? (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 进度条 */}
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              投票进度
            </Text>
            <Progress
              percent={Math.round(progress)}
              status={status.is_complete ? 'success' : 'active'}
              size="small"
              format={(percent) => `${percent}%`}
            />
          </div>

          {/* 投票人员列表 */}
          <div>
            {status.voters.map((voter, index) => {
              const attendee = attendees.find((a) => a.attendee_id === voter.attendee_id)
              const isAssigned = selectedVoterIds.includes(voter.attendee_id)

              return (
                <div
                  key={voter.attendee_id}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    borderRadius: '6px',
                    border: '1px solid #f0f0f0',
                    background: voter.has_voted ? '#f5f5f5' : '#fff',
                    opacity: voter.has_voted ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Space>
                    {/* 显示队列序号 */}
                    <Text
                      style={{
                        fontSize: '14px',
                        color: '#8c8c8c',
                        minWidth: '40px',
                      }}
                    >
                      {index + 1}/{status.total_assigned}
                    </Text>

                    {canControl && (
                      <Checkbox
                        checked={isAssigned}
                        onChange={() => handleVoterToggle(voter.attendee_id)}
                        disabled={voter.has_voted} // 已投票的人不能取消
                      />
                    )}
                    <Avatar
                      size="small"
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: voter.has_voted ? '#d9d9d9' : '#1890ff'
                      }}
                    >
                      {voter.username?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Space direction="vertical" size={0}>
                      <Text strong>
                        {voter.full_name || voter.username}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        @{voter.username}
                      </Text>
                    </Space>
                  </Space>

                  {voter.has_voted ? (
                    <Tag icon={<CheckCircleOutlined />} color={VOTE_OPTION_COLORS[voter.vote_option || 'default']}>
                      {VOTE_OPTION_LABELS[voter.vote_option || 'abstain']}
                    </Tag>
                  ) : (
                    <Tag icon={<ClockCircleOutlined />} color="default">
                      等待中
                    </Tag>
                  )}
                </div>
              )
            })}
          </div>

          {/* 提示信息 */}
          {canControl && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              提示：勾选参会人员设为投票人员，已投票的人员不能取消
            </Text>
          )}
        </Space>
      ) : (
        // 当没有指定投票人员时，显示提示信息
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Text type="secondary" style={{ fontSize: '14px', marginBottom: '16px', display: 'block' }}>
            尚未设置投票人员
          </Text>
          {canControl ? (
            <Space direction="vertical" size="small">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                请在下方勾选参会人员作为投票人员
              </Text>
              {attendees.length > 0 && (
                <div style={{ marginTop: '20px', textAlign: 'left' }}>
                  <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '12px' }}>
                    参会人员列表：
                  </Text>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {attendees.map((attendee) => {
                      const isAssigned = selectedVoterIds.includes(attendee.attendee_id)

                      return (
                        <div
                          key={attendee.attendee_id}
                          style={{
                            padding: '10px',
                            marginBottom: '6px',
                            borderRadius: '4px',
                            border: '1px solid #f0f0f0',
                            background: isAssigned ? '#e6f7ff' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Space>
                            <Checkbox
                              checked={isAssigned}
                              onChange={() => handleVoterToggle(attendee.attendee_id)}
                            >
                                <Space size={8}>
                                  <Avatar
                                    size="small"
                                    icon={<UserOutlined />}
                                    style={{ backgroundColor: isAssigned ? '#1890ff' : '#d9d9d9' }}
                                  >
                                    {attendee.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                                  </Avatar>
                                  <Text>
                                    {attendee.user?.full_name || attendee.user?.username || `User${attendee.attendee_id}`}
                                  </Text>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    @{attendee.user?.username || `user${attendee.attendee_id}`}
                                  </Text>
                                </Space>
                              </Checkbox>
                            </Space>
                          {isAssigned && (
                            <Tag color="blue" size="small">已选择</Tag>
                          )}
                        </div>
                      )
                    })}
                  </Space>
                </div>
              )}
            </Space>
          ) : (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              请等待主持人设置投票人员
            </Text>
          )}
        </div>
      )}
    </Card>
  )
}

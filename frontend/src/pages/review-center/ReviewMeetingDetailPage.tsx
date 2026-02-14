import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, message, Spin, Space, Button, Popconfirm } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import reviewMeetingService from '@/services/reviewMeeting.service'
import type { VoteOption, Attendee } from '@/types/review-meeting'
import { MeetingInfoCard } from './components/MeetingInfoCard'
import { RequirementListPanel } from './components/RequirementListPanel'
import { VotePanel } from './components/VotePanel'
import { VoteStatisticsPanel } from './components/VoteStatisticsPanel'
import { VoterSelectionPanel } from './components/VoterSelectionPanel'
import { AddRequirementModal } from './components/AddRequirementModal'
import { AddAttendeeModal } from './components/AddAttendeeModal'
import { EndMeetingConfirmModal } from './components/EndMeetingConfirmModal'
import { useAuthStore } from '@/stores/useAuthStore'

export function ReviewMeetingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [selectedRequirementId, setSelectedRequirementId] = useState<number | null>(null)
  const [votedRequirements, setVotedRequirements] = useState<Set<number>>(new Set())
  const [addRequirementModalVisible, setAddRequirementModalVisible] = useState(false)
  const [addAttendeeModalVisible, setAddAttendeeModalVisible] = useState(false)
  const [endMeetingConfirmVisible, setEndMeetingConfirmVisible] = useState(false)
  const [pendingVotersData, setPendingVotersData] = useState<any>(null)

  // 获取会议详情
  const { data: meetingData, isLoading: meetingLoading } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => reviewMeetingService.getMeeting(Number(id)),
    enabled: !!id,
  })

  // 获取参会人员
  const { data: attendees = [] } = useQuery({
    queryKey: ['attendees', id],
    queryFn: () => reviewMeetingService.getAttendees(Number(id)),
    enabled: !!id,
  })

  // 获取会议需求
  const { data: requirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ['meeting-requirements', id],
    queryFn: () => reviewMeetingService.getMeetingRequirements(Number(id)),
    enabled: !!id,
    refetchInterval: 5000, // 每5秒刷新
  })

  // 获取投票统计（当选中需求时）
  const { data: voteStatistics } = useQuery({
    queryKey: ['vote-statistics', id, selectedRequirementId],
    queryFn: () =>
      reviewMeetingService.getVoteStatistics(Number(id), selectedRequirementId!),
    enabled: !!selectedRequirementId,
    refetchInterval: 5000, // 每5秒刷新
  })

  // 获取我的投票
  const { data: myVote } = useQuery({
    queryKey: ['my-vote', id, selectedRequirementId],
    queryFn: async () => {
      try {
        return await reviewMeetingService.getMyVote(Number(id), selectedRequirementId!)
      } catch (error: any) {
        // 404 是正常的（用户还没投票），返回 undefined
        if (error?.response?.status === 404) {
          console.log('[ReviewMeetingDetailPage] 用户还未投票')
          return undefined
        }
        throw error
      }
    },
    enabled: !!selectedRequirementId,
    retry: false,
  })

  // 获取投票人员状态（用于权限检查）
  const { data: voterStatusData } = useQuery({
    queryKey: ['voter-status', id, selectedRequirementId],
    queryFn: () => reviewMeetingService.getVoterStatus(Number(id), selectedRequirementId!),
    enabled: !!selectedRequirementId,
    refetchInterval: 5000, // 每5秒刷新
  })

  // 获取未投票人员（手动触发）
  const { data: pendingVoters, refetch: refetchPendingVoters } = useQuery({
    queryKey: ['pending-voters', id],
    queryFn: () => reviewMeetingService.getPendingVoters(Number(id)),
    enabled: false,  // 手动触发
  })

  // 开始会议
  const startMeetingMutation = useMutation({
    mutationFn: () => reviewMeetingService.startMeeting(Number(id)),
    onSuccess: () => {
      message.success('会议已开始')
      queryClient.invalidateQueries({ queryKey: ['meeting', id] })
    },
    onError: (error: any) => {
      message.error(error.message || '开始会议失败')
    },
  })

  // 结束会议
  const endMeetingMutation = useMutation({
    mutationFn: ({ autoAbstain = false }: { autoAbstain?: boolean }) =>
      reviewMeetingService.endMeeting(Number(id), autoAbstain),
    onSuccess: () => {
      message.success('会议已结束')
      queryClient.invalidateQueries({ queryKey: ['meeting', id] })
    },
    onError: (error: any) => {
      message.error(error.message || '结束会议失败')
    },
  })

  // 投票
  const voteMutation = useMutation({
    mutationFn: ({ voteOption, comment }: { voteOption: VoteOption; comment?: string }) =>
      reviewMeetingService.castVote(Number(id), selectedRequirementId!, {
        vote_option: voteOption,
        comment,
      }),
    onSuccess: async () => {
      message.success('投票成功')

      // 标记该需求已投票
      if (selectedRequirementId) {
        setVotedRequirements((prev) => new Set(prev).add(selectedRequirementId))
      }

      // 立即刷新投票统计、我的投票和投票人员状态
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vote-statistics', id, selectedRequirementId] }),
        queryClient.invalidateQueries({ queryKey: ['my-vote', id, selectedRequirementId] }),
        queryClient.invalidateQueries({ queryKey: ['voter-status', id, selectedRequirementId] })
      ])

      // 强制重新获取数据（确保立即更新）
      await queryClient.refetchQueries({ queryKey: ['vote-statistics', id, selectedRequirementId] })
      await queryClient.refetchQueries({ queryKey: ['my-vote', id, selectedRequirementId] })
      await queryClient.refetchQueries({ queryKey: ['voter-status', id, selectedRequirementId] })
    },
    onError: (error: any) => {
      message.error(error.message || '投票失败')
    },
  })

  const handleStartMeeting = () => {
    startMeetingMutation.mutate()
  }

  const handleEndMeeting = async () => {
    console.log('[ReviewMeetingDetailPage] handleEndMeeting 被调用')
    console.log('[ReviewMeetingDetailPage] 当前用户:', user)
    console.log('[ReviewMeetingDetailPage] 会议数据:', meetingData?.data)

    // 先获取未投票人员信息
    try {
      const result = await refetchPendingVoters()
      console.log('[ReviewMeetingDetailPage] 获取未投票人员结果:', result)
      console.log('[ReviewMeetingDetailPage] result.data:', result.data)
      console.log('[ReviewMeetingDetailPage] result.data?.data:', result.data?.data)

      if (result.data?.data) {
        setPendingVotersData(result.data.data)
        const totalPending = result.data.data.requirements?.reduce(
          (sum: number, req: any) => sum + (req.pending_voters?.length || 0),
          0
        )

        console.log('[ReviewMeetingDetailPage] 总未投票人数:', totalPending)

        if (totalPending > 0) {
          // 有未投票人员,显示确认弹窗
          console.log('[ReviewMeetingDetailPage] 显示确认弹窗')
          setEndMeetingConfirmVisible(true)
        } else {
          // 所有人员都已投票,直接结束会议
          console.log('[ReviewMeetingDetailPage] 直接结束会议（无未投票人员）')
          endMeetingMutation.mutate({ autoAbstain: false })
        }
      } else {
        console.log('[ReviewMeetingDetailPage] result.data?.data 为空，使用默认值（直接结束）')
        // 如果获取失败或没有数据，直接结束会议
        endMeetingMutation.mutate({ autoAbstain: false })
      }
    } catch (error) {
      console.error('[ReviewMeetingDetailPage] handleEndMeeting 错误:', error)
      message.error('获取未投票人员信息失败')
    }
  }

  const handleEndMeetingConfirm = () => {
    // 用户确认,执行自动弃权并结束会议
    endMeetingMutation.mutate(
      { autoAbstain: true },
      {
        onSuccess: () => {
          setEndMeetingConfirmVisible(false)
          message.success('会议已结束,未投票人员已自动弃权')
        }
      }
    )
  }

  const handleEndMeetingCancel = () => {
    // 用户取消,关闭弹窗
    setEndMeetingConfirmVisible(false)
    message.info('已取消结束会议,请继续投票')
  }

  const handleSelectRequirement = (requirementId: number) => {
    setSelectedRequirementId(requirementId)
  }

  const handleVote = async (voteOption: VoteOption, comment?: string) => {
    voteMutation.mutate({ voteOption, comment })
  }

  // 删除会议
  const deleteMeetingMutation = useMutation({
    mutationFn: () => reviewMeetingService.deleteMeeting(Number(id)),
    onSuccess: () => {
      message.success('会议删除成功')
      // 返回列表页
      navigate('/review-center')
    },
    onError: (error: any) => {
      message.error(error.message || '删除会议失败')
    },
  })

  const handleDeleteMeeting = () => {
    deleteMeetingMutation.mutate()
  }

  // 检查是否可以控制会议（主持人）
  const canControl = !!(meetingData?.data && user && meetingData.data.moderator_id === user.id)

  // 检查会议是否进行中（只有进行中才能添加人员和需求）
  const isMeetingInProgress = meetingData?.data?.status === 'in_progress'

  // 调试日志
  console.log('[ReviewMeetingDetailPage] 控制检查:', {
    hasMeetingData: !!meetingData?.data,
    hasUser: !!user,
    userId: user?.id,
    moderatorId: meetingData?.data?.moderator_id,
    canControl,
    userRole: user?.role,
  })

  // 获取主持人信息（从attendees或当前用户）
  const moderator = attendees.find((a: Attendee) => a.attendee_id === meetingData?.data?.moderator_id)?.user
    || (user && user.id === meetingData?.data?.moderator_id ? {
        id: user.id,
        username: user.username || `User${user.id}`,
        full_name: user.full_name
      } : undefined)

  console.log('[ReviewMeetingDetailPage] 主持人信息:', moderator)

  // 检查是否可以投票
  // 规则：
  // 1. admin 用户任何时候都可以投票（无需在参会人员列表中）
  // 2. 其他用户必须在参会人员列表中才能投票
  // 3. 必须选中需求
  // 4. 会议必须进行中
  const isAdmin = user?.role === 'admin'
  const isAttendee = attendees.some((a: Attendee) => a.attendee_id === user?.id)

  const canVote =
    meetingData?.data?.status === 'in_progress' &&
    (isAdmin || isAttendee) &&  // admin 或参会人员都可以投票
    selectedRequirementId !== null  // 必须选中需求

  // 调试日志：显示投票权限检查状态
  console.log('[ReviewMeetingDetailPage] ===== 投票权限检查 =====')
  console.log('[ReviewMeetingDetailPage] canVote:', canVote)
  console.log('[ReviewMeetingDetailPage] isAdmin:', isAdmin)
  console.log('[ReviewMeetingDetailPage] isAttendee:', isAttendee)
  console.log('[ReviewMeetingDetailPage] meetingStatus:', meetingData?.data?.status)
  console.log('[ReviewMeetingDetailPage] selectedRequirementId:', selectedRequirementId)
  console.log('[ReviewMeetingDetailPage] user:', user)
  console.log('[ReviewMeetingDetailPage] userId:', user?.id)
  console.log('[ReviewMeetingDetailPage] userRole:', user?.role)
  console.log('[ReviewMeetingDetailPage] attendees count:', attendees.length)
  console.log('[ReviewMeetingDetailPage] attendees:', attendees.map(a => ({
    attendee_id: a.attendee_id,
    attendance_status: a.attendance_status,
    username: a.user?.username
  })))
  console.log('[ReviewMeetingDetailPage] ======================================')

  if (meetingLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!meetingData?.data) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2>会议不存在</h2>
      </div>
    )
  }

  const meeting = meetingData.data

  // 调试：渲染时检查状态
  console.log('[ReviewMeetingDetailPage] 渲染状态:', {
    canControl,
    isMeetingInProgress,
    meetingStatus: meeting?.status,
    hasHandleEndMeeting: typeof handleEndMeeting === 'function',
    hasOnEndMeeting: !!(canControl && handleEndMeeting),
  })

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        {/* 左侧：会议信息 + 需求列表 */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <MeetingInfoCard
              meeting={meeting}
              attendees={attendees.map(a => ({
                id: a.attendee_id,
                username: a.user?.username || `User${a.attendee_id}`,
                full_name: a.user?.full_name,
              }))}
              moderator={moderator}
              onStartMeeting={canControl ? handleStartMeeting : undefined}
              onEndMeeting={canControl ? handleEndMeeting : undefined}
              onDeleteMeeting={canControl ? handleDeleteMeeting : undefined}
              onAddAttendee={(canControl && isMeetingInProgress) ? () => setAddAttendeeModalVisible(true) : undefined}
              canControl={canControl}
              isMeetingInProgress={isMeetingInProgress}
            />
            <RequirementListPanel
              requirements={requirements}
              selectedId={selectedRequirementId}
              onSelect={handleSelectRequirement}
              votedRequirements={votedRequirements}
              loading={requirementsLoading}
              onAddRequirement={isMeetingInProgress ? () => setAddRequirementModalVisible(true) : undefined}
              canAddRequirements={isMeetingInProgress}  // 只有会议进行中才能添加需求
            />
          </Space>
        </Col>

        {/* 右侧：投票面板 + 投票统计 + 投票人员管理 */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <VotePanel
              requirementId={selectedRequirementId ?? undefined}
              selectedRequirementId={selectedRequirementId}
              existingVote={myVote?.data?.vote_option}
              existingComment={myVote?.data?.comment}
              onSubmit={handleVote}
              disabled={!canVote}
              isVotingComplete={voterStatusData?.data?.is_voting_complete}
            />
            {voteStatistics && (
              <VoteStatisticsPanel statistics={voteStatistics.data} />
            )}
            <VoterSelectionPanel
              meetingId={Number(id)}
              requirementId={selectedRequirementId}
              attendees={attendees}
              canControl={canControl}
              isVotingComplete={voterStatusData?.data?.is_voting_complete}
            />
          </Space>
        </Col>
      </Row>

      {/* 添加需求模态框 */}
      <AddRequirementModal
        visible={addRequirementModalVisible}
        onCancel={() => setAddRequirementModalVisible(false)}
        meetingId={Number(id)}
        existingRequirementIds={requirements.map((r) => r.requirement_id)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['meeting-requirements', id] })
        }}
      />

      {/* 添加参会人员模态框 */}
      <AddAttendeeModal
        visible={addAttendeeModalVisible}
        onCancel={() => setAddAttendeeModalVisible(false)}
        meetingId={Number(id)}
        existingAttendeeIds={attendees.map((a) => a.attendee_id)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['attendees', id] })
        }}
      />

      {/* 结束会议确认弹窗 */}
      <EndMeetingConfirmModal
        visible={endMeetingConfirmVisible}
        data={pendingVotersData}
        onConfirm={handleEndMeetingConfirm}
        onCancel={handleEndMeetingCancel}
        loading={endMeetingMutation.isPending}
      />
    </div>
  )
}

export default ReviewMeetingDetailPage

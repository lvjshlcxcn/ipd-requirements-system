import { Card, Button, Radio, Space, Typography, Input, message, Tag } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import type { VoteOption } from '@/types/review-meeting'

const { TextArea } = Input
const { Text, Title } = Typography

interface VotePanelProps {
  requirementId?: number
  selectedRequirementId: number | null
  existingVote?: VoteOption
  existingComment?: string
  onSubmit: (voteOption: VoteOption, comment?: string) => Promise<void>
  disabled?: boolean
  isVotingComplete?: boolean
}

/**
 * 投票选项配置
 */
const VOTE_OPTIONS: Array<{
  value: VoteOption
  label: string
  icon: React.ReactNode
  color: string
}> = [
  { value: 'approve', label: '支持通过', icon: <CheckCircleOutlined />, color: '#52c41a' },
  { value: 'reject', label: '反对拒绝', icon: <CloseCircleOutlined />, color: '#ff4d4f' },
  { value: 'abstain', label: '弃权', icon: <MinusCircleOutlined />, color: '#faad14' },
]

export function VotePanel({
  requirementId,
  selectedRequirementId,
  existingVote,
  existingComment = '',
  onSubmit,
  disabled = false,
  isVotingComplete = false,
}: VotePanelProps) {
  const [voteOption, setVoteOption] = useState<VoteOption | undefined>(existingVote)
  const [comment, setComment] = useState(existingComment)
  const [submitting, setSubmitting] = useState(false)

  // 当 existingVote 或 existingComment 变化时，同步到 state
  useEffect(() => {
    setVoteOption(existingVote)
    setComment(existingComment || '')
  }, [existingVote, existingComment])

  // 判断投票按钮是否应该禁用
  const voteButtonDisabled = disabled || existingVote !== undefined

  const handleSubmit = async () => {
    if (!voteOption) {
      message.warning('请选择投票选项')
      return
    }

    if (!selectedRequirementId) {
      message.warning('请先选择一个需求')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(voteOption, comment.trim() || undefined)
      // 注意：消息显示已移至父组件 (ReviewMeetingDetailPage)
    } catch (error: any) {
      message.error(error.message || '投票失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 没有选中需求时显示提示
  if (!selectedRequirementId) {
    return (
      <Card title="投票决策">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">请从左侧选择一个需求进行投票</Text>
        </div>
      </Card>
    )
  }

  // 投票完成时显示结果
  if (isVotingComplete) {
    return (
      <Card
        title="投票决策"
        extra={<Tag icon={<CheckCircleOutlined />} color="success">投票完成</Tag>}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: '16px' }} />
          <Title level={4}>所有投票已完成</Title>
          <Text type="secondary">该需求的所有投票人已完成投票，请查看投票统计结果</Text>
        </div>
      </Card>
    )
  }

  return (
    <Card
      title="投票决策"
      extra={existingVote && <Tag color="blue">已投票</Tag>}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>

        {/* 投票选项按钮 */}
        <div>
          <Text strong style={{ marginBottom: 16, display: 'block' }}>
            请选择您的立场：
          </Text>
          <Radio.Group
            value={voteOption}
            onChange={(e) => setVoteOption(e.target.value)}
            disabled={voteButtonDisabled}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {VOTE_OPTIONS.map((option) => (
                <Radio.Button
                  key={option.value}
                  value={option.value}
                  style={{ width: '100%', height: 'auto', padding: '12px 16px' }}
                  disabled={voteButtonDisabled}
                >
                  <Space size="large">
                    <span style={{ fontSize: '20px', color: option.color }}>
                      {option.icon}
                    </span>
                    <span style={{ fontSize: '16px' }}>{option.label}</span>
                  </Space>
                </Radio.Button>
              ))}
            </Space>
          </Radio.Group>
        </div>

        {/* 评审意见 */}
        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>
            评审意见（可选）：
          </Text>
          <TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="请输入您的评审意见..."
            rows={4}
            disabled={voteButtonDisabled}
            maxLength={500}
            showCount
          />
        </div>

        {/* 提交按钮 */}
        <Button
          type="primary"
          size="large"
          onClick={handleSubmit}
          loading={submitting}
          disabled={existingVote || voteButtonDisabled || !voteOption}
          block
        >
          {existingVote ? '已投票' : '提交投票'}
        </Button>
      </Space>
    </Card>
  )
}

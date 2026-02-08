import { Card, Progress, List, Avatar, Tag, Empty, Typography, Space } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons'
import type { VoteStatistics, VoteOption } from '@/types/review-meeting'

const { Text } = Typography

interface VoteStatisticsPanelProps {
  statistics: VoteStatistics
}

/**
 * 投票选项配置
 */
const VOTE_CONFIG: Record<
  VoteOption,
  { color: string; label: string; icon: React.ReactNode }
> = {
  approve: { color: '#52c41a', label: '支持通过', icon: <CheckCircleOutlined /> },
  reject: { color: '#ff4d4f', label: '反对拒绝', icon: <CloseCircleOutlined /> },
  abstain: { color: '#faad14', label: '弃权', icon: <MinusCircleOutlined /> },
}

export function VoteStatisticsPanel({ statistics }: VoteStatisticsPanelProps) {
  const { total_votes, approve_count, reject_count, abstain_count, votes } = statistics

  const voteData = [
    {
      option: 'approve' as VoteOption,
      count: approve_count,
      percentage: statistics.approve_percentage || 0,
    },
    {
      option: 'reject' as VoteOption,
      count: reject_count,
      percentage: statistics.reject_percentage || 0,
    },
    {
      option: 'abstain' as VoteOption,
      count: abstain_count,
      percentage: statistics.abstain_percentage || 0,
    },
  ]

  return (
    <Card title="投票统计" extra={<Text type="secondary">共 {total_votes} 票</Text>}>
      {total_votes === 0 ? (
        <Empty description="暂无投票" />
      ) : (
        <>
          {/* 进度条统计 */}
          <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 24 }}>
            {voteData.map(({ option, count, percentage }) => {
              const config = VOTE_CONFIG[option]
              return (
                <div key={option}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Space>
                      {config.icon}
                      <Text>
                        {config.label} ({count})
                      </Text>
                    </Space>
                    <Text strong>{percentage.toFixed(1)}%</Text>
                  </div>
                  <Progress
                    percent={percentage}
                    strokeColor={config.color}
                    showInfo={false}
                    trailColor="#f0f0f0"
                  />
                </div>
              )
            })}
          </Space>

          {/* 投票详情列表 */}
          <List
            header={<Text strong>投票详情</Text>}
            dataSource={votes}
            renderItem={(vote) => {
              const config = VOTE_CONFIG[vote.vote_option]
              return (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: config.color }}>
                        {vote.voter_name?.charAt(0)?.toUpperCase() || '?'}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <Text strong>{vote.voter_name}</Text>
                        <Tag color={config.color}>{config.label}</Tag>
                      </Space>
                    }
                    description={
                      vote.comment ? (
                        <Text type="secondary">{vote.comment}</Text>
                      ) : (
                        <Text type="secondary">无意见</Text>
                      )
                    }
                  />
                </List.Item>
              )
            }}
          />
        </>
      )}
    </Card>
  )
}

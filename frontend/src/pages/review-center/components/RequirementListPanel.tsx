import { List, Tag, Card, Avatar, Space, Typography, Empty, Badge, Button } from 'antd'
import { CheckOutlined, ClockCircleOutlined, PlusOutlined } from '@ant-design/icons'
import type { MeetingRequirement, VoteOption } from '@/types/review-meeting'

const { Text, Paragraph } = Typography

interface RequirementListPanelProps {
  requirements: MeetingRequirement[]
  selectedId: number | null
  onSelect: (requirementId: number) => void
  votedRequirements?: Set<number> // 已投票的需求ID集合
  loading?: boolean
  onAddRequirement?: () => void // 添加需求的回调
  canAddRequirements?: boolean // 是否可以添加需求
}

/**
 * 优先级颜色映射
 */
const PRIORITY_COLORS: Record<string, string> = {
  P0: 'red',
  P1: 'orange',
  P2: 'blue',
  P3: 'default',
}

/**
 * 需求类型颜色映射
 */
const TYPE_COLORS: Record<string, string> = {
  OR: 'purple',
  PR: 'cyan',
  SR: 'green',
  FR: 'blue',
  NFR: 'magenta',
}

export function RequirementListPanel({
  requirements,
  selectedId,
  onSelect,
  votedRequirements = new Set(),
  loading = false,
  onAddRequirement,
  canAddRequirements = false,
}: RequirementListPanelProps) {
  // 调试日志
  console.log('[RequirementListPanel] 状态检查:', {
    requirementsLength: requirements.length,
    canAddRequirements,
    hasOnAddRequirement: !!onAddRequirement,
  })

  return (
    <Card
      title={
        <Space>
          <Text strong>待评审需求</Text>
          <Badge count={requirements.length} showZero />
        </Space>
      }
      extra={
        canAddRequirements && onAddRequirement ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              console.log('[RequirementListPanel] 添加需求按钮被点击')
              onAddRequirement()
            }}
            size="small"
          >
            添加需求
          </Button>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {!canAddRequirements ? '请先开始会议' : '加载中...'}
          </Text>
        )
      }
    >
      {requirements.length === 0 ? (
        <Empty description="暂无待评审需求" />
      ) : (
        <List
          loading={loading}
          dataSource={requirements}
          renderItem={(item) => {
            const isSelected = selectedId === item.requirement_id
            const hasVoted = votedRequirements.has(item.requirement_id)

            // 调试日志
            console.log('[RequirementListPanel] 需求项:', {
              id: item.id,
              requirement_id: item.requirement_id,
              hasRequirement: !!item.requirement,
              requirement: item.requirement,
            })

            return (
              <List.Item
                key={item.id}
                onClick={() => onSelect(item.requirement_id)}
                style={{
                  cursor: 'pointer',
                  padding: '16px',
                  background: isSelected ? '#e6f7ff' : 'transparent',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: isSelected ? '1px solid #1890ff' : '1px solid #f0f0f0',
                  transition: 'all 0.2s',
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar style={{ backgroundColor: '#1890ff' }}>
                      {item.review_order}
                    </Avatar>
                  }
                  title={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space>
                        {item.requirement ? (
                          <>
                            <Text code>{item.requirement.requirement_no}</Text>
                            <Tag color={TYPE_COLORS[item.requirement.target_type || 'default']}>
                              {item.requirement.target_type || '未分类'}
                            </Tag>
                            <Tag color={PRIORITY_COLORS[item.requirement.moscow_priority || 'default']}>
                              {item.requirement.moscow_priority || '未设置'}
                            </Tag>
                          </>
                        ) : (
                          <Tag color="warning">需求信息加载失败</Tag>
                        )}
                        {hasVoted && (
                          <Tag icon={<CheckOutlined />} color="success">
                            已投票
                          </Tag>
                        )}
                      </Space>
                      {item.requirement ? (
                        <Text strong>{item.requirement.title}</Text>
                      ) : (
                        <Text type="secondary">需求 ID: {item.requirement_id} (无法加载详情)</Text>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {item.requirement?.description ? (
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          style={{ marginBottom: 0, color: '#666' }}
                        >
                          {item.requirement.description}
                        </Paragraph>
                      ) : item.requirement ? (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          无描述
                        </Text>
                      ) : (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          ⚠️ 需求详情可能在数据库中已被删除
                        </Text>
                      )}
                      {item.meeting_notes && (
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            会议备注: {item.meeting_notes}
                          </Text>
                        </div>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )
          }}
        />
      )}
    </Card>
  )
}

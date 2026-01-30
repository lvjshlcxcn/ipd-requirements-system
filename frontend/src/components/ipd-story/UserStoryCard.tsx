import React from 'react'
import { Card, Tag, Space, Typography, Button, Divider } from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { GeneratedUserStory } from '@/types/ipd'
import { FREQUENCY_MAP, PRIORITY_MAP } from '@/types/ipd'

const { Title, Text, Paragraph } = Typography

interface UserStoryCardProps {
  story: GeneratedUserStory
  onEdit?: () => void
  onNext?: () => void
  onConvertToRequirement?: (story: GeneratedUserStory) => void
  showActions?: boolean
  loading?: boolean
}

/**
 * 用户故事卡片组件
 */
export const UserStoryCard: React.FC<UserStoryCardProps> = ({
  story,
  onEdit,
  onNext,
  onConvertToRequirement,
  showActions = true,
  loading = false,
}) => {
  const priorityInfo = PRIORITY_MAP[story.priority] || { text: '未定', color: '#d9d9d9' }
  const frequencyText = FREQUENCY_MAP[story.frequency] || story.frequency

  return (
    <Card
      bordered={false}
      style={{
        background: 'linear-gradient(135deg, #f6f8fc 0%, #ffffff 100%)',
        borderLeft: '4px solid #1890ff',
        borderRadius: '8px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 故事标题 */}
        <div>
          <Title level={4} style={{ marginBottom: 8 }}>
            📝 {story.title}
          </Title>
          <Text type="secondary" italic>
            以便于 {story.benefit}
          </Text>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* 元数据标签 */}
        <div>
          <Space size="middle" wrap>
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
              👤 {story.role}
            </Tag>
            <Tag
              color={priorityInfo.text === '高' ? 'red' : priorityInfo.text === '中' ? 'orange' : 'green'}
              style={{ fontSize: 14, padding: '4px 12px' }}
            >
              ⭐ {priorityInfo.text}优先级
            </Tag>
            <Tag style={{ fontSize: 14, padding: '4px 12px', background: '#f0f0f0' }}>
              📊 频次: {frequencyText}
            </Tag>
          </Space>
        </div>

        {/* 验收标准 */}
        <div
          style={{
            background: '#fff',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #d9d9d9',
          }}
        >
          <Title level={5} style={{ marginBottom: 12 }}>
            ✅ 验收标准
          </Title>
          <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
            {story.acceptanceCriteria.map((criteria, index) => (
              <li
                key={index}
                style={{
                  padding: '6px 0',
                  paddingLeft: '24px',
                  position: 'relative',
                  color: 'rgba(0, 0, 0, 0.65)',
                }}
              >
                <CheckCircleOutlined
                  style={{
                    position: 'absolute',
                    left: 0,
                    color: '#52c41a',
                    fontSize: 14,
                  }}
                />
                {criteria}
              </li>
            ))}
          </ul>
        </div>

        {/* 操作按钮 */}
        {showActions && (
          <>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <Button icon={<ArrowLeftOutlined />} onClick={onEdit} disabled={loading}>
                返回修改
              </Button>
              {onConvertToRequirement && (
                <Button onClick={() => onConvertToRequirement(story)} disabled={loading} loading={loading}>
                  转化为需求
                </Button>
              )}
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={onNext} disabled={loading}>
                开始 INVEST 分析
              </Button>
            </div>
          </>
        )}
      </Space>
    </Card>
  )
}

export default UserStoryCard

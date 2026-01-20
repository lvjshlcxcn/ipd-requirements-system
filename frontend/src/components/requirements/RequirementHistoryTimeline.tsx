import { Timeline, Tag, Empty, Input, Modal, Button, message } from 'antd'
import { ClockCircleOutlined, EditOutlined, UserOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { requirementService } from '@/services/requirement.service'
import { STATUS_MAP, HISTORY_ACTION_MAP } from '@/constants/status'
import type { ApiResponse } from '@/services/api'

const { TextArea } = Input

interface HistoryItem {
  id: number
  action: string
  from_status: string | null
  to_status: string
  comments: string | null
  performed_at: string
  performed_by: number | null
}

interface RequirementHistoryTimelineProps {
  requirementId: number
  // refreshTrigger 已移除 - TanStack Query 会自动管理缓存
}

/**
 * 需求历史时间线组件
 * 显示需求的状态变更历史和用户添加的备注
 * 使用 TanStack Query 管理服务端状态
 */
export function RequirementHistoryTimeline({ requirementId }: RequirementHistoryTimelineProps) {
  const queryClient = useQueryClient()
  const [noteModalVisible, setNoteModalVisible] = useState(false)
  const [noteContent, setNoteContent] = useState('')

  // 使用 useQuery 获取历史记录
  const {
    data: history = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['requirementHistory', requirementId],
    queryFn: async () => {
      const response = await requirementService.getRequirementHistory(requirementId) as ApiResponse<HistoryItem[]>
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.message || '获取历史记录失败')
    },
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
    gcTime: 10 * 60 * 1000, // 10分钟后清理缓存
  })

  // 使用 useMutation 添加备注
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await requirementService.addHistoryNote(requirementId, {
        comments: content,
      }) as ApiResponse<any>
      if (!response.success) {
        throw new Error(response.message || '添加备注失败')
      }
      return response
    },
    onSuccess: () => {
      message.success('备注添加成功')
      setNoteModalVisible(false)
      setNoteContent('')
      // 使查询缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['requirementHistory', requirementId] })
    },
    onError: (error: Error) => {
      console.error('Add note error:', error)
      message.error('添加备注失败')
    },
  })

  // 处理错误
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Empty description="加载失败，请稍后重试" />
      </div>
    )
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      message.warning('请输入备注内容')
      return
    }

    addNoteMutation.mutate(noteContent)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const renderTimelineItem = (item: HistoryItem) => {
    const isStatusChange = item.action === 'status_changed' && item.from_status

    return (
      <Timeline.Item
        key={item.id}
        dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />}
      >
        <div>
          <div style={{ marginBottom: 4 }}>
            <Tag color="blue">{HISTORY_ACTION_MAP[item.action] || item.action}</Tag>
            <span style={{ marginLeft: 8, color: '#999' }}>
              {formatDateTime(item.performed_at)}
            </span>
            {item.performed_by && (
              <span style={{ marginLeft: 8, color: '#999' }}>
                <UserOutlined /> ID: {item.performed_by}
              </span>
            )}
          </div>

          {isStatusChange && (
            <div style={{ marginBottom: 4 }}>
              状态变更：
              <Tag color={STATUS_MAP[item.from_status!]?.color}>
                {STATUS_MAP[item.from_status!]?.text || item.from_status}
              </Tag>
              →
              <Tag color={STATUS_MAP[item.to_status]?.color}>
                {STATUS_MAP[item.to_status]?.text || item.to_status}
              </Tag>
            </div>
          )}

          {item.comments && (
            <div
              style={{
                padding: '8px 12px',
                background: '#f5f5f5',
                borderRadius: '4px',
                marginTop: 4,
              }}
            >
              {item.comments}
            </div>
          )}
        </div>
      </Timeline.Item>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => setNoteModalVisible(true)}
        >
          添加备注
        </Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
      ) : history.length === 0 ? (
        <Empty description="暂无历史记录" />
      ) : (
        <Timeline mode="left">{history.map(renderTimelineItem)}</Timeline>
      )}

      <Modal
        title="添加备注"
        open={noteModalVisible}
        onOk={handleAddNote}
        okText="确定"
        cancelText="取消"
        onCancel={() => {
          setNoteModalVisible(false)
          setNoteContent('')
        }}
        confirmLoading={addNoteMutation.isPending}
      >
        <TextArea
          rows={4}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="请输入备注内容..."
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  )
}

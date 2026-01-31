import { Timeline, Tag, Empty, Input, Modal, Button, message, Pagination } from 'antd'
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
  pageSize?: number // 每页显示条数，默认10条
}

/**
 * 需求历史时间线组件
 * 显示需求的状态变更历史和用户添加的备注
 * 使用 TanStack Query 管理服务端状态
 * 支持分页显示历史记录
 */
export function RequirementHistoryTimeline({
  requirementId,
  pageSize = 10
}: RequirementHistoryTimelineProps) {
  const queryClient = useQueryClient()
  const [noteModalVisible, setNoteModalVisible] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // 使用 useQuery 获取历史记录（获取更多数据以支持分页）
  const {
    data: history = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['requirementHistory', requirementId],
    queryFn: async () => {
      // 获取最多100条历史记录用于分页
      const response = await requirementService.getRequirementHistory(requirementId, 100) as ApiResponse<HistoryItem[]>
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.message || '获取历史记录失败')
    },
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
    gcTime: 10 * 60 * 1000, // 10分钟后清理缓存
  })

  // 计算分页数据
  const totalItems = history.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPageData = history.slice(startIndex, endIndex)

  // 页码改变处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  // 当添加新备注时，重置到第一页
  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      message.warning('请输入备注内容')
      return
    }

    addNoteMutation.mutate(noteContent, {
      onSuccess: () => {
        // 重置到第一页以显示最新添加的备注
        setCurrentPage(1)
      }
    })
  }

  const timelineItems = currentPageData.map((item) => {
    const isStatusChange = item.action === 'status_changed' && item.from_status

    return {
      key: item.id,
      dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
      children: (
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
      ),
    }
  })

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#999', fontSize: 14 }}>
          共 {totalItems} 条记录
        </span>
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
      ) : totalItems === 0 ? (
        <Empty description="暂无历史记录" />
      ) : (
        <>
          <Timeline mode="left" items={timelineItems} style={{ marginBottom: 24 }} />

          {/* 分页组件 */}
          {totalPages > 1 && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Pagination
                current={currentPage}
                total={totalItems}
                pageSize={pageSize}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                size="small"
              />
            </div>
          )}
        </>
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

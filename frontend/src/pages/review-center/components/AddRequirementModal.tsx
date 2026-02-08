import { Modal, List, Tag, Button, Input, Space, Typography, Spin, Empty, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { requirementService } from '@/services/requirement.service'
import type { Requirement } from '@/shared/types/api'
import { useMutation } from '@tanstack/react-query'
import reviewMeetingService from '@/services/reviewMeeting.service'

const { Text } = Typography
const { Search } = Input

interface AddRequirementModalProps {
  visible: boolean
  onCancel: () => void
  meetingId: number
  existingRequirementIds: number[] // 已添加的需求ID列表
  onSuccess: () => void
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

export function AddRequirementModal({
  visible,
  onCancel,
  meetingId,
  existingRequirementIds,
  onSuccess,
}: AddRequirementModalProps) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // 重置状态
  useEffect(() => {
    if (visible) {
      setSearchKeyword('')
      setPage(1)
      setSelectedIds([])
    }
  }, [visible])

  // 获取需求列表
  const { data: requirementsData, isLoading } = useQuery({
    queryKey: ['requirements-for-meeting', page, pageSize, searchKeyword],
    queryFn: () =>
      requirementService.getRequirements({
        page,
        page_size: pageSize,
        search: searchKeyword || undefined,
      }),
    enabled: visible,
  })

  // 过滤已添加的需求
  const availableRequirements = requirementsData?.data?.items?.filter(
    (req: Requirement) => !existingRequirementIds.includes(req.id)
  ) || []

  // 添加需求到会议
  const addMutation = useMutation({
    mutationFn: (requirementId: number) =>
      reviewMeetingService.addRequirementToMeeting(meetingId, {
        requirement_id: requirementId,
      }),
    onSuccess: (response) => {
      console.log('[AddRequirementModal] 添加成功:', response)
      message.success('需求添加成功')
      onSuccess()
    },
    onError: (error: any) => {
      console.error('[AddRequirementModal] 添加失败:', error)
      // 显示更详细的错误信息
      const errorMessage = error?.response?.data?.detail || error?.message || '添加需求失败'
      message.error(errorMessage)
    },
  })

  // 批量添加需求
  const handleAddMultiple = async () => {
    if (selectedIds.length === 0) {
      message.warning('请至少选择一个需求')
      return
    }

    for (const requirementId of selectedIds) {
      await addMutation.mutateAsync(requirementId)
    }

    setSelectedIds([])
    message.success(`成功添加 ${selectedIds.length} 个需求`)
  }

  // 切换选择状态
  const toggleSelection = (requirementId: number) => {
    setSelectedIds((prev) =>
      prev.includes(requirementId)
        ? prev.filter((id) => id !== requirementId)
        : [...prev, requirementId]
    )
  }

  return (
    <Modal
      title="添加需求到会议"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button
            type="primary"
            onClick={handleAddMultiple}
            loading={addMutation.isPending}
            disabled={selectedIds.length === 0}
          >
            添加选中的需求 ({selectedIds.length})
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 搜索框 */}
        <Search
          placeholder="搜索需求编号、标题或描述"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={(value) => {
            setSearchKeyword(value)
            setPage(1)
          }}
          prefix={<SearchOutlined />}
          allowClear
          enterButton
        />

        {/* 需求列表 */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
            </div>
          ) : availableRequirements.length === 0 ? (
            <Empty description={searchKeyword ? '未找到匹配的需求' : '没有可添加的需求'} />
          ) : (
            <List
              dataSource={availableRequirements}
              renderItem={(item: Requirement) => {
                const isSelected = selectedIds.includes(item.id)

                return (
                  <List.Item
                    key={item.id}
                    style={{
                      cursor: 'pointer',
                      padding: '16px',
                      background: isSelected ? '#e6f7ff' : 'transparent',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      border: isSelected ? '1px solid #1890ff' : '1px solid #f0f0f0',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => toggleSelection(item.id)}
                  >
                    <List.Item.Meta
                      title={
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Space>
                            <Text code>{item.requirement_no}</Text>
                            <Tag color={TYPE_COLORS[item.target_type || 'default']}>
                              {item.target_type || '未分类'}
                            </Tag>
                            <Tag color={PRIORITY_COLORS[item.moscow_priority || 'default']}>
                              {item.moscow_priority || '未设置'}
                            </Tag>
                          </Space>
                          <Text strong>{item.title}</Text>
                        </Space>
                      }
                      description={
                        item.description && (
                          <Text
                            type="secondary"
                            ellipsis={{ rows: 2 }}
                            style={{ fontSize: '12px' }}
                          >
                            {item.description}
                          </Text>
                        )
                      }
                    />
                  </List.Item>
                )
              }}
            />
          )}
        </div>

        {/* 分页 */}
        {requirementsData?.data?.total_pages && requirementsData.data.total_pages > 1 && (
          <div style={{ textAlign: 'center', paddingTop: '16px' }}>
            <Space>
              <Button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </Button>
              <Text>
                第 {page} / {requirementsData.data.total_pages} 页
              </Text>
              <Button
                disabled={page === requirementsData.data.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </Space>
          </div>
        )}
      </Space>
    </Modal>
  )
}

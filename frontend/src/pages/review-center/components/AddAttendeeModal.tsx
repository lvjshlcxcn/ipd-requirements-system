import { Modal, List, Tag, Button, Input, Space, Typography, Spin, Empty, message } from 'antd'
import { SearchOutlined, UserOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { useMutation } from '@tanstack/react-query'
import reviewMeetingService from '@/services/reviewMeeting.service'

// 导入URL（虽然通常在全局可用，但明确导入更安全）
const URLSearchParams = globalThis.URLSearchParams

const { Text } = Typography
const { Search } = Input

interface User {
  id: number
  username: string
  email?: string
  full_name?: string
  role: string
}

interface UsersResponse {
  success: boolean
  data: {
    items: User[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}

interface AddAttendeeModalProps {
  visible: boolean
  onCancel: () => void
  meetingId: number
  existingAttendeeIds: number[] // 已添加的参会人员ID列表
  onSuccess: () => void
}

/**
 * 角色颜色映射
 */
const ROLE_COLORS: Record<string, string> = {
  admin: 'red',
  product_manager: 'orange',
  marketing_manager: 'blue',
  sales_manager: 'green',
  pm: 'purple',
  engineer: 'cyan',
  stakeholder: 'magenta',
}

export function AddAttendeeModal({
  visible,
  onCancel,
  meetingId,
  existingAttendeeIds,
  onSuccess,
}: AddAttendeeModalProps) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // 立即打印输入参数（组件级别调试）
  console.log('[AddAttendeeModal] 组件渲染，输入参数:', {
    visible,
    meetingId,
    existingAttendeeIds,
    existingIdsType: typeof existingAttendeeIds,
    existingIdsLength: existingAttendeeIds?.length,
  })

  // 重置状态
  useEffect(() => {
    if (visible) {
      setSearchKeyword('')
      setPage(1)
      setSelectedIds([])

      // 模态框打开时立即打印
      console.log('[AddAttendeeModal] 模态框已打开')
      console.log('[AddAttendeeModal] existingAttendeeIds:', existingAttendeeIds)
    }
  }, [visible])

  // 获取用户列表
  const { data: usersData, isLoading, error, isError, status, fetchStatus } = useQuery({
    queryKey: ['users-list', page, pageSize, searchKeyword],
    queryFn: async () => {
      // 使用 axios 的 params 配置，而不是手动拼接URL
      const params = {
        page: page,
        page_size: pageSize,
      }
      if (searchKeyword) {
        (params as any).search = searchKeyword
      }

      console.log('[AddAttendeeModal] === queryFn 开始执行 ===')
      console.log('[AddAttendeeModal] 请求参数:', params)

      try {
        // api.get 的响应拦截器已经返回 response.data
        const response = await api.get<UsersResponse>('/auth/users', { params })
        console.log('[AddAttendeeModal] api.get 返回值类型:', typeof response)
        console.log('[AddAttendeeModal] api.get 返回值:', response)
        console.log('[AddAttendeeModal] response.success:', response?.success)
        console.log('[AddAttendeeModal] response.data:', response?.data)
        console.log('[AddAttendeeModal] response.data.items 长度:', response?.data?.items?.length)
        console.log('[AddAttendeeModal] === queryFn 执行完成，准备返回 ===')
        return response
      } catch (err) {
        console.error('[AddAttendeeModal] queryFn 捕获到异常:', err)
        throw err
      }
    },
    enabled: visible,
    staleTime: 0,  // 禁用缓存，每次都重新获取
  })

  // 添加查询状态日志
  console.log('[AddAttendeeModal] React Query 状态:', {
    status,
    fetchStatus,
    isLoading,
    isError,
    error,
    hasUsersData: !!usersData,
    usersDataType: typeof usersData,
  })

  // 添加错误日志
  if (isError) {
    console.error('[AddAttendeeModal] 查询错误:', error)
  }

  // 过滤已添加的参会人员（移到这里，在console.log之前）
  const availableUsers = usersData?.data?.items?.filter(
    (user: User) => !existingAttendeeIds.includes(user.id)
  ) || []

  // 调试日志 - 详细追踪数据流
  console.log('=== [AddAttendeeModal] 数据流追踪 ===')
  console.log('1. Props输入:', {
    meetingId,
    existingAttendeeIds,
    visible
  })
  console.log('2. API响应状态:', {
    isLoading,
    hasUsersData: !!usersData,
    usersDataType: typeof usersData,
  })
  console.log('3. usersData完整结构:', usersData)
  console.log('4. usersData.data:', usersData?.data)
  console.log('5. usersData.data.items:', usersData?.data?.items)
  console.log('6. 过滤后可用用户:', availableUsers)
  console.log('7. 最终用户数量:', availableUsers.length)
  console.log('========================================')

  // 在组件首次渲染时弹出调试信息（仅开发环境）
  useEffect(() => {
    if (visible && !isLoading && usersData) {
      const debugInfo = {
        usersData: usersData,
        hasDataField: !!usersData.data,
        hasItemsField: !!usersData.data?.items,
        itemsCount: usersData.data?.items?.length || 0,
        existingAttendeeIds,
        availableUsersCount: availableUsers.length,
      }

      console.log('[AddAttendeeModal] 调试信息已准备好，请查看上方详细日志')

      // 弹出详细信息（只在第一次打开时）
      if (import.meta.env.DEV) {
        alert(`调试信息：\n` +
              `API返回data字段: ${debugInfo.hasDataField}\n` +
              `items数量: ${debugInfo.itemsCount}\n` +
              `已添加参会人员: ${debugInfo.existingAttendeeIds.length}人\n` +
              `可用用户: ${debugInfo.availableUsersCount}人`
        )
      }
    }
  }, [visible, isLoading, usersData, existingAttendeeIds, availableUsers.length])

  // 添加参会人员到会议
  const addMutation = useMutation({
    mutationFn: (userId: number) => {
      console.log('[AddAttendeeModal] 准备添加参会人员:', { userId, meetingId })
      return reviewMeetingService.addAttendee(meetingId, {
        attendee_id: userId,
        attendance_status: 'invited',
      })
    },
    onSuccess: (response) => {
      console.log('[AddAttendeeModal] 添加成功:', response)
      message.success('参会人员添加成功')
      onSuccess()
    },
    onError: (error: any) => {
      console.error('[AddAttendeeModal] 添加失败，完整错误对象:', error)

      // API拦截器返回的error结构可能是 {detail: "..."} 或 {response: {data: {detail: "..."}}}
      let errorMessage = '添加参会人员失败'

      if (error?.detail) {
        // 直接是 {detail: "..."}
        errorMessage = error.detail
      } else if (error?.response?.data?.detail) {
        // Axios风格 {response: {data: {detail: "..."}}}
        errorMessage = error.response.data.detail
      } else if (error?.message) {
        errorMessage = error.message
      }

      console.error('[AddAttendeeModal] 提取的错误消息:', errorMessage)
      message.error(errorMessage)
    },
  })

  // 批量添加参会人员
  const handleAddMultiple = async () => {
    console.log('[AddAttendeeModal] 开始批量添加，选中的用户:', selectedIds)

    if (selectedIds.length === 0) {
      message.warning('请至少选择一个用户')
      return
    }

    let successCount = 0
    let failCount = 0

    for (const userId of selectedIds) {
      console.log(`[AddAttendeeModal] 添加用户 ${userId}...`)
      try {
        await addMutation.mutateAsync(userId)
        successCount++
        console.log(`[AddAttendeeModal] 用户 ${userId} 添加成功`)
      } catch (error) {
        failCount++
        console.error(`[AddAttendeeModal] 用户 ${userId} 添加失败:`, error)
      }
    }

    setSelectedIds([])

    if (successCount > 0) {
      message.success(`成功添加 ${successCount} 个参会人员${failCount > 0 ? `，失败 ${failCount} 个` : ''}`)
      if (failCount === 0) {
        onSuccess() // 只在全部成功时关闭模态框
      }
    } else {
      message.error('添加失败，请查看控制台错误信息')
    }
  }

  // 切换选择状态
  const toggleSelection = (userId: number) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <Modal
      title="添加参会人员"
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
            添加选中的用户 ({selectedIds.length})
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 调试面板（开发模式） */}
        {import.meta.env.DEV && (
          <div style={{
            background: '#f0f0f0',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '12px',
            fontFamily: 'monospace',
            border: '1px solid #d9d9d9'
          }}>
            <div><strong>调试信息：</strong></div>
            <div>visible: {String(visible)}</div>
            <div>isLoading: {String(isLoading)}</div>
            <div>hasUsersData: {String(!!usersData)}</div>
            <div>usersDataType: {typeof usersData}</div>
            <div>existingAttendeeIds: {JSON.stringify(existingAttendeeIds)}</div>
            <div>availableUsers.length: {availableUsers.length}</div>
            {usersData && (
              <div>usersData.data存在: {String(!!usersData.data)}</div>
            )}
            {usersData?.data && (
              <div>items数量: {usersData.data.items?.length || 0}</div>
            )}
          </div>
        )}

        {/* 直接测试API按钮（开发模式） */}
        {import.meta.env.DEV && (
          <Button
            onClick={async () => {
              try {
                const response = await fetch('/api/v1/auth/users');
                const data = await response.json();
                alert(`直接fetch测试:\n` +
                      `状态码: ${response.status}\n` +
                      `总用户数: ${data.data.total}\n` +
                      `有数据: ${!!data.data}\n` +
                      `items: ${data.data.items.length}个`
                );
              } catch (error) {
                alert(`fetch失败:\n${error}`);
              }
            }}
            style={{ marginBottom: '16px' }}
          >
            🧪 直接测试API
          </Button>
        )}

        {/* 搜索框 */}
        <Search
          placeholder="搜索用户名或姓名"
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

        {/* 用户列表 */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
            </div>
          ) : availableUsers.length === 0 ? (
            <Empty
              description={
                <div style={{ textAlign: 'center' }}>
                  {searchKeyword ? (
                    <>
                      <div>未找到匹配的用户</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                        请尝试其他关键词
                      </div>
                    </>
                  ) : existingAttendeeIds.length > 0 ? (
                    <>
                      <div>所有用户都已添加为参会人员</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                        已添加 {existingAttendeeIds.length} 位参会人员
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        如需添加新用户，请先联系管理员创建用户账号
                      </div>
                    </>
                  ) : (
                    <>
                      <div>没有可添加的用户</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                        数据库中暂无可用用户
                      </div>
                    </>
                  )}
                </div>
              }
            />
          ) : (
            <List
              dataSource={availableUsers}
              renderItem={(user: User) => {
                const isSelected = selectedIds.includes(user.id)

                return (
                  <List.Item
                    key={user.id}
                    style={{
                      cursor: 'pointer',
                      padding: '16px',
                      background: isSelected ? '#e6f7ff' : 'transparent',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      border: isSelected ? '1px solid #1890ff' : '1px solid #f0f0f0',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => toggleSelection(user.id)}
                  >
                    <List.Item.Meta
                      avatar={<UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                      title={
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Space>
                            <Text strong>{user.full_name || user.username}</Text>
                            <Tag color={ROLE_COLORS[user.role] || 'default'}>
                              {user.role}
                            </Tag>
                          </Space>
                          {user.full_name && user.username !== user.full_name && (
                            <Text type="secondary">@{user.username}</Text>
                          )}
                          {user.email && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {user.email}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )
              }}
            />
          )}
        </div>

        {/* 分页 */}
        {usersData?.data?.total_pages && usersData.data.total_pages > 1 && (
          <div style={{ textAlign: 'center', paddingTop: '16px' }}>
            <Space>
              <Button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </Button>
              <Text>
                第 {page} / {usersData.data.total_pages} 页
              </Text>
              <Button
                disabled={page === usersData.data.total_pages}
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

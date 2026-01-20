import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Tag, Space, Input, Select, Card, message } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { requirementService, Requirement } from '@/services/requirement.service'
import { UploadAttachmentModal } from '@/components/requirements/UploadAttachmentModal'

interface RequirementListItem {
  key: string
  no: string
  title: string
  description: string
  source: string
  status: string
  priority: number
  createdAt: string
}

const statusMap: Record<string, { text: string; color: string }> = {
  collected: { text: '已收集', color: 'blue' },
  analyzing: { text: '分析中', color: 'processing' },
  analyzed: { text: '已分析', color: 'default' },
  distributing: { text: '分发中', color: 'lime' },
  distributed: { text: '已分发', color: 'cyan' },
  implementing: { text: '实现中', color: 'orange' },
  verifying: { text: '验证中', color: 'purple' },
  completed: { text: '已完成', color: 'green' },
  rejected: { text: '已拒绝', color: 'error' },
}

const sourceMap: Record<string, string> = {
  customer: '客户',
  market: '市场',
  competition: '竞争',
  sales: '销售',
  after_sales: '售后',
  rd: '研发',
}

function RequirementListPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RequirementListItem[]>([])
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [sourceFilter, setSourceFilter] = useState<string | undefined>()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false)
  const [selectedRequirementId, setSelectedRequirementId] = useState<number | null>(null)

  const fetchRequirements = async (
    page = pagination.current,
    pageSize = pagination.pageSize,
    status?: string,
    sourceChannel?: string,
    search?: string
  ) => {
    setLoading(true)
    try {
      const response = await requirementService.getRequirements({
        page,
        page_size: pageSize,
        status,
        source_channel: sourceChannel,
        search,
      }) as any

      if (response.success && response.data) {
        const { items, total } = response.data

        // 转换数据格式
        const transformedData: RequirementListItem[] = items.map((item: any) => ({
          key: String(item.id),
          no: item.requirement_no,
          title: item.title,
          description: item.description,
          source: item.source_channel,
          status: item.status,
          priority: item.priority_score || 0,
          createdAt: new Date(item.created_at).toLocaleDateString('zh-CN'),
        }))

        setData(transformedData)
        setPagination({
          current: page,
          pageSize,
          total,
        })
      }
    } catch (error: any) {
      console.error('Fetch requirements error:', error)
      message.error('获取需求列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequirements()
  }, [])

  const handleTableChange = (newPagination: any) => {
    fetchRequirements(
      newPagination.current,
      newPagination.pageSize,
      statusFilter,
      sourceFilter,
      searchText
    )
  }

  const handleSearch = () => {
    fetchRequirements(1, pagination.pageSize, statusFilter, sourceFilter, searchText)
  }

  const handleOpenAttachmentModal = (requirementId: string) => {
    setSelectedRequirementId(parseInt(requirementId))
    setAttachmentModalVisible(true)
  }

  const handleCloseAttachmentModal = () => {
    setAttachmentModalVisible(false)
    setSelectedRequirementId(null)
  }

  const columns: ColumnsType<RequirementListItem> = [
    {
      title: '需求编号',
      dataIndex: 'no',
      key: 'no',
      width: 140,
    },
    {
      title: '需求标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => sourceMap[source] || source,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const { text, color } = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      sorter: (a: any, b: any) => a.priority - b.priority,
      render: (score: number) => {
        if (!score) return '-'
        const color = score >= 80 ? '#ff4d4f' : score >= 60 ? '#faad14' : '#52c41a'
        return <span style={{ color, fontWeight: 'bold' }}>{score}</span>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 450,
      render: (_, record) => (
        <Space size={2} style={{ fontSize: '12px' }}>
          <Button type="link" size="small" onClick={() => navigate(`/requirements/${record.key}`)}>
            👁️ 查看
          </Button>
          <Button type="link" size="small" onClick={() => navigate(`/requirements/${record.key}/edit`)}>
            ✏️ 编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => {
            if (window.confirm('确定要删除这个需求吗？')) {
              requirementService.deleteRequirement(parseInt(record.key))
                .then(() => {
                  message.success('删除成功')
                  fetchRequirements()
                })
                .catch(() => message.error('删除失败'))
            }
          }}>
            🗑️ 删除
          </Button>
          <Button type="link" size="small" style={{ color: '#1890ff' }} onClick={() => handleOpenAttachmentModal(record.key)}>
            📎 附件
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <UploadAttachmentModal
        requirementId={selectedRequirementId!}
        open={attachmentModalVisible && selectedRequirementId !== null}
        onClose={handleCloseAttachmentModal}
      />
      <Card
        title="需求列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/requirements/new')}
          >
            新建需求
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }} size="middle">
          <Input
            placeholder="搜索需求编号或标题"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Select
            placeholder="选择状态"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => {
              setStatusFilter(value)
              fetchRequirements(1, pagination.pageSize, value, sourceFilter, searchText)
            }}
            value={statusFilter}
          >
            <Select.Option value="collected">已收集</Select.Option>
            <Select.Option value="analyzing">分析中</Select.Option>
            <Select.Option value="analyzed">已分析</Select.Option>
            <Select.Option value="distributed">已分发</Select.Option>
            <Select.Option value="implementing">实现中</Select.Option>
            <Select.Option value="completed">已完成</Select.Option>
          </Select>
          <Select
            placeholder="选择来源"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => {
              setSourceFilter(value)
              fetchRequirements(1, pagination.pageSize, statusFilter, value, searchText)
            }}
            value={sourceFilter}
          >
            <Select.Option value="customer">客户</Select.Option>
            <Select.Option value="market">市场</Select.Option>
            <Select.Option value="competition">竞争</Select.Option>
            <Select.Option value="sales">销售</Select.Option>
            <Select.Option value="after_sales">售后</Select.Option>
            <Select.Option value="rd">研发</Select.Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchText('')
              setStatusFilter(undefined)
              setSourceFilter(undefined)
              fetchRequirements(1, pagination.pageSize, undefined, undefined, '')
            }}
          >
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  )
}

export default RequirementListPage

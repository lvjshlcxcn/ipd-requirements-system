import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, Input, message, Card, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FileTextOutlined, EyeOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import { requirementService } from '@/services/requirement.service'
import type { Requirement } from '@/shared/types/api'
import { EditableCell } from '@/shared/components/editable-cell'
import { RowCountdown } from '@/shared/components/countdown/RowCountdown'

interface RequirementRecord extends Requirement {
  key: string
}

/**
 * 需求开发页面
 * 显示已分发且目标类型为"进入开发"（charter）的需求列表
 */
export function DevelopmentPage() {
  const navigate = useNavigate()
  const [requirements, setRequirements] = useState<RequirementRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  // 更新预估工期
  const handleUpdateDuration = async (id: number, months: number | null) => {
    await requirementService.updateRequirement(id, { estimated_duration_months: months ?? undefined })
    // 更新本地状态
    setRequirements((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, estimated_duration_months: months ?? undefined } : req
      )
    )
  }

  const developmentColumns: ColumnsType<RequirementRecord> = useMemo(
    () => [
      { title: '需求编号', dataIndex: 'requirement_no', key: 'requirement_no', width: 140, fixed: 'left' },
      { title: '需求标题', dataIndex: 'title', key: 'title', width: 250, ellipsis: true },
      {
        title: '来源',
        dataIndex: 'source_channel',
        key: 'source_channel',
        width: 100,
        render: (source: string) => {
          const map: Record<string, string> = {
            customer: '客户',
            market: '市场',
            sales: '销售',
            rd: '技术',
            after_sales: '售后',
          }
          return map[source] || source
        },
      },
      {
        title: '优先级',
        dataIndex: 'priority_score',
        key: 'priority_score',
        width: 100,
        render: (p: number) => {
          const color = p === 90 ? 'red' : p === 60 ? 'orange' : 'green'
          const label = p === 90 ? '高' : p === 60 ? '中' : '低'
          return <span style={{ color, fontWeight: 'bold' }}>{label}</span>
        },
      },
      {
        title: 'MoSCoW',
        dataIndex: 'moscow_priority',
        key: 'moscow_priority',
        width: 100,
        render: (moscow: string) => {
          if (!moscow) return <span style={{ color: '#999' }}>-</span>
          const colorMap: Record<string, string> = {
            must_have: 'red',
            should_have: 'orange',
            could_have: 'blue',
            wont_have: 'default',
          }
          const labelMap: Record<string, string> = {
            must_have: 'Must',
            should_have: 'Should',
            could_have: 'Could',
            wont_have: "Won't",
          }
          return <span style={{ color: colorMap[moscow] }}>{labelMap[moscow]}</span>
        },
      },
      {
        title: 'Charter ID',
        dataIndex: 'target_id',
        key: 'target_id',
        width: 120,
        render: (id: number) => (id ? <span>CHARTER-{String(id).padStart(3, '0')}</span> : '-'),
      },
      {
        title: '预估工期',
        dataIndex: 'estimated_duration_months',
        key: 'estimated_duration_months',
        width: 120,
        render: (days: number | null, record: RequirementRecord) => (
          <EditableCell value={days} recordId={record.id} onSave={handleUpdateDuration} />
        ),
      },
      {
        title: '开发倒计时',
        key: 'countdown',
        width: 180,
        render: (_: any, record: RequirementRecord) => (
          <RowCountdown
            createdAt={record.created_at}
            distributedAt={record.updated_at}
            estimatedDays={record.estimated_duration_months}
            status={record.status}
          />
        ),
      },
      {
        title: '分发时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 120,
        render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
      },
      {
        title: '需求描述',
        dataIndex: 'description',
        key: 'description',
        width: 300,
        ellipsis: true,
        render: (desc: string) => {
          if (!desc) return <span style={{ color: '#999' }}>-</span>
          const displayText = desc.length > 80 ? desc.substring(0, 80) + '...' : desc
          return (
            <Tooltip title={desc} placement="topLeft">
              <span>{displayText}</span>
            </Tooltip>
          )
        },
      },
      {
        title: '操作',
        key: 'action',
        width: 150,
        fixed: 'right',
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/requirements/edit/${record.id}`)}
            >
              查看
            </Button>
          </Space>
        ),
      },
    ],
    [navigate],
  )

  const fetchRequirements = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const response = await requirementService.getRequirements({
        page,
        page_size: pageSize,
        status: 'distributed', // 固定筛选：已分发
        target_type: 'charter', // 固定筛选：进入开发
        search: searchText || undefined,
      })
      const items = (response as any)?.data?.items || []
      const total = (response as any)?.data?.total || 0
      setRequirements(
        items.map((item: Requirement, idx: number) => ({
          key: `${item.id}-${idx}`,
          ...item,
        })),
      )
      setPagination({ current: page, pageSize, total })
    } catch (error) {
      console.error('Failed to fetch:', error)
      message.error('加载需求列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 导出功能 - 导出Excel
  const handleExport = async () => {
    try {
      message.loading({ content: '正在导出Excel...', key: 'export' })

      const { data } = await requirementService.exportRequirements({
        status: 'distributed',
        target_type: 'charter',
        search: searchText || undefined,
      })

      // 创建下载链接
      const url = window.URL.createObjectURL(
        new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      )
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `需求开发列表_${new Date().getTime()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      message.success({ content: '导出成功', key: 'export' })
    } catch (error) {
      console.error('导出失败:', error)
      message.error({ content: '导出失败，请重试', key: 'export' })
    }
  }

  useEffect(() => {
    fetchRequirements()
  }, [searchText])

  const handleTableChange = (newPagination: any) => {
    fetchRequirements(newPagination.current, newPagination.pageSize)
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <span style={{ fontSize: 18, fontWeight: 500 }}>需求开发管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText('')
                fetchRequirements(1, pagination.pageSize)
              }}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出Excel
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16, width: '100%' }}>
          <Input
            placeholder="搜索需求编号或标题"
            prefix={<FileTextOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Space>

        <Table
          columns={developmentColumns}
          dataSource={requirements}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          bordered
          scroll={{ x: 1700 }}
          rowKey="key"
        />
      </Card>
    </div>
  )
}

export default DevelopmentPage

import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Form, Select, Input, message, Modal, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SendOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '@/services/api'

export function DistributionPage() {
  const [pendingReqs, setPendingReqs] = useState<any[]>([])
  const [distributedReqs, setDistributedReqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [distributing, setDistributing] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [targetType, setTargetType] = useState<string>('')
  const [targetId, setTargetId] = useState<string>('')
  const [numericTargetId, setNumericTargetId] = useState<number>(0)
  const [form] = Form.useForm()

  const fetchRequirements = async () => {
    setLoading(true)
    try {
      const response = await api.get('/requirements', {
        params: { page: 1, page_size: 100 },
      })
      const items = response?.data?.items || []

      const pending = items
        .filter((req: any) => req.status === 'analyzed')
        .map((item: any, index: number) => ({
          key: String(index),
          ...item,
        }))

      const distributed = items
        .filter((req: any) => req.status === 'distributed')
        .map((item: any, index: number) => ({
          key: String(index),
          ...item,
        }))

      setPendingReqs(pending)
      setDistributedReqs(distributed)
    } catch (error) {
      console.error('Failed to fetch requirements:', error)
      message.error('加载需求数据失败')
    } finally {
      setLoading(false)
    }
  }

  const generateNextTargetId = async (type: string) => {
    try {
      const response = await api.get('/distribution/next-target-id', {
        params: { target_type: type },
      })
      if (response?.data?.formatted_id) {
        setTargetId(response.data.formatted_id)
        setNumericTargetId(response.data.next_numeric_id)
      }
    } catch (error) {
      console.error('Failed to generate target ID:', error)
      message.error('生成目标ID失败')
    }
  }

  // 初始化加载数据
  useEffect(() => {
    fetchRequirements()
  }, [])

  // Auto-generate target ID when target type changes
  useEffect(() => {
    if (targetType) {
      generateNextTargetId(targetType)
    } else {
      setTargetId('')
      setNumericTargetId(0)
    }
  }, [targetType])

  const handleDistribute = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要分发的需求')
      return
    }
    if (!targetType) {
      message.warning('请选择目标类型')
      return
    }
    if (!numericTargetId) {
      message.warning('请等待目标ID生成')
      return
    }

    setDistributing(true)
    try {
      await Promise.all(
        selectedRowKeys.map((key) => {
          const req = pendingReqs.find((r) => r.key === key)
          if (!req) return Promise.resolve()
          return api.put(`/requirements/${req.id}`, {
            target_type: targetType,
            target_id: numericTargetId,
            status: 'distributed',
          })
        })
      )

      message.success(`成功分发 ${selectedRowKeys.length} 个需求到 ${targetId}`)
      setSelectedRowKeys([])
      form.resetFields()
      setTargetType('')
      setTargetId('')
      setNumericTargetId(0)
      fetchRequirements()
    } catch (error) {
      console.error('Distribution failed:', error)
      message.error('分发失败')
    } finally {
      setDistributing(false)
    }
  }

  const handleCancelDistribution = async (reqId: number) => {
    Modal.confirm({
      title: '取消分发',
      content: '确定要取消该需求的分发吗？需求将返回到已分析状态。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.put(`/requirements/${reqId}`, {
            target_type: null,
            target_id: null,
            status: 'analyzed',
          })
          message.success('已取消分发')
          fetchRequirements()
        } catch (error) {
          console.error('Cancel distribution failed:', error)
          message.error('取消分发失败')
        }
      },
    })
  }

  const pendingColumns: ColumnsType<any> = [
    {
      title: '需求编号',
      dataIndex: 'requirement_no',
      key: 'requirement_no',
      width: 150,
    },
    {
      title: '需求标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '来源',
      dataIndex: 'source_channel',
      key: 'source_channel',
      width: 100,
      render: (source: string) => {
        const labelMap: Record<string, string> = {
          customer: '客户',
          market: '市场',
          sales: '销售',
          rd: '技术',
          after_sales: '售后',
        }
        return labelMap[source] || source
      },
    },
    {
      title: 'MoSCoW',
      dataIndex: 'moscow_priority',
      key: 'moscow_priority',
      width: 120,
      render: (moscow: string) => {
        if (!moscow) return '-'
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
        return <Tag color={colorMap[moscow]}>{labelMap[moscow]}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ]

  const distributedColumns: ColumnsType<any> = [
    {
      title: '需求编号',
      dataIndex: 'requirement_no',
      key: 'requirement_no',
      width: 150,
    },
    {
      title: '需求标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '目标类型',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 120,
      render: (type: string) => {
        const labelMap: Record<string, string> = {
          sp: '系统计划',
          bp: '商业计划',
          charter: '项目章程',
          pcr: '变更请求',
        }
        return labelMap[type] || type
      },
    },
    {
      title: '目标ID',
      dataIndex: 'target_id',
      key: 'target_id',
      width: 100,
    },
    {
      title: '分发时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => handleCancelDistribution(record.id)}
        >
          取消分发
        </Button>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>需求分发</h2>

      <Card title="待分发需求" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Form form={form} layout="inline">
            <Form.Item label="目标类型" name="targetType" rules={[{ required: true }]}>
              <Select
                placeholder="请选择目标类型"
                style={{ width: 180 }}
                onChange={(value) => setTargetType(value)}
              >
                <Select.Option value="sp">系统计划 (SP)</Select.Option>
                <Select.Option value="bp">商业计划 (BP)</Select.Option>
                <Select.Option value="charter">项目章程</Select.Option>
                <Select.Option value="pcr">变更请求 (PCR)</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="目标ID">
              <Input
                value={targetId}
                placeholder="自动生成"
                style={{ width: 120 }}
                readOnly
                disabled
              />
            </Form.Item>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleDistribute}
              loading={distributing}
              disabled={selectedRowKeys.length === 0 || !numericTargetId}
            >
              分发选中需求 ({selectedRowKeys.length})
            </Button>
          </Form>

          <Table
            columns={pendingColumns}
            dataSource={pendingReqs}
            loading={loading}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
          />
        </Space>
      </Card>

      <Card title="已分发需求">
        <Table
          columns={distributedColumns}
          dataSource={distributedReqs}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  )
}

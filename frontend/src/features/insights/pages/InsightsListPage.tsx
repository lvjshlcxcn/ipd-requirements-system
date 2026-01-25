import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, message, Card, Tooltip, Modal } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { InsightResultModal } from '@/components/insights/InsightResultModal'
import insightService from '@/services/insight.service'
import type { Insight } from '@/types/insight'

export const InsightsListPage: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null)
  const [resultModalVisible, setResultModalVisible] = useState(false)

  // 加载洞察列表
  const loadInsights = async () => {
    setLoading(true)
    try {
      const data = await insightService.listInsights()
      setInsights(data)
    } catch (error) {
      message.error('加载洞察列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInsights()
  }, [])

  // 查看详情
  const handleView = (insight: Insight) => {
    setSelectedInsight(insight)
    setResultModalVisible(true)
  }

  // 删除洞察
  const handleDelete = async (insight: Insight) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除洞察 ${insight.insight_number} 吗？此操作将同时删除关联的故事板数据，且无法恢复。`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await insightService.deleteInsight(insight.id)
          message.success('删除成功')
          loadInsights() // 刷新列表
        } catch (error) {
          message.error('删除失败')
          console.error(error)
        }
      }
    })
  }

  // 状态映射
  const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'default' },
    confirmed: { label: '已确认', color: 'blue' },
    linked: { label: '已关联', color: 'green' },
  }

  // 模式映射
  const modeMap: Record<string, { label: string; color: string }> = {
    full: { label: '深度分析', color: 'purple' },
    quick: { label: '快速分析', color: 'cyan' },
  }

  const columns: ColumnsType<Insight> = [
    {
      title: '编号',
      dataIndex: 'insight_number',
      key: 'insight_number',
      width: 150,
      render: (number: string) => (
        <Tag color="blue" style={{ fontSize: 12 }}>
          {number}
        </Tag>
      ),
    },
    {
      title: '文本预览',
      dataIndex: 'input_text',
      key: 'input_text',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text?.substring(0, 80)}...</span>
        </Tooltip>
      ),
    },
    {
      title: '分析模式',
      dataIndex: 'analysis_mode',
      key: 'analysis_mode',
      width: 100,
      render: (mode: string) => {
        const config = modeMap[mode] || { label: mode, color: 'default' }
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusMap[status] || { label: status, color: 'default' }
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: '文本长度',
      dataIndex: 'text_length',
      key: 'text_length',
      width: 100,
      render: (length: number) => `${length} 字符`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>📊 AI 洞察分析列表</h2>
            <p style={{ margin: '8px 0 0 0', color: '#999' }}>
              共 {insights.length} 条分析记录
            </p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadInsights}>
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={insights}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 结果展示弹窗 */}
      <InsightResultModal
        visible={resultModalVisible}
        insight={selectedInsight}
        onClose={() => {
          setResultModalVisible(false)
          setSelectedInsight(null)
        }}
      />
    </div>
  )
}

export default InsightsListPage

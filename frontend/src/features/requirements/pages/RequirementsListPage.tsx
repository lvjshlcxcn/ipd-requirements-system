import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, Input, message, Modal } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import api from '@/services/api'
import { UploadAttachmentModal } from '@/components/requirements/UploadAttachmentModal'
import { TextInsightModal, InsightResultModal } from '@/components/insights'
import type { Insight } from '@/types/insight'

interface Requirement {
  key: string
  id: number
  requirement_no: string
  title: string
  source_channel: string
  priority: string
  status: string
  created_at: string
  description?: string
  priority_score?: number
  moscow_priority?: string
}

const requirementColumns: ColumnsType<Requirement> = [
  {
    title: '需求编号',
    dataIndex: 'requirement_no',
    key: 'requirement_no',
  },
  {
    title: '需求标题',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: '来源',
    dataIndex: 'source_channel',
    key: 'source_channel',
    render: (source: string) => {
      const labelMap: Record<string, string> = {
        'customer': '客户',
        'market': '市场',
        'sales': '销售',
        'rd': '技术',
        'after_sales': '售后',
      }
      return labelMap[source] || source
    },
  },
  {
    title: '优先级',
    dataIndex: 'priority_score',
    key: 'priority_score',
    render: (priority: number) => {
      const color = priority === 90 ? 'red' : priority === 60 ? 'orange' : 'green'
      const label = priority === 90 ? '高' : priority === 60 ? '中' : '低'
      return <span style={{ color }}>{label}</span>
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const colorMap: Record<string, string> = {
        'collected': 'blue',
        'analyzing': 'processing',
        'distributed': 'cyan',
        'implementing': 'gold',
        'completed': 'green',
      }
      const labelMap: Record<string, string> = {
        'collected': '已收集',
        'analyzing': '分析中',
        'distributed': '已分发',
        'implementing': '开发中',
        'completed': '已完成',
      }
      const color = colorMap[status] || 'default'
      const label = labelMap[status] || status
      return <span style={{ color }}>{label}</span>
    },
  },
  {
    title: 'MoSCoW',
    dataIndex: 'moscow_priority',
    key: 'moscow_priority',
    render: (moscow: string) => {
      if (!moscow) return <span style={{ color: '#999' }}>-</span>

      const colorMap: Record<string, string> = {
        'must_have': 'red',
        'should_have': 'orange',
        'could_have': 'blue',
        'wont_have': 'default',
      }
      const labelMap: Record<string, string> = {
        'must_have': 'Must',
        'should_have': 'Should',
        'could_have': 'Could',
        'wont_have': "Won't",
      }
      const color = colorMap[moscow] || 'default'
      const label = labelMap[moscow] || moscow
      return <span style={{ color }}>{label}</span>
    },
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
  },
]

async function handleDelete(id: number) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个需求吗？',
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        await api.delete(`/requirements/${id}`)
        message.success('删除成功')
        window.location.reload()
      } catch (error) {
        message.error('删除失败')
      }
    },
  })
}

export function RequirementsListPage() {
  const navigate = useNavigate()
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false)
  const [selectedRequirementId, setSelectedRequirementId] = useState<number | null>(null)
  const [insightModalVisible, setInsightModalVisible] = useState(false)
  const [resultModalVisible, setResultModalVisible] = useState(false)
  const [currentInsight, setCurrentInsight] = useState<Insight | null>(null)

  useEffect(() => {
    async function fetchRequirements() {
      try {
        const response = await api.get('/requirements', {
          params: { search: searchText || undefined },
        })
        const items = response?.data?.items || []
        setRequirements(items.map((item: any, index: number) => ({
          key: String(index + 1),
          ...item,
        })))
      } catch (error) {
        console.error('Failed to fetch requirements:', error)
        message.error('加载需求列表失败')
      } finally {
        setLoading(false)
      }
    }
    fetchRequirements()
  }, [searchText])

  const handleOpenAttachmentModal = (requirementId: number) => {
    setSelectedRequirementId(requirementId)
    setAttachmentModalVisible(true)
  }

  const handleCloseAttachmentModal = () => {
    setAttachmentModalVisible(false)
    setSelectedRequirementId(null)
  }

  const requirementColumnsWithActions: ColumnsType<Requirement> = [
    ...requirementColumns.filter(col => col.key !== 'action'),
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => window.location.href = `/requirements/edit/${record.id}`}>
            编辑
          </Button>
          <Button type="link" icon={<CheckCircleOutlined />} size="small" style={{ color: '#52c41a', fontWeight: 'bold' }} onClick={() => window.location.href = `/requirements/${record.id}/verification`}>
            ✅ 验证
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.id)}>
            删除
          </Button>
          <Button type="link" icon={<UploadOutlined />} size="small" style={{ color: '#1890ff' }} onClick={() => handleOpenAttachmentModal(record.id)}>
            附件
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

      {/* 文本洞察分析弹窗 */}
      <TextInsightModal
        visible={insightModalVisible}
        onClose={() => setInsightModalVisible(false)}
        onAnalysisComplete={(insight) => {
          setCurrentInsight(insight)
          setInsightModalVisible(false)
          setResultModalVisible(true)
          message.success('洞察分析完成！')
        }}
      />

      {/* 洞察结果展示弹窗 */}
      <InsightResultModal
        visible={resultModalVisible}
        insight={currentInsight}
        onClose={() => setResultModalVisible(false)}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>新需求输入</h2>
        <Space>
          <Input
            placeholder="搜索需求"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button onClick={() => setInsightModalVisible(true)}>
            📊 AI洞察分析
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => navigate('/settings?tab=ipd_ten_questions')}
          >
            配置 Prompt
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/requirements/new')}>
            新建需求
          </Button>
        </Space>
      </div>

      <Table
        columns={requirementColumnsWithActions}
        dataSource={requirements}
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
      />
    </div>
  )
}

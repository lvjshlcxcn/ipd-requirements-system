import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'
import { Layout, Menu, Row, Col, Statistic, Card, Table, Button, Space, Tag, Input, Form, Select, Modal, Spin, message, Checkbox, Slider, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import api from '@/services/api'
// Import RTM Page component
import { RTMPage } from '@/pages/rtm/RTMPage'
import { UploadAttachmentModal } from '@/components/requirements/UploadAttachmentModal'
import { VoiceInputTextArea } from '@/components/VoiceInputTextArea'
import { DeepSeekIcon, ClaudeIcon } from '@/components/AIIcons'
// Import Verification Pages
import { VerificationListPage } from '@/pages/verifications/VerificationListPage'
import { VerificationChecklistForm } from '@/pages/verifications/VerificationChecklistForm'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  DashboardOutlined,
  FileTextOutlined,
  BarChartOutlined,
  PartitionOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  LogoutOutlined,
  UserOutlined,
  SendOutlined,
  UploadOutlined,
  ThunderboltOutlined,
  MenuOutlined,
  MessageOutlined,
  LineChartOutlined,
  HistoryOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout
const { TextArea } = Input

interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: number
    username: string
    email: string
    role: string
  }
}

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/requirements', icon: <FileTextOutlined />, label: '需求管理' },
  { key: '/analytics', icon: <BarChartOutlined />, label: '需求分析' },
  { key: '/distribution', icon: <SendOutlined />, label: '需求分发' },
  { key: '/rtm', icon: <PartitionOutlined />, label: '需求跟踪' },
]

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
      return <Tag color={color}>{priority === 90 ? '高' : priority === 60 ? '中' : '低'}</Tag>
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
      return <Tag color={color}>{label}</Tag>
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
      return <Tag color={color}>{label}</Tag>
    },
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
  },
  {
    title: '操作',
    key: 'action',
    width: 400,
    render: (_, record) => (
      <Space size="small">
        <Button type="link" icon={<EditOutlined />} size="small" onClick={() => window.location.href = `/requirements/edit/${record.id}`}>
          编辑
        </Button>
        <Button type="link" icon={<CheckCircleOutlined />} size="small" style={{ color: '#52c41a' }} onClick={() => window.location.href = `/requirements/${record.id}/verification`}>
          验证
        </Button>
        <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.id)}>
          删除
        </Button>
        <Button type="link" icon={<UploadOutlined />} size="small" style={{ color: '#1890ff' }} onClick={() => window.location.href = `/requirements/${record.id}/attachments`}>
          附件
        </Button>
      </Space>
    ),
  },
]

function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const response = await api.post<any>('/auth/login', {
        username: values.username,
        password: values.password,
      })

      if (response?.data?.access_token) {
        const loginData: LoginResponse = response.data
        localStorage.setItem('access_token', loginData.access_token)
        localStorage.setItem('user_info', JSON.stringify(loginData.user))
        message.success('登录成功')
        navigate('/dashboard')
      } else {
        message.error('登录失败')
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      message.error(error?.detail || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8, color: '#1890ff' }}>IPD需求管理</h1>
          <p style={{ color: '#666' }}>IPD Requirements Management System</p>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<DashboardOutlined />}
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            <p>演示账号：任意用户名和密码</p>
          </div>
        </Form>
      </Card>
    </div>
  )
}

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

function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [rtmStats, setRtmStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // 获取需求统计
        const reqResponse = await api.get('/requirements/stats/summary')
        setStats(reqResponse?.data)

        // 获取RTM统计
        const rtmResponse = await api.get('/rtm/statistics')
        setRtmStats(rtmResponse?.data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statusConfig = [
    { key: 'collected', label: '已收集', color: 'blue' },
    { key: 'analyzing', label: '分析中', color: 'processing' },
    { key: 'analyzed', label: '已分析', color: 'cyan' },
    { key: 'distributed', label: '已分发', color: 'lime' },
    { key: 'implementing', label: '开发中', color: 'gold' },
    { key: 'completed', label: '已完成', color: 'green' },
    { key: 'rejected', label: '已拒绝', color: 'red' },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表盘</h2>

      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总需求数" value={stats?.total || 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="已完成" value={stats?.by_status?.completed || 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="进行中" value={(stats?.by_status?.analyzing || 0) + (stats?.by_status?.implementing || 0)} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="待处理" value={stats?.by_status?.collected || 0} />
            </Card>
          </Col>
        </Row>

        <Card title="需求状态分布" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {statusConfig.map((status) => (
              <Col span={8} key={status.key}>
                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color={status.color} style={{ fontSize: 14, padding: '4px 12px' }}>
                        {status.label}
                      </Tag>
                      <Statistic
                        value={stats?.by_status?.[status.key] || 0}
                        valueStyle={{ fontSize: 24 }}
                      />
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card title="需求来源分布">
          <Row gutter={[16, 16]}>
            <Col span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title="客户" value={stats?.by_channel?.customer || 0} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title="市场" value={stats?.by_channel?.market || 0} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title="销售" value={stats?.by_channel?.sales || 0} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title="售后" value={stats?.by_channel?.after_sales || 0} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title="技术" value={stats?.by_channel?.rd || 0} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title="竞争" value={stats?.by_channel?.competition || 0} />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* RTM 追溯矩阵统计 */}
        <Card title={<span><PartitionOutlined style={{ marginRight: 8 }} />需求追溯矩阵统计</span>}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="追溯完成率"
                  value={rtmStats?.completion_rate || 0}
                  suffix="%"
                  valueStyle={{ color: rtmStats?.completion_rate >= 80 ? '#52c41a' : rtmStats?.completion_rate >= 50 ? '#faad14' : '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="完整追溯"
                  value={rtmStats?.complete || 0}
                  valueStyle={{ color: '#52c41a' }}
                  suffix={`/ ${rtmStats?.total || 0}`}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="部分追溯"
                  value={rtmStats?.partial || 0}
                  valueStyle={{ color: '#faad14' }}
                  suffix={`/ ${rtmStats?.total || 0}`}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="缺失追溯"
                  value={rtmStats?.missing || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                  suffix={`/ ${rtmStats?.total || 0}`}
                />
              </Card>
            </Col>
          </Row>

          {/* 追溯覆盖率 */}
          <div style={{ marginTop: 24 }}>
            <h4 style={{ marginBottom: 16 }}>追溯覆盖率</h4>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
                  <Statistic
                    title="设计文档覆盖"
                    value={rtmStats?.coverage?.design || 0}
                    suffix={`/ ${rtmStats?.total || 0}`}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                  <Statistic
                    title="代码文件覆盖"
                    value={rtmStats?.coverage?.code || 0}
                    suffix={`/ ${rtmStats?.total || 0}`}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ backgroundColor: '#fff7e6' }}>
                  <Statistic
                    title="测试用例覆盖"
                    value={rtmStats?.coverage?.test || 0}
                    suffix={`/ ${rtmStats?.total || 0}`}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </Row>
          </div>

          {/* 可视化图表 */}
          <div style={{ marginTop: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="追溯状态分布">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={[
                      { subject: '完整追溯', value: rtmStats?.complete || 0, fullMark: rtmStats?.total || 0 },
                      { subject: '部分追溯', value: rtmStats?.partial || 0, fullMark: rtmStats?.total || 0 },
                      { subject: '缺失追溯', value: rtmStats?.missing || 0, fullMark: rtmStats?.total || 0 },
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis type="category" dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, (rtmStats?.total || 1) * 1.2]} />
                      <Radar name="追溯状态" dataKey="value" fill="#8884d8" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="追溯要素覆盖">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={[
                      { subject: '设计文档', value: rtmStats?.coverage?.design || 0, fullMark: rtmStats?.total || 0 },
                      { subject: '代码文件', value: rtmStats?.coverage?.code || 0, fullMark: rtmStats?.total || 0 },
                      { subject: '测试用例', value: rtmStats?.coverage?.test || 0, fullMark: rtmStats?.total || 0 },
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis type="category" dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, (rtmStats?.total || 1) * 1.2]} />
                      <Radar name="覆盖要素" dataKey="value" fill="#82ca9d" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </div>
        </Card>
      </Spin>
    </div>
  )
}

function RequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false)
  const [selectedRequirementId, setSelectedRequirementId] = useState<number | null>(null)

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

  // 在组件内部定义 columns，以便访问处理函数
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>需求管理</h2>
        <Space>
          <Input
            placeholder="搜索需求"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => window.location.href = '/requirements/new'}>
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

function RequirementEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [show10q, setShow10q] = useState(false)

  useEffect(() => {
    if (id && id !== 'new') {
      async function fetchRequirement() {
        try {
          const response = await api.get(`/requirements/${id}`)
          const data = response?.data
          if (data) {
            form.setFieldsValue({
              title: data.title || '',
              source_channel: data.source_channel || '',
              priority_score: data.priority_score || undefined,
              status: data.status || '',
              moscow_priority: data.moscow_priority || undefined,
              moscow_comment: data.moscow_comment || '',
              description: data.description || '',
              // Expand 10q fields into form
              ...(data.customer_need_10q || {}),
            })
            // Show 10q if data exists and has content
            const has10qData = data.customer_need_10q && typeof data.customer_need_10q === 'object' && Object.keys(data.customer_need_10q).length > 0
            setShow10q(has10qData)
            console.log('Loaded requirement:', data)
            console.log('10q data:', data.customer_need_10q)
          }
        } catch (error) {
          console.error('Failed to fetch requirement:', error)
          message.error('加载需求数据失败')
        }
      }
      fetchRequirement()
    }
  }, [id, form])

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      if (id && id !== 'new') {
        // 更新需求
        await api.put(`/requirements/${id}`, {
          title: values.title,
          source_channel: values.source_channel,
          description: values.description,
          priority_score: values.priority_score,
          status: values.status,
          moscow_priority: values.moscow_priority,
          moscow_comment: values.moscow_comment,
          customer_need_10q: show10q ? {
            q1_who_cares: values.q1_who_cares,
            q2_why_care: values.q2_why_care,
            q3_how_often: values.q3_how_often,
            q4_current_solution: values.q4_current_solution,
            q5_pain_points: values.q5_pain_points,
            q6_expected_outcome: values.q6_expected_outcome,
            q7_value_impact: values.q7_value_impact,
            q8_urgency_level: values.q8_urgency_level,
            q9_budget_willingness: values.q9_budget_willingness,
            q10_alternative_solutions: values.q10_alternative_solutions,
            additional_notes: values.additional_notes,
          } : undefined,
        })
        message.success('需求更新成功')
        window.location.href = '/requirements'
      } else {
        // 新建需求
        await api.post('/requirements', {
          title: values.title,
          source_channel: values.source_channel,
          description: values.description,
          priority_score: values.priority_score,
          moscow_priority: values.moscow_priority,
          moscow_comment: values.moscow_comment,
          customer_need_10q: show10q ? {
            q1_who_cares: values.q1_who_cares,
            q2_why_care: values.q2_why_care,
            q3_how_often: values.q3_how_often,
            q4_current_solution: values.q4_current_solution,
            q5_pain_points: values.q5_pain_points,
            q6_expected_outcome: values.q6_expected_outcome,
            q7_value_impact: values.q7_value_impact,
            q8_urgency_level: values.q8_urgency_level,
            q9_budget_willingness: values.q9_budget_willingness,
            q10_alternative_solutions: values.q10_alternative_solutions,
            additional_notes: values.additional_notes,
          } : undefined,
        })
        message.success('需求创建成功')
        window.location.href = '/requirements'
      }
    } catch (error: any) {
      console.error('Failed to save requirement:', error)
      message.error(error?.detail || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/requirements')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card title={id === 'new' ? '新建需求' : '编辑需求'} style={{ maxWidth: 1000 }}>
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              label="需求标题"
              name="title"
              rules={[{ required: true, message: '请输入需求标题' }]}
            >
              <Input placeholder="请输入需求标题" />
            </Form.Item>

            <Form.Item
              label="需求来源"
              name="source_channel"
              rules={[{ required: true, message: '请选择需求来源' }]}
            >
              <Select
                placeholder="请选择需求来源"
                options={[
                  { label: '客户', value: 'customer' },
                  { label: '市场', value: 'market' },
                  { label: '销售', value: 'sales' },
                  { label: '技术', value: 'rd' },
                  { label: '安全', value: 'after_sales' },
                ]}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="优先级"
                  name="priority_score"
                  rules={[{ required: false }]}
                >
                  <Select
                    placeholder="请选择优先级"
                    allowClear
                    options={[
                      { label: '高', value: 90 },
                      { label: '中', value: 60 },
                      { label: '低', value: 30 },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="状态"
                  name="status"
                  rules={[{ required: true, message: '请选择状态' }]}
                >
                  <Select
                    placeholder="请选择状态"
                    options={[
                      { label: '已收集', value: 'collected' },
                      { label: '分析中', value: 'analyzing' },
                      { label: '已分发', value: 'distributed' },
                      { label: '开发中', value: 'implementing' },
                      { label: '已完成', value: 'completed' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="MoSCoW 优先级"
                  name="moscow_priority"
                  rules={[{ required: false }]}
                  tooltip="Must: 必须有 | Should: 应该有 | Could: 可以有 | Won't: 这次不会有"
                >
                  <Select
                    placeholder="请选择 MoSCoW 优先级"
                    allowClear
                    options={[
                      {
                        label: (
                          <Space>
                            <Tag color="red" style={{ margin: 0 }}>Must Have</Tag>
                            <span>必须有 - 核心功能，必须交付</span>
                          </Space>
                        ),
                        value: 'must_have'
                      },
                      {
                        label: (
                          <Space>
                            <Tag color="orange" style={{ margin: 0 }}>Should Have</Tag>
                            <span>应该有 - 重要但非核心</span>
                          </Space>
                        ),
                        value: 'should_have'
                      },
                      {
                        label: (
                          <Space>
                            <Tag color="blue" style={{ margin: 0 }}>Could Have</Tag>
                            <span>可以有 - 有了更好</span>
                          </Space>
                        ),
                        value: 'could_have'
                      },
                      {
                        label: (
                          <Space>
                            <Tag color="default" style={{ margin: 0 }}>Won't Have</Tag>
                            <span>这次不会有 - 明确不做</span>
                          </Space>
                        ),
                        value: 'wont_have'
                      },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="优先级评审意见"
                  name="moscow_comment"
                  rules={[{ required: false }]}
                  tooltip="说明选择该优先级的原因和依据"
                >
                  <TextArea
                    placeholder="请说明选择该优先级的原因，例如：业务价值、技术可行性、资源约束等..."
                    rows={3}
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="需求描述"
              name="description"
              rules={[{ required: true, message: '请输入需求描述' }]}
            >
              <TextArea rows={6} placeholder="请输入需求描述" />
            </Form.Item>

            {/* 客户需求10问 */}
            <Form.Item label="客户需求10问" name="show_10q" valuePropName="checked">
              <Checkbox onChange={(e) => setShow10q(e.target.checked)}>展开填写客户需求10问</Checkbox>
            </Form.Item>

            {show10q && (
              <Form.Item noStyle shouldUpdate={false}>
                <div style={{ padding: '16px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                  <Row gutter={16}>
                    <Col span={24}>
                      <h4 style={{ marginBottom: 16 }}>客户需求10问</h4>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="谁关注这个需求" name="q1_who_cares">
                        <VoiceInputTextArea rows={2} placeholder="谁关注这个需求（可语音输入）" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="为什么关注" name="q2_why_care">
                        <VoiceInputTextArea rows={2} placeholder="为什么关注（可语音输入）" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="使用频率" name="q3_how_often">
                        <VoiceInputTextArea rows={2} placeholder="使用频率（可语音输入）" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="现有解决方案" name="q4_current_solution">
                        <VoiceInputTextArea rows={2} placeholder="现有解决方案（可语音输入）" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="痛点问题" name="q5_pain_points">
                        <VoiceInputTextArea rows={2} placeholder="痛点问题（可语音输入）" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="期望结果" name="q6_expected_outcome">
                        <VoiceInputTextArea rows={2} placeholder="期望结果（可语音输入）" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="价值和影响" name="q7_value_impact">
                        <VoiceInputTextArea rows={2} placeholder="价值和影响（可语音输入）" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="紧急程度" name="q8_urgency_level">
                        <VoiceInputTextArea rows={2} placeholder="紧急程度（可语音输入）" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="预算意愿" name="q9_budget_willingness">
                        <VoiceInputTextArea rows={2} placeholder="预算意愿（可语音输入）" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="替代方案" name="q10_alternative_solutions">
                        <VoiceInputTextArea rows={2} placeholder="替代方案（可语音输入）" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="补充说明" name="additional_notes">
                    <VoiceInputTextArea rows={2} placeholder="补充说明（可语音输入）" />
                  </Form.Item>
                </div>
              </Form.Item>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {id === 'new' ? '创建' : '保存'}
                </Button>
                <Button onClick={() => navigate('/requirements')}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  )
}

function AnalyticsPage() {
  const [requirements, setRequirements] = useState<any[]>([])
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [form] = Form.useForm()

  // Generate random weights that sum to 1
  const generateRandomWeights = () => {
    const keys = ['price', 'availability', 'packaging', 'performance', 'ease_of_use', 'assurance', 'lifecycle_cost', 'social_acceptance']
    const randomValues = keys.map(() => Math.random())
    const sum = randomValues.reduce((a, b) => a + b, 0)
    const normalizedWeights: any = {}
    keys.forEach((key, index) => {
      normalizedWeights[key] = Math.round((randomValues[index] / sum) * 100) / 100
    })

    // Set form values
    const formValues: any = {}
    appealsDimensions.forEach(dim => {
      formValues[`${dim.key}_weight`] = normalizedWeights[dim.key]
    })
    form.setFieldsValue(formValues)
    setRefresh(refresh + 1)
    message.success('已生成随机权重，总和为1')
  }

  // APPEALS dimensions with normalized weights
  const appealsDimensions = [
    { key: 'price', label: '价格/成本', icon: '$', defaultWeight: 0.15, description: '产品或服务的价格竞争力' },
    { key: 'availability', label: '可获得性', icon: 'A', defaultWeight: 0.10, description: '产品获取的难易程度' },
    { key: 'packaging', label: '包装/外观', icon: 'P', defaultWeight: 0.05, description: '产品外观和包装设计' },
    { key: 'performance', label: '性能', icon: 'P', defaultWeight: 0.25, description: '产品功能的性能表现' },
    { key: 'ease_of_use', label: '易用性', icon: 'E', defaultWeight: 0.15, description: '产品使用的便捷程度' },
    { key: 'assurance', label: '保证/可靠性', icon: 'A', defaultWeight: 0.15, description: '产品质量和可靠性保证' },
    { key: 'lifecycle_cost', label: '生命周期成本', icon: 'L', defaultWeight: 0.10, description: '使用和维护的总成本' },
    { key: 'social_acceptance', label: '社会接受度', icon: 'S', defaultWeight: 0.05, description: '社会认可和接受程度' },
  ]

  // Normalize weights to sum to 1
  const normalizeWeights = (changedKey: string, changedValue: number) => {
    const values = form.getFieldsValue()
    const currentWeights: any = {}

    appealsDimensions.forEach(dim => {
      currentWeights[dim.key] = parseFloat(values[`${dim.key}_weight`]) || dim.defaultWeight
    })

    // Set the changed weight
    currentWeights[changedKey] = changedValue

    // Calculate sum of all weights except the changed one
    let otherSum = 0
    appealsDimensions.forEach(dim => {
      if (dim.key !== changedKey) {
        otherSum += currentWeights[dim.key]
      }
    })

    // Normalize other weights to make total = 1
    const remaining = 1 - changedValue
    if (remaining > 0 && otherSum > 0) {
      appealsDimensions.forEach(dim => {
        if (dim.key !== changedKey) {
          const proportion = currentWeights[dim.key] / otherSum
          currentWeights[dim.key] = Math.round(proportion * remaining * 100) / 100
        }
      })
    }

    return currentWeights
  }

  const handleWeightChange = (key: string, value: number) => {
    const normalizedWeights = normalizeWeights(key, value)
    const formValues: any = {}
    appealsDimensions.forEach(dim => {
      formValues[`${dim.key}_weight`] = normalizedWeights[dim.key]
    })
    form.setFieldsValue(formValues)
    setRefresh(refresh + 1)
  }

  // Load requirements list
  useEffect(() => {
    async function fetchRequirements() {
      try {
        const response = await api.get('/requirements')
        const items = response?.data?.items || []
        setRequirements(items)
      } catch (error) {
        console.error('Failed to fetch requirements:', error)
      }
    }
    fetchRequirements()
  }, [])

  // Load APPEALS analysis when requirement is selected
  useEffect(() => {
    if (selectedReqId) {
      loadAppealsAnalysis(selectedReqId)
    }
  }, [selectedReqId])

  const loadAppealsAnalysis = async (reqId: number) => {
    setLoading(true)
    try {
      const data = await api.get(`/requirements/${reqId}/appeals`)
      console.log('Loaded APPEALS data:', data)

      if (data && data.dimensions) {
        // Populate form with existing data
        const formValues: any = {}
        Object.keys(data.dimensions).forEach(key => {
          formValues[`${key}_score`] = data.dimensions[key].score
          formValues[`${key}_weight`] = Number(data.dimensions[key].weight)
          formValues[`${key}_comment`] = data.dimensions[key].comment || ''
        })
        console.log('Setting form values:', formValues)
        form.setFieldsValue(formValues)
      } else {
        // Reset form with defaults
        resetForm()
      }
    } catch (error) {
      console.log('No existing analysis found, starting fresh', error)
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    const formValues: any = {}
    appealsDimensions.forEach(dim => {
      formValues[`${dim.key}_score`] = 5
      formValues[`${dim.key}_weight`] = dim.defaultWeight
      formValues[`${dim.key}_comment`] = ''
    })
    form.setFieldsValue(formValues)
  }

  const calculateTotalScore = () => {
    const values = form.getFieldsValue()
    let total = 0
    appealsDimensions.forEach(dim => {
      const score = values[`${dim.key}_score`] || 5
      const weight = values[`${dim.key}_weight`] || dim.defaultWeight
      total += score * weight
    })
    return (total * 10).toFixed(2)
  }

  const getRadarChartData = () => {
    const values = form.getFieldsValue()
    return appealsDimensions.map(dim => ({
      dimension: dim.label,
      fullMark: 10,
      score: values[`${dim.key}_score`] || 5,
      key: dim.key,
    }))
  }

  const handleSave = async (values: any) => {
    if (!selectedReqId) {
      message.warning('请先选择要分析的需求')
      return
    }

    setSaving(true)
    try {
      const dimensions: any = {}
      appealsDimensions.forEach(dim => {
        dimensions[dim.key] = {
          score: values[`${dim.key}_score`],
          weight: values[`${dim.key}_weight`],
          comment: values[`${dim.key}_comment`],
        }
      })

      await api.post(`/requirements/${selectedReqId}/appeals`, dimensions)
      message.success('保存成功')
    } catch (error: any) {
      console.error('Failed to save analysis:', error)
      message.error(error?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const selectedRequirement = requirements.find(r => r.id === selectedReqId)

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>需求分析 - $APPEALS 评估</h2>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label style={{ marginRight: 16, fontWeight: 'bold' }}>选择需求：</label>
            <Select
              style={{ width: 400 }}
              placeholder="请选择要分析的需求"
              value={selectedReqId}
              onChange={setSelectedReqId}
              showSearch
              optionFilterProp="children"
            >
              {requirements.map(req => (
                <Select.Option key={req.id} value={req.id}>
                  {req.requirement_no} - {req.title}
                </Select.Option>
              ))}
            </Select>
          </div>

          {selectedRequirement && (
            <div>
              <p><strong>需求标题：</strong>{selectedRequirement.title}</p>
              <p><strong>需求编号：</strong>{selectedRequirement.requirement_no}</p>
              <p><strong>需求描述：</strong>{selectedRequirement.description}</p>
            </div>
          )}
        </Space>
      </Card>

      {selectedReqId && (
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            onValuesChange={() => {
              // Trigger re-render to update total score display
              setRefresh(refresh + 1)
            }}
          >
            <Row gutter={[16, 16]}>
              {appealsDimensions.map(dim => (
                <Col span={12} key={dim.key}>
                  <Card
                    title={
                      <Space>
                        <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>
                          {dim.icon}
                        </Tag>
                        <span>{dim.label}</span>
                      </Space>
                    }
                    size="small"
                  >
                    <p style={{ color: '#666', marginBottom: 16, fontSize: 12 }}>
                      {dim.description}
                    </p>

                    <Form.Item
                      name={`${dim.key}_score`}
                      label="评分 (1-10)"
                      initialValue={5}
                      rules={[{ required: true, message: '请评分' }]}
                    >
                      <Slider min={1} max={10} marks={{ 1: '1', 5: '5', 10: '10' }} />
                    </Form.Item>

                    <Form.Item
                      name={`${dim.key}_weight`}
                      label={
                        <Space>
                          权重
                          <Tag color="blue">总和: {(() => {
                            const values = form.getFieldsValue()
                            let total = 0
                            appealsDimensions.forEach(d => {
                              total += parseFloat(values[`${d.key}_weight`] || d.defaultWeight)
                            })
                            return total.toFixed(2)
                          })()}</Tag>
                        </Space>
                      }
                      initialValue={dim.defaultWeight}
                      rules={[{ required: true, message: '请设置权重' }]}
                    >
                      <Input
                        type="number"
                        step={0.01}
                        min={0}
                        max={1}
                        addonAfter="×"
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          if (!isNaN(value) && value >= 0 && value <= 1) {
                            handleWeightChange(dim.key, value)
                          }
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name={`${dim.key}_comment`}
                      label="评分说明"
                      initialValue=""
                    >
                      <TextArea rows={2} placeholder="请输入评分说明" />
                    </Form.Item>
                  </Card>
                </Col>
              ))}
            </Row>

            <Card style={{ marginTop: 24 }} title="$APPEALS 雷达图">
              <Row gutter={16} align="middle">
                <Col span={12}>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={getRadarChartData()}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimension" />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} />
                      <Radar
                        name="评分"
                        dataKey="score"
                        stroke="#1890ff"
                        fill="#1890ff"
                        fillOpacity={0.6}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <Statistic
                      title="加权总分"
                      value={calculateTotalScore()}
                      suffix="/ 100"
                      valueStyle={{ color: '#1890ff', fontSize: 48, fontWeight: 'bold' }}
                    />
                    <div style={{ marginTop: 24 }}>
                      <Space size="middle">
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={saving}
                          size="large"
                        >
                          保存分析
                        </Button>
                        <Button
                          onClick={() => {
                            resetForm()
                            message.info('已重置表单')
                          }}
                          size="large"
                        >
                          重置
                        </Button>
                        <Button
                          onClick={generateRandomWeights}
                          size="large"
                          style={{ borderColor: '#1890ff', color: '#1890ff' }}
                        >
                          随机权重
                        </Button>
                      </Space>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Form>
        </Spin>
      )}

      {!selectedReqId && (
        <Card>
          <p style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
            请从上方选择一个需求开始分析
          </p>
        </Card>
      )}
    </div>
  )
}

function DistributionPage() {
  const [pendingReqs, setPendingReqs] = useState<any[]>([])
  const [distributedReqs, setDistributedReqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [distributing, setDistributing] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [targetType, setTargetType] = useState<string>('')
  const [targetId, setTargetId] = useState<string>('')
  const [numericTargetId, setNumericTargetId] = useState<number>(0)
  const [form] = Form.useForm()

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

function MainLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user_info')
    if (userStr) {
      try {
        setUserInfo(JSON.parse(userStr))
      } catch (e) {
        console.error('Failed to parse user info:', e)
      }
    }
  }, [])

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_info')
        message.success('已退出登录')
        navigate('/login')
      },
    })
  }

  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          padding: '16px',
          color: 'white',
          textAlign: 'center',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingLeft: collapsed ? '0' : '24px'
        }}>
          {!collapsed && (
            <h2 style={{ color: 'white', margin: 0, fontSize: '18px' }}>IPD需求管理</h2>
          )}
          {collapsed && (
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>IPD</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          inlineCollapsed={collapsed}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleCollapsed}
              style={{ fontSize: '16px', width: 48, height: 48 }}
            />
            <h1 style={{ margin: 0 }}>IPD Requirements Management</h1>
          </Space>
          <Space size="middle">
            <Tooltip title="DeepSeek AI">
              <Button
                type="primary"
                icon={<DeepSeekIcon width={20} height={20} />}
                onClick={() => window.open('https://chat.deepseek.com/', '_blank')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  width: '44px',
                  height: '44px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </Tooltip>
            <Tooltip title="Claude AI">
              <Button
                type="primary"
                icon={<ClaudeIcon width={20} height={20} />}
                onClick={() => window.open('https://claude.ai/', '_blank')}
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                  border: 'none',
                  width: '44px',
                  height: '44px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </Tooltip>
            <span style={{ color: '#666' }}>
              <UserOutlined /> {userInfo?.username || 'User'}
            </span>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              退出
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px', padding: '24px', background: '#fff' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default function App() {
  const token = localStorage.getItem('access_token')

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Navigate to="/dashboard" replace />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RequirementsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements/new"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RequirementEditPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements/edit/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RequirementEditPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AnalyticsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/distribution"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DistributionPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rtm"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RTMPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements/:requirementId/verification"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VerificationListPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements/:requirementId/verification/create"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VerificationChecklistForm mode="create" />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements/:requirementId/verification/:checklistId"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VerificationChecklistForm mode="view" />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requirements/:requirementId/verification/:checklistId/edit"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VerificationChecklistForm mode="edit" />
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

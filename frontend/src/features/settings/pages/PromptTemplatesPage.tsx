import { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Typography,
  Tabs,
} from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import promptTemplateService from '@/services/promptTemplate.service'
import type { PromptTemplate, PromptTemplateCreate, PromptTemplateUpdate } from '@/types/prompt'
import { useAuthStore } from '@/stores/useAuthStore'
import { isAdmin } from '@/utils/permissions'

const { TextArea } = Input
const { Title, Text } = Typography

interface PromptTemplatesPageProps {
  defaultTab?: 'ipd_ten_questions' | 'quick_insight'
}

export function PromptTemplatesPage({ defaultTab = 'ipd_ten_questions' }: PromptTemplatesPageProps) {
  const { user, token } = useAuthStore()
  const userIsAdmin = isAdmin(user)

  // 从 localStorage 读取用户信息（备用方案）
  const [localStorageUser, setLocalStorageUser] = useState<any>(null)

  // 调试日志 - 检查 localStorage 和 store 状态
  useEffect(() => {
    const storage = localStorage.getItem('auth-storage')
    console.log('[PromptTemplatesPage] localStorage auth-storage:', storage ? '存在' : '不存在')
    if (storage) {
      try {
        const parsed = JSON.parse(storage)
        console.log('[PromptTemplatesPage] 解析后的用户数据:', parsed)
        // 尝试从 state 中获取 user
        if (parsed.state?.user) {
          setLocalStorageUser(parsed.state.user)
          console.log('[PromptTemplatesPage] 从 localStorage 恢复用户:', parsed.state.user)
        }
      } catch (e) {
        console.error('[PromptTemplatesPage] 解析 localStorage 失败:', e)
      }
    }

    console.log('[PromptTemplatesPage] Store 状态:', {
      user,
      token: token ? '存在' : '不存在',
      userRole: user?.role,
      isAdmin: userIsAdmin,
      isAuthenticated: !!user,
      localStorageUser
    })
  }, [user, token, userIsAdmin])

  // 优先使用 store 中的 user，如果不存在则使用 localStorage 中的 user
  const effectiveUser = user || localStorageUser
  const effectiveIsAdmin = isAdmin(effectiveUser)

  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)
  const [viewingTemplate, setViewingTemplate] = useState<PromptTemplate | null>(null)
  const [form] = Form.useForm()

  const [activeTab, setActiveTab] = useState<'ipd_ten_questions' | 'quick_insight'>(defaultTab)

  useEffect(() => {
    loadTemplates()
  }, [activeTab])

  // Update activeTab when defaultTab prop changes
  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await promptTemplateService.listTemplates(activeTab)
      setTemplates(data)
    } catch (error: any) {
      message.error(error.message || '加载模板失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    form.resetFields()
    form.setFieldsValue({
      template_key: activeTab,
      variables: ['text']
    })
    setModalVisible(true)
  }

  const handleEdit = (template: PromptTemplate) => {
    setEditingTemplate(template)
    form.setFieldsValue({
      template_key: template.template_key,
      content: template.content,
      name: template.name,
      description: template.description,
      variables: template.variables || ['text'],
    })
    setModalVisible(true)
  }

  const handleView = (template: PromptTemplate) => {
    setViewingTemplate(template)
    setViewModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await promptTemplateService.deleteTemplate(id)
      message.success('删除成功')
      loadTemplates()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // Convert variables comma-separated string to array if needed
      let variables = values.variables
      if (typeof variables === 'string') {
        variables = variables.split(',').map((v: string) => v.trim()).filter((v: string) => v)
      }

      console.log('[创建模板] 提交数据:', { values, variables, editingTemplate })

      if (editingTemplate) {
        // Update
        const updateData: PromptTemplateUpdate = {
          content: values.content,
          name: values.name,
          description: values.description,
          variables,
        }
        console.log('[创建模板] 更新数据:', updateData)
        await promptTemplateService.updateTemplate(editingTemplate.id, updateData)
        message.success('更新成功，已创建新版本')
      } else {
        // Create
        const createData: PromptTemplateCreate = {
          template_key: values.template_key,
          name: values.name,
          content: values.content,
          description: values.description,
          variables,
        }
        console.log('[创建模板] 创建数据:', createData)
        await promptTemplateService.createTemplate(createData)
        message.success('创建成功')
      }

      setModalVisible(false)
      loadTemplates()
    } catch (error: any) {
      console.error('[创建模板] 错误:', error)
      message.error(error.message || '操作失败')
    }
  }

  return (
    <div>
      <Title level={2}>Prompt 模板管理</Title>

      {/* 调试信息：显示当前用户 */}
      {import.meta.env.DEV && (
        <Card size="small" style={{ marginBottom: 16, background: effectiveUser ? '#e6f7ff' : '#fff1f0' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">
              <strong>调试信息：</strong>
              {effectiveUser ? (
                <>
                  <span style={{ color: '#52c41a' }}>● 已登录</span> |
                  用户: {effectiveUser.username} |
                  角色: {effectiveUser.role} |
                  管理员: {effectiveIsAdmin ? '是 ✓' : '否 ✗'}
                </>
              ) : (
                <>
                  <span style={{ color: '#ff4d4f' }}>● 未登录</span> |
                  请重新登录后再访问此页面
                </>
              )}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Store User: {user ? '存在 ✓' : '不存在 ✗'} |
              LocalStorage User: {localStorageUser ? '存在 ✓' : '不存在 ✗'} |
              Token: {token ? '存在 ✓' : '不存在 ✗'}
            </Text>
          </Space>
        </Card>
      )}

      <Card>
        <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as any)}>
          <Tabs.TabPane tab="IPD 十问模板" key="ipd_ten_questions">
            <TemplateList
              templates={templates}
              loading={loading}
              isAdmin={effectiveIsAdmin}
              onCreate={handleCreate}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="快速分析模板" key="quick_insight">
            <TemplateList
              templates={templates}
              loading={loading}
              isAdmin={effectiveIsAdmin}
              onCreate={handleCreate}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingTemplate ? '编辑模板（将创建新版本）' : '创建模板'}
        open={modalVisible}
        onOk={async () => {
          console.log('[Modal] 点击确认按钮')
          try {
            const values = await form.validateFields()
            console.log('[Modal] 表单验证成功，值:', values)
            await handleSubmit()
          } catch (error) {
            console.error('[Modal] 表单验证失败:', error)
          }
        }}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="template_key"
            label="模板类型"
            rules={[{ required: true, message: '请选择模板类型' }]}
          >
            <Select disabled={!!editingTemplate}>
              <Select.Option value="ipd_ten_questions">IPD 十问</Select.Option>
              <Select.Option value="quick_insight">快速分析</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="例如：IPD 需求十问模板 v1.0" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={2} placeholder="模板用途说明" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Prompt 内容"
            rules={[
              { required: true, message: '请输入 Prompt 内容' },
              { min: 10, message: 'Prompt 内容至少需要 10 个字符' }
            ]}
          >
            <TextArea
              rows={15}
              placeholder="使用 {variable} 格式定义变量，例如：{text}"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="variables"
            label="变量列表（逗号分隔）"
            tooltip="Prompt 中使用的变量名称，例如：text"
          >
            <Input placeholder="例如：text, user_name, company" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看模板弹窗 */}
      <Modal
        title="查看模板详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {viewingTemplate && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>模板名称：</strong>{viewingTemplate.name}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>模板类型：</strong>
              <Tag color="blue">{viewingTemplate.template_key === 'ipd_ten_questions' ? 'IPD 十问' : '快速分析'}</Tag>
              <Tag color="green">{viewingTemplate.version}</Tag>
              {viewingTemplate.is_active && <Tag color="blue">当前版本</Tag>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>描述：</strong>{viewingTemplate.description || '无'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>变量列表：</strong>
              {viewingTemplate.variables && viewingTemplate.variables.length > 0
                ? viewingTemplate.variables.map((v, i) => <Tag key={i}>{v}</Tag>)
                : '无'}
            </div>
            <div>
              <strong>Prompt 内容：</strong>
              <TextArea
                value={viewingTemplate.content}
                rows={15}
                readOnly
                style={{ fontFamily: 'monospace', marginTop: 8 }}
              />
            </div>
            <div style={{ marginTop: 16, color: '#999' }}>
              <small>
                创建时间：{new Date(viewingTemplate.created_at).toLocaleString('zh-CN')}<br/>
                更新时间：{new Date(viewingTemplate.updated_at).toLocaleString('zh-CN')}
              </small>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function TemplateList({
  templates,
  loading,
  isAdmin,
  onCreate,
  onEdit,
  onView,
  onDelete,
}: {
  templates: PromptTemplate[]
  loading: boolean
  isAdmin: boolean
  onCreate: () => void
  onEdit: (template: PromptTemplate) => void
  onView: (template: PromptTemplate) => void
  onDelete: (id: number) => void
}) {
  const columns: ColumnsType<PromptTemplate> = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 120,
      render: (version, record) => (
        <Space>
          <Tag color={record.is_active ? 'green' : 'default'}>{version}</Tag>
          {record.is_active && <Tag color="blue">当前</Tag>}
        </Space>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc) => desc || '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
          >
            查看
          </Button>
          {isAdmin && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确认删除此模板？"
                onConfirm={() => onDelete(record.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      {isAdmin && (
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            创建新模板
          </Button>
        </div>
      )}

      {!isAdmin && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">只有管理员可以编辑 Prompt 模板</Text>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={templates}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </>
  )
}

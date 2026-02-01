import React, { useEffect, useState } from 'react'
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Select,
  Input,
  Modal,
  Form,
  message,
  Spin,
  Upload,
} from 'antd'
import {
  DownloadOutlined,
  LinkOutlined,
  DisconnectOutlined,
  UploadOutlined,
  FileOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { rtmService, TraceabilityMatrix, TraceabilityItem } from '@/services/rtm.service'

const { Title, Text, Dragger } = Typography

export const RTMPage: React.FC = () => {
  const [matrix, setMatrix] = useState<TraceabilityMatrix[]>([])
  const [loading, setLoading] = useState(false)
  const [linkModalVisible, setLinkModalVisible] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null)
  const [selectedRequirementId, setSelectedRequirementId] = useState<number | null>(null)
  const [uploadType, setUploadType] = useState<'design' | 'code' | 'test'>('design')
  const [uploading, setUploading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [linkForm] = Form.useForm()

  useEffect(() => {
    fetchMatrix()
  }, [])

  const fetchMatrix = async () => {
    setLoading(true)
    try {
      const response = await rtmService.getTraceabilityMatrix()
      console.log('RTM API Response:', response)
      console.log('Response type:', typeof response)
      console.log('Is array?', Array.isArray(response))

      const data = 'data' in response ? (response as any).data : response
      console.log('Matrix data:', data)
      console.log('Data length:', Array.isArray(data) ? data.length : 'Not an array')

      setMatrix(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('RTM API Error:', error)
      message.error('获取需求追溯矩阵失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async (values: any) => {
    try {
      await rtmService.createLink(values)
      message.success('关联创建成功')
      setLinkModalVisible(false)
      linkForm.resetFields()
      await fetchMatrix()
    } catch (error) {
      message.error('创建关联失败')
    }
  }

  const handleDeleteLink = async (linkId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个关联吗？',
      onOk: async () => {
        try {
          await rtmService.deleteLink(linkId)
          message.success('关联删除成功')
          await fetchMatrix()
        } catch (error) {
          message.error('删除关联失败')
        }
      },
    })
  }

  const handleOpenUploadModal = (requirementNo: string, requirementId: number, type: 'design' | 'code' | 'test') => {
    setSelectedRequirement(requirementNo)
    setSelectedRequirementId(requirementId)
    setUploadType(type)
    setUploadModalVisible(true)
  }

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    if (selectedRequirementId === null) {
      message.error('未选择需求')
      onError?.(new Error('未选择需求'))
      return
    }

    setUploading(true)
    try {
      // Ant Design Upload 组件的 file 对象包含 originFileObj 属性
      const originalFile = (file as any).originFileObj || file
      await rtmService.uploadDocumentAndLink(selectedRequirementId, uploadType, originalFile as File)
      message.success('上传成功')
      onSuccess?.(null)
      setUploadModalVisible(false)
      await fetchMatrix()
    } catch (error) {
      console.error('Upload error:', error)
      message.error('上传失败')
      onError?.(error as Error)
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadAttachment = (attachmentId: number) => {
    const url = rtmService.getAttachmentDownloadUrl(attachmentId)
    window.open(url, '_blank')
  }

  const handleExport = async (format: 'excel' | 'pdf' = 'excel') => {
    try {
      const { data } = await rtmService.exportMatrix(format)
      // Create download link
      const url = window.URL.createObjectURL(new Blob([data], {
        type: format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      }))
      const link = document.createElement('a')
      link.href = url
      // 使用正确的文件扩展名
      const fileExt = format === 'excel' ? 'xlsx' : 'pdf'
      link.setAttribute('download', `需求追溯矩阵.${fileExt}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      message.success(`已导出 ${format.toUpperCase()} 格式`)
    } catch (error) {
      console.error('导出错误:', error)
      message.error('导出失败')
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      complete: { color: 'success', text: '完整' },
      partial: { color: 'warning', text: '部分' },
      missing: { color: 'error', text: '缺失' },
      pending: { color: 'default', text: '待处理' },
    }
    const { color, text } = statusMap[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  const columns = [
    {
      title: '需求ID',
      dataIndex: 'requirement_no',
      key: 'requirement_no',
      width: 150,
      fixed: 'left' as const,
      render: (text: string) => <Text code style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text}</Text>
    },
    {
      title: '需求标题',
      dataIndex: 'requirement_title',
      key: 'requirement_title',
      width: 180,
      ellipsis: true,
    },
    {
      title: '设计文档',
      key: 'design',
      width: 280,
      render: (_: any, record: TraceabilityMatrix) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {record.design_items.length > 0 ? (
            record.design_items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                {item.design_attachment ? (
                  <Button
                    type="link"
                    size="small"
                    icon={<FileOutlined />}
                    onClick={() => handleDownloadAttachment(item.design_attachment!.id)}
                    style={{ flex: 1, minWidth: 0, padding: '0 4px', textAlign: 'left' }}
                    ellipsis
                  >
                    {item.design_attachment.file_name}
                  </Button>
                ) : (
                  <Tag>{item.design_id}</Tag>
                )}
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DisconnectOutlined />}
                  onClick={() => handleDeleteLink(item.id)}
                  style={{ flexShrink: 0 }}
                />
              </div>
            ))
          ) : (
            <Button
              type="dashed"
              size="small"
              icon={<UploadOutlined />}
              onClick={() => handleOpenUploadModal(record.requirement_no, record.requirement_id, 'design')}
            >
              上传设计文档
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: '代码',
      key: 'code',
      width: 280,
      render: (_: any, record: TraceabilityMatrix) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {record.code_items.length > 0 ? (
            record.code_items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                {item.code_attachment ? (
                  <Button
                    type="link"
                    size="small"
                    icon={<FileOutlined />}
                    onClick={() => handleDownloadAttachment(item.code_attachment!.id)}
                    style={{ flex: 1, minWidth: 0, padding: '0 4px', textAlign: 'left' }}
                    ellipsis
                  >
                    {item.code_attachment.file_name}
                  </Button>
                ) : (
                  <Tag>{item.code_id}</Tag>
                )}
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DisconnectOutlined />}
                  onClick={() => handleDeleteLink(item.id)}
                  style={{ flexShrink: 0 }}
                />
              </div>
            ))
          ) : (
            <Button
              type="dashed"
              size="small"
              icon={<UploadOutlined />}
              onClick={() => handleOpenUploadModal(record.requirement_no, record.requirement_id, 'code')}
            >
              上传代码
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: '测试用例',
      key: 'test',
      width: 280,
      render: (_: any, record: TraceabilityMatrix) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {record.test_items.length > 0 ? (
            record.test_items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                {item.test_attachment ? (
                  <Button
                    type="link"
                    size="small"
                    icon={<FileOutlined />}
                    onClick={() => handleDownloadAttachment(item.test_attachment!.id)}
                    style={{ flex: 1, minWidth: 0, padding: '0 4px', textAlign: 'left' }}
                    ellipsis
                  >
                    {item.test_attachment.file_name}
                  </Button>
                ) : (
                  <Tag>{item.test_id}</Tag>
                )}
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DisconnectOutlined />}
                  onClick={() => handleDeleteLink(item.id)}
                  style={{ flexShrink: 0 }}
                />
              </div>
            ))
          ) : (
            <Button
              type="dashed"
              size="small"
              icon={<UploadOutlined />}
              onClick={() => handleOpenUploadModal(record.requirement_no, record.requirement_id, 'test')}
            >
              上传测试用例
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      fixed: 'right' as const,
      render: (_: any, record: TraceabilityMatrix) => {
        const hasDesign = record.design_items.length > 0
        const hasCode = record.code_items.length > 0
        const hasTest = record.test_items.length > 0

        if (hasDesign && hasCode && hasTest) {
          return getStatusTag('complete')
        } else if (hasDesign || hasCode || hasTest) {
          return getStatusTag('partial')
        } else {
          return getStatusTag('missing')
        }
      },
    },
  ]

  const filteredMatrix = matrix.filter((item) => {
    if (filterStatus === 'all') return true

    const hasDesign = item.design_items.length > 0
    const hasCode = item.code_items.length > 0
    const hasTest = item.test_items.length > 0

    if (filterStatus === 'complete') return hasDesign && hasCode && hasTest
    if (filterStatus === 'partial') return hasDesign || hasCode || hasTest
    if (filterStatus === 'missing') return !hasDesign && !hasCode && !hasTest

    return true
  })

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={3}>需求追溯矩阵 (RTM)</Title>
          <Space>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 150 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'complete', label: '完整' },
                { value: 'partial', label: '部分' },
                { value: 'missing', label: '缺失' },
              ]}
            />
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('excel')}>
              导出 Excel
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('pdf')}>
              导出 PDF
            </Button>
          </Space>
        </Space>

        <Card>
          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={filteredMatrix}
              rowKey="requirement_no"
              scroll={{ x: 1400 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Spin>
        </Card>

        <Card title="统计摘要">
          <Space size="large">
            <div>
              <Text type="secondary">总计需求</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {matrix.length}
              </div>
            </div>
            <div>
              <Text type="secondary">完整追溯</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {matrix.filter((item) => {
                  const d = item.design_items.length > 0
                  const c = item.code_items.length > 0
                  const t = item.test_items.length > 0
                  return d && c && t
                }).length}
              </div>
            </div>
            <div>
              <Text type="secondary">部分追溯</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                {matrix.filter((item) => {
                  const d = item.design_items.length > 0
                  const c = item.code_items.length > 0
                  const t = item.test_items.length > 0
                  return (d || c || t) && !(d && c && t)
                }).length}
              </div>
            </div>
            <div>
              <Text type="secondary">缺失追溯</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {matrix.filter((item) => {
                  const d = item.design_items.length > 0
                  const c = item.code_items.length > 0
                  const t = item.test_items.length > 0
                  return !d && !c && !t
                }).length}
              </div>
            </div>
          </Space>
        </Card>
      </Space>

      <Modal
        title="添加追溯关联"
        open={linkModalVisible}
        onCancel={() => {
          setLinkModalVisible(false)
          linkForm.resetFields()
        }}
        onOk={() => linkForm.submit()}
      >
        <Form form={linkForm} layout="vertical" onFinish={handleCreateLink}>
          <Form.Item
            name="requirement_id"
            label="需求ID"
            initialValue={selectedRequirement}
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="design_id"
            label="设计文档ID"
            extra="可选：关联设计文档"
          >
            <Input placeholder="例如：DESIGN-001" />
          </Form.Item>

          <Form.Item
            name="code_id"
            label="代码ID"
            extra="可选：关联代码文件或函数"
          >
            <Input placeholder="例如：CODE-001" />
          </Form.Item>

          <Form.Item
            name="test_id"
            label="测试用例ID"
            extra="可选：关联测试用例"
          >
            <Input placeholder="例如：TEST-001" />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="关联说明" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 上传文档模态框 */}
      <Modal
        title={`上传${uploadType === 'design' ? '设计文档' : uploadType === 'code' ? '代码' : '测试用例'}`}
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">需求编号：{selectedRequirement}</Text>
          </div>
          <Upload.Dragger
            name="file"
            disabled={uploading}
            multiple={false}
            customRequest={handleUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.png,.jpg,.jpeg"
            beforeUpload={(file) => {
              const maxSize = 50 * 1024 * 1024 // 50MB
              if (file.size > maxSize) {
                message.error('文件大小不能超过50MB')
                return Upload.LIST_IGNORE
              }
              return true
            }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持单个文件上传，最大50MB
            </p>
          </Upload.Dragger>
        </Space>
      </Modal>
    </div>
  )
}

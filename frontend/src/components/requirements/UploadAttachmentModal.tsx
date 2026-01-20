import { useState, useEffect } from 'react'
import { Modal, Upload, Table, Button, Space, message, Typography, Tag } from 'antd'
import { InboxOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { requirementService } from '@/services/requirement.service'
import type { ApiResponse } from '@/services/api'

const { Dragger } = Upload
const { Text, Title } = Typography

export interface Attachment {
  id: number
  entity_type: string
  entity_id: number
  file_name: string
  file_path: string
  file_size: number
  file_type: string | null
  mime_type: string | null
  uploaded_by: number | null
  uploaded_at: string
  description: string | null
}

interface UploadAttachmentModalProps {
  requirementId: number
  open: boolean
  onClose: () => void
}

export function UploadAttachmentModal({
  requirementId,
  open,
  onClose,
}: UploadAttachmentModalProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Load attachments when modal opens
  useEffect(() => {
    if (open) {
      fetchAttachments()
    }
  }, [open, requirementId])

  const fetchAttachments = async () => {
    setLoading(true)
    try {
      const response = await requirementService.getAttachments(requirementId) as ApiResponse<Attachment[]>
      if (response.success) {
        setAttachments(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error)
      message.error('加载附件列表失败')
    } finally {
      setLoading(false)
    }
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    disabled: uploading,
    showUploadList: false,
    beforeUpload: (file) => {
      // Validate file size (50MB)
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        message.error('文件大小不能超过50MB')
        return Upload.LIST_IGNORE
      }
      return true
    },
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options
      setUploading(true)
      try {
        await requirementService.uploadAttachment(requirementId, file as File)
        message.success('上传成功')
        onSuccess?.(null)
        await fetchAttachments()
      } catch (error) {
        console.error('Upload error:', error)
        message.error('上传失败')
        onError?.(error as Error)
      } finally {
        setUploading(false)
      }
    },
  }

  const handleDelete = async (attachmentId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个附件吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await requirementService.deleteAttachment(attachmentId)
          message.success('删除成功')
          await fetchAttachments()
        } catch (error) {
          console.error('Delete error:', error)
          message.error('删除失败')
        }
      },
    })
  }

  const handleDownload = (attachment: Attachment) => {
    const url = requirementService.getAttachmentDownloadUrl(attachment.id)
    window.open(url, '_blank')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getFileTypeTag = (fileType: string | null) => {
    if (!fileType) return <Tag>未知</Tag>

    const typeMap: Record<string, { color: string; text: string }> = {
      pdf: { color: 'red', text: 'PDF' },
      doc: { color: 'blue', text: 'Word' },
      docx: { color: 'blue', text: 'Word' },
      xls: { color: 'green', text: 'Excel' },
      xlsx: { color: 'green', text: 'Excel' },
      ppt: { color: 'orange', text: 'PPT' },
      pptx: { color: 'orange', text: 'PPT' },
      jpg: { color: 'purple', text: '图片' },
      jpeg: { color: 'purple', text: '图片' },
      png: { color: 'purple', text: '图片' },
      gif: { color: 'purple', text: '图片' },
      zip: { color: 'cyan', text: '压缩包' },
      rar: { color: 'cyan', text: '压缩包' },
    }

    const type = typeMap[fileType.toLowerCase()] || { color: 'default', text: fileType.toUpperCase() }
    return <Tag color={type.color}>{type.text}</Tag>
  }

  const columns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true,
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 100,
      render: (fileType: string | null) => getFileTypeTag(fileType),
    },
    {
      title: '上传时间',
      dataIndex: 'uploaded_at',
      key: 'uploaded_at',
      width: 180,
      render: (date: string) => formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Attachment) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Modal
      title="需求附件"
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnHidden
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Upload Area */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">支持所有文件类型，单个文件最大50MB</Text>
          </div>
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          </Dragger>
        </div>

        {/* Attachments List */}
        <div>
          <Title level={5}>
            已上传附件 ({attachments.length})
          </Title>
          <Table
            dataSource={attachments}
            loading={loading}
            rowKey="id"
            size="small"
            pagination={false}
            columns={columns}
          />
        </div>
      </Space>
    </Modal>
  )
}

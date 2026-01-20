import React, { useState } from 'react'
import {
  Modal,
  Upload,
  Button,
  Space,
  Typography,
  Alert,
  Progress,
  Tag,
  List,
} from 'antd'
import {
  UploadOutlined,
  DownloadOutlined,
  InboxOutlined,
  FileExcelOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { importExportService, ImportJob, ImportResult } from '@/services/importExport.service'

const { Title, Text } = Typography
const { Dragger } = Upload

interface ImportModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

export const ImportModal: React.FC<ImportModalProps> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null)

  const handleDownloadTemplate = async () => {
    try {
      const { data } = await importExportService.downloadTemplate()
      const url = window.URL.createObjectURL(new Blob([data as Blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'requirements_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to download template:', error)
    }
  }

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options

    try {
      setUploading(true)
      setUploadProgress(0)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const { data: job } = await importExportService.importExcel(
        file as File,
        true
      )

      clearInterval(progressInterval)
      setUploadProgress(100)
      setCurrentJob(job)

      setTimeout(() => {
        onSuccess?.(job)
        setUploadProgress(0)
        setUploading(false)
        onSuccess?.()
      }, 1000)
    } catch (error) {
      onError?.(error as Error)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    customRequest: handleUpload,
    showUploadList: false,
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: '待处理' },
      processing: { color: 'processing', text: '处理中' },
      completed: { color: 'success', text: '已完成' },
      failed: { color: 'error', text: '失败' },
    }
    const { color, text } = statusMap[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  return (
    <Modal
      title="导入需求"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={uploading}>
          取消
        </Button>,
      ]}
      width={600}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="导入说明"
          description="请按照模板格式填写需求数据，确保所有必填项都已填写。导入后可以在导入记录中查看结果。"
          type="info"
          showIcon
        />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={5}>1. 下载模板</Title>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
          >
            下载 Excel 模板
          </Button>
        </Space>

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={5}>2. 上传文件</Title>
        </Space>

        {!uploading && !currentJob ? (
          <Dragger {...uploadProps} style={{ marginTop: 16 }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 .xlsx 或 .xls 格式的 Excel 文件
            </p>
          </Dragger>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <FileExcelOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <div style={{ marginTop: 16 }}>
              <Title level={5}>{uploading ? '导入中...' : '导入完成'}</Title>
              {uploading ? (
                <Progress percent={uploadProgress} status="active" />
              ) : currentJob ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text>状态:</Text>
                    {getStatusTag(currentJob.status)}
                  </Space>
                  <Space>
                    <Text>总记录:</Text>
                    <Text strong>{currentJob.total_records}</Text>
                  </Space>
                  <Space>
                    <Text>成功:</Text>
                    <Text strong style={{ color: '#52c41a' }}>
                      {currentJob.success_count}
                    </Text>
                  </Space>
                  <Space>
                    <Text>失败:</Text>
                    <Text strong style={{ color: '#ff4d4f' }}>
                      {currentJob.failed_count}
                    </Text>
                  </Space>
                  {currentJob.failed_count > 0 &&
                    currentJob.error_log && (
                      <Alert
                        message="导入错误"
                        description={
                          <List
                            size="small"
                            dataSource={Object.entries(currentJob.error_log).slice(
                              0,
                              5
                            )}
                            renderItem={(item) => {
                              const [key, errors] = item as [string, string[]]
                              return (
                                <List.Item>
                                  <div>
                                    <div><strong>行 {key}:</strong></div>
                                    {errors.map((err, idx) => (
                                      <div key={idx} style={{ marginLeft: '10px', color: '#ff4d4f' }}>
                                        - {err}
                                      </div>
                                    ))}
                                  </div>
                                </List.Item>
                              )
                            }}
                          />
                        }
                        type="error"
                        showIcon
                      />
                    )}
                </Space>
              ) : null}
            </div>
          </div>
        )}
      </Space>
    </Modal>
  )
}

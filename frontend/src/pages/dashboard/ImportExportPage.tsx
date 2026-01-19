import React, { useEffect, useState } from 'react'
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Tabs,
  Modal,
  message,
  Spin,
} from 'antd'
import {
  ImportOutlined,
  ExportOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import { importExportService, ImportJob, ExportJob } from '@/services/importExport.service'
import { ImportModal } from '@/components/import-export/ImportModal'
import { ExportModal } from '@/components/import-export/ExportModal'

const { Title } = Typography

type TabKey = 'import' | 'export'

export const ImportExportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('import')
  const [importJobs, setImportJobs] = useState<ImportJob[]>([])
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [loading, setLoading] = useState(false)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [exportModalVisible, setExportModalVisible] = useState(false)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'import') {
        const { data } = await importExportService.getImportJobs()
        setImportJobs(data)
      } else {
        const { data } = await importExportService.getExportJobs()
        setExportJobs(data)
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExport = async (jobId: number, fileName: string) => {
    try {
      const { data } = await importExportService.downloadExport(jobId)
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      message.success('下载成功')
    } catch (error) {
      message.error('下载失败')
    }
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

  const importColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '总记录',
      dataIndex: 'total_records',
      key: 'total_records',
      width: 100,
    },
    {
      title: '成功',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 80,
      render: (count: number) => <span style={{ color: '#52c41a' }}>{count}</span>,
    },
    {
      title: '失败',
      dataIndex: 'failed_count',
      key: 'failed_count',
      width: 80,
      render: (count: number) => <span style={{ color: '#ff4d4f' }}>{count}</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ]

  const exportColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '导出类型',
      dataIndex: 'export_type',
      key: 'export_type',
      width: 100,
      render: (type: string) => (
        <Space>
          {type === 'excel' ? <FileExcelOutlined /> : <FilePdfOutlined />}
          {type.toUpperCase()}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 120,
      render: (size: number) => size ? `${(size / 1024).toFixed(2)} KB` : '-',
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
      width: 120,
      render: (_: any, record: ExportJob) =>
        record.status === 'completed' ? (
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() =>
              handleDownloadExport(
                record.id,
                `export_${record.export_type}_${record.id}.${record.export_type}`
              )
            }
          >
            下载
          </Button>
        ) : null,
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={3}>导入/导出管理</Title>
          <Space>
            <Button
              type="primary"
              icon={<ImportOutlined />}
              onClick={() => setImportModalVisible(true)}
            >
              导入需求
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={() => setExportModalVisible(true)}
            >
              导出需求
            </Button>
          </Space>
        </Space>

        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as TabKey)}
            items={[
              {
                key: 'import',
                label: '导入记录',
                children: (
                  <Spin spinning={loading}>
                    <Table
                      columns={importColumns}
                      dataSource={importJobs}
                      rowKey="id"
                      pagination={{
                        pageSize: 10,
                        showTotal: (total) => `共 ${total} 条记录`,
                      }}
                    />
                  </Spin>
                ),
              },
              {
                key: 'export',
                label: '导出记录',
                children: (
                  <Spin spinning={loading}>
                    <Table
                      columns={exportColumns}
                      dataSource={exportJobs}
                      rowKey="id"
                      pagination={{
                        pageSize: 10,
                        showTotal: (total) => `共 ${total} 条记录`,
                      }}
                    />
                  </Spin>
                ),
              },
            ]}
          />
        </Card>
      </Space>

      <ImportModal
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onSuccess={fetchData}
      />

      <ExportModal
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        onSuccess={fetchData}
      />
    </div>
  )
}

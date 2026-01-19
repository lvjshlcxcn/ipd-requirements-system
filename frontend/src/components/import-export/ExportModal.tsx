import React from 'react'
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Checkbox,
  Card,
  Row,
  Col,
  message,
} from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { importExportService, ExportFilters } from '@/services/importExport.service'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface ExportModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const filters: ExportFilters = {
        status: values.status,
        moscow_priority: values.moscow_priority,
        kano_category: values.kano_category,
        include_analysis: values.include_analysis,
        include_history: values.include_history,
      }

      if (values.date_range && values.date_range.length === 2) {
        filters.date_from = values.date_range[0].format('YYYY-MM-DD')
        filters.date_to = values.date_range[1].format('YYYY-MM-DD')
      }

      const { data: job } = await importExportService.exportData(
        values.export_type,
        filters
      )

      message.success('导出任务已创建，请在导出记录中下载')
      form.resetFields()
      onSuccess?.()
    } catch (error) {
      message.error('创建导出任务失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="导出需求"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
          icon={<DownloadOutlined />}
        >
          开始导出
        </Button>,
      ]}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={5}>导出配置</Title>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="export_type"
                label="导出格式"
                initialValue="excel"
                rules={[{ required: true, message: '请选择导出格式' }]}
              >
                <Select>
                  <Select.Option value="excel">Excel (.xlsx)</Select.Option>
                  <Select.Option value="pdf">PDF (.pdf)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Card title="筛选条件" size="small">
            <Form.Item name="status" label="需求状态">
              <Select
                placeholder="全部状态"
                allowClear
                options={[
                  { value: 'draft', label: '草稿' },
                  { value: 'in_review', label: '审核中' },
                  { value: 'approved', label: '已批准' },
                  { value: 'in_development', label: '开发中' },
                  { value: 'testing', label: '测试中' },
                  { value: 'completed', label: '已完成' },
                  { value: 'rejected', label: '已拒绝' },
                ]}
              />
            </Form.Item>

            <Form.Item name="moscow_priority" label="MoSCoW优先级">
              <Select
                placeholder="全部优先级"
                allowClear
                options={[
                  { value: 'must_have', label: '必须有 (Must Have)' },
                  { value: 'should_have', label: '应该有 (Should Have)' },
                  { value: 'could_have', label: '可以有 (Could Have)' },
                  { value: 'wont_have', label: '本次不做 (Won\'t Have)' },
                ]}
              />
            </Form.Item>

            <Form.Item name="kano_category" label="Kano分类">
              <Select
                placeholder="全部分类"
                allowClear
                options={[
                  { value: 'excitement', label: '兴奋型' },
                  { value: 'performance', label: '期望型' },
                  { value: 'basic', label: '必备型' },
                  { value: 'indifferent', label: '无差异型' },
                  { value: 'reverse', label: '反向型' },
                ]}
              />
            </Form.Item>

            <Form.Item name="date_range" label="创建日期范围">
              <RangePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Card>

          <Card title="包含内容" size="small">
            <Form.Item name="include_analysis" valuePropName="checked" initialValue={false}>
              <Checkbox>包含分析数据 (INVEST, MoSCoW, Kano, RICE)</Checkbox>
            </Form.Item>

            <Form.Item name="include_history" valuePropName="checked" initialValue={false}>
              <Checkbox>包含版本历史</Checkbox>
            </Form.Item>

            <Text type="secondary" style={{ fontSize: '12px' }}>
              选中后将增加导出文件大小和处理时间
            </Text>
          </Card>
        </Space>
      </Form>
    </Modal>
  )
}

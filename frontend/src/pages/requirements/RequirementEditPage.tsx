import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Button, Space, message, Row, Col } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { requirementService } from '@/services/requirement.service'

const { TextArea } = Input
const { Option } = Select

interface RequirementForm {
  title: string
  description: string
  source_channel: string
  source_contact?: string
  status: string
  priority_score?: number
  estimated_duration_months?: number
  complexity_level?: string
}

function RequirementEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm<RequirementForm>()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  const fetchRequirement = async () => {
    if (!id) return
    setFetching(true)
    try {
      const response = await requirementService.getRequirement(parseInt(id))
      if (response.success && response.data) {
        form.setFieldsValue({
          title: response.data.title,
          description: response.data.description,
          source_channel: response.data.source_channel,
          source_contact: response.data.source_contact,
          status: response.data.status,
          priority_score: response.data.priority_score,
          estimated_duration_months: response.data.estimated_duration_months,
          complexity_level: response.data.complexity_level,
        })
      } else {
        message.error('获取需求详情失败')
      }
    } catch (error: any) {
      console.error('Fetch requirement error:', error)
      message.error('获取需求详情失败')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchRequirement()
  }, [id])

  const onFinish = async (values: RequirementForm) => {
    setLoading(true)
    try {
      const updateData = {
        title: values.title,
        description: values.description,
        source_channel: values.source_channel,
        source_contact: values.source_contact,
        status: values.status,
        priority_score: values.priority_score,
        estimated_duration_months: values.estimated_duration_months,
        complexity_level: values.complexity_level,
      }

      const response = await requirementService.updateRequirement(parseInt(id!), updateData)

      if (response.success) {
        message.success('需求更新成功')
        navigate(`/requirements/${id}`)
      } else {
        message.error(response.message || '更新失败')
      }
    } catch (error: any) {
      console.error('Update requirement error:', error)
      message.error(error?.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card
        title="编辑需求"
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="需求标题"
                name="title"
                rules={[{ required: true, message: '请输入需求标题' }]}
              >
                <Input placeholder="请输入需求标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="需求来源"
                name="source_channel"
                rules={[{ required: true, message: '请选择需求来源' }]}
              >
                <Select placeholder="请选择需求来源">
                  <Option value="customer">客户</Option>
                  <Option value="market">市场</Option>
                  <Option value="competition">竞争</Option>
                  <Option value="sales">销售</Option>
                  <Option value="after_sales">售后</Option>
                  <Option value="rd">研发</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="需求描述"
            name="description"
            rules={[{ required: true, message: '请输入需求描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述需求内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="来源联系人" name="source_contact">
                <Input placeholder="请输入联系人信息" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="当前状态" name="status">
                <Select>
                  <Option value="collected">已收集</Option>
                  <Option value="analyzing">分析中</Option>
                  <Option value="analyzed">已分析</Option>
                  <Option value="distributing">分发中</Option>
                  <Option value="distributed">已分发</Option>
                  <Option value="implementing">实现中</Option>
                  <Option value="verifying">验证中</Option>
                  <Option value="completed">已完成</Option>
                  <Option value="rejected">已拒绝</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="优先级分数" name="priority_score">
                <Input type="number" placeholder="0-100" min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="预计周期(月)" name="estimated_duration_months">
                <Input type="number" placeholder="月数" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="复杂度" name="complexity_level">
                <Select placeholder="请选择复杂度">
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                  <Option value="very_high">非常高</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                保存修改
              </Button>
              <Button onClick={() => navigate(-1)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default RequirementEditPage

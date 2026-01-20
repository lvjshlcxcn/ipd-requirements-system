import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Modal,
  Steps,
  Row,
  Col,
  Divider,
  Descriptions,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { requirementService } from '@/services/requirement.service'
import type { ApiResponse } from '@/services/api'
import type { Requirement } from '@/services/requirement.service'

const { TextArea } = Input
const { Option } = Select
const { Step } = Steps

interface RequirementFormData {
  // 基本信息
  title: string
  description: string
  source_channel: string
  source_contact?: string
  estimated_duration_months?: number
  complexity_level?: string

  // 十问
  customer_need_10q?: {
    q1_who_cares?: string
    q2_why_care?: string
    q3_how_often?: string
    q4_current_solution?: string
    q5_pain_points?: string
    q6_expected_outcome?: string
    q7_value_impact?: string
    q8_urgency_level?: string
    q9_budget_willingness?: string
    q10_alternative_solutions?: string
    additional_notes?: string
  }
}

function RequirementCreatePage() {
  const navigate = useNavigate()
  const [form] = Form.useForm<RequirementFormData>()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const steps = [
    { title: '基本信息', description: '填写需求基本信息' },
    { title: '需求十问', description: '客户需求十问分析' },
    { title: '附加信息', description: '其他附加信息' },
    { title: '确认提交', description: '确认并提交' },
  ]

  const next = () => {
    if (currentStep === 0) {
      form.validateFields(['title', 'description', 'source_channel'])
        .then(() => {
          setCurrentStep(currentStep + 1)
        })
        .catch((error) => {
          // 验证失败时显示错误信息（Ant Design 会自动显示字段级错误）
          console.error('表单验证失败:', error)
        })
    } else if (currentStep === 1) {
      setCurrentStep(currentStep + 1)
    } else if (currentStep === 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prev = () => {
    setCurrentStep(currentStep - 1)
  }

  const onFinish = async () => {
    setLoading(true)
    try {
      // 获取所有字段值（包括已卸载的字段）
      const values = form.getFieldsValue(true)

      console.log('获取到的表单数据:', values)

      // 检查必填字段
      if (!values.title || !values.title.trim()) {
        throw new Error('请输入需求标题')
      }
      if (!values.description || !values.description.trim()) {
        throw new Error('请输入需求描述')
      }
      if (!values.source_channel) {
        throw new Error('请选择需求来源')
      }

      // 构造API请求数据
      const createData = {
        title: values.title?.trim(),
        description: values.description?.trim(),
        source_channel: values.source_channel,
        source_contact: values.source_contact?.trim(),
        estimated_duration_months: values.estimated_duration_months,
        complexity_level: values.complexity_level,
        customer_need_10q: values.customer_need_10q || undefined,
      }

      console.log('提交数据:', createData)

      const response = await requirementService.createRequirement(createData) as ApiResponse<Requirement>

      console.log('API响应:', response)

      if (response.success) {
        message.success('需求创建成功')
        navigate('/requirements')
      } else {
        message.error(response.message || '创建失败')
      }
    } catch (error: any) {
      console.error('Create requirement error:', error)

      // 显示详细错误信息
      let errorDetail = error?.message || '未知错误'

      // 使用 Modal 显示详细错误
      Modal.error({
        title: '创建需求失败',
        content: (
          <div>
            <p><strong>错误信息:</strong></p>
            <p style={{ color: '#ff4d4f', fontSize: 14 }}>{errorDetail}</p>
            <p style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
              请检查输入是否完整，确保所有必填字段都已填写。
            </p>
          </div>
        ),
        width: 500,
      })
    } finally {
      setLoading(false)
    }
  }

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label="需求标题"
          name="title"
          rules={[{ required: true, message: '请输入需求标题' }]}
        >
          <Input placeholder="请输入需求标题" size="large" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="需求来源"
          name="source_channel"
          rules={[{ required: true, message: '请选择需求来源' }]}
        >
          <Select placeholder="请选择需求来源" size="large">
            <Option value="customer">客户</Option>
            <Option value="market">市场</Option>
            <Option value="competition">竞争</Option>
            <Option value="sales">销售</Option>
            <Option value="after_sales">售后</Option>
            <Option value="rd">研发</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item
          label="需求描述"
          name="description"
          rules={[{ required: true, message: '请输入需求描述' }]}
        >
          <TextArea rows={4} placeholder="请详细描述需求内容" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="来源联系人" name="source_contact">
          <Input placeholder="请输入联系人信息" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="预计周期(月)" name="estimated_duration_months">
          <Input type="number" placeholder="月数" min={0} />
        </Form.Item>
      </Col>
      <Col span={12}>
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
  )

  const renderTenQuestions = () => (
    <div>
      <p style={{ color: '#666', marginBottom: 16 }}>
        通过"客户需求十问"深入挖掘真实需求，过滤"伪需求"
      </p>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Form.Item
            label="1. 谁在意这个需求？"
            name={['customer_need_10q', 'q1_who_cares']}
          >
            <TextArea rows={2} placeholder="哪些人群关注这个需求？" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="2. 为什么在意？"
            name={['customer_need_10q', 'q2_why_care']}
          >
            <TextArea rows={2} placeholder="为什么这个需求重要？" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="3. 多久遇到一次？"
            name={['customer_need_10q', 'q3_how_often']}
          >
            <TextArea rows={2} placeholder="使用频率如何？" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="4. 现在怎么解决？"
            name={['customer_need_10q', 'q4_current_solution']}
          >
            <TextArea rows={2} placeholder="当前的解决方案是什么？" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="5. 痛点是什么？"
            name={['customer_need_10q', 'q5_pain_points']}
          >
            <TextArea rows={2} placeholder="当前方案存在哪些问题？" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="6. 期望结果是什么？"
            name={['customer_need_10q', 'q6_expected_outcome']}
          >
            <TextArea rows={2} placeholder="希望达成什么效果？" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="7. 价值/影响有多大？"
            name={['customer_need_10q', 'q7_value_impact']}
          >
            <TextArea rows={2} placeholder="对业务的影响程度？" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="8. 紧急程度如何？"
            name={['customer_need_10q', 'q8_urgency_level']}
          >
            <TextArea rows={2} placeholder="是否需要紧急处理？" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="9. 预算意愿？"
            name={['customer_need_10q', 'q9_budget_willingness']}
          >
            <TextArea rows={2} placeholder="客户愿意投入多少？" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="10. 还有其他方案吗？"
            name={['customer_need_10q', 'q10_alternative_solutions']}
          >
            <TextArea rows={2} placeholder="是否有替代方案？" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            label="补充说明"
            name={['customer_need_10q', 'additional_notes']}
          >
            <TextArea rows={2} placeholder="其他需要补充的内容" />
          </Form.Item>
        </Col>
      </Row>
    </div>
  )

  const renderAdditionalInfo = () => (
    <div>
      <p style={{ color: '#666', marginBottom: 16 }}>附加信息（可选）</p>
      <Form.Item label="备注说明">
        <TextArea rows={4} placeholder="其他需要说明的内容" />
      </Form.Item>
      <Form.Item label="附件上传">
        <Input type="file" multiple />
      </Form.Item>
    </div>
  )

  const renderConfirm = () => {
    // 获取所有字段值（包括已卸载的字段）
    const values = form.getFieldsValue(true)

    console.log('确认页数据:', values)

    const sourceMap: Record<string, string> = {
      customer: '客户',
      market: '市场',
      competition: '竞争',
      sales: '销售',
      after_sales: '售后',
      rd: '研发',
    }

    const complexityMap: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      very_high: '非常高',
    }

    return (
      <div>
        <Divider orientation="left">基本信息</Divider>
        <Descriptions title={values.title} bordered column={1}>
          <Descriptions.Item label="需求描述">
            {values.description || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="需求来源">
            {sourceMap[values.source_channel] || values.source_channel || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="来源联系人">
            {values.source_contact || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="预计周期">
            {values.estimated_duration_months
              ? `${values.estimated_duration_months} 个月`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="复杂度">
            {complexityMap[values.complexity_level || ''] || values.complexity_level || '-'}
          </Descriptions.Item>
        </Descriptions>

        {values.customer_need_10q && (
          <>
            <Divider orientation="left">客户需求十问</Divider>
            <Row gutter={[16, 16]}>
              {values.customer_need_10q.q1_who_cares && (
                <Col span={12}>
                  <Card size="small" title="谁在意？">
                    {values.customer_need_10q.q1_who_cares}
                  </Card>
                </Col>
              )}
              {values.customer_need_10q.q2_why_care && (
                <Col span={12}>
                  <Card size="small" title="为什么在意？">
                    {values.customer_need_10q.q2_why_care}
                  </Card>
                </Col>
              )}
              {values.customer_need_10q.q3_how_often && (
                <Col span={12}>
                  <Card size="small" title="多久遇到一次？">
                    {values.customer_need_10q.q3_how_often}
                  </Card>
                </Col>
              )}
              {values.customer_need_10q.q4_current_solution && (
                <Col span={12}>
                  <Card size="small" title="现在怎么解决？">
                    {values.customer_need_10q.q4_current_solution}
                  </Card>
                </Col>
              )}
              {values.customer_need_10q.q5_pain_points && (
                <Col span={12}>
                  <Card size="small" title="痛点是什么？">
                    {values.customer_need_10q.q5_pain_points}
                  </Card>
                </Col>
              )}
              {values.customer_need_10q.q6_expected_outcome && (
                <Col span={12}>
                  <Card size="small" title="期望结果是什么？">
                    {values.customer_need_10q.q6_expected_outcome}
                  </Card>
                </Col>
              )}
            </Row>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <Card
        title="新建需求"
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
        }
      >
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} description={step.description} />
          ))}
        </Steps>

        <Form form={form} layout="vertical">
          <div style={{ minHeight: 400 }}>
            {currentStep === 0 && renderBasicInfo()}
            {currentStep === 1 && renderTenQuestions()}
            {currentStep === 2 && renderAdditionalInfo()}
            {currentStep === 3 && renderConfirm()}
          </div>

          <Divider />

          <Space style={{ float: 'right' }}>
            {currentStep > 0 && currentStep < 3 && (
              <Button onClick={prev}>上一步</Button>
            )}
            {currentStep < 3 && (
              <Button type="primary" onClick={next} icon={<ArrowRightOutlined />}>
                下一步
              </Button>
            )}
            {currentStep === 3 && (
              <>
                <Button onClick={() => setCurrentStep(0)}>重新填写</Button>
                <Button
                  type="primary"
                  onClick={onFinish}
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  提交需求
                </Button>
              </>
            )}
          </Space>
        </Form>
      </Card>
    </div>
  )
}

export default RequirementCreatePage

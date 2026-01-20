import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Form, Input, Button, Select, Space, Row, Col, Checkbox, Spin, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import api from '@/services/api'
import { VoiceInputTextArea } from '@/components/VoiceInputTextArea'

const { TextArea } = Input

export function RequirementEditPage() {
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
                            <span style={{ color: 'red' }}>Must Have</span>
                            <span>必须有 - 核心功能，必须交付</span>
                          </Space>
                        ),
                        value: 'must_have'
                      },
                      {
                        label: (
                          <Space>
                            <span style={{ color: 'orange' }}>Should Have</span>
                            <span>应该有 - 重要但非核心</span>
                          </Space>
                        ),
                        value: 'should_have'
                      },
                      {
                        label: (
                          <Space>
                            <span style={{ color: 'blue' }}>Could Have</span>
                            <span>可以有 - 有了更好</span>
                          </Space>
                        ),
                        value: 'could_have'
                      },
                      {
                        label: (
                          <Space>
                            <span style={{ color: '#999' }}>Won't Have</span>
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

import React from 'react'
import { Form, Input, Select, Button, Card, Row, Col, Space } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import type { IPDTenQuestions } from '@/types/ipd'

const { TextArea } = Input
const { Option } = Select

interface IPDQuestionnaireFormProps {
  onSubmit: (data: IPDTenQuestions) => void
  loading?: boolean
  initialValues?: Partial<IPDTenQuestions>
}

/**
 * IPD 需求十问表单组件
 */
export const IPDQuestionnaireForm: React.FC<IPDQuestionnaireFormProps> = ({
  onSubmit,
  loading = false,
  initialValues,
}) => {
  const [form] = Form.useForm<IPDTenQuestions>()

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values)
    })
  }

  return (
    <Card
      title="📋 IPD 需求十问"
      bordered={false}
      style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)' }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        autoComplete="off"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span>
                  <span style={{ color: '#1890ff', fontWeight: 600 }}>1. </span>
                  谁关心这个需求？
                  <span style={{ color: '#ff4d4f' }}> *</span>
                </span>
              }
              name="q1_who"
              rules={[{ required: true, message: '请输入关心需求的角色' }]}
              tooltip="用户角色、部门、职位"
            >
              <Input placeholder="例如：产品经理、销售总监、客服团队" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={
                <span>
                  <span style={{ color: '#1890ff', fontWeight: 600 }}>2. </span>
                  为什么关心？
                  <span style={{ color: '#ff4d4f' }}> *</span>
                </span>
              }
              name="q2_why"
              rules={[{ required: true, message: '请输入关心原因' }]}
              tooltip="动机、背景、KPI压力"
            >
              <Input placeholder="例如：提升转化率、降低客诉率、完成季度KPI" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span>
                  <span style={{ color: '#1890ff', fontWeight: 600 }}>3. </span>
                  什么问题？
                  <span style={{ color: '#ff4d4f' }}> *</span>
                </span>
              }
              name="q3_what_problem"
              rules={[{ required: true, message: '请描述具体问题' }]}
              tooltip="具体痛点、困扰"
            >
              <TextArea
                rows={3}
                placeholder="例如：用户经常在结账时遇到支付失败，导致订单流失"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={
                <span>
                  <span style={{ color: '#1890ff', fontWeight: 600 }}>4. </span>
                  当前怎么解决的？
                </span>
              }
              name="q4_current_solution"
              tooltip="现有方案、工作流程"
            >
              <TextArea
                rows={3}
                placeholder="例如：手动导出订单，联系客服处理，或重新下单"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span>
                  <span style={{ color: '#1890ff', fontWeight: 600 }}>5. </span>
                  有什么问题？
                </span>
              }
              name="q5_current_issues"
              tooltip="现有方案的不足"
            >
              <TextArea
                rows={3}
                placeholder="例如：处理效率低、用户体验差、重复下单造成库存问题"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={
                <span>
                  <span style={{ color: '#1890ff', fontWeight: 600 }}>6. </span>
                  理想方案是什么？
                  <span style={{ color: '#ff4d4f' }}> *</span>
                </span>
              }
              name="q6_ideal_solution"
              rules={[{ required: true, message: '请描述理想方案' }]}
              tooltip="期望的解决方案"
            >
              <TextArea
                rows={3}
                placeholder="例如：系统自动检测支付失败，引导用户重试或选择其他支付方式"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span>
                  <span style={{ color: '#1890ff', fontWeight: 600 }}>7. </span>
                  优先级？
                  <span style={{ color: '#ff4d4f' }}> *</span>
                </span>
              }
              name="q7_priority"
              rules={[{ required: true, message: '请选择优先级' }]}
              tooltip="紧急程度、重要性"
            >
              <Select placeholder="请选择优先级">
                <Option value="high">高 - 紧急且重要</Option>
                <Option value="medium">中 - 重要但不紧急</Option>
                <Option value="low">低 - 可延后处理</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={
                <span>
                  <span style={{ color: '#1890ff', fontWeight: 600 }}>8. </span>
                  频次？
                  <span style={{ color: '#ff4d4f' }}> *</span>
                </span>
              }
              name="q8_frequency"
              rules={[{ required: true, message: '请选择问题出现频次' }]}
              tooltip="问题出现的频率"
            >
              <Select placeholder="请选择频次">
                <Option value="daily">每天</Option>
                <Option value="weekly">每周</Option>
                <Option value="monthly">每月</Option>
                <Option value="occasional">偶尔</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span>
                  <span style={{ color: '#1890ff', fontWeight: 600 }}>9. </span>
                  影响范围？
                </span>
              }
              name="q9_impact_scope"
              tooltip="涉及多少人、多少业务"
            >
              <Input placeholder="例如：涉及全部线上用户，每日约1000个订单" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={
                <span>
                  <span style={{ color: '#1890ff', fontWeight: 600 }}>10. </span>
                  价值衡量？
                </span>
              }
              name="q10_value"
              tooltip="可量化的收益"
            >
              <Input placeholder="例如：预计可提升订单成功率15%，减少客诉20%" />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={handleSubmit}
            loading={loading}
          >
            生成用户故事
          </Button>
        </div>
      </Form>
    </Card>
  )
}

export default IPDQuestionnaireForm

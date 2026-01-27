import { useEffect } from 'react'
import { Form, Spin, Slider, Input, Button, Row, Col, Tag, Space, Statistic, Card, message } from 'antd'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useAppealsAnalysis } from '../hooks/useAppealsAnalysis'

const { TextArea } = Input

/**
 * APPEALS评估表单组件
 * 包含8个维度的评分、权重、注释和雷达图可视化
 */
export function APPEALSForm({ requirementId }: { requirementId: number }) {
  const [form] = Form.useForm()
  const {
    appealsDimensions,
    formValues,
    loading,
    saving,
    setFormValues,
    setRefresh,
    saveAppealsAnalysis,
    resetFormValues,
    generateRandomWeights,
    normalizeWeights,
    calculateTotalScore,
    getRadarChartData,
  } = useAppealsAnalysis(requirementId)

  // 当 formValues 变化时，更新表单
  useEffect(() => {
    form.setFieldsValue(formValues)
  }, [formValues, form])

  const handleWeightChange = (key: string, value: number) => {
    const values = form.getFieldsValue()
    const normalizedWeights = normalizeWeights(key, value, values)
    const newFormValues: any = {}
    appealsDimensions.forEach((dim) => {
      newFormValues[`${dim.key}_weight`] = normalizedWeights[dim.key]
    })
    form.setFieldsValue(newFormValues)
    setFormValues({ ...formValues, ...newFormValues })
    setRefresh((prev) => prev + 1)
  }

  const handleRandomWeights = () => {
    const normalizedWeights = generateRandomWeights()
    const newFormValues: any = {}
    appealsDimensions.forEach((dim) => {
      newFormValues[`${dim.key}_weight`] = normalizedWeights[dim.key]
    })
    form.setFieldsValue(newFormValues)
    setFormValues({ ...formValues, ...newFormValues })
    setRefresh((prev) => prev + 1)
    message.success('已生成随机权重，总和为1')
  }

  const handleReset = () => {
    resetFormValues()
    message.info('已重置表单')
  }

  const handleSave = async (values: any) => {
    await saveAppealsAnalysis(values)
  }

  const handleValuesChange = (changedValues: any, allValues: any) => {
    // 同步更新 formValues，确保雷达图和总分数实时更新
    setFormValues({ ...formValues, ...allValues })
    setRefresh((prev) => prev + 1)
  }

  return (
    <Spin spinning={loading}>
      <Form form={form} layout="vertical" onFinish={handleSave} onValuesChange={handleValuesChange}>
        <Row gutter={[16, 16]}>
          {appealsDimensions.map((dim) => (
            <Col span={12} key={dim.key}>
              <Card
                title={
                  <Space>
                    <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>
                      {dim.icon}
                    </Tag>
                    <span>{dim.label}</span>
                  </Space>
                }
                size="small"
              >
                <p style={{ color: '#666', marginBottom: 16, fontSize: 12 }}>{dim.description}</p>

                <Form.Item
                  name={`${dim.key}_score`}
                  label="评分 (1-10)"
                  initialValue={5}
                  rules={[{ required: true, message: '请评分' }]}
                >
                  <Slider min={1} max={10} marks={{ 1: '1', 5: '5', 10: '10' }} />
                </Form.Item>

                <Form.Item
                  name={`${dim.key}_weight`}
                  label={
                    <Space>
                      权重
                      <Tag color="blue">
                        总总:{' '}
                        {(() => {
                          const values = form.getFieldsValue()
                          let total = 0
                          appealsDimensions.forEach((d) => {
                            total += parseFloat(values[`${d.key}_weight`] || d.defaultWeight)
                          })
                          return total.toFixed(2)
                        })()}
                      </Tag>
                    </Space>
                  }
                  initialValue={dim.defaultWeight}
                  rules={[{ required: true, message: '请设置权重' }]}
                >
                  <Input
                    type="number"
                    step={0.01}
                    min={0}
                    max={1}
                    addonAfter="×"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      if (!isNaN(value) && value >= 0 && value <= 1) {
                        handleWeightChange(dim.key, value)
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item name={`${dim.key}_comment`} label="评分说明" initialValue="">
                  <TextArea rows={2} placeholder="请输入评分说明" />
                </Form.Item>
              </Card>
            </Col>
          ))}
        </Row>

        <Card style={{ marginTop: 24 }} title="$APPEALS 雷达图">
          <Row gutter={16} align="middle">
            <Col span={12}>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={getRadarChartData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} />
                  <Radar name="评分" dataKey="score" stroke="#1890ff" fill="#1890ff" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Col>
            <Col span={12}>
              <div style={{ textAlign: 'center' }}>
                <Statistic
                  title="加权总分"
                  value={calculateTotalScore()}
                  suffix="/ 100"
                  valueStyle={{ color: '#1890ff', fontSize: 48, fontWeight: 'bold' }}
                />
                <div style={{ marginTop: 24 }}>
                  <Space size="middle">
                    <Button type="primary" htmlType="submit" loading={saving} size="large">
                      保存分析
                    </Button>
                    <Button onClick={handleReset} size="large">
                      重置
                    </Button>
                    <Button onClick={handleRandomWeights} size="large" style={{ borderColor: '#1890ff', color: '#1890ff' }}>
                      随机权重
                    </Button>
                  </Space>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Form>
    </Spin>
  )
}

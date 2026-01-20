import { useState, useEffect } from 'react'
import { Card, Form, Select, Space, Slider, Input, Button, message, Spin, Row, Col, Tag, Statistic } from 'antd'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import api from '@/services/api'

const { TextArea } = Input

export function AnalyticsPage() {
  const [requirements, setRequirements] = useState<any[]>([])
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [form] = Form.useForm()

  // Generate random weights that sum to 1
  const generateRandomWeights = () => {
    const keys = ['price', 'availability', 'packaging', 'performance', 'ease_of_use', 'assurance', 'lifecycle_cost', 'social_acceptance']
    const randomValues = keys.map(() => Math.random())
    const sum = randomValues.reduce((a, b) => a + b, 0)
    const normalizedWeights: any = {}
    keys.forEach((key, index) => {
      normalizedWeights[key] = Math.round((randomValues[index] / sum) * 100) / 100
    })

    // Set form values
    const formValues: any = {}
    appealsDimensions.forEach(dim => {
      formValues[`${dim.key}_weight`] = normalizedWeights[dim.key]
    })
    form.setFieldsValue(formValues)
    setRefresh(refresh + 1)
    message.success('已生成随机权重，总和为1')
  }

  // APPEALS dimensions with normalized weights
  const appealsDimensions = [
    { key: 'price', label: '价格/成本', icon: '$', defaultWeight: 0.15, description: '产品或服务的价格竞争力' },
    { key: 'availability', label: '可获得性', icon: 'A', defaultWeight: 0.10, description: '产品获取的难易程度' },
    { key: 'packaging', label: '包装/外观', icon: 'P', defaultWeight: 0.05, description: '产品外观和包装设计' },
    { key: 'performance', label: '性能', icon: 'P', defaultWeight: 0.25, description: '产品功能的性能表现' },
    { key: 'ease_of_use', label: '易用性', icon: 'E', defaultWeight: 0.15, description: '产品使用的便捷程度' },
    { key: 'assurance', label: '保证/可靠性', icon: 'A', defaultWeight: 0.15, description: '产品质量和可靠性保证' },
    { key: 'lifecycle_cost', label: '生命周期成本', icon: 'L', defaultWeight: 0.10, description: '使用和维护的总成本' },
    { key: 'social_acceptance', label: '社会接受度', icon: 'S', defaultWeight: 0.05, description: '社会认可和接受程度' },
  ]

  // Normalize weights to sum to 1
  const normalizeWeights = (changedKey: string, changedValue: number) => {
    const values = form.getFieldsValue()
    const currentWeights: any = {}

    appealsDimensions.forEach(dim => {
      currentWeights[dim.key] = parseFloat(values[`${dim.key}_weight`]) || dim.defaultWeight
    })

    // Set the changed weight
    currentWeights[changedKey] = changedValue

    // Calculate sum of all weights except the changed one
    let otherSum = 0
    appealsDimensions.forEach(dim => {
      if (dim.key !== changedKey) {
        otherSum += currentWeights[dim.key]
      }
    })

    // Normalize other weights to make total = 1
    const remaining = 1 - changedValue
    if (remaining > 0 && otherSum > 0) {
      appealsDimensions.forEach(dim => {
        if (dim.key !== changedKey) {
          const proportion = currentWeights[dim.key] / otherSum
          currentWeights[dim.key] = Math.round(proportion * remaining * 100) / 100
        }
      })
    }

    return currentWeights
  }

  const handleWeightChange = (key: string, value: number) => {
    const normalizedWeights = normalizeWeights(key, value)
    const formValues: any = {}
    appealsDimensions.forEach(dim => {
      formValues[`${dim.key}_weight`] = normalizedWeights[dim.key]
    })
    form.setFieldsValue(formValues)
    setRefresh(refresh + 1)
  }

  // Load requirements list
  useEffect(() => {
    async function fetchRequirements() {
      try {
        const response = await api.get('/requirements') as any
        const items = response?.data?.items || []
        setRequirements(items)
      } catch (error) {
        console.error('Failed to fetch requirements:', error)
      }
    }
    fetchRequirements()
  }, [])

  // Load APPEALS analysis when requirement is selected
  useEffect(() => {
    if (selectedReqId) {
      loadAppealsAnalysis(selectedReqId)
    }
  }, [selectedReqId])

  const loadAppealsAnalysis = async (reqId: number) => {
    setLoading(true)
    try {
      const response = await api.get(`/requirements/${reqId}/appeals`) as any
      const data = response?.data
      console.log('Loaded APPEALS data:', data)

      if (data && data.dimensions) {
        // Populate form with existing data
        const formValues: any = {}
        Object.keys(data.dimensions).forEach(key => {
          formValues[`${key}_score`] = data.dimensions[key].score
          formValues[`${key}_weight`] = Number(data.dimensions[key].weight)
          formValues[`${key}_comment`] = data.dimensions[key].comment || ''
        })
        console.log('Setting form values:', formValues)
        form.setFieldsValue(formValues)
      } else {
        // Reset form with defaults
        resetForm()
      }
    } catch (error) {
      console.log('No existing analysis found, starting fresh', error)
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    const formValues: any = {}
    appealsDimensions.forEach(dim => {
      formValues[`${dim.key}_score`] = 5
      formValues[`${dim.key}_weight`] = dim.defaultWeight
      formValues[`${dim.key}_comment`] = ''
    })
    form.setFieldsValue(formValues)
  }

  const calculateTotalScore = () => {
    const values = form.getFieldsValue()
    let total = 0
    appealsDimensions.forEach(dim => {
      const score = values[`${dim.key}_score`] || 5
      const weight = values[`${dim.key}_weight`] || dim.defaultWeight
      total += score * weight
    })
    return (total * 10).toFixed(2)
  }

  const getRadarChartData = () => {
    const values = form.getFieldsValue()
    return appealsDimensions.map(dim => ({
      dimension: dim.label,
      fullMark: 10,
      score: values[`${dim.key}_score`] || 5,
      key: dim.key,
    }))
  }

  const handleSave = async (values: any) => {
    if (!selectedReqId) {
      message.warning('请先选择要分析的需求')
      return
    }

    setSaving(true)
    try {
      const dimensions: any = {}
      appealsDimensions.forEach(dim => {
        dimensions[dim.key] = {
          score: values[`${dim.key}_score`],
          weight: values[`${dim.key}_weight`],
          comment: values[`${dim.key}_comment`],
        }
      })

      await api.post(`/requirements/${selectedReqId}/appeals`, dimensions)
      message.success('保存成功')
    } catch (error: any) {
      console.error('Failed to save analysis:', error)
      message.error(error?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const selectedRequirement = requirements.find(r => r.id === selectedReqId)

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>需求分析 - $APPEALS 评估</h2>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label style={{ marginRight: 16, fontWeight: 'bold' }}>选择需求：</label>
            <Select
              style={{ width: 400 }}
              placeholder="请选择要分析的需求"
              value={selectedReqId}
              onChange={setSelectedReqId}
              showSearch
              optionFilterProp="children"
            >
              {requirements.map(req => (
                <Select.Option key={req.id} value={req.id}>
                  {req.requirement_no} - {req.title}
                </Select.Option>
              ))}
            </Select>
          </div>

          {selectedRequirement && (
            <div>
              <p><strong>需求标题：</strong>{selectedRequirement.title}</p>
              <p><strong>需求编号：</strong>{selectedRequirement.requirement_no}</p>
              <p><strong>需求描述：</strong>{selectedRequirement.description}</p>
            </div>
          )}
        </Space>
      </Card>

      {selectedReqId && (
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            onValuesChange={() => {
              // Trigger re-render to update total score display
              setRefresh(refresh + 1)
            }}
          >
            <Row gutter={[16, 16]}>
              {appealsDimensions.map(dim => (
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
                    <p style={{ color: '#666', marginBottom: 16, fontSize: 12 }}>
                      {dim.description}
                    </p>

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
                          <Tag color="blue">总和: {(() => {
                            const values = form.getFieldsValue()
                            let total = 0
                            appealsDimensions.forEach(d => {
                              total += parseFloat(values[`${d.key}_weight`] || d.defaultWeight)
                            })
                            return total.toFixed(2)
                          })()}</Tag>
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

                    <Form.Item
                      name={`${dim.key}_comment`}
                      label="评分说明"
                      initialValue=""
                    >
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
                      <Radar
                        name="评分"
                        dataKey="score"
                        stroke="#1890ff"
                        fill="#1890ff"
                        fillOpacity={0.6}
                      />
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
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={saving}
                          size="large"
                        >
                          保存分析
                        </Button>
                        <Button
                          onClick={() => {
                            resetForm()
                            message.info('已重置表单')
                          }}
                          size="large"
                        >
                          重置
                        </Button>
                        <Button
                          onClick={generateRandomWeights}
                          size="large"
                          style={{ borderColor: '#1890ff', color: '#1890ff' }}
                        >
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
      )}

      {!selectedReqId && (
        <Card>
          <p style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
            请从上方选择一个需求开始分析
          </p>
        </Card>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Form,
  Slider,
  Button,
  Space,
  Row,
  Col,
  InputNumber,
  Input,
  message,
  Descriptions,
  Statistic,
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  BarChartOutlined,
} from '@ant-design/icons'

// APPEALS 8个维度
const appealsDimensions = [
  {
    key: 'price',
    name: '价格',
    nameEn: 'Price',
    description: '产品/服务的价格竞争力',
  },
  {
    key: 'availability',
    name: '可获得性',
    nameEn: 'Availability',
    description: '产品/服务的可获得程度',
  },
  {
    key: 'packaging',
    name: '包装',
    nameEn: 'Packaging',
    description: '产品外观和包装设计',
  },
  {
    key: 'performance',
    name: '性能',
    nameEn: 'Performance',
    description: '产品功能和性能表现',
  },
  {
    key: 'ease_of_use',
    name: '易用性',
    nameEn: 'Ease of Use',
    description: '使用的便捷程度',
  },
  {
    key: 'assurance',
    name: '保证',
    nameEn: 'Assurance',
    description: '质量保证和售后服务',
  },
  {
    key: 'lifecycle_cost',
    name: '生命周期成本',
    nameEn: 'Lifecycle Cost',
    description: '总拥有成本',
  },
  {
    key: 'social_acceptance',
    name: '社会接受度',
    nameEn: 'Social Acceptance',
    description: '社会认可度和口碑',
  },
]

// 简单的雷达图组件
function RadarChart({ data }: { data: number[] }) {
  const size = 300
  const center = size / 2
  const radius = 100
  const angleStep = (Math.PI * 2) / data.length

  // 计算多边形顶点
  const points = data
    .map((value, index) => {
      const angle = angleStep * index - Math.PI / 2
      const r = (value / 10) * radius
      const x = center + r * Math.cos(angle)
      const y = center + r * Math.sin(angle)
      return `${x},${y}`
    })
    .join(' ')

  // 计算标签位置
  const labels = data.map((value, index) => {
    const angle = angleStep * index - Math.PI / 2
    const labelRadius = radius + 25
    const x = center + labelRadius * Math.cos(angle)
    const y = center + labelRadius * Math.sin(angle)
    return { x, y, text: appealsDimensions[index].name, value }
  })

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <svg width={size} height={size} style={{ margin: '0 auto' }}>
        {/* 背景网格 */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
          <polygon
            key={scale}
            points={
              data
                .map(
                  (_, index) => {
                    const angle = angleStep * index - Math.PI / 2
                    const r = radius * scale
                    const x = center + r * Math.cos(angle)
                    const y = center + r * Math.sin(angle)
                    return `${x},${y}`
                  }
                )
                .join(' ')
            }
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="1"
          />
        ))}

        {/* 数据区域 */}
        <polygon
          points={points}
          fill="rgba(24, 144, 255, 0.2)"
          stroke="#1890ff"
          strokeWidth="2"
        />

        {/* 标签 */}
        {labels.map((label, index) => (
          <text
            key={index}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fill="#666"
          >
            {label.text}
          </text>
        ))}

        {/* 分数标签 */}
        {labels.map((label, index) => {
          const angle = angleStep * index - Math.PI / 2
          const r = (data[index] / 10) * radius
          const x = center + r * Math.cos(angle)
          const y = center + r * Math.sin(angle)
          return (
            <text
              key={`score-${index}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="#1890ff"
              fontWeight="bold"
            >
              {data[index]}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

interface AppealsFormData {
  price_score: number
  price_weight: number
  price_comment?: string

  availability_score: number
  availability_weight: number
  availability_comment?: string

  packaging_score: number
  packaging_weight: number
  packaging_comment?: string

  performance_score: number
  performance_weight: number
  performance_comment?: string

  ease_of_use_score: number
  ease_of_use_weight: number
  ease_of_use_comment?: string

  assurance_score: number
  assurance_weight: number
  assurance_comment?: string

  lifecycle_cost_score: number
  lifecycle_cost_weight: number
  lifecycle_cost_comment?: string

  social_acceptance_score: number
  social_acceptance_weight: number
  social_acceptance_comment?: string
}

function AppealsAnalysisPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState<number[]>(new Array(8).fill(5))
  const [totalScore, setTotalScore] = useState(0)

  // 初始化默认值
  useEffect(() => {
    const initialValues: Partial<AppealsFormData> = {}
    appealsDimensions.forEach((dim) => {
      initialValues[`${dim.key}_score` as keyof AppealsFormData] = 5 as any
      initialValues[`${dim.key}_weight` as keyof AppealsFormData] = 0.5 as any
    })
    form.setFieldsValue(initialValues)
  }, [form])

  // 计算总分
  const calculateTotal = (values: AppealsFormData) => {
    let total = 0
    appealsDimensions.forEach((dim) => {
      const score = values[`${dim.key}_score` as keyof AppealsFormData] as number
      const weight = values[`${dim.key}_weight` as keyof AppealsFormData] as number
      total += score * weight
    })
    return total.toFixed(2)
  }

  // 当表单值变化时更新图表
  const onValuesChange = (changedValues: any, allValues: any) => {
    const newScores = appealsDimensions.map((dim) => {
      return allValues[`${dim.key}_score`] || 5
    })
    setScores(newScores)

    const total = calculateTotal(allValues)
    setTotalScore(parseFloat(total))
  }

  const onFinish = async (values: AppealsFormData) => {
    setLoading(true)
    try {
      console.log('Save APPEALS analysis:', id, values)
      // TODO: 调用API保存分析结果
      await new Promise((resolve) => setTimeout(resolve, 1000))
      message.success('APPEALS分析保存成功')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card
        title="APPEALS分析"
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
        }
      >
        <Row gutter={24}>
          {/* 左侧：评分表单 */}
          <Col span={14}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onValuesChange={onValuesChange}
            >
              {appealsDimensions.map((dim, index) => (
                <Card
                  key={dim.key}
                  type="inner"
                  title={`${index + 1}. ${dim.name} (${dim.nameEn})`}
                  size="small"
                  style={{ marginBottom: 16 }}
                >
                  <p style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>
                    {dim.description}
                  </p>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="评分 (1-10)"
                        name={`${dim.key}_score`}
                        rules={[{ required: true, message: '请评分' }]}
                      >
                        <Slider min={1} max={10} marks={{ 1: '1', 5: '5', 10: '10' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="权重 (0.1-1.0)" name={`${dim.key}_weight`}>
                        <InputNumber min={0.1} max={1} step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="得分" style={{ marginBottom: 0 }}>
                        <Statistic
                          value={(scores[index] * (form.getFieldValue(`${dim.key}_weight`) || 0.5)).toFixed(1)}
                          precision={1}
                          valueStyle={{ fontSize: 18, color: '#1890ff' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name={`${dim.key}_comment`} label="说明" style={{ marginBottom: 0 }}>
                    <Input.TextArea rows={1} placeholder="请说明评分理由" />
                  </Form.Item>
                </Card>
              ))}

              <Form.Item style={{ marginTop: 24 }}>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                    保存分析
                  </Button>
                  <Button onClick={() => navigate(-1)}>取消</Button>
                </Space>
              </Form.Item>
            </Form>
          </Col>

          {/* 右侧：可视化 */}
          <Col span={10}>
            <Card title="分析结果" extra={<BarChartOutlined />}>
              <RadarChart data={scores} />

              <Descriptions
                title="总分统计"
                bordered
                column={1}
                size="small"
                style={{ marginTop: 24 }}
              >
                <Descriptions.Item label="加权总分">
                  <Statistic
                    value={totalScore}
                    precision={2}
                    valueStyle={{
                      color: totalScore >= 30 ? '#ff4d4f' : totalScore >= 20 ? '#faad14' : '#52c41a',
                    }}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="平均分">
                  <Statistic
                    value={(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}
                    precision={1}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="最高分维度">
                  {
                    appealsDimensions[
                      scores.indexOf(Math.max(...scores))
                    ].name
                  }
                </Descriptions.Item>
                <Descriptions.Item label="最低分维度">
                  {
                    appealsDimensions[
                      scores.indexOf(Math.min(...scores))
                    ].name
                  }
                </Descriptions.Item>
              </Descriptions>

              <Card
                type="inner"
                title="评分说明"
                size="small"
                style={{ marginTop: 16 }}
              >
                <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
                  <li>评分范围：1-10分，1分最低，10分最高</li>
                  <li>权重范围：0.1-1.0，表示该维度的重要程度</li>
                  <li>加权得分 = 评分 × 权重</li>
                  <li>总分 = 所有维度加权得分之和</li>
                </ul>
              </Card>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default AppealsAnalysisPage

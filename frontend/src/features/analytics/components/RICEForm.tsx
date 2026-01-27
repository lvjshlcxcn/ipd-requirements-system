import { Card, Form, Slider, Input, Button, Row, Col, Statistic, Space, Spin, message } from 'antd'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useRICEAnalysis } from '../hooks/useRICEAnalysis'

const { TextArea } = Input

/**
 * RICE维度配置
 */
const RICE_DIMENSIONS = [
  { key: 'reach', label: 'Reach (影响范围)', description: '有多少用户会受到影响', color: '#8884d8' },
  { key: 'impact', label: 'Impact (影响程度)', description: '对用户的影响有多大', color: '#82ca9d' },
  { key: 'confidence', label: 'Confidence (信心程度)', description: '对评估的信心有多大', color: '#ffc658' },
  { key: 'effort', label: 'Effort (所需努力)', description: '实现需要多少工作量', color: '#ff7300' },
]

/**
 * RICE评分表单组件
 * 包含4个维度的评分和柱状图可视化
 */
export function RICEForm({ requirementId }: { requirementId: number }) {
  const { riceData, loading, saving, updateRiceData, saveRICEAnalysis, resetRICEData, calculateRICEScore } =
    useRICEAnalysis(requirementId)

  const handleSave = async () => {
    const success = await saveRICEAnalysis(riceData)
    if (success) {
      message.success('RICE分析保存成功')
    }
  }

  const handleReset = () => {
    resetRICEData()
    message.info('已重置表单')
  }

  const riceScore = calculateRICEScore(riceData)

  // 准备柱状图数据
  const chartData = RICE_DIMENSIONS.map((dim) => ({
    name: dim.label.split(' ')[0],
      评分: riceData[dim.key as keyof typeof riceData] as number,
    }))

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        {RICE_DIMENSIONS.map((dim) => (
          <Col span={12} key={dim.key}>
            <Card title={<span style={{ color: dim.color }}>{dim.label}</span>} size="small">
              <p style={{ color: '#666', marginBottom: 16, fontSize: 12 }}>{dim.description}</p>

              <Form layout="vertical">
                <Form.Item label="评分 (1-10)">
                  <Slider
                    min={1}
                    max={10}
                    marks={{ 1: '1', 5: '5', 10: '10' }}
                    value={riceData[dim.key as keyof typeof riceData] as number}
                    onChange={(value) => updateRiceData(dim.key as keyof typeof riceData, value)}
                  />
                </Form.Item>
              </Form>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 24 }} title="RICE评分结果">
        <Row gutter={16} align="middle">
          <Col span={12}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Statistic
                title="RICE评分"
                value={riceScore}
                valueStyle={{ color: '#1890ff', fontSize: 48, fontWeight: 'bold' }}
              />
              <div style={{ marginTop: 16, color: '#666', fontSize: 14 }}>
                公式：(R × I × C) / E = ({riceData.reach} × {riceData.impact} × {riceData.confidence}) / {riceData.effort} = {riceScore}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="评分" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Col>
          <Col span={12}>
            <Form layout="vertical">
              <Form.Item label="备注说明">
                <TextArea
                  rows={8}
                  placeholder="请输入RICE分析的备注说明"
                  value={riceData.notes}
                  onChange={(e) => updateRiceData('notes', e.target.value)}
                />
              </Form.Item>

              <Form.Item>
                <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
                  <Button type="primary" onClick={handleSave} loading={saving} size="large">
                    保存分析
                  </Button>
                  <Button onClick={handleReset} size="large">
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>
    </Spin>
  )
}

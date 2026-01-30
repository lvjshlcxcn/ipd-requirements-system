import { Card, Form, Button, Space, Statistic, Row, Col, Slider, InputNumber, Spin, message } from 'antd'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts'
import { useINVESTAnalysis } from '../hooks/useINVESTAnalysis'

/**
 * INVEST分析表单组件 - 评分系统
 * 包含6个维度的 Slider 评分 + 雷达图可视化
 */
export function INVESTForm({ requirementId }: { requirementId: number }) {
  const {
    investData,
    loading,
    saving,
    updateInvestData,
    saveINVESTAnalysis,
    resetINVESTData,
    calculateTotalScore,
    calculateAverageScore,
    getRadarChartData,
    INVEST_DIMENSIONS,
  } = useINVESTAnalysis(requirementId)

  const handleSave = async () => {
    const success = await saveINVESTAnalysis(investData)
    if (success) {
      message.success('INVEST分析保存成功')
    }
  }

  const handleReset = () => {
    resetINVESTData()
    message.info('已重置表单')
  }

  const totalScore = calculateTotalScore()
  const averageScore = parseFloat(calculateAverageScore())
  const radarData = getRadarChartData()

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="INVEST 评分分析">
          {/* 6个维度评分器 - 两栏布局 */}
          <Row gutter={[16, 16]}>
            {INVEST_DIMENSIONS.map((dim) => (
              <Col span={12} key={dim.key}>
                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <strong>{dim.label}</strong>
                      <span style={{ color: '#999' }}>({investData[dim.key]}分)</span>
                    </Space>
                    <p style={{ color: '#666', fontSize: 12, margin: 0 }}>{dim.description}</p>

                    <Row gutter={8} align="middle">
                      <Col span={16}>
                        <Slider
                          min={0}
                          max={100}
                          value={investData[dim.key]}
                          onChange={(value) => updateInvestData(dim.key, value)}
                          marks={{ 0: '0', 50: '50', 100: '100' }}
                        />
                      </Col>
                      <Col span={8}>
                        <InputNumber
                          min={0}
                          max={100}
                          style={{ width: '100%' }}
                          value={investData[dim.key]}
                          onChange={(value) => updateInvestData(dim.key, value || 0)}
                        />
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 雷达图 + 统计信息 */}
        <Card title="INVEST 雷达图">
          <Row gutter={16} align="middle">
            <Col span={12}>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
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
              <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
                <Statistic
                  title="总分"
                  value={totalScore}
                  suffix="/ 600"
                  valueStyle={{ color: '#1890ff', fontSize: 48, fontWeight: 'bold' }}
                />
                <Statistic
                  title="平均分"
                  value={averageScore}
                  precision={2}
                  valueStyle={{
                    color: averageScore >= 80 ? '#52c41a' :
                           averageScore >= 60 ? '#1890ff' : '#faad14',
                    fontSize: 36
                  }}
                />
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 备注和操作按钮 */}
        <Card title="备注说明">
          <Form layout="vertical">
            <Form.Item label="请输入INVEST分析的备注说明">
              <textarea
                rows={3}
                placeholder="请输入INVEST分析的备注说明"
                value={investData.notes}
                onChange={(e) => updateInvestData('notes', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
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
        </Card>
      </Space>
    </Spin>
  )
}

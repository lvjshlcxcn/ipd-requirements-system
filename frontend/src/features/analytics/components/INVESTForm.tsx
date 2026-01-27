import { Card, Form, Checkbox, Button, Space, Statistic, Progress, Spin, message } from 'antd'
import { useINVESTAnalysis } from '../hooks/useINVESTAnalysis'

/**
 * INVEST维度配置
 */
const INVEST_DIMENSIONS = [
  { key: 'independent', label: '独立', description: '可以在不依赖其他功能的情况下实现' },
  { key: 'negotiable', label: '可协商', description: '可以与相关方协商修改' },
  { key: 'valuable', label: '有价值', description: '为用户或业务提供可衡量的价值' },
  { key: 'estimable', label: '可估算', description: '可以合理估算所需的工作量' },
  { key: 'small', label: '小型', description: '规模适中，可以在短周期内完成' },
  { key: 'testable', label: '可测试', description: '可以通过测试验证实现是否正确' },
]

/**
 * INVEST分析表单组件
 * 包含6个维度的复选框和通过率统计
 */
export function INVESTForm({ requirementId }: { requirementId: number }) {
  const {
    investData,
    loading,
    saving,
    updateInvestData,
    saveINVESTAnalysis,
    resetINVESTData,
    calculatePassedCount,
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

  const passedCount = calculatePassedCount(investData)
  const percentage = Math.round((passedCount / 6) * 100)

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 6个维度复选框 */}
        {INVEST_DIMENSIONS.map((dim) => (
          <Card key={dim.key} size="small">
            <Checkbox
              checked={investData[dim.key as keyof typeof investData] as boolean}
              onChange={(e) => updateInvestData(dim.key as keyof typeof investData, e.target.checked)}
            >
              <Space direction="vertical" size={0}>
                <strong>{dim.label}</strong>
                <span style={{ color: '#666', fontSize: 12 }}>{dim.description}</span>
              </Space>
            </Checkbox>
          </Card>
        ))}

        {/* 通过率统计 */}
        <Card title="通过率统计" size="small" style={{ backgroundColor: '#fafafa' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Statistic
              title="通过数量"
              value={passedCount}
              suffix="/ 6"
              valueStyle={{
                color: percentage >= 83 ? '#52c41a' : percentage >= 50 ? '#1890ff' : '#faad14'
              }}
            />
            <Progress
              percent={percentage}
              strokeColor={percentage >= 83 ? '#52c41a' : percentage >= 50 ? '#1890ff' : '#faad14'}
            />
          </Space>
        </Card>

        {/* 备注输入 */}
        <Card title="备注说明" size="small">
          <Form layout="vertical">
            <Form.Item>
              <textarea
                rows={4}
                placeholder="请输入INVEST分析的备注说明"
                value={investData.notes}
                onChange={(e) => updateInvestData('notes', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
              />
            </Form.Item>

            {/* 操作按钮 */}
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

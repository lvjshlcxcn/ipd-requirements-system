import React from 'react'
import { Checkbox, Form, InputNumber, Space, Typography } from 'antd'
import { INVESTAnalysis } from '@/services/analysis.service'

const { Title, Text } = Typography

interface INVESTScoreProps {
  value?: INVESTAnalysis
  onChange?: (value: INVESTAnalysis) => void
  disabled?: boolean
}

export const INVESTScore: React.FC<INVESTScoreProps> = ({
  value = {
    independent: false,
    negotiable: false,
    valuable: false,
    estimable: false,
    small: false,
    testable: false,
  },
  onChange,
  disabled = false,
}) => {
  const handleChange = (field: keyof INVESTAnalysis, checked: boolean) => {
    const newValue = { ...value, [field]: checked }
    onChange?.(newValue)
  }

  return (
    <div style={{ padding: '16px' }}>
      <Title level={5}>INVEST 分析</Title>
      <Text type="secondary">
        评估需求的独立、可协商、有价值、可估算、小型、可测试性
      </Text>

      <Form layout="vertical" style={{ marginTop: '16px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Form.Item label="独立 (Independent) - 可以独立实现">
            <Checkbox
              checked={value.independent}
              onChange={(e) => handleChange('independent', e.target.checked)}
              disabled={disabled}
            >
              可以在不依赖其他功能的情况下实现
            </Checkbox>
          </Form.Item>

          <Form.Item label="可协商 (Negotiable) - 可以协商">
            <Checkbox
              checked={value.negotiable}
              onChange={(e) => handleChange('negotiable', e.target.checked)}
              disabled={disabled}
            >
              可以与相关方协商修改
            </Checkbox>
          </Form.Item>

          <Form.Item label="有价值 (Valuable) - 提供价值">
            <Checkbox
              checked={value.valuable}
              onChange={(e) => handleChange('valuable', e.target.checked)}
              disabled={disabled}
            >
              为用户或业务提供可衡量的价值
            </Checkbox>
          </Form.Item>

          <Form.Item label="可估算 (Estimable) - 可以估算工作量">
            <Checkbox
              checked={value.estimable}
              onChange={(e) => handleChange('estimable', e.target.checked)}
              disabled={disabled}
            >
              可以合理估算所需的工作量
            </Checkbox>
          </Form.Item>

          <Form.Item label="小型 (Small) - 小型">
            <Checkbox
              checked={value.small}
              onChange={(e) => handleChange('small', e.target.checked)}
              disabled={disabled}
            >
              规模适中，可以在短周期内完成
            </Checkbox>
          </Form.Item>

          <Form.Item label="可测试 (Testable) - 可测试">
            <Checkbox
              checked={value.testable}
              onChange={(e) => handleChange('testable', e.target.checked)}
              disabled={disabled}
            >
              可以通过测试验证实现是否正确
            </Checkbox>
          </Form.Item>
        </Space>
      </Form>
    </div>
  )
}

export default INVESTScore

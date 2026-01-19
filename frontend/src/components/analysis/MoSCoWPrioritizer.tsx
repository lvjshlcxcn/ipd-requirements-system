import React from 'react'
import { Radio, Space, Typography, Tag } from 'antd'
import { MoSCoWAnalysis } from '@/services/analysis.service'

const { Title, Text } = Typography

interface MoSCoWPrioritizerProps {
  value?: MoSCoWAnalysis
  onChange?: (value: MoSCoWAnalysis) => void
  disabled?: boolean
}

const MOSCOW_OPTIONS = [
  { value: 'must_have', label: '必须有 (Must Have)', color: 'red', description: '不可或缺的核心需求' },
  { value: 'should_have', label: '应该有 (Should Have)', color: 'orange', description: '重要但不紧急的需求' },
  { value: 'could_have', label: '可以有 (Could Have)', color: 'green', description: '有价值的但非必需的需求' },
  { value: 'wont_have', label: '本次不做 (Won\'t Have)', color: 'default', description: '明确不会在本次实现的需求' },
]

export const MoSCoWPrioritizer: React.FC<MoSCoWPrioritizerProps> = ({
  value = { priority: 'should_have' },
  onChange,
  disabled = false,
}) => {
  const handleChange = (priority: 'must_have' | 'should_have' | 'could_have' | 'wont_have') => {
    onChange?.({ ...value, priority })
  }

  return (
    <div style={{ padding: '16px' }}>
      <Title level={5}>MoSCoW 优先级</Title>
      <Text type="secondary">基于价值与紧急程度的优先级分类</Text>

      <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: '16px' }}>
        {MOSCOW_OPTIONS.map((option) => (
          <div key={option.value} style={{ marginBottom: '12px' }}>
            <Radio
              checked={value.priority === option.value}
              onChange={() => handleChange(option.value)}
              disabled={disabled}
            >
              <Space>
                <span style={{ fontWeight: 'bold' }}>{option.label}</span>
                <Tag color={option.color}>{option.value}</Tag>
              </Space>
            </Radio>
            <div style={{ marginLeft: '24px', marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {option.description}
              </Text>
            </div>
          </div>
        ))}
      </Space>
    </div>
  )
}

export default MoSCoWPrioritizer

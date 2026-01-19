import React from 'react'
import { Slider, Space, Typography, Card, Statistic } from 'antd'
import { RICEAnalysis } from '@/services/analysis.service'

const { Title, Text } = Typography

interface RICEScoreProps {
  value?: RICEAnalysis
  onChange?: (value: RICEAnalysis) => void
  disabled?: boolean
}

export const RICEScore: React.FC<RICEScoreProps> = ({
  value = { reach: 5, impact: 5, confidence: 5, effort: 5 },
  onChange,
  disabled = false,
}) => {
  const handleChange = (field: keyof RICEAnalysis, numberValue: number) => {
    const newValue = { ...value, [field]: numberValue }
    onChange?.(newValue)
  }

  const score = (value.reach * value.impact * value.confidence) / value.effort

  return (
    <div style={{ padding: '16px' }}>
      <Title level={5}>RICE 评分</Title>
      <Text type="secondary">基于触达范围、影响程度、信心水平和所需工作量的评分模型</Text>

      <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '16px' }}>
        <div>
          <Text strong>触达范围 (Reach) - {value.reach}</Text>
          <Text type="secondary" style={{ marginLeft: '8px' }}>
            受影响的用户数量 (1-10)
          </Text>
          <Slider
            min={1}
            max={10}
            value={value.reach}
            onChange={(val) => handleChange('reach', val)}
            disabled={disabled}
            style={{ marginTop: '8px' }}
          />
        </div>

        <div>
          <Text strong>影响程度 (Impact) - {value.impact}</Text>
          <Text type="secondary" style={{ marginLeft: '8px' }}>
            对用户或业务的影响 (1-10)
          </Text>
          <Slider
            min={1}
            max={10}
            value={value.impact}
            onChange={(val) => handleChange('impact', val)}
            disabled={disabled}
            style={{ marginTop: '8px' }}
          />
        </div>

        <div>
          <Text strong>信心水平 (Confidence) - {value.confidence}</Text>
          <Text type="secondary" style={{ marginLeft: '8px' }}>
            对评估的信心 (1-10)
          </Text>
          <Slider
            min={1}
            max={10}
            value={value.confidence}
            onChange={(val) => handleChange('confidence', val)}
            disabled={disabled}
            style={{ marginTop: '8px' }}
          />
        </div>

        <div>
          <Text strong>所需工作量 (Effort) - {value.effort}</Text>
          <Text type="secondary" style={{ marginLeft: '8px' }}>
            实施所需的工作量 (1-10)
          </Text>
          <Slider
            min={1}
            max={10}
            value={value.effort}
            onChange={(val) => handleChange('effort', val)}
            disabled={disabled}
            style={{ marginTop: '8px' }}
          />
        </div>
      </Space>

      <Card style={{ marginTop: '24px', textAlign: 'center' }}>
        <Statistic
          title="RICE 分数"
          value={score.toFixed(2)}
          precision={2}
          valueStyle={{ color: '#3f8600', fontSize: '24px', fontWeight: 'bold' }}
        />
        <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
          (Reach × Impact × Confidence) / Effort
        </Text>
      </Card>
    </div>
  )
}

export default RICEScore

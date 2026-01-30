import React, { useEffect, useRef, useState } from 'react'
import {
  Card,
  Col,
  Row,
  Slider,
  Statistic,
  Button,
  Space,
  Typography,
  Tag,
  Divider,
  Alert,
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import type { INVESTScoreData, INVESTAnalysis } from '@/types/ipd'

const { Title, Text } = Typography

interface INVESTAnalysisPanelProps {
  onSave?: (scores: INVESTScoreData) => void
  onExport?: () => void
  onBack?: () => void
  initialScores?: INVESTScoreData
  loading?: boolean
}

interface INVESTDimension {
  key: keyof INVESTScoreData
  label: string
  name: string
  description: string
}

/**
 * INVEST 分析面板组件
 */
export const INVESTAnalysisPanel: React.FC<INVESTAnalysisPanelProps> = ({
  onSave,
  onExport,
  onBack,
  initialScores,
  loading = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scores, setScores] = useState<INVESTScoreData>(
    initialScores || {
      independent: 70,
      negotiable: 70,
      valuable: 70,
      estimable: 70,
      small: 70,
      testable: 70,
    }
  )

  const dimensions: INVESTDimension[] = [
    {
      key: 'independent',
      label: 'I',
      name: '独立的',
      description: '可以独立实现，不依赖其他功能',
    },
    {
      key: 'negotiable',
      label: 'N',
      name: '可协商的',
      description: '细节可以协商调整',
    },
    {
      key: 'valuable',
      label: 'V',
      name: '有价值的',
      description: '为用户或业务提供价值',
    },
    {
      key: 'estimable',
      label: 'E',
      name: '可估算的',
      description: '可以合理估算工作量',
    },
    {
      key: 'small',
      label: 'S',
      name: '小的',
      description: '规模适中，短周期可完成',
    },
    {
      key: 'testable',
      label: 'T',
      name: '可测试的',
      description: '有明确的验收标准',
    },
  ]

  // 计算总分
  const totalScore = Math.round(
    (scores.independent +
      scores.negotiable +
      scores.valuable +
      scores.estimable +
      scores.small +
      scores.testable) / 6
  )

  // 获取评分等级
  const getScoreLevel = (score: number): { text: string; color: string; class: string } => {
    if (score >= 85) {
      return {
        text: '优秀',
        color: '#52c41a',
        class: 'excellent',
      }
    }
    if (score >= 70) {
      return {
        text: '良好',
        color: '#faad14',
        class: 'good',
      }
    }
    return {
      text: '待改进',
      color: '#ff4d4f',
      class: 'poor',
    }
  }

  // 更新评分
  const handleScoreChange = (key: keyof INVESTScoreData, value: number) => {
    setScores((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // 绘制雷达图
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    const centerX = width / 2
    const centerY = height / 2
    const radius = 120

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    const angleStep = (Math.PI * 2) / dimensions.length

    // 绘制背景网格
    for (let i = 5; i >= 1; i--) {
      ctx.beginPath()
      const r = (radius / 5) * i
      for (let j = 0; j <= dimensions.length; j++) {
        const angle = angleStep * j - Math.PI / 2
        const x = centerX + r * Math.cos(angle)
        const y = centerY + r * Math.sin(angle)
        if (j === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.strokeStyle = '#f0f0f0'
      ctx.stroke()
    }

    // 绘制数据区域
    ctx.beginPath()
    dimensions.forEach((dim, index) => {
      const angle = angleStep * index - Math.PI / 2
      const value = scores[dim.key] / 100
      const r = radius * value
      const x = centerX + r * Math.cos(angle)
      const y = centerY + r * Math.sin(angle)

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.closePath()

    // 填充渐变
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, 'rgba(24, 144, 255, 0.1)')
    gradient.addColorStop(1, 'rgba(24, 144, 255, 0.3)')
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.strokeStyle = '#1890ff'
    ctx.lineWidth = 2
    ctx.stroke()

    // 绘制标签
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    dimensions.forEach((dim, index) => {
      const angle = angleStep * index - Math.PI / 2
      const labelRadius = radius + 30
      const x = centerX + labelRadius * Math.cos(angle)
      const y = centerY + labelRadius * Math.sin(angle)
      ctx.fillText(dim.name, x, y)
    })

    // 绘制数据点和分数值
    dimensions.forEach((dim, index) => {
      const angle = angleStep * index - Math.PI / 2
      const value = scores[dim.key] / 100
      const r = radius * value
      const x = centerX + r * Math.cos(angle)
      const y = centerY + r * Math.sin(angle)

      // 数据点
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#1890ff'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()

      // 分数值
      ctx.fillStyle = '#1890ff'
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
      const labelRadius = radius + 15
      const labelX = centerX + labelRadius * Math.cos(angle)
      const labelY = centerY + labelRadius * Math.sin(angle)
      ctx.fillText(scores[dim.key].toString(), labelX, labelY)
    })
  }, [scores, dimensions])

  // 生成改进建议
  const generateSuggestions = () => {
    const suggestions: {
      dimension: string
      priority: 'high' | 'medium' | 'low'
      content: string
    }[] = []

    if (scores.independent < 70) {
      suggestions.push({
        dimension: '独立性',
        priority: 'high',
        content: '用户故事应该尽可能独立，不依赖于其他功能。建议检查是否有外部依赖。',
      })
    }

    if (scores.negotiable < 70) {
      suggestions.push({
        dimension: '可协商性',
        priority: 'medium',
        content: '用户故事的细节应该是可协商的。避免过于固化的实现方案，保留灵活性。',
      })
    }

    if (scores.valuable < 70) {
      suggestions.push({
        dimension: '价值性',
        priority: 'high',
        content: '用户故事必须对用户或业务产生明确价值。建议重新审视故事的价值主张。',
      })
    }

    if (scores.estimable < 70) {
      suggestions.push({
        dimension: '可估算性',
        priority: 'high',
        content: '团队应该能够估算完成工作所需的工作量。建议补充技术细节或拆分故事。',
      })
    }

    if (scores.small < 70) {
      suggestions.push({
        dimension: '小型',
        priority: 'medium',
        content: '故事要足够小，能在一个迭代周期内完成。建议将大型故事拆分成多个小故事。',
      })
    }

    if (scores.testable < 70) {
      suggestions.push({
        dimension: '可测试性',
        priority: 'high',
        content: '故事必须有明确的验收标准。建议完善验收标准，确保可以通过测试验证。',
      })
    }

    return suggestions
  }

  const suggestions = generateSuggestions()

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* INVEST 六个维度评分 */}
      <Card title="🎯 INVEST 评估" bordered={false}>
        <Row gutter={16}>
          {dimensions.map((dim) => {
            const score = scores[dim.key]
            const level = getScoreLevel(score)

            return (
              <Col span={8} key={dim.key} style={{ marginBottom: 16 }}>
                <Card
                  size="small"
                  style={{
                    height: '100%',
                    transition: 'all 0.3s',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                  }}
                  hoverable
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dim.label} - {dim.label}
                      </Text>
                      <Title level={5} style={{ margin: 0 }}>
                        {dim.name}
                      </Title>
                    </div>

                    <Slider
                      min={0}
                      max={100}
                      value={score}
                      onChange={(value) => handleScoreChange(dim.key, value)}
                      trackStyle={{ backgroundColor: '#1890ff' }}
                      handleStyle={{ borderColor: '#1890ff' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: 16, color: level.color }}>
                        {score}
                      </Text>
                      <Tag color={level.color}>{level.text}</Tag>
                    </div>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dim.description}
                    </Text>
                  </Space>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Card>

      {/* 总体评分 */}
      <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%)' }}>
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <Statistic
            title={<span style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.45)' }}>INVEST 总体评分</span>}
            value={totalScore}
            valueStyle={{
              color: totalScore >= 85 ? '#52c41a' : totalScore >= 70 ? '#faad14' : '#ff4d4f',
              fontSize: 48,
              fontWeight: 700,
            }}
            suffix="/ 100"
          />
          <div style={{ marginTop: 8 }}>
            <Tag color={totalScore >= 85 ? '#52c41a' : totalScore >= 70 ? '#faad14' : '#ff4d4f'}>
              {getScoreLevel(totalScore).text}
            </Tag>
          </div>
        </div>
      </Card>

      {/* 雷达图 */}
      <Card title="📊 INVEST 雷达图" bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <canvas ref={canvasRef} width={600} height={400} />
        </div>
      </Card>

      {/* 改进建议 */}
      <Card title="💡 改进建议" bordered={false}>
        {suggestions.length === 0 ? (
          <Alert
            message="优秀！没有发现改进建议"
            description="这个故事符合所有INVEST原则"
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {suggestions.map((suggestion, index) => (
              <Alert
                key={index}
                message={
                  <Space>
                    <WarningOutlined style={{ color: '#faad14' }} />
                    <Text strong>{suggestion.dimension}</Text>
                  </Space>
                }
                description={suggestion.content}
                type="warning"
                showIcon={false}
                style={{
                  borderLeft: `4px solid ${suggestion.priority === 'high' ? '#ff4d4f' : '#faad14'}`,
                }}
              />
            ))}
          </Space>
        )}
      </Card>

      {/* 操作按钮 */}
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回故事
        </Button>
        <Space>
          <Button icon={<SaveOutlined />} onClick={() => onSave && onSave(scores)}>
            保存分析
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={onExport} loading={loading}>
            导出结果
          </Button>
        </Space>
      </div>
    </Space>
  )
}

export default INVESTAnalysisPanel

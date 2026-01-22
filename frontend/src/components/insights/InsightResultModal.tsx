import React from 'react'
import { Modal, Descriptions, Tag, Divider, Card, Space } from 'antd'
import type { Insight } from '@/types/insight'
import {
  UserOutlined,
  BulbOutlined,
  EnvironmentOutlined,
  HeartOutlined,
} from '@ant-design/icons'

interface InsightResultModalProps {
  visible: boolean
  insight: Insight | null
  onClose: () => void
}

export const InsightResultModal: React.FC<InsightResultModalProps> = ({
  visible,
  insight,
  onClose,
}) => {
  if (!insight) return null

  const { analysis_result } = insight

  // 优先级颜色映射
  const priorityColorMap: Record<string, string> = {
    high: 'red',
    medium: 'orange',
    low: 'green',
  }

  const priorityLabelMap: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  }

  const frequencyLabelMap: Record<string, string> = {
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    occasional: '偶尔',
  }

  const sentimentLabelMap: Record<string, string> = {
    frustrated: '😞 沮丧/焦虑',
    neutral: '😐 中立',
    satisfied: '😊 满意',
  }

  const urgencyLabelMap: Record<string, string> = {
    high: '🔴 高',
    medium: '🟡 中',
    low: '🟢 低',
  }

  return (
    <Modal
      title={
        <div>
          <div>📊 AI洞察分析结果</div>
          <div style={{ fontSize: 12, fontWeight: 'normal', marginTop: 4 }}>
            编号: <Tag color="blue">{insight.insight_number}</Tag>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* IPD需求十问 */}
        <Card title="🎯 IPD需求十问" style={{ marginBottom: 16 }}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="谁提出的需求">
              {analysis_result.q1_who || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="为什么提出">
              {analysis_result.q2_why || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="什么问题">
              {analysis_result.q3_what_problem || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="当前解决方案">
              {analysis_result.q4_current_solution || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="当前存在的问题">
              {analysis_result.q5_current_issues || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="理想解决方案">
              {analysis_result.q6_ideal_solution || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              {analysis_result.q7_priority && (
                <Tag color={priorityColorMap[analysis_result.q7_priority]}>
                  {priorityLabelMap[analysis_result.q7_priority]}
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="频率">
              {analysis_result.q8_frequency
                ? frequencyLabelMap[analysis_result.q8_frequency]
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="影响范围">
              {analysis_result.q9_impact_scope || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="价值">
              {analysis_result.q10_value || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 用户画像 */}
        {analysis_result.user_persona && (
          <Card
            title={
              <Space>
                <UserOutlined />
                用户画像
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="角色">
                {analysis_result.user_persona.role || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="部门">
                {analysis_result.user_persona.department || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="人群特征">
                {analysis_result.user_persona.demographics || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="痛点">
                {Array.isArray(analysis_result.user_persona.pain_points)
                  ? analysis_result.user_persona.pain_points.join('、')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="目标">
                {Array.isArray(analysis_result.user_persona.goals)
                  ? analysis_result.user_persona.goals.join('、')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 场景 */}
        {analysis_result.scenario && (
          <Card
            title={
              <Space>
                <EnvironmentOutlined />
                场景分析
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="上下文">
                {analysis_result.scenario.context || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="环境">
                {analysis_result.scenario.environment || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="触发因素">
                {analysis_result.scenario.trigger || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="频率">
                {analysis_result.scenario.frequency || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 情感标签 */}
        {analysis_result.emotional_tags && (
          <Card
            title={
              <Space>
                <HeartOutlined />
                情感标签
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>紧急度：</strong>
                {analysis_result.emotional_tags.urgency && (
                  <Tag style={{ marginLeft: 8 }}>
                    {urgencyLabelMap[analysis_result.emotional_tags.urgency]}
                  </Tag>
                )}
              </div>
              <div>
                <strong>重要性：</strong>
                {analysis_result.emotional_tags.importance && (
                  <Tag style={{ marginLeft: 8 }}>
                    {urgencyLabelMap[analysis_result.emotional_tags.importance]}
                  </Tag>
                )}
              </div>
              <div>
                <strong>情感倾向：</strong>
                {analysis_result.emotional_tags.sentiment && (
                  <span style={{ marginLeft: 8 }}>
                    {sentimentLabelMap[analysis_result.emotional_tags.sentiment]}
                  </span>
                )}
              </div>
              <div>
                <strong>情感关键词：</strong>
                {Array.isArray(analysis_result.emotional_tags.emotional_keywords) && (
                  <div style={{ marginTop: 8 }}>
                    {analysis_result.emotional_tags.emotional_keywords.map(
                      (keyword, index) => (
                        <Tag key={index} color="blue">
                          {keyword}
                        </Tag>
                      )
                    )}
                  </div>
                )}
              </div>
            </Space>
          </Card>
        )}

        {/* 元数据 */}
        <Divider />
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          <div>分析ID: {insight.id}</div>
          <div>
            分析时间: {new Date(insight.created_at).toLocaleString('zh-CN')}
          </div>
          <div>文本长度: {insight.text_length} 字符</div>
        </div>
      </div>
    </Modal>
  )
}

export default InsightResultModal

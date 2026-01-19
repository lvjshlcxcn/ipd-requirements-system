import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Card, Descriptions, Button, Tag, Space, Divider, Row, Col, message, Modal } from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  RadarChartOutlined,
} from '@ant-design/icons'
import { requirementService } from '@/services/requirement.service'
import { RequirementHistoryTimeline } from '@/components/requirements/RequirementHistoryTimeline'
import { STATUS_MAP, SOURCE_MAP, KANO_MAP, COMPLEXITY_MAP, TARGET_MAP } from '@/constants/status'

function RequirementDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  const fetchRequirement = async () => {
    if (!id) return
    setLoading(true)
    try {
      const response = await requirementService.getRequirement(parseInt(id))
      if (response.success && response.data) {
        setData(response.data)
      } else {
        message.error('获取需求详情失败')
      }
    } catch (error: any) {
      console.error('Fetch requirement error:', error)
      message.error('获取需求详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequirement()
  }, [id])

  const handleEdit = () => {
    navigate(`/requirements/${id}/edit`)
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个需求吗？此操作不可撤销。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await requirementService.deleteRequirement(parseInt(id!))
          if (response.success) {
            message.success('删除成功')
            navigate('/requirements')
          } else {
            message.error(response.message || '删除失败')
          }
        } catch (error: any) {
          console.error('Delete requirement error:', error)
          message.error('删除失败')
        }
      },
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  if (loading || !data) {
    return (
      <div>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
        </Space>
        <Card loading={loading} />
      </div>
    )
  }

  const tenQuestions = data.customer_need_10q || {}

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
          编辑
        </Button>
        <Button
          icon={<BarChartOutlined />}
          onClick={() => navigate(`/requirements/${id}/appeals`)}
        >
          APPEALS分析
        </Button>
        <Button
          icon={<RadarChartOutlined />}
          onClick={() => navigate(`/requirements/${id}/kano`)}
        >
          KANO分类
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          删除
        </Button>
      </Space>

      <Card>
        <Descriptions title="需求基本信息" bordered column={2}>
          <Descriptions.Item label="需求编号">{data.requirement_no}</Descriptions.Item>
          <Descriptions.Item label="需求标题">{data.title}</Descriptions.Item>
          <Descriptions.Item label="需求来源" span={2}>
            {SOURCE_MAP[data.source_channel] || data.source_channel}
          </Descriptions.Item>
          {data.source_contact && (
            <Descriptions.Item label="来源联系人" span={2}>
              {data.source_contact}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="需求描述" span={2}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{data.description}</div>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={STATUS_MAP[data.status]?.color}>{STATUS_MAP[data.status]?.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="优先级">
            {data.priority_score ? (
              <span
                style={{
                  color:
                    data.priority_score >= 80
                      ? '#ff4d4f'
                      : data.priority_score >= 60
                        ? '#faad14'
                        : '#52c41a',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
              >
                {data.priority_score}
              </span>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          {data.kano_category && (
            <Descriptions.Item label="KANO分类">
              {KANO_MAP[data.kano_category] || data.kano_category}
            </Descriptions.Item>
          )}
          {data.target_type && (
            <Descriptions.Item label="分发目标">
              {TARGET_MAP[data.target_type] || data.target_type}
            </Descriptions.Item>
          )}
          {data.estimated_duration_months && (
            <Descriptions.Item label="预计周期">
              {data.estimated_duration_months} 个月
            </Descriptions.Item>
          )}
          {data.complexity_level && (
            <Descriptions.Item label="复杂度">
              {COMPLEXITY_MAP[data.complexity_level] || data.complexity_level}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="创建时间">{formatDate(data.created_at)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDate(data.updated_at)}</Descriptions.Item>
        </Descriptions>

        {(tenQuestions.q1_who_cares ||
          tenQuestions.q2_why_care ||
          tenQuestions.q3_how_often ||
          tenQuestions.q4_current_solution ||
          tenQuestions.q5_pain_points ||
          tenQuestions.q6_expected_outcome ||
          tenQuestions.q7_value_impact ||
          tenQuestions.q8_urgency_level ||
          tenQuestions.q9_budget_willingness ||
          tenQuestions.q10_alternative_solutions) && (
          <>
            <Divider />
            <Card title="客户需求十问" type="inner" style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                {tenQuestions.q1_who_cares && (
                  <Col span={12}>
                    <Card type="inner" size="small" title="1. 谁在意这个需求？">
                      {tenQuestions.q1_who_cares}
                    </Card>
                  </Col>
                )}
                {tenQuestions.q2_why_care && (
                  <Col span={12}>
                    <Card type="inner" size="small" title="2. 为什么在意？">
                      {tenQuestions.q2_why_care}
                    </Card>
                  </Col>
                )}
                {tenQuestions.q3_how_often && (
                  <Col span={12}>
                    <Card type="inner" size="small" title="3. 多久遇到一次？">
                      {tenQuestions.q3_how_often}
                    </Card>
                  </Col>
                )}
                {tenQuestions.q4_current_solution && (
                  <Col span={12}>
                    <Card type="inner" size="small" title="4. 现在怎么解决？">
                      {tenQuestions.q4_current_solution}
                    </Card>
                  </Col>
                )}
                {tenQuestions.q5_pain_points && (
                  <Col span={12}>
                    <Card type="inner" size="small" title="5. 痛点是什么？">
                      {tenQuestions.q5_pain_points}
                    </Card>
                  </Col>
                )}
                {tenQuestions.q6_expected_outcome && (
                  <Col span={12}>
                    <Card type="inner" size="small" title="6. 期望结果是什么？">
                      {tenQuestions.q6_expected_outcome}
                    </Card>
                  </Col>
                )}
                {tenQuestions.q7_value_impact && (
                  <Col span={12}>
                    <Card type="inner" size="small" title="7. 价值/影响有多大？">
                      {tenQuestions.q7_value_impact}
                    </Card>
                  </Col>
                )}
                {tenQuestions.q8_urgency_level && (
                  <Col span={12}>
                    <Card type="inner" size="small" title="8. 紧急程度如何？">
                      {tenQuestions.q8_urgency_level}
                    </Card>
                  </Col>
                )}
                {tenQuestions.q9_budget_willingness && (
                  <Col span={12}>
                    <Card type="inner" size="small" title="9. 预算意愿？">
                      {tenQuestions.q9_budget_willingness}
                    </Card>
                  </Col>
                )}
                {tenQuestions.q10_alternative_solutions && (
                  <Col span={12}>
                    <Card type="inner" size="small" title="10. 还有其他方案吗？">
                      {tenQuestions.q10_alternative_solutions}
                    </Card>
                  </Col>
                )}
                {tenQuestions.additional_notes && (
                  <Col span={24}>
                    <Card type="inner" size="small" title="补充说明">
                      {tenQuestions.additional_notes}
                    </Card>
                  </Col>
                )}
              </Row>
            </Card>
          </>
        )}
      </Card>

      <Divider style={{ margin: '24px 0' }} />

      <Card title="历史记录" type="inner">
        <RequirementHistoryTimeline requirementId={parseInt(id!)} />
      </Card>
    </div>
  )
}

export default RequirementDetailPage

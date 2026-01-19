import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Form,
  Radio,
  Button,
  Space,
  Row,
  Col,
  Descriptions,
  message,
  Alert,
  Progress,
  Input,
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

interface KanoFormData {
  category: string
  functional_present: number
  functional_absent: number
  dysfunctional_present: number
  dysfunctional_absent: number
  classification_reason?: string
}

// KANO模型说明
const kanoCategories = [
  {
    key: 'basic',
    name: '基本型需求',
    color: '#ff4d4f',
    description: '必须具备的功能，如果没有会非常不满，有了也觉得理所当然',
    example: '手机必须能打电话、发短信',
  },
  {
    key: 'performance',
    name: '期望型需求',
    color: '#faad14',
    description: '越多越好，用户会明确表达期望',
    example: '手机电池续航时间越长越好',
  },
  {
    key: 'excitement',
    name: '兴奋型需求',
    color: '#52c41a',
    description: '超出预期，给用户惊喜，没有也不会不满',
    example: '手机无线充电功能',
  },
]

// KANO评估表
function KanoEvaluationTable({
  onChange,
}: {
  onChange: (values: any) => void
}) {
  const [functional, setFunctional] = useState<number>(5)
  const [dysfunctional, setDysfunctional] = useState<number>(5)

  useEffect(() => {
    onChange({ functional_present: functional, dysfunctional_absent: dysfunctional })
  }, [functional, dysfunctional])

  return (
    <Card title="KANO评估问卷" size="small">
      <p style={{ marginBottom: 16, color: '#666' }}>
        请根据客户调研结果，对以下问题进行评分：
      </p>

      <Row gutter={16}>
        <Col span={12}>
          <Card type="inner" size="small" title="功能性问题" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              如果这个需求<strong>实现了</strong>，您的感觉是？
            </p>
            <Radio.Group
              value={functional}
              onChange={(e) => setFunctional(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value={1}>1. 我喜欢这样</Radio>
                <Radio value={2}>2. 理所当然</Radio>
                <Radio value={3}>3. 无所谓</Radio>
                <Radio value={4}>4. 勉强接受</Radio>
                <Radio value={5}>5. 不喜欢这样</Radio>
              </Space>
            </Radio.Group>
          </Card>
        </Col>

        <Col span={12}>
          <Card type="inner" size="small" title="反功能性问题">
            <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              如果这个需求<strong>没有实现</strong>，您的感觉是？
            </p>
            <Radio.Group
              value={dysfunctional}
              onChange={(e) => setDysfunctional(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value={1}>1. 我喜欢这样</Radio>
                <Radio value={2}>2. 理所当然</Radio>
                <Radio value={3}>3. 无所谓</Radio>
                <Radio value={4}>4. 勉强接受</Radio>
                <Radio value={5}>5. 不喜欢这样</Radio>
              </Space>
            </Radio.Group>
          </Card>
        </Col>
      </Row>

      <Alert
        message="评估提示"
        description='根据KANO模型原理，通过对比"有"和"没有"两种情况的客户反应，可以准确判断需求类型'
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  )
}

// KANO分类可视化
function KanoVisualization({ category }: { category: string }) {
  const categoryInfo = kanoCategories.find((c) => c.key === category)

  if (!categoryInfo) {
    return <div>请先选择分类</div>
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div
        style={{
          width: 150,
          height: 150,
          borderRadius: '50%',
          backgroundColor: categoryInfo.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
        }}
      >
        {categoryInfo.name}
      </div>

      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="类型">{categoryInfo.name}</Descriptions.Item>
        <Descriptions.Item label="特点">{categoryInfo.description}</Descriptions.Item>
        <Descriptions.Item label="示例">{categoryInfo.example}</Descriptions.Item>
      </Descriptions>
    </div>
  )
}

function KanoClassificationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState<string>('performance')

  const onFinish = async (values: KanoFormData) => {
    setLoading(true)
    try {
      console.log('Save KANO classification:', id, values)
      // TODO: 调用API保存分类结果
      await new Promise((resolve) => setTimeout(resolve, 1000))
      message.success('KANO分类保存成功')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const onCategoryChange = (e: any) => {
    setCategory(e.target.value)
  }

  return (
    <div>
      <Card
        title="KANO模型分类"
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
        }
      >
        <Row gutter={24}>
          {/* 左侧：分类选择和评估 */}
          <Col span={14}>
            <Alert
              message="KANO模型"
              description="KANO模型用于识别客户需求的类型，帮助产品团队优先处理最重要的功能"
              type="info"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginBottom: 24 }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                category: 'performance',
                functional_present: 5,
                dysfunctional_absent: 5,
              }}
            >
              <Card title="选择需求类型" size="small" style={{ marginBottom: 16 }}>
                <Form.Item
                  label="需求分类"
                  name="category"
                  rules={[{ required: true, message: '请选择分类' }]}
                >
                  <Radio.Group onChange={onCategoryChange}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {kanoCategories.map((cat) => (
                        <Radio key={cat.key} value={cat.key}>
                          <span style={{ color: cat.color, fontWeight: 'bold' }}>
                            {cat.name}
                          </span>
                          <span style={{ marginLeft: 8, color: '#666' }}>
                            - {cat.description}
                          </span>
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </Form.Item>
              </Card>

              <KanoEvaluationTable
                onChange={(values) => {
                  form.setFieldsValue(values)
                }}
              />

              <Form.Item
                label="分类理由"
                name="classification_reason"
                style={{ marginTop: 16 }}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="请说明为什么这样分类，提供依据和理由"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24 }}>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                    保存分类
                  </Button>
                  <Button onClick={() => navigate(-1)}>取消</Button>
                </Space>
              </Form.Item>
            </Form>
          </Col>

          {/* 右侧：可视化 */}
          <Col span={10}>
            <Card title="分类结果" extra={<CheckCircleOutlined />}>
              <KanoVisualization category={category} />

              <Card
                type="inner"
                title="KANO模型说明"
                size="small"
                style={{ marginTop: 24 }}
              >
                <Row gutter={[16, 16]}>
                  {kanoCategories.map((cat) => (
                    <Col span={24} key={cat.key}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: cat.color,
                            marginRight: 8,
                          }}
                        />
                        <strong style={{ flex: 1 }}>{cat.name}</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                        {cat.description}
                      </p>
                      <Progress
                        percent={category === cat.key ? 100 : 0}
                        strokeColor={cat.color}
                        showInfo={false}
                        size="small"
                      />
                    </Col>
                  ))}
                </Row>
              </Card>

              <Card
                type="inner"
                title="优先级建议"
                size="small"
                style={{ marginTop: 16 }}
              >
                <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
                  <li>
                    <strong style={{ color: '#ff4d4f' }}>基本型需求</strong>：必须满足，优先级最高
                  </li>
                  <li>
                    <strong style={{ color: '#faad14' }}>期望型需求</strong>：提升竞争力，优先级中等
                  </li>
                  <li>
                    <strong style={{ color: '#52c41a' }}>兴奋型需求</strong>：超出预期，优先级灵活
                  </li>
                </ul>
              </Card>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default KanoClassificationPage

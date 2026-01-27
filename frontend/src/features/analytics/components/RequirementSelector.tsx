import { Card, Select, Space } from 'antd'

/**
 * 需求选择器组件
 * 用于需求分析页面的需求选择和详情展示
 */
export function RequirementSelector({
  requirements,
  selectedReqId,
  onSelectReq,
}: {
  requirements: any[]
  selectedReqId: number | null
  onSelectReq: (id: number | null) => void
}) {
  const selectedRequirement = requirements.find((r) => r.id === selectedReqId)

  return (
    <Card style={{ marginBottom: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <label style={{ marginRight: 16, fontWeight: 'bold' }}>选择需求：</label>
          <Select
            style={{ width: 400 }}
            placeholder="请选择要分析的需求"
            value={selectedReqId}
            onChange={onSelectReq}
            showSearch
            optionFilterProp="children"
            allowClear
          >
            {requirements.map((req) => (
              <Select.Option key={req.id} value={req.id}>
                {req.requirement_no} - {req.title}
              </Select.Option>
            ))}
          </Select>
        </div>

        {selectedRequirement && (
          <div>
            <p>
              <strong>需求标题：</strong>
              {selectedRequirement.title}
            </p>
            <p>
              <strong>需求编号：</strong>
              {selectedRequirement.requirement_no}
            </p>
            <p>
              <strong>需求描述：</strong>
              {selectedRequirement.description}
            </p>
          </div>
        )}
      </Space>
    </Card>
  )
}

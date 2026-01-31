import { Card, Result, Button } from 'antd'
import { BuildOutlined } from '@ant-design/icons'

/**
 * 需求开发页面（占位）
 * 用于跟踪和管理需求的开发进度
 */
export function DevelopmentPage() {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>需求开发</h2>

      <Card>
        <Result
          icon={<BuildOutlined style={{ fontSize: 72, color: '#1890ff' }} />}
          title="需求开发模块"
          subTitle="此模块正在开发中，将用于跟踪和管理需求的开发进度、工时统计、开发状态等功能。"
          extra={[
            <Button type="primary" key="console">
              返回首页
            </Button>,
            <Button key="documentation">查看文档</Button>,
          ]}
        />
      </Card>

      <div style={{ marginTop: 24 }}>
        <Card title="功能规划" type="inner">
          <ul style={{ lineHeight: 2 }}>
            <li>✅ 需求开发任务分配</li>
            <li>✅ 开发进度跟踪</li>
            <li>✅ 工时统计和报表</li>
            <li>✅ 开发状态管理（开发中、测试中、已完成等）</li>
            <li>✅ 开发问题和风险记录</li>
            <li>✅ 开发文档和代码关联</li>
            <li>✅ 与 Git/GitLab 集成</li>
            <li>✅ 开发团队协作</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

export default DevelopmentPage

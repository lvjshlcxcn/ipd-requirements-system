import { useState, useEffect } from 'react'
import { Tabs, Card, Button, Space } from 'antd'
const { TabPane } = Tabs
import api from '@/services/api'
import { RequirementSelector } from '../components/RequirementSelector'
import { APPEALSForm } from '../components/APPEALSForm'
import { RICEForm } from '../components/RICEForm'
import { INVESTForm } from '../components/INVESTForm'

/**
 * 需求分析页面
 * 包含APPEALS评估和RICE评分两个功能，通过标签页切换
 */
export function AnalyticsPage() {
  const [requirements, setRequirements] = useState<any[]>([])
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('appeals')

  // 加载需求列表
  useEffect(() => {
    async function fetchRequirements() {
      try {
        const response = await api.get('/requirements')
        const items = response?.data?.items || []
        setRequirements(items)
      } catch (error) {
        console.error('Failed to fetch requirements:', error)
      }
    }
    fetchRequirements()
  }, [])

  console.log('AnalyticsPage 渲染:', {
    selectedReqId,
    activeTab,
    requirementsCount: requirements.length,
    hasAPPEALSForm: typeof APPEALSForm !== 'undefined',
    hasRICEForm: typeof RICEForm !== 'undefined',
  })

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>需求分析</h2>

      {/* 共享的需求选择器 */}
      <RequirementSelector requirements={requirements} selectedReqId={selectedReqId} onSelectReq={setSelectedReqId} />

      {/* APPEALS 和 RICE 标签页 */}
      {selectedReqId && (
        <>
          {/* 临时显示三个按钮来切换 */}
          <Space style={{ marginBottom: 16 }}>
            <Button
              type={activeTab === 'appeals' ? 'primary' : 'default'}
              onClick={() => setActiveTab('appeals')}
              size="large"
            >
              APPEALS评估
            </Button>
            <Button
              type={activeTab === 'rice' ? 'primary' : 'default'}
              onClick={() => setActiveTab('rice')}
              size="large"
            >
              RICE评分
            </Button>
            <Button
              type={activeTab === 'invest' ? 'primary' : 'default'}
              onClick={() => setActiveTab('invest')}
              size="large"
            >
              INVEST分析
            </Button>
          </Space>

          {activeTab === 'appeals' && <APPEALSForm requirementId={selectedReqId} />}
          {activeTab === 'rice' && <RICEForm requirementId={selectedReqId} />}
          {activeTab === 'invest' && <INVESTForm requirementId={selectedReqId} />}
        </>
      )}

      {!selectedReqId && (
        <Card>
          <p style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>请从上方选择一个需求开始分析</p>
        </Card>
      )}
    </div>
  )
}

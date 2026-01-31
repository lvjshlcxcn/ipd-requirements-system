import { useState, useEffect } from 'react'
import { Tabs, Card, Button, Space, message, Modal } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
const { TabPane } = Tabs
import api from '@/services/api'
import { RequirementSelector } from '../components/RequirementSelector'
import { APPEALSForm } from '../components/APPEALSForm'
import { RICEForm } from '../components/RICEForm'
import { INVESTForm } from '../components/INVESTForm'
import { requirementService } from '@/services/requirement.service'
import type { ApiResponse } from '@/services/api'

/**
 * 需求分析页面
 * 包含APPEALS评估和RICE评分两个功能，通过标签页切换
 */
export function AnalyticsPage() {
  const [requirements, setRequirements] = useState<any[]>([])
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null)
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('appeals')

  // 加载需求列表（只包含分析中的需求）
  useEffect(() => {
    async function fetchRequirements() {
      try {
        const response = await api.get('/requirements')
        const items = response?.data?.items || []
        // 只包含 analyzing（分析中）状态的需求
        const filteredItems = items.filter((req: any) => req.status === 'analyzing')
        setRequirements(filteredItems)
      } catch (error) {
        console.error('Failed to fetch requirements:', error)
      }
    }
    fetchRequirements()
  }, [])

  // 当选中需求时，加载需求详情以获取状态
  useEffect(() => {
    async function fetchRequirementDetail() {
      if (!selectedReqId) {
        setSelectedRequirement(null)
        return
      }
      try {
        const response = await requirementService.getRequirement(selectedReqId) as ApiResponse<any>
        if (response.success && response.data) {
          setSelectedRequirement(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch requirement detail:', error)
      }
    }
    fetchRequirementDetail()
  }, [selectedReqId])

  // 处理分析完成
  const handleAnalysisComplete = async () => {
    if (!selectedReqId) return

    Modal.confirm({
      title: '确认分析完成',
      content: '确认该需求已分析完成？此操作将需求状态改为"已分析"，之后可以进行分发操作。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await requirementService.updateStatus(selectedReqId, 'analyzed') as ApiResponse<any>
          if (response.success) {
            message.success('需求已标记为已分析')
            // 从需求列表中移除已分析的需求
            setRequirements(prev => prev.filter(req => req.id !== selectedReqId))
            // 清空选中状态
            setSelectedReqId(null)
            setSelectedRequirement(null)
          } else {
            message.error(response.message || '操作失败')
          }
        } catch (error: any) {
          console.error('Update status error:', error)
          message.error('操作失败')
        }
      },
    })
  }

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
          {/* 切换按钮组 */}
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

            {/* 分析完成按钮 - 只在状态为"分析中"时显示 */}
            {selectedRequirement?.status === 'analyzing' && (
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleAnalysisComplete}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', fontSize: 16, height: 40 }}
              >
                分析完成
              </Button>
            )}
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

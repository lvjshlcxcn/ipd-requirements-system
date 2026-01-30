import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInsightModal } from '@/components/insights/TextInsightModal'
import type { Insight } from '@/types/insight'

/**
 * IPD Story Flow 独立页面加载器
 * 使用 iframe 加载独立的 HTML 页面
 * 通过 URL 参数传递认证 token
 */
export function IPDStoryFlowPage() {
  const navigate = useNavigate()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(window.innerHeight - 150)
  const [token, setToken] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [textInsightModalVisible, setTextInsightModalVisible] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight - 150)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // 获取认证信息
    const accessToken = localStorage.getItem('access_token')
    const tenant = localStorage.getItem('tenant_id') || '1'
    setToken(accessToken)
    setTenantId(tenant)
  }, [])

  // 监听来自 iframe 的关闭消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 检查消息类型
      if (event.data?.type === 'CLOSE_IPD_STORY_FLOW') {
        // 返回到需求列表页面
        navigate('/requirements')
      } else if (event.data?.type === 'NAVIGATE_TO_INSIGHTS') {
        // 导航到 AI 洞察页面
        navigate('/insights')
      } else if (event.data?.type === 'OPEN_TEXT_INSIGHT_MODAL') {
        // 打开文本洞察分析弹窗
        setTextInsightModalVisible(true)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [navigate])

  // 处理 AI 洞察分析完成
  const handleInsightAnalysisComplete = (insight: Insight) => {
    console.log('AI 洞察分析完成:', insight)

    // 将结果发送到 iframe
    const iframe = iframeRef.current
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'INSIGHT_ANALYSIS_RESULT',
          result: insight.analysis_result,
        },
        '*'
      )
    }

    // 关闭弹窗
    setTextInsightModalVisible(false)
  }

  // 构建 iframe URL，附带认证信息
  const iframeSrc = token
    ? `/ipd-story-flow.html?token=${encodeURIComponent(token)}&tenant_id=${tenantId}`
    : `/ipd-story-flow.html`

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        style={{
          width: '100%',
          height: `${height}px`,
          border: 'none',
          borderRadius: '8px',
        }}
        title="IPD需求十问 → 用户故事 → INVEST分析"
      />

      {/* 文本洞察分析弹窗 */}
      <TextInsightModal
        visible={textInsightModalVisible}
        onClose={() => setTextInsightModalVisible(false)}
        onAnalysisComplete={handleInsightAnalysisComplete}
      />
    </div>
  )
}

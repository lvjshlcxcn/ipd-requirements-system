import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * IPD Story Flow 独立页面加载器
 * 使用 iframe 加载独立的 HTML 页面
 * 通过 URL 参数传递认证 token
 */
export function IPDStoryFlowPage() {
  const navigate = useNavigate()
  const [height, setHeight] = useState(window.innerHeight - 150)
  const [token, setToken] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)

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
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [navigate])

  // 构建 iframe URL，附带认证信息
  const iframeSrc = token
    ? `/ipd-story-flow.html?token=${encodeURIComponent(token)}&tenant_id=${tenantId}`
    : `/ipd-story-flow.html`

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <iframe
        src={iframeSrc}
        style={{
          width: '100%',
          height: `${height}px`,
          border: 'none',
          borderRadius: '8px',
        }}
        title="IPD需求十问 → 用户故事 → INVEST分析"
      />
    </div>
  )
}

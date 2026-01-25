import { useEffect, useState } from 'react'
import { Card, Tag, Button, Space, Typography } from 'antd'
import { useAuthStore } from '@/stores/useAuthStore'

const { Text, Paragraph } = Typography

export function SessionTimeoutDebugger() {
  const { isAuthenticated, token, user, initialize } = useAuthStore()
  const [localStorageState, setLocalStorageState] = useState<any>(null)

  useEffect(() => {
    // 检查 localStorage
    const checkStorage = () => {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        try {
          setLocalStorageState(JSON.parse(authStorage))
        } catch (e) {
          console.error('解析 auth-storage 失败:', e)
        }
      }
    }

    checkStorage()
    const interval = setInterval(checkStorage, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleFixAuth = () => {
    console.log('修复认证状态...')
    initialize()

    // 强制设置 isAuthenticated
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const authData = JSON.parse(authStorage)
      authData.state.isAuthenticated = true
      localStorage.setItem('auth-storage', JSON.stringify(authData))
      console.log('✅ 已强制设置 isAuthenticated = true')
      setTimeout(() => window.location.reload(), 500)
    }
  }

  return (
    <Card
      title="🔍 会话超时调试面板"
      size="small"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 400,
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <div>
          <Text strong>Zustand 状态:</Text><br/>
          isAuthenticated: <Tag color={isAuthenticated ? 'green' : 'red'}>{String(isAuthenticated)}</Tag><br/>
          token: <Tag color={token ? 'green' : 'red'}>{token ? '存在' : '不存在'}</Tag><br/>
          user: <Tag>{user?.username || '无'}</Tag>
        </div>

        <div>
          <Text strong>localStorage 状态:</Text><br/>
          {localStorageState ? (
            <>
              isAuthenticated: <Tag color={localStorageState?.state?.isAuthenticated ? 'green' : 'red'}>
                {String(localStorageState?.state?.isAuthenticated)}
              </Tag><br/>
              version: {localStorageState.version}
            </>
          ) : (
            <Tag color="red">未加载</Tag>
          )}
        </div>

        <Button
          type="primary"
          onClick={handleFixAuth}
          style={{ width: '100%' }}
        >
          🔧 修复认证状态
        </Button>

        <Paragraph style={{ fontSize: '12px', margin: 0 }}>
          <Text type="secondary">
            如果 isAuthenticated 为 false，点击"修复认证状态"按钮，然后刷新页面。
          </Text>
        </Paragraph>
      </Space>
    </Card>
  )
}

import { Modal, Input, Button, message } from 'antd'
import { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

export function ScreenLockModal() {
  const { isLocked, lockedUsername, unlockScreen, failedPasswordAttempts } = useAuthStore()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 如果未锁定，不显示 Modal
  if (!isLocked) return null

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError('请输入密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const success = await unlockScreen(password)

      if (success) {
        setPassword('')
        message.success('解锁成功')
      } else {
        const remaining = 5 - (failedPasswordAttempts + 1)
        if (remaining > 0) {
          setError(`密码错误，剩余 ${remaining} 次尝试机会`)
        } else {
          message.error('密码错误次数过多，已强制登出')
        }
      }
    } catch (err) {
      setError('网络连接失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock()
    }
  }

  return (
    <Modal
      open={true}
      closable={false}
      maskClosable={false}
      centered
      width={400}
      footer={null}
      styles={{
        mask: { backdropFilter: 'blur(8px)' },
      }}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <h2 style={{ marginBottom: '8px' }}>欢迎回来，{lockedUsername}</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>请输入密码解锁</p>

        <Input.Password
          size="large"
          placeholder="请输入密码"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError('')
          }}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{ marginBottom: '16px' }}
        />

        {error && (
          <div style={{ color: '#ff4d4f', marginBottom: '16px', textAlign: 'left' }}>
            ⚠️ {error}
          </div>
        )}

        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          onClick={handleUnlock}
        >
          解锁
        </Button>
      </div>
    </Modal>
  )
}

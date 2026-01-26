import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, message } from 'antd'
import { DashboardOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/useAuthStore'

export function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      console.log('[LoginPage] 开始登录:', values.username)

      // 使用 useAuthStore 的 login 方法
      await login(values.username, values.password)

      console.log('[LoginPage] 登录成功')

      message.success('登录成功')
      navigate('/dashboard')
    } catch (error: any) {
      console.error('[LoginPage] 登录失败:', error)
      message.error(error?.detail || error?.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8, color: '#1890ff' }}>IPD需求管理</h1>
          <p style={{ color: '#666' }}>IPD Requirements Management System</p>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<DashboardOutlined />}
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            <p>演示账号：任意用户名和密码</p>
          </div>
        </Form>
      </Card>
    </div>
  )
}

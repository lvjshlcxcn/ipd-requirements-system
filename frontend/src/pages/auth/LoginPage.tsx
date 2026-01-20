import { useState } from 'react'
import { Button, Form, Input, Card, Typography, message, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import type { ApiResponse } from '@/services/api'

const { Title, Text } = Typography

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (values: any) => {
    setLoading(true)
    try {
      console.log('开始登录，用户名:', values.username)

      // 直接使用 JSON 格式发送请求
      const response = await api.post('/auth/login', {
        username: values.username,
        password: values.password
      }) as ApiResponse<{ access_token: string; user: any }>

      console.log('登录响应:', response)

      // 后端返回格式：{ success: true, message: "...", data: { access_token, user } }
      if (response.success && response.data) {
        message.success('登录成功')

        // Store token with correct key
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        navigate('/')
      } else {
        message.error(response.message || '登录失败')
      }
    } catch (error: any) {
      console.error('登录错误详情:', error)
      console.error('响应数据:', error.response?.data)
      console.error('响应状态:', error.response?.status)

      const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.message || '登录失败，请检查用户名和密码'
      message.error(errorMsg)
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
      <Card style={{ width: 400, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
        <Space direction="vertical" size="large" align="center" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <UserOutlined style={{ fontSize: 64, color: '#fff', marginBottom: 16 }} />
            <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
              IPD需求管理系统
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              智能需求管理平台
            </Text>
          </div>

          <Form
            name="login"
            onFinish={handleLogin}
            initialValues={{ username: 'admin', password: 'admin123' }}
            layout="vertical"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                size="large"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              默认账号：admin / admin123
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}

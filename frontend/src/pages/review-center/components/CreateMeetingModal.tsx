import { Modal, Form, Input, DatePicker, Select, Button, message, Space } from 'antd'
import { useState } from 'react'
import dayjs from 'dayjs'
import { useMutation } from '@tanstack/react-query'
import reviewMeetingService from '@/services/reviewMeeting.service'
import type { MeetingCreateRequest } from '@/types/review-meeting'
import { useAuthStore } from '@/stores/useAuthStore'

const { TextArea } = Input

interface CreateMeetingModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
}

export function CreateMeetingModal({ visible, onCancel, onSuccess }: CreateMeetingModalProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuthStore()

  // 创建会议
  const createMutation = useMutation({
    mutationFn: (data: MeetingCreateRequest) =>
      reviewMeetingService.createMeeting(data),
    onSuccess: () => {
      message.success('会议创建成功')
      form.resetFields()
      onSuccess()
    },
    onError: (error: any) => {
      message.error(error.message || '创建会议失败')
      setSubmitting(false)
    },
    onSettled: () => {
      setSubmitting(false)
    },
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      // 转换数据格式
      const meetingData: MeetingCreateRequest = {
        title: values.title,
        description: values.description || undefined,
        scheduled_at: values.scheduled_at.toISOString(),
        moderator_id: values.moderator_id,
        meeting_settings: {},
      }

      await createMutation.mutateAsync(meetingData)
    } catch (error) {
      // 表单验证失败，不处理
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="创建评审会议"
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
          >
            创建
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          scheduled_at: dayjs().add(1, 'hour'),
        }}
      >
        <Form.Item
          label="会议标题"
          name="title"
          rules={[
            { required: true, message: '请输入会议标题' },
            { max: 200, message: '标题不能超过200字符' },
          ]}
        >
          <Input placeholder="请输入会议标题" />
        </Form.Item>

        <Form.Item
          label="会议描述"
          name="description"
          rules={[
            { max: 1000, message: '描述不能超过1000字符' },
          ]}
        >
          <TextArea
            placeholder="请输入会议描述（可选）"
            rows={3}
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="预定时间"
          name="scheduled_at"
          rules={[
            { required: true, message: '请选择预定时间' },
          ]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: '100%' }}
            placeholder="请选择预定时间"
            disabledDate={(current) => current && current.isBefore(dayjs(), 'day')}
          />
        </Form.Item>

        <Form.Item
          label="主持人"
          name="moderator_id"
          rules={[
            { required: true, message: '请选择主持人' },
          ]}
          initialValue={user?.id}
        >
          <Select
            placeholder="请选择主持人"
            disabled={!user}
            options={user ? [{
              label: user.full_name || user.username,
              value: user.id,
            }] : []}
          />
        </Form.Item>

        {!user && (
          <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '-8px', marginBottom: '16px' }}>
            ⚠️ 当前无法获取用户信息，请确保已登录
          </div>
        )}
      </Form>
    </Modal>
  )
}

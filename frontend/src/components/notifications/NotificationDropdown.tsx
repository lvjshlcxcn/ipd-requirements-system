import React from 'react'
import {
  Badge,
  Dropdown,
  List,
  Avatar,
  Typography,
  Space,
  Button,
  Empty,
} from 'antd'
import { BellOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import { Notification } from '@/services/notification.service'
import { useNotificationStore } from '@/stores/useNotificationStore'

const { Text } = Typography

interface NotificationDropdownProps {
  onClick?: () => void
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClick,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore()

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const notificationItems = notifications.slice(0, 10)

  const menu = (
    <div style={{ width: '400px', maxHeight: '500px', overflow: 'auto' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space>
          <Text strong>通知</Text>
          {unreadCount > 0 && (
            <Badge count={unreadCount} size="small" />
          )}
        </Space>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            onClick={handleMarkAllAsRead}
          >
            全部已读
          </Button>
        )}
      </div>

      {notificationItems.length === 0 ? (
        <div style={{ padding: '32px' }}>
          <Empty description="暂无通知" />
        </div>
      ) : (
        <List
          dataSource={notificationItems}
          renderItem={(item: Notification) => (
            <List.Item
              key={item.id}
              style={{
                backgroundColor: item.is_read ? 'transparent' : '#f6ffed',
                padding: '12px 16px',
              }}
              actions={[
                !item.is_read && (
                  <Button
                    type="link"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleMarkAsRead(item.id)}
                  >
                    标记已读
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{
                      backgroundColor: item.is_read ? '#d9d9d9' : '#1890ff',
                    }}
                  >
                    {item.notification_type.charAt(0).toUpperCase()}
                  </Avatar>
                }
                title={
                  <div>
                    <Text
                      strong={!item.is_read}
                      style={{
                        color: item.is_read ? '#999' : 'inherit',
                      }}
                    >
                      {item.title}
                    </Text>
                  </div>
                }
                description={
                  <div>
                    <Text>{item.message}</Text>
                    <div style={{ marginTop: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(item.created_at).toLocaleString('zh-CN')}
                      </Text>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  )

  return (
    <Dropdown
      dropdownRender={() => menu}
      trigger={['click']}
      placement="bottomRight"
      onOpenChange={onClick}
    >
      <Badge count={unreadCount} size="small" offset={[-10, 10]}>
        <BellOutlined
          style={{
            fontSize: '20px',
            cursor: 'pointer',
            color: '#fff',
          }}
        />
      </Badge>
    </Dropdown>
  )
}

export default NotificationDropdown

import { api } from './api'

export interface Notification {
  id: number
  user_id: number
  tenant_id: number
  notification_type: string
  title: string
  message: string
  entity_type?: string
  entity_id?: number
  is_read: boolean
  read_at?: number
  created_at: string
}

export interface NotificationUnreadCount {
  count: number
}

export const notificationService = {
  // Get all notifications
  getNotifications: async (params?: {
    skip?: number
    limit?: number
    unread_only?: boolean
  }) => {
    return api.get('/notifications', { params })
  },

  // Get unread count
  getUnreadCount: async () => {
    return api.get('/notifications/unread-count')
  },

  // Mark notification as read
  markAsRead: async (notificationId: number) => {
    return api.put(`/notifications/${notificationId}/read`)
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return api.put('/notifications/read-all')
  },
}

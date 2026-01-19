import { create } from 'zustand'
import { notificationService } from '@/services/notification.service'

interface Notification {
  id: number
  user_id: number
  notification_type: string
  title: string
  message: string
  entity_type?: string
  entity_id?: number
  is_read: boolean
  read_at?: number
  created_at: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean

  // Actions
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (notificationId: number) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export const useNotificationStore = create<NotificationState>()(
  (set) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
      set({ isLoading: true })
      try {
        const { data } = await notificationService.getNotifications()
        set({ notifications: data, isLoading: false })
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        set({ isLoading: false })
      }
    },

    fetchUnreadCount: async () => {
      try {
        const { data } = await notificationService.getUnreadCount()
        set({ unreadCount: data.count })
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    },

    markAsRead: async (notificationId: number) => {
      try {
        await notificationService.markAsRead(notificationId)
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }))
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    },

    markAllAsRead: async () => {
      try {
        await notificationService.markAllAsRead()
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        }))
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error)
      }
    },
  })
)

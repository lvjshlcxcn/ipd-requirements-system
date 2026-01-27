/**
 * useNotificationStore 测试
 *
 * 测试通知Store的所有功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { notificationService } from '@/services/notification.service'

// Mock notificationService
vi.mock('@/services/notification.service', () => ({
  notificationService: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}))

describe('useNotificationStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
    })
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const { result } = renderHook(() => useNotificationStore())

      expect(result.current.notifications).toEqual([])
      expect(result.current.unreadCount).toBe(0)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('fetchNotifications', () => {
    it('应该成功获取通知列表', async () => {
      const mockNotifications = [
        {
          id: 1,
          user_id: 1,
          notification_type: 'requirement_assigned',
          title: '新需求分配',
          message: '您被分配了一个新需求',
          is_read: false,
          created_at: '2026-01-26T00:00:00Z',
        },
        {
          id: 2,
          user_id: 1,
          notification_type: 'requirement_updated',
          title: '需求更新',
          message: '需求状态已更新',
          is_read: true,
          read_at: 1643142400,
          created_at: '2026-01-26T01:00:00Z',
        },
      ]

      vi.mocked(notificationService.getNotifications).mockResolvedValue({
        data: mockNotifications,
      })

      const { result } = renderHook(() => useNotificationStore())

      await act(async () => {
        await result.current.fetchNotifications()
      })

      expect(result.current.notifications).toEqual(mockNotifications)
      expect(result.current.notifications.length).toBe(2)
      expect(result.current.isLoading).toBe(false)
    })

    it('应该处理空通知列表', async () => {
      vi.mocked(notificationService.getNotifications).mockResolvedValue({
        data: [],
      })

      const { result } = renderHook(() => useNotificationStore())

      await act(async () => {
        await result.current.fetchNotifications()
      })

      expect(result.current.notifications).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })

    it('应该处理获取失败', async () => {
      vi.mocked(notificationService.getNotifications).mockRejectedValue(
        new Error('网络错误')
      )

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useNotificationStore())

      await act(async () => {
        await result.current.fetchNotifications()
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch notifications:',
        expect.any(Error)
      )
      expect(result.current.isLoading).toBe(false)
      expect(result.current.notifications).toEqual([])

      consoleSpy.mockRestore()
    })

    it('应该在加载期间设置isLoading为true', async () => {
      vi.mocked(notificationService.getNotifications).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ data: [] })
            }, 100)
          })
      )

      const { result } = renderHook(() => useNotificationStore())

      act(() => {
        result.current.fetchNotifications()
      })

      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150))
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('fetchUnreadCount', () => {
    it('应该成功获取未读数量', async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        data: { count: 5 },
      })

      const { result } = renderHook(() => useNotificationStore())

      await act(async () => {
        await result.current.fetchUnreadCount()
      })

      expect(result.current.unreadCount).toBe(5)
    })

    it('应该处理零未读', async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        data: { count: 0 },
      })

      const { result } = renderHook(() => useNotificationStore())

      await act(async () => {
        await result.current.fetchUnreadCount()
      })

      expect(result.current.unreadCount).toBe(0)
    })

    it('应该处理获取失败', async () => {
      vi.mocked(notificationService.getUnreadCount).mockRejectedValue(
        new Error('获取未读数失败')
      )

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useNotificationStore())

      await act(async () => {
        await result.current.fetchUnreadCount()
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch unread count:',
        expect.any(Error)
      )
      // 失败时不应修改unreadCount
      expect(result.current.unreadCount).toBe(0)

      consoleSpy.mockRestore()
    })
  })

  describe('markAsRead', () => {
    it('应该成功标记单个通知为已读', async () => {
      const notifications = [
        {
          id: 1,
          user_id: 1,
          notification_type: 'test',
          title: '测试通知1',
          message: '消息1',
          is_read: false,
          created_at: '2026-01-26T00:00:00Z',
        },
        {
          id: 2,
          user_id: 1,
          notification_type: 'test',
          title: '测试通知2',
          message: '消息2',
          is_read: false,
          created_at: '2026-01-26T01:00:00Z',
        },
      ]

      vi.mocked(notificationService.markAsRead).mockResolvedValue({})

      const { result } = renderHook(() => useNotificationStore())

      act(() => {
        result.current.notifications = notifications
        result.current.unreadCount = 2
      })

      expect(result.current.notifications[0].is_read).toBe(false)
      expect(result.current.unreadCount).toBe(2)

      await act(async () => {
        await result.current.markAsRead(1)
      })

      expect(result.current.notifications[0].is_read).toBe(true)
      expect(result.current.notifications[1].is_read).toBe(false)
      expect(result.current.unreadCount).toBe(1)

      expect(notificationService.markAsRead).toHaveBeenCalledWith(1)
    })

    it('应该处理标记失败', async () => {
      vi.mocked(notificationService.markAsRead).mockRejectedValue(
        new Error('标记失败')
      )

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const notifications = [
        {
          id: 1,
          user_id: 1,
          notification_type: 'test',
          title: '测试通知',
          message: '消息',
          is_read: false,
          created_at: '2026-01-26T00:00:00Z',
        },
      ]

      const { result } = renderHook(() => useNotificationStore())

      act(() => {
        result.current.notifications = notifications
        result.current.unreadCount = 1
      })

      await act(async () => {
        await result.current.markAsRead(1)
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to mark notification as read:',
        expect.any(Error)
      )
      // 失败时不应修改状态
      expect(result.current.notifications[0].is_read).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('markAllAsRead', () => {
    it('应该成功标记所有通知为已读', async () => {
      const notifications = [
        {
          id: 1,
          user_id: 1,
          notification_type: 'test',
          title: '测试通知1',
          message: '消息1',
          is_read: false,
          created_at: '2026-01-26T00:00:00Z',
        },
        {
          id: 2,
          user_id: 1,
          notification_type: 'test',
          title: '测试通知2',
          message: '消息2',
          is_read: false,
          created_at: '2026-01-26T01:00:00Z',
        },
        {
          id: 3,
          user_id: 1,
          notification_type: 'test',
          title: '测试通知3',
          message: '消息3',
          is_read: true,
          created_at: '2026-01-26T02:00:00Z',
        },
      ]

      vi.mocked(notificationService.markAllAsRead).mockResolvedValue({})

      const { result } = renderHook(() => useNotificationStore())

      act(() => {
        result.current.notifications = notifications
        result.current.unreadCount = 2
      })

      expect(result.current.unreadCount).toBe(2)

      await act(async () => {
        await result.current.markAllAsRead()
      })

      expect(result.current.notifications.every(n => n.is_read)).toBe(true)
      expect(result.current.unreadCount).toBe(0)

      expect(notificationService.markAllAsRead).toHaveBeenCalled()
    })

    it('应该处理空通知列表', async () => {
      vi.mocked(notificationService.markAllAsRead).mockResolvedValue({})

      const { result } = renderHook(() => useNotificationStore())

      act(() => {
        result.current.notifications = []
        result.current.unreadCount = 0
      })

      await act(async () => {
        await result.current.markAllAsRead()
      })

      expect(result.current.notifications).toEqual([])
      expect(result.current.unreadCount).toBe(0)
    })

    it('应该处理标记失败', async () => {
      vi.mocked(notificationService.markAllAsRead).mockRejectedValue(
        new Error('标记失败')
      )

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const notifications = [
        {
          id: 1,
          user_id: 1,
          notification_type: 'test',
          title: '测试通知',
          message: '消息',
          is_read: false,
          created_at: '2026-01-26T00:00:00Z',
        },
      ]

      const { result } = renderHook(() => useNotificationStore())

      act(() => {
        result.current.notifications = notifications
        result.current.unreadCount = 1
      })

      await act(async () => {
        await result.current.markAllAsRead()
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to mark all notifications as read:',
        expect.any(Error)
      )
      // 失败时不应修改状态
      expect(result.current.notifications[0].is_read).toBe(false)
      expect(result.current.unreadCount).toBe(1)

      consoleSpy.mockRestore()
    })
  })

  describe('未读计数管理', () => {
    it('应该正确维护未读计数', async () => {
      const notifications = [
        {
          id: 1,
          user_id: 1,
          notification_type: 'test',
          title: '通知1',
          message: '消息1',
          is_read: false,
          created_at: '2026-01-26T00:00:00Z',
        },
        {
          id: 2,
          user_id: 1,
          notification_type: 'test',
          title: '通知2',
          message: '消息2',
          is_read: false,
          created_at: '2026-01-26T01:00:00Z',
        },
        {
          id: 3,
          user_id: 1,
          notification_type: 'test',
          title: '通知3',
          message: '消息3',
          is_read: true,
          created_at: '2026-01-26T02:00:00Z',
        },
      ]

      vi.mocked(notificationService.markAsRead).mockResolvedValue({})

      const { result } = renderHook(() => useNotificationStore())

      act(() => {
        result.current.notifications = notifications
        result.current.unreadCount = 2
      })

      // 标记第一个为已读
      await act(async () => {
        await result.current.markAsRead(1)
      })

      expect(result.current.unreadCount).toBe(1)

      // 标记第二个为已读
      await act(async () => {
        await result.current.markAsRead(2)
      })

      expect(result.current.unreadCount).toBe(0)
    })

    it('应该防止未读计数为负数', async () => {
      const notifications = [
        {
          id: 1,
          user_id: 1,
          notification_type: 'test',
          title: '通知',
          message: '消息',
          is_read: true, // 已经是已读
          created_at: '2026-01-26T00:00:00Z',
        },
      ]

      vi.mocked(notificationService.markAsRead).mockResolvedValue({})

      const { result } = renderHook(() => useNotificationStore())

      act(() => {
        result.current.notifications = notifications
        result.current.unreadCount = 0
      })

      // 尝试标记已读的通知
      await act(async () => {
        await result.current.markAsRead(1)
      })

      // 应该保持为0，不会变成负数
      expect(result.current.unreadCount).toBe(0)
    })
  })

  describe('边界情况', () => {
    it('应该处理大量通知', async () => {
      const largeNotificationCount = 100
      const notifications = Array.from(
        { length: largeNotificationCount },
        (_, i) => ({
          id: i + 1,
          user_id: 1,
          notification_type: 'test',
          title: `通知${i + 1}`,
          message: `消息${i + 1}`,
          is_read: i % 2 === 0, // 一半已读一半未读
          created_at: '2026-01-26T00:00:00Z',
        })
      )

      vi.mocked(notificationService.getNotifications).mockResolvedValue({
        data: notifications,
      })

      const { result } = renderHook(() => useNotificationStore())

      await act(async () => {
        await result.current.fetchNotifications()
      })

      expect(result.current.notifications.length).toBe(largeNotificationCount)
    })

    it('应该处理特殊字符的通知内容', async () => {
      const notifications = [
        {
          id: 1,
          user_id: 1,
          notification_type: 'test',
          title: '标题包含特殊字符：!@#$%^&*()',
          message: '消息包含换行\n和引号"单引号\'',
          is_read: false,
          created_at: '2026-01-26T00:00:00Z',
        },
      ]

      vi.mocked(notificationService.getNotifications).mockResolvedValue({
        data: notifications,
      })

      const { result } = renderHook(() => useNotificationStore())

      await act(async () => {
        await result.current.fetchNotifications()
      })

      expect(result.current.notifications[0].title).toContain('!@#$%^&*()')
      expect(result.current.notifications[0].message).toContain('\n')
      expect(result.current.notifications[0].message).toContain('"')
    })

    it('应该处理极长的通知消息', async () => {
      const longMessage = 'x'.repeat(10000)

      const notifications = [
        {
          id: 1,
          user_id: 1,
          notification_type: 'test',
          title: '长消息通知',
          message: longMessage,
          is_read: false,
          created_at: '2026-01-26T00:00:00Z',
        },
      ]

      vi.mocked(notificationService.getNotifications).mockResolvedValue({
        data: notifications,
      })

      const { result } = renderHook(() => useNotificationStore())

      await act(async () => {
        await result.current.fetchNotifications()
      })

      expect(result.current.notifications[0].message.length).toBe(10000)
    })
  })
})

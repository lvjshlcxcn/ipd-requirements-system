/**
 * NotificationService 测试
 *
 * 测试通知服务相关的所有API调用
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { notificationService } from '@/services/notification.service'
import api from '@/services/api'

// Mock api模块
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getNotifications', () => {
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
      ]

      vi.mocked(api.get).mockResolvedValue({ data: mockNotifications })

      const result = await notificationService.getNotifications()

      expect(api.get).toHaveBeenCalledWith('/notifications', { params: undefined })
      expect(result.data).toEqual(mockNotifications)
    })

    it('应该处理空通知列表', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] })

      const result = await notificationService.getNotifications()

      expect(result.data).toEqual([])
    })

    it('应该处理获取失败', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('网络错误'))

      await expect(notificationService.getNotifications()).rejects.toThrow('网络错误')
    })
  })

  describe('getUnreadCount', () => {
    it('应该成功获取未读数量', async () => {
      const mockResponse = { data: { count: 5 } }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await notificationService.getUnreadCount()

      expect(api.get).toHaveBeenCalledWith('/notifications/unread-count')
      expect(result.data).toEqual({ count: 5 })
    })

    it('应该处理零未读', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: { count: 0 } })

      const result = await notificationService.getUnreadCount()

      expect(result.data.count).toBe(0)
    })
  })

  describe('markAsRead', () => {
    it('应该成功标记为已读', async () => {
      vi.mocked(api.put).mockResolvedValue({ success: true })

      await notificationService.markAsRead(1)

      expect(api.put).toHaveBeenCalledWith('/notifications/1/read')
    })

    it('应该处理标记失败', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('标记失败'))

      await expect(notificationService.markAsRead(1)).rejects.toThrow('标记失败')
    })
  })

  describe('markAllAsRead', () => {
    it('应该成功标记所有为已读', async () => {
      vi.mocked(api.put).mockResolvedValue({ success: true })

      await notificationService.markAllAsRead()

      expect(api.put).toHaveBeenCalledWith('/notifications/read-all')
    })

    it('应该处理批量标记失败', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('批量标记失败'))

      await expect(notificationService.markAllAsRead()).rejects.toThrow('批量标记失败')
    })
  })
})

import { create } from 'zustand'
import { Notification } from '@/types'
import api from '@/services/api'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (n: Notification) => void
  markRead: (id: string) => void
  markAllRead: () => void
  fetchAll: () => Promise<void>
  deleteNotification: (id: string) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (n) => {
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + (n.isRead ? 0 : 1),
    }))
  },

  markRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch {}
  },

  markAllRead: async () => {

    try {
      await api.put('/notifications/read-all')
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }))
    } catch {}
  },

  fetchAll: async () => {
    const token = localStorage.getItem('accessToken')
      if (!token) return 
    try {
      const { data } = await api.get('/notifications')
     const notifications: Notification[] = data.data.notifications || []
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      })
    } catch {}
  },

  deleteNotification: async (id) => {
    try {
      await api.delete(`/notifications/${id}`)
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: state.notifications.find((n) => n.id === id && !n.isRead)
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      }))
    } catch {}
  },
}))

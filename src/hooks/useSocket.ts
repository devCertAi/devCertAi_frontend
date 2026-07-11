import { useEffect } from 'react'
import { getSocket } from '@/services/socket'
import { useNotificationStore } from '@/store/notificationStore'
import toast from 'react-hot-toast'
import { Notification } from '@/types'

// Callback type for project:updated events — used by ProjectDetail and ProjectList
// to update their local state without a full page reload.
type ProjectUpdatedHandler = (data: { projectId: string; status: string; score: number; level: string }) => void

export function useSocket(userId?: string, onProjectUpdated?: ProjectUpdatedHandler) {
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (!userId) return
    const socket = getSocket()

    const handleEvalComplete = (data: { title: string; score: number; level: string; projectId: string }) => {
      const n: Notification = {
        id: Date.now().toString(),
        userId,
        type: 'evaluation_complete',
        title: 'Evaluation complete!',
        message: `${data.title} scored ${data.score}/100 (${data.level})`,
        isRead: false,
        data,
        createdAt: new Date().toISOString(),
      }
      addNotification(n)
      toast.success(n.message)
    }

    const handleExamResult = (data: { score: number; passed: boolean; level: string }) => {
      const n: Notification = {
        id: Date.now().toString(),
        userId,
        type: 'exam_result',
        title: data.passed ? '🎉 Exam Passed!' : 'Exam Result',
        message: `Score: ${data.score}/100 — ${data.level}`,
        isRead: false,
        data,
        createdAt: new Date().toISOString(),
      }
      addNotification(n)
      data.passed ? toast.success(n.message) : toast.error(n.message)
    }

    const handleCertReady = (data: { title: string }) => {
      const n: Notification = {
        id: Date.now().toString(),
        userId,
        type: 'certificate_ready',
        title: '🎓 Certificate Ready!',
        message: data.title,
        isRead: false,
        data,
        createdAt: new Date().toISOString(),
      }
      addNotification(n)
      toast.success('Your certificate is ready!')
    }

    // FIX: handle project:updated so ProjectDetail and ProjectList can react
    // to evaluation completion in real-time — updating the progress indicator
    // and revealing the report without a manual refresh.
    const handleProjectUpdated = (data: { projectId: string; status: string; score: number; level: string }) => {
      onProjectUpdated?.(data)
    }

    // FIX: notificationService.create() (used for every pipeline stage
    // update, selection, rejection, and ranking event) emits a generic
    // 'notification' socket event — see backend/src/services/
    // notificationService.js `_emit`. This listener never existed here, so
    // those in-app messages were saved to the DB but never delivered live;
    // only the separately-queued email arrived right away. Users saw an
    // email land instantly but the in-app notification only showed up on
    // next page load/refresh (via fetchAll). This restores real-time
    // delivery for all of them.
    const handleGenericNotification = (n: Notification) => {
      addNotification(n)
      if (n.title || n.message) {
        toast(n.title || n.message)
      }
    }

    socket.on('evaluation_complete', handleEvalComplete)
    socket.on('exam_result', handleExamResult)
    socket.on('certificate_ready', handleCertReady)
    socket.on('project:updated', handleProjectUpdated)
    socket.on('notification', handleGenericNotification)

    return () => {
      socket.off('evaluation_complete', handleEvalComplete)
      socket.off('exam_result', handleExamResult)
      socket.off('certificate_ready', handleCertReady)
      socket.off('project:updated', handleProjectUpdated)
      socket.off('notification', handleGenericNotification)
    }
  }, [userId, addNotification, onProjectUpdated])
}
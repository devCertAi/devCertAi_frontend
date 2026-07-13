import { useEffect } from 'react'
import { getSocket } from '@/services/socket'
import { useNotificationStore } from '@/store/notificationStore'
import toast from 'react-hot-toast'
import { Notification } from '@/types'

// Callback type for project:updated events — used by ProjectDetail and ProjectList
// to update their local state without a full page reload.
type ProjectUpdatedHandler = (data: { projectId: string; status: string; score: number; level: string; certificateReady?: boolean }) => void

/**
 * Global, app-wide socket listener for notifications + toasts.
 *
 * FIX (duplicate toasts): this hook used to also take an `onProjectUpdated`
 * callback, which meant every page that needed project:updated (ProjectDetail,
 * ProjectList) called this SAME hook a second time on top of the instance
 * already mounted in App.tsx. Since both instances attach a listener to the
 * same underlying socket singleton (`getSocket()` always returns the one
 * shared socket), every real-time notification — "Evaluation complete",
 * "Certificate Ready", pipeline stage updates, etc. — fired its toast/
 * addNotification TWICE while on those pages.
 *
 * `useSocket` now ONLY handles notifications and should be mounted exactly
 * ONCE for the whole app (App.tsx already does this). Anything that needs
 * to react to `project:updated` for a specific page should use
 * `useProjectUpdates` below instead — it's a separate, narrowly-scoped
 * listener that doesn't touch notifications at all, so mounting it per-page
 * can't cause duplicate toasts.
 */
export function useSocket(userId?: string) {
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

    // notificationService.create() (used for every pipeline stage update,
    // selection, rejection, ranking event, and certificate-ready event)
    // emits a generic 'notification' socket event — see backend/src/
    // services/notificationService.js `_emit`. This is the single listener
    // for that event across the whole app.
    const handleGenericNotification = (n: Notification) => {
      addNotification(n)
      if (n.title || n.message) {
        if (n.type === 'evaluation_failed') {
          toast.error(n.title || n.message)
        } else {
          toast(n.title || n.message)
        }
      }
    }

    socket.on('evaluation_complete', handleEvalComplete)
    socket.on('exam_result', handleExamResult)
    socket.on('certificate_ready', handleCertReady)
    socket.on('notification', handleGenericNotification)

    return () => {
      socket.off('evaluation_complete', handleEvalComplete)
      socket.off('exam_result', handleExamResult)
      socket.off('certificate_ready', handleCertReady)
      socket.off('notification', handleGenericNotification)
    }
  }, [userId, addNotification])
}

/**
 * Page-level listener for `project:updated` ONLY. Deliberately kept
 * separate from `useSocket` (see doc above) so a page can react to project
 * status/score/certificate changes in real time without re-attaching the
 * global notification listeners and causing duplicate toasts.
 *
 * Safe to mount from multiple pages (e.g. ProjectList and ProjectDetail
 * aren't mounted at the same time), and safe to mount alongside the single
 * global `useSocket()` instance in App.tsx, since App.tsx never passes a
 * project:updated callback of its own.
 */
export function useProjectUpdates(userId: string | undefined, onProjectUpdated: ProjectUpdatedHandler) {
  useEffect(() => {
    if (!userId) return
    const socket = getSocket()

    const handleProjectUpdated = (data: Parameters<ProjectUpdatedHandler>[0]) => {
      onProjectUpdated(data)
    }

    socket.on('project:updated', handleProjectUpdated)
    return () => {
      socket.off('project:updated', handleProjectUpdated)
    }
  }, [userId, onProjectUpdated])
}

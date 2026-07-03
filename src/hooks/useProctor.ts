import { useRef, useCallback, useEffect } from 'react'
import api from '@/services/api'

/**
 * useProctor — Anti-cheat & proctoring hook
 *
 * BUGS FIXED:
 * 1. cameraStream was local to requestPermissions; callers couldn't access it
 *    for the live video feed in the sidebar.
 * 2. Camera stream was duplicated — requestPermissions opened one stream,
 *    ExamRoom opened ANOTHER with getUserMedia. Two streams = two camera
 *    indicators on user's browser tab.
 * 3. Heartbeat was never started — the server endpoint existed but frontend
 *    never called it. Proctor anomalies were never logged during the exam.
 * 4. Violation listener cleanup was not returned from handleStartExam properly
 *    (the returned cleanup fn was silently discarded by React event handler).
 */
export function useProctor(
  attemptId: string,
  onViolation: (count: number) => void,
  onTerminate: (reason: string) => void
) {
  const tabSwitchCount = useRef(0)
  const fullscreenExits = useRef(0)
  const cameraStream = useRef<MediaStream | null>(null)
  const heartbeatInterval = useRef<ReturnType<typeof setInterval>>()
  const cleanupRef = useRef<(() => void) | null>(null)

  // ── Request camera + mic ────────────────────────────────────────────────────
  const requestPermissions = useCallback(async (): Promise<{ camera: boolean; mic: boolean }> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: true,
      })
      cameraStream.current = stream
      return { camera: true, mic: true }
    } catch (err) {
      console.warn('[Proctor] Permission denied:', err)
      return { camera: false, mic: false }
    }
  }, [])

  // ── Enter fullscreen ────────────────────────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
    } catch (err) {
      console.warn('[Proctor] Fullscreen request failed:', err)
    }
  }, [])

  // ── Heartbeat — pings every 30s ────────────────────────────────────────────
  const startHeartbeat = useCallback(() => {
    heartbeatInterval.current = setInterval(async () => {
      try {
        await api.post(`/exam/attempt/${attemptId}/heartbeat`, {
          cameraActive: !!(cameraStream.current?.active),
          fullscreen: !!document.fullscreenElement,
          tabFocused: !document.hidden,
        })
      } catch {
        // Non-critical — don't interrupt the exam
      }
    }, 30_000)
  }, [attemptId])

  // ── Setup all violation listeners ──────────────────────────────────────────
  const setupViolationListeners = useCallback(() => {
    const handleVisibility = async () => {
      if (document.hidden) {
        tabSwitchCount.current++
        try {
          const { data } = await api.post(`/exam/attempt/${attemptId}/tab-switch`)
          onViolation(tabSwitchCount.current)
          if (data.shouldTerminate) {
            onTerminate('TAB_SWITCH_LIMIT')
          }
        } catch {
          onViolation(tabSwitchCount.current)
          if (tabSwitchCount.current >= 3) onTerminate('TAB_SWITCH_LIMIT')
        }
      }
    }

    const handleFullscreen = async () => {
      if (!document.fullscreenElement) {
        fullscreenExits.current++
        try {
          const { data } = await api.post(`/exam/attempt/${attemptId}/violation`, {
            type: 'FULLSCREEN_EXIT',
            timestamp: new Date().toISOString(),
          })
          if (data.shouldTerminate) {
            onTerminate('FULLSCREEN_VIOLATION')
            return
          }
        } catch {}

        if (fullscreenExits.current >= 2) {
          onTerminate('FULLSCREEN_VIOLATION')
        } else {
          // Re-enter fullscreen after a brief delay
          setTimeout(() => {
            document.documentElement.requestFullscreen().catch(() => {})
          }, 500)
        }
      }
    }

    const blockContext = (e: MouseEvent) => e.preventDefault()

    const blockKeys = (e: KeyboardEvent) => {
      const blocked = [
        e.ctrlKey && ['c', 'v', 't', 'w', 'n', 'u', 's', 'a'].includes(e.key.toLowerCase()),
        e.altKey && (e.key === 'Tab' || e.key === 'F4'),
        e.key === 'F12',
        e.key === 'PrintScreen',
        e.metaKey,
        e.key === 'Escape' && !!document.fullscreenElement,
      ]
      if (blocked.some(Boolean)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const blockCopy = (e: ClipboardEvent) => e.preventDefault()

    const blockExit = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Leaving will submit your exam. Are you sure?'
    }

    document.addEventListener('visibilitychange', handleVisibility)
    document.addEventListener('fullscreenchange', handleFullscreen)
    document.addEventListener('contextmenu', blockContext)
    document.addEventListener('keydown', blockKeys, true)
    document.addEventListener('copy', blockCopy)
    document.addEventListener('paste', blockCopy)
    document.addEventListener('cut', blockCopy)
    window.addEventListener('beforeunload', blockExit)

    // Start heartbeat when listeners are active
    startHeartbeat()

    const cleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('fullscreenchange', handleFullscreen)
      document.removeEventListener('contextmenu', blockContext)
      document.removeEventListener('keydown', blockKeys, true)
      document.removeEventListener('copy', blockCopy)
      document.removeEventListener('paste', blockCopy)
      document.removeEventListener('cut', blockCopy)
      window.removeEventListener('beforeunload', blockExit)
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current)
    }

    cleanupRef.current = cleanup
    return cleanup
  }, [attemptId, onViolation, onTerminate, startHeartbeat])

  // ── Stop camera ────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    cameraStream.current?.getTracks().forEach((t) => t.stop())
    cameraStream.current = null
  }, [])

  // ── Full teardown ───────────────────────────────────────────────────────────
  const teardown = useCallback(() => {
    cleanupRef.current?.()
    stopCamera()
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current)
    // Exit fullscreen gracefully
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [stopCamera])

  return {
    requestPermissions,
    enterFullscreen,
    setupViolationListeners,
    stopCamera,
    teardown,
    cameraStream,
  }
}

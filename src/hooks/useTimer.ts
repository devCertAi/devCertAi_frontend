import { useRef, useCallback, useEffect } from 'react'


export function useTimer(
  totalSeconds: number,
  attemptId: string,
  onTick: (remaining: number) => void,
  onExpire: () => void
) {
  const STORAGE_KEY = `exam_timer_${attemptId}`

  // useRef does NOT support lazy initializers — compute the initial value eagerly
  const getInitialRemaining = () => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    const parsed = stored ? parseInt(stored) : NaN
    if (!isNaN(parsed) && parsed > 0 && parsed <= totalSeconds) return parsed
    return totalSeconds
  }
  const remaining = useRef<number>(getInitialRemaining())

  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const hasStarted = useRef(false)

  // BUG FIX: `useRef`'s initializer only runs on the very first render, so
  // if `totalSeconds` arrives late (e.g. the exam attempt is still loading
  // when this hook first mounts with a fallback default), `remaining` gets
  // permanently stuck at that stale fallback — the countdown then starts
  // from the wrong value once the real `totalSeconds` shows up. Re-sync
  // `remaining` whenever `totalSeconds` changes, as long as the timer
  // hasn't started ticking yet.
  useEffect(() => {
    if (hasStarted.current) return
    remaining.current = getInitialRemaining()
    onTick(remaining.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const start = useCallback(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    intervalRef.current = setInterval(() => {
      remaining.current -= 1
      // Persist every tick so we don't lose progress on refresh
      sessionStorage.setItem(STORAGE_KEY, String(remaining.current))
      onTick(remaining.current)

      if (remaining.current <= 0) {
        clearInterval(intervalRef.current)
        sessionStorage.removeItem(STORAGE_KEY)
        onExpire()
      }
    }, 1000)
  }, [STORAGE_KEY, onTick, onExpire])

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [STORAGE_KEY])

  const getRemaining = () => remaining.current

  return { start, stop, getRemaining }
}
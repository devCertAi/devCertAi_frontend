import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ExamTimer } from './ExamTimer'
import { Button } from '@/components/ui/Button'
import { VideoOff } from 'lucide-react'
import { Question } from '@/types'

interface ExamSidebarProps {
  total: number
  current: number
  answers: Record<string, string>
  phase: number
  questions: Question[]
  markedForReview: Set<number>
  timeRemaining: number
  cameraStream: React.RefObject<MediaStream | null>
  onJump: (i: number) => void
  onSubmit: () => void
  violationCount: number
}

/**
 * ExamSidebar
 *
 * BUGS FIXED:
 * 1. Camera video element was rendered with an inline ref callback that set
 *    srcObject on every render — this caused a new getUserMedia call each time
 *    the component re-rendered (e.g. on timer tick), blinking the camera.
 *    Fixed using a stable useRef + useEffect that only sets srcObject once.
 * 2. answered count used Object.keys(answers).length — but for Phase 1 answers
 *    are keyed by question.id (string), for Phase 2 by index. The display was
 *    correct but now explicitly documented and consistent with the store.
 * 3. Camera "Live" badge always showed green even when stream was null/inactive.
 *    Fixed to check stream.active.
 */
export function ExamSidebar({
  total, current, answers, phase, questions, markedForReview,
  timeRemaining, cameraStream, onJump, onSubmit, violationCount,
}: ExamSidebarProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Stable effect — only re-run when the stream reference changes
  useEffect(() => {
    const video = videoRef.current
    const stream = cameraStream.current
    if (video && stream) {
      video.srcObject = stream
    }
  }, [cameraStream.current]) // eslint-disable-line react-hooks/exhaustive-deps

  const isStreamActive = !!(cameraStream.current?.active)

  // Count answered questions correctly per phase
  const answeredCount = questions.filter((q, i) => {
    const key = phase === 1 ? q.id : String(i)
    return !!answers[key]
  }).length

  return (
    <div className="w-64 flex flex-col gap-4">
      {/* Question navigator */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
        <h3 className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-3">
          Navigator
        </h3>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: total }).map((_, i) => {
            const q = questions[i]
            const key = phase === 1 ? q?.id : String(i)
            const isAnswered = key ? !!answers[key] : false

            return (
              <button
                key={i}
                onClick={() => onJump(i)}
                className={cn(
                  'w-9 h-9 rounded-lg text-xs font-medium transition-all',
                  i === current
                    ? 'bg-[var(--color-primary)] text-[var(--color-inverse)]'
                    : isAnswered
                    ? 'bg-[color-mix(in_srgb,var(--color-success)_20%,transparent)] text-[var(--color-success)] border border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]'
                    : markedForReview.has(i)
                    ? 'bg-[color-mix(in_srgb,var(--color-warning)_20%,transparent)] text-[var(--color-warning)] border border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]'
                    : 'bg-[var(--color-surface2)] text-[var(--color-muted)] hover:bg-[var(--color-surface2)]'
                )}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3 mt-3 text-[10px] text-[var(--color-muted)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-[color-mix(in_srgb,var(--color-success)_30%,transparent)] inline-block" />
            Answered
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-[color-mix(in_srgb,var(--color-warning)_30%,transparent)] inline-block" />
            Review
          </span>
        </div>
      </div>

      {/* Camera monitor */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3">
        <div className="relative w-full aspect-video bg-[var(--color-bg)] rounded-xl overflow-hidden mb-2">
          {isStreamActive ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-1">
              <VideoOff size={20} className="text-[var(--color-muted)]" />
              <span className="text-[10px] text-[var(--color-muted)]">No camera</span>
            </div>
          )}
          {/* Live indicator */}
          <div className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full ${
            isStreamActive
              ? 'bg-[color-mix(in_srgb,var(--color-success)_20%,transparent)] border border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]'
              : 'bg-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)]'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isStreamActive ? 'bg-[var(--color-success)] animate-pulse' : 'bg-[var(--color-danger)]'
            }`} />
            <span className={`text-[9px] font-medium ${
              isStreamActive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
            }`}>
              {isStreamActive ? 'Live' : 'Off'}
            </span>
          </div>
        </div>
        {violationCount > 0 && (
          <p className="text-xs text-[var(--color-warning)] text-center">
            ⚠️ {violationCount} violation{violationCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Timer */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
        <p className="text-xs text-[var(--color-muted)] mb-2">Time Remaining</p>
        <ExamTimer seconds={timeRemaining} />
        <div className="mt-3 text-xs text-[var(--color-muted)]">
          <span className="text-[var(--color-text)] font-medium">{answeredCount}</span>{' '}
          / {total} answered
        </div>
      </div>

      <Button variant="danger" onClick={onSubmit} className="w-full">
        Submit Exam
      </Button>
    </div>
  )
}

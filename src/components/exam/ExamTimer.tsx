import { formatTimer } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface ExamTimerProps { seconds: number }

export function ExamTimer({ seconds }: ExamTimerProps) {
  const color = seconds <= 60 ? 'var(--color-danger)' : seconds <= 300 ? 'var(--color-warning)' : 'var(--color-text)'
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)]">
      <Clock size={15} style={{ color }} />
      <span className="font-mono text-base font-bold tabular-nums" style={{ color }}>{formatTimer(seconds)}</span>
    </div>
  )
}

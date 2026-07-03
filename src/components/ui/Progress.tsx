import { cn } from '@/lib/utils'
interface ProgressProps { value: number; max?: number; className?: string; color?: string; showLabel?: boolean }
export function Progress({ value, max = 100, className, color = 'var(--color-primary)', showLabel }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-2 bg-[var(--color-surface2)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {showLabel && <div className="flex justify-between mt-1"><span className="text-xs text-[var(--color-muted)]">{value}</span><span className="text-xs text-[var(--color-muted)]">{max}</span></div>}
    </div>
  )
}

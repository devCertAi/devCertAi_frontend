import { Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatDeadline, isPastDate, getDaysRemaining, isToday } from '@/lib/utils'

interface DeadlineDisplayProps {
  date: string | Date | null | undefined
  label?: string
  showTime?: boolean
  showIcon?: boolean
  timezone?: string
  variant?: 'default' | 'compact' | 'inline'
  showStatus?: boolean
}

/**
 * Standardized deadline display component
 * 
 * Formats: 
 * - Default: "24 Jul 2026 • 11:59 PM IST"
 * - Compact: "Jul 24, 11:59 PM"
 * - Inline: "Deadline: Jul 24, 2026 at 11:59 PM IST"
 * 
 * Status indicators:
 * - Past: Red with warning icon
 * - Today: Orange with alert icon
 * - Future: Blue with calendar icon
 */
export function DeadlineDisplay({
  date,
  label,
  showTime = true,
  showIcon = true,
  timezone,
  variant = 'default',
  showStatus = true,
}: DeadlineDisplayProps) {
  if (!date) {
    return (
      <div className="flex items-center gap-2 text-[var(--color-muted)]">
        {showIcon && <Calendar size={14} />}
        <span className="text-sm">No deadline set</span>
      </div>
    )
  }

  const isPast = isPastDate(date)
  const isTodayDate = isToday(date)
  const daysRemaining = getDaysRemaining(date)

  const getStatusColor = () => {
    if (isPast) return 'text-[var(--color-danger)]'
    if (isTodayDate) return 'text-[var(--color-warning)]'
    return 'text-[var(--color-primary)]'
  }

  const getStatusIcon = () => {
    if (isPast) return <AlertTriangle size={14} className={getStatusColor()} />
    if (isTodayDate) return <AlertTriangle size={14} className={getStatusColor()} />
    return <Calendar size={14} className={getStatusColor()} />
  }

  const getStatusText = () => {
    if (isPast) return 'Expired'
    if (isTodayDate) return 'Today'
    if (daysRemaining === 1) return 'Tomorrow'
    if (daysRemaining < 7) return `${daysRemaining} days left`
    return null
  }

  const formatDisplay = () => {
    if (showTime) {
      return formatDeadline(date, timezone)
    }
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date))
  }

  const renderDefault = () => (
    <div className="flex items-center gap-2">
      {showIcon && getStatusIcon()}
      <div className="flex flex-col">
        {label && <span className="text-xs font-medium text-[var(--color-muted)] mb-0.5">{label}</span>}
        <span className={`text-sm font-medium ${getStatusColor()}`}>{formatDisplay()}</span>
        {showStatus && getStatusText() && (
          <span className={`text-xs ${getStatusColor()} mt-0.5`}>{getStatusText()}</span>
        )}
      </div>
    </div>
  )

  const renderCompact = () => (
    <div className="flex items-center gap-1.5">
      {showIcon && <Clock size={12} className={getStatusColor()} />}
      <span className={`text-xs font-medium ${getStatusColor()}`}>
        {new Intl.DateTimeFormat('en-US', {
          day: 'numeric',
          month: 'short',
        }).format(new Date(date))}
        {showTime && `, ${new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(new Date(date))}`}
      </span>
    </div>
  )

  const renderInline = () => (
    <div className="inline-flex items-center gap-2">
      {label && <span className="text-sm text-[var(--color-muted)]">{label}:</span>}
      {showIcon && getStatusIcon()}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {formatDisplay()}
      </span>
      {showStatus && getStatusText() && (
        <span className={`text-xs ${getStatusColor()} ml-1`}>({getStatusText()})</span>
      )}
    </div>
  )

  switch (variant) {
    case 'compact':
      return renderCompact()
    case 'inline':
      return renderInline()
    default:
      return renderDefault()
  }
}

/**
 * Compact deadline badge for cards and lists
 */
export function DeadlineBadge({
  date,
  timezone,
}: {
  date: string | Date | null | undefined
  timezone?: string
}) {
  if (!date) return null

  const isPast = isPastDate(date)
  const isTodayDate = isToday(date)
  const daysRemaining = getDaysRemaining(date)

  const getBadgeColor = () => {
    if (isPast) return 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20'
    if (isTodayDate) return 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20'
    return 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20'
  }

  const getBadgeText = () => {
    if (isPast) return 'Expired'
    if (isTodayDate) return 'Today'
    if (daysRemaining === 1) return 'Tomorrow'
    if (daysRemaining < 7) return `${daysRemaining}d left`
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(date))
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getBadgeColor()}`}>
      <Clock size={10} />
      {getBadgeText()}
    </span>
  )
}

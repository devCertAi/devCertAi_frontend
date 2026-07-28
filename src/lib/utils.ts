import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// ─── Date Formatting Utilities ─────────────────────────────────────────────────

/**
 * Standardized date formatter for display
 * Format: 24 Jul 2026
 */
export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/**
 * Standardized datetime formatter for display
 * Format: 24 Jul 2026, 11:59 PM
 */
export function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

/**
 * Standardized deadline formatter with timezone
 * Format: 24 Jul 2026 • 11:59 PM [Timezone]
 */
export function formatDeadline(date: string | Date | null | undefined, timezone?: string) {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  
  // Get user's local timezone abbreviation
  const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const timeZoneName = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).format(d)
  
  const dateStr = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
  const timeStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: userTimezone,
  }).format(d)
  return `${dateStr} • ${timeStr} ${timeZoneName}`
}

/**
 * Format date with full month name
 * Format: July 24, 2026
 */
export function formatDateFull(date: string | Date | null | undefined) {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/**
 * Format datetime with full month name
 * Format: July 24, 2026 at 11:59 PM
 */
export function formatDateTimeFull(date: string | Date | null | undefined) {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

/**
 * Relative time formatter
 * Format: "2d ago", "5h ago", "30m ago", "just now"
 */
export function formatRelativeTime(date: string | Date) {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

/**
 * Timer formatter for countdown
 * Format: "MM:SS"
 */
export function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Extended timer formatter with hours
 * Format: "HH:MM:SS"
 */
export function formatTimerExtended(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  const d = new Date(date)
  const now = new Date()
  return d.getTime() < now.getTime()
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const d = new Date(date)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

/**
 * Get days remaining until a date
 */
export function getDaysRemaining(date: string | Date): number {
  const d = new Date(date)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Color Utilities ───────────────────────────────────────────────────────────

export function getLevelColor(level: string) {
  switch (level) {
    case 'Advanced': return '#FFD700'
    case 'Intermediate': return '#C0C0C0'
    case 'Beginner': return '#CD7F32'
    default: return 'var(--color-primary)'
  }
}

export function getScoreColor(score: number) {
  if (score >= 75) return 'var(--color-success)'
  if (score >= 50) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'success'
    case 'evaluating': return 'warning'
    case 'pending': return 'muted'
    case 'failed': return 'danger'
    default: return 'muted'
  }
}

// ─── String Utilities ─────────────────────────────────────────────────────────

export function truncate(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { formatRelativeTime } from '@/lib/utils'

interface NotificationPanelProps { onClose: () => void }

// Works out where a notification should take the user when clicked, so they
// land straight on the apply page (or their application) instead of having
// to go hunt for it themselves.
function resolveNotificationLink(n: { type: string; data?: Record<string, unknown> }): string | null {
  const data = n.data || {}
  switch (n.type) {
    case 'evaluation_complete':
    case 'evaluation_failed':
      return data.projectId ? `/projects/${data.projectId}` : null
    case 'job_match':
      return data.slug ? `/apply/${data.slug}` : null
    case 'job_match_digest': {
      const postings = data.postings as { slug?: string }[] | undefined
      const first = postings?.[0]
      return first?.slug ? `/apply/${first.slug}` : null
    }
    case 'application_selected':
    case 'application_rejected':
    case 'assignment_reminder':
    case 'exam_reminder':
      return data.applicationId ? `/applications/${data.applicationId}` : null
    case 'ranking_complete':
      return data.jobPostingId ? `/recruiter/postings/${data.jobPostingId}/ranked` : null
    case 'decisions_sent':
      return data.jobPostingId ? `/recruiter/postings/${data.jobPostingId}` : null
    default:
      return null
  }
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markRead, markAllRead, deleteNotification } = useNotificationStore()
  const navigate = useNavigate()

  const handleOpen = (n: { id: string; isRead: boolean; type: string; data?: Record<string, unknown> }) => {
    if (!n.isRead) markRead(n.id)
    const link = resolveNotificationLink(n)
    if (link) {
      navigate(link)
      onClose()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute right-0 mt-2 w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Notifications</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={markAllRead} className="p-1 rounded hover:bg-[var(--color-surface2)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors" title="Mark all read">
            <CheckCheck size={14} />
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--color-surface2)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell size={28} className="text-[var(--color-muted)] mx-auto mb-2 opacity-40" />
            <p className="text-sm text-[var(--color-muted)]">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const link = resolveNotificationLink(n)
            return (
              <div
                key={n.id}
                onClick={() => handleOpen(n)}
                role={link ? 'button' : undefined}
                className={`flex gap-3 p-3 border-b border-[var(--color-border)] hover:bg-[var(--color-surface2)] transition-colors ${!n.isRead ? 'bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]' : ''} ${link ? 'cursor-pointer' : ''}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${!n.isRead ? 'bg-[var(--color-primary)]' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text)] flex items-center gap-1">
                    {n.title}
                    {link && <ExternalLink size={10} className="text-[var(--color-muted)] flex-shrink-0" />}
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-[color-mix(in_srgb,var(--color-muted)_60%,transparent)] mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>
                <div className="flex items-start gap-0.5">
                  {!n.isRead && (
                    <button onClick={(e) => { e.stopPropagation(); markRead(n.id) }} className="p-1 rounded hover:bg-[var(--color-surface2)] text-[var(--color-muted)] hover:text-[var(--color-success)] transition-colors">
                      <Check size={12} />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }} className="p-1 rounded hover:bg-[var(--color-surface2)] text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}

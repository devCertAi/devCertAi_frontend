import { ActivityItem } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import { Activity } from 'lucide-react'

interface ActivityFeedProps { items: ActivityItem[] }

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) return (
    <div className="text-center py-8"><Activity size={24} className="text-[var(--color-muted)] mx-auto mb-2 opacity-40" /><p className="text-sm text-[var(--color-muted)]">No activity yet</p></div>
  )
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3 items-start">
          <div className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full mt-2 flex-shrink-0" />
          <div>
            <p className="text-sm text-[var(--color-text)]">{item.message}</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">{formatRelativeTime(item.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

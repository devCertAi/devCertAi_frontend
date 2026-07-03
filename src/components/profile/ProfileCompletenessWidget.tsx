/**
 * ProfileCompletenessWidget.tsx
 *
 * Reusable sidebar / dashboard card showing profile completeness.
 * Used in:
 *   - Dashboard sidebar
 *   - Profile page
 *
 * Props:
 *   compact?: boolean  — smaller variant for sidebars
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import api from '@/services/api'

interface Section {
  key: string
  label: string
  weight: number
  done: boolean
  missing: string[]
}

interface Completeness {
  percentage: number
  isComplete: boolean
  sections: Section[]
  missingFields: string[]
}

interface Props {
  compact?: boolean
  /** Called when the user clicks "Complete your profile" — lets the parent open the edit form */
  onEditClick?: () => void
}

export default function ProfileCompletenessWidget({ compact = false, onEditClick }: Props) {
  const [data, setData] = useState<Completeness | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/profile-completeness')
      .then(({ data }) => setData(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card className={`flex items-center justify-center ${compact ? 'p-4' : 'p-6'}`}>
        <Loader2 size={18} className="animate-spin text-[var(--color-muted)]" />
      </Card>
    )
  }

  if (!data) return null

  const { percentage, isComplete, sections } = data

  const barColor = isComplete
    ? 'var(--color-success)'
    : percentage >= 50
    ? 'var(--color-warning, #f59e0b)'
    : 'var(--color-error, #ef4444)'

  if (compact) {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-text)]">Profile Strength</span>
          <span className="text-sm font-bold" style={{ color: barColor }}>{percentage}%</span>
        </div>

        <div className="w-full bg-[var(--color-border)] rounded-full h-1.5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: barColor }} />
        </div>

        {isComplete ? (
          <p className="text-xs text-[var(--color-success)] flex items-center gap-1">
            <CheckCircle2 size={12} /> Ready to apply to any job
          </p>
        ) : onEditClick ? (
          <button onClick={onEditClick} className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
            Complete your profile <ChevronRight size={12} />
          </button>
        ) : (
          <Link to="/profile-detail" className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
            Complete your profile <ChevronRight size={12} />
          </Link>
        )}
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[var(--color-text)]">Profile Completeness</h3>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            {isComplete ? 'Ready to apply — no resume upload needed each time.' : 'Reach 70% to start applying instantly.'}
          </p>
        </div>
        <div className="text-2xl font-bold" style={{ color: barColor }}>{percentage}%</div>
      </div>

      {/* Bar */}
      <div className="w-full bg-[var(--color-border)] rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage}%`, background: barColor }} />
      </div>

      {/* Section checklist */}
      <div className="space-y-0 divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        {sections.map(s => (
          <div key={s.key} className="flex items-center gap-3 px-4 py-2.5">
            <div
              className="rounded-full flex-shrink-0"
              style={{ width: 16, height: 16, background: s.done ? 'var(--color-success)' : 'var(--color-border)' }}
            >
              {s.done && (
                <svg viewBox="0 0 16 16" fill="none" className="w-full h-full">
                  <path d="M3.5 8l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${s.done ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]'}`}>
                {s.label}
                <span className="ml-1.5 text-xs opacity-60">+{s.weight}%</span>
              </p>
              {!s.done && s.missing.length > 0 && (
                <p className="text-xs text-[color-mix(in_srgb,var(--color-warning,#f59e0b)_80%,transparent)] truncate">
                  {s.missing[0]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {isComplete ? (
        <div className="flex items-center gap-2 text-sm text-[var(--color-success)]">
          <CheckCircle2 size={16} />
          <span className="font-medium">Profile complete — apply instantly!</span>
        </div>
      ) : onEditClick ? (
        <Button className="w-full" onClick={onEditClick}>
          Complete Profile <ChevronRight size={14} className="ml-1" />
        </Button>
      ) : (
        <Link to="/profile-detail">
          <Button className="w-full">
            Complete Profile <ChevronRight size={14} className="ml-1" />
          </Button>
        </Link>
      )}
    </Card>
  )
}
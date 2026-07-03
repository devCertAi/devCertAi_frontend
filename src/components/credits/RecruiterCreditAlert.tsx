/**
 * RecruiterCreditAlert.tsx
 *
 * Shown when a recruiter starts a hiring pipeline but doesn't have enough
 * credits for all CVs. Offers two paths:
 *   1. Add more credits (link to pricing)
 *   2. Continue anyway — only `creditsAvailable` CVs will be processed;
 *      the rest are auto-rejected (not selected) with a clear UI indicator.
 */

import { AlertTriangle, CreditCard, Users, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export interface CreditWarning {
  code: string
  creditsNeeded: number
  creditsAvailable: number
  shortfall: number
  message: string
}

interface Props {
  warning: CreditWarning
  onContinueAnyway: () => void
  onCancel: () => void
}

export function RecruiterCreditAlert({ warning, onContinueAnyway, onCancel }: Props) {
  return (
    <div className="bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle size={18} className="text-[var(--color-warning)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text)] text-sm mb-0.5">
              Insufficient Credits for All CVs
            </h3>
            <p className="text-xs text-[var(--color-muted)]">
              {warning.message}
            </p>
          </div>
        </div>
        <button onClick={onCancel} className="text-[var(--color-muted)] hover:text-[var(--color-text)] p-1">
          <X size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[var(--color-surface)] rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-[var(--color-text)]">{warning.creditsNeeded}</p>
          <p className="text-xs text-[var(--color-muted)]">CVs to process</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-[var(--color-warning)]">{warning.creditsAvailable}</p>
          <p className="text-xs text-[var(--color-muted)]">Credits available</p>
        </div>
      </div>

      {/* What happens if you continue */}
      <div className="bg-[var(--color-surface)] rounded-xl p-3 mb-4">
        <p className="text-xs font-medium text-[var(--color-text)] mb-1">If you continue anyway:</p>
        <ul className="text-xs text-[var(--color-muted)] space-y-0.5">
          <li className="flex items-center gap-1.5">
            <Users size={10} />
            First {warning.creditsAvailable} CVs will be processed normally
          </li>
          <li className="flex items-center gap-1.5 text-[var(--color-danger)]">
            <X size={10} />
            Remaining {warning.shortfall} CVs will be auto-rejected (not selected)
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link to="/pricing" className="flex-1">
          <Button variant="primary" size="sm" className="w-full text-xs">
            <CreditCard size={13} className="mr-1.5" />
            Buy Credits
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]"
          onClick={onContinueAnyway}
        >
          Continue ({warning.creditsAvailable} CVs only)
        </Button>
      </div>
    </div>
  )
}

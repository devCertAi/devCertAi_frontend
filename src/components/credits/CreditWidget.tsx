/**
 * CreditWidget.tsx — Displays credit balance with expiry, usage, and upgrade CTA
 *
 * Shows:
 * - Skill exam credits remaining (free + bonus)
 * - Project evaluation credits remaining (free + bonus)
 * - When purchased credits expire
 * - When free credits reset
 * - Lock icon if credits = 0
 * - Upgrade button if not premium
 */

import { Link } from 'react-router-dom'
import { Zap, BookOpen, FolderOpen, RefreshCw, Lock, Crown, AlertTriangle, ChevronRight } from 'lucide-react'
import { useCredits, CreditBalance } from '@/hooks/useCredits'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

interface CreditRowProps {
  icon: React.ReactNode
  label: string
  used: number
  limit: number
  bonus: number
  remaining: number
  isPremium: boolean
}

function CreditRow({ icon, label, used, limit, bonus, remaining, isPremium }: CreditRowProps) {
  const pct = isPremium ? 100 : limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const isLow = !isPremium && remaining <= 1
  const isEmpty = !isPremium && remaining === 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <span className="text-[var(--color-muted)]">{icon}</span>
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          {isEmpty && !isPremium && <Lock size={12} className="text-[var(--color-danger)]" />}
          {isLow && !isEmpty && <AlertTriangle size={12} className="text-[var(--color-warning)]" />}
          <span className={cn(
            'text-sm font-medium',
            isPremium ? 'text-[var(--color-primary)]' :
            isEmpty ? 'text-[var(--color-danger)]' :
            isLow ? 'text-[var(--color-warning)]' :
            'text-[var(--color-text)]'
          )}>
            {isPremium ? '∞' : remaining}
          </span>
          {bonus > 0 && !isPremium && (
            <span className="text-xs text-[var(--color-muted)]">
              ({limit - used} free + {bonus} bonus)
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!isPremium && (
        <div className="h-1.5 rounded-full bg-[var(--color-surface2)] overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isEmpty ? 'bg-[var(--color-danger)]' :
              isLow ? 'bg-[var(--color-warning)]' :
              'bg-[var(--color-primary)]'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

interface CreditWidgetProps {
  className?: string
  compact?: boolean
}

export function CreditWidget({ className, compact = false }: CreditWidgetProps) {
  const { balance, loading, isPremium } = useCredits()

  if (loading) {
    return (
      <div className={cn('bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-[var(--color-surface2)] rounded w-24" />
          <div className="h-3 bg-[var(--color-surface2)] rounded" />
          <div className="h-3 bg-[var(--color-surface2)] rounded" />
        </div>
      </div>
    )
  }

  const resetDays = daysUntil(balance.cycleResetAt)
  const bonusDays = daysUntil(balance.purchasedExpiresAt)
  const hasPurchasedCredits = (balance.skill.bonus + balance.project.bonus) > 0
  const anyEmpty = balance.skill.remaining === 0 || balance.project.remaining === 0

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex items-center gap-1.5 text-sm">
          <BookOpen size={13} className="text-[var(--color-muted)]" />
          <span className={cn('font-medium', balance.skill.remaining === 0 && !isPremium ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]')}>
            {isPremium ? '∞' : balance.skill.remaining}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <FolderOpen size={13} className="text-[var(--color-muted)]" />
          <span className={cn('font-medium', balance.project.remaining === 0 && !isPremium ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]')}>
            {isPremium ? '∞' : balance.project.remaining}
          </span>
        </div>
        {!isPremium && anyEmpty && (
          <Link to="/pricing">
            <Button size="sm" className="text-xs h-7">Top Up</Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className={cn('bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] flex items-center justify-center">
            <Zap size={14} className="text-[var(--color-primary)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Credits</h3>
        </div>
        {isPremium && (
          <div className="flex items-center gap-1 text-xs text-[var(--color-primary)] font-medium">
            <Crown size={12} />
            Premium
          </div>
        )}
      </div>

      {/* Credit rows */}
      <div className="space-y-4 mb-4">
        <CreditRow
          icon={<BookOpen size={13} />}
          label="Skill Exams"
          used={balance.skill.used}
          limit={balance.skill.limit}
          bonus={balance.skill.bonus}
          remaining={balance.skill.remaining}
          isPremium={isPremium}
        />
        <CreditRow
          icon={<FolderOpen size={13} />}
          label="Project Evals"
          used={balance.project.used}
          limit={balance.project.limit}
          bonus={balance.project.bonus}
          remaining={balance.project.remaining}
          isPremium={isPremium}
        />
      </div>

      {/* Expiry info */}
      {!isPremium && (
        <div className="space-y-1 border-t border-[var(--color-border)] pt-3 mb-4">
          {balance.cycleResetAt && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
              <RefreshCw size={10} />
              Free credits reset in {resetDays}d ({formatDate(balance.cycleResetAt)})
            </div>
          )}
          {hasPurchasedCredits && balance.purchasedExpiresAt && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-warning)]">
              <AlertTriangle size={10} />
              Purchased credits expire in {bonusDays}d ({formatDate(balance.purchasedExpiresAt)})
            </div>
          )}
        </div>
      )}

      {/* Upgrade CTA */}
      {!isPremium && (
        <Link to="/pricing">
          <Button
            variant={anyEmpty ? 'primary' : 'outline'}
            size="sm"
            className="w-full text-xs"
          >
            {anyEmpty ? 'Buy Credits' : 'Get More Credits'}
            <ChevronRight size={12} className="ml-1" />
          </Button>
        </Link>
      )}

      {isPremium && (
        <p className="text-xs text-[var(--color-muted)] text-center">
          Unlimited access with Premium plan
        </p>
      )}
    </div>
  )
}

/**
 * CreditGate — Wraps any action with a credit check.
 * Shows the action if credits available, shows "Buy Credits" if not.
 */
interface CreditGateProps {
  bucket: 'skill' | 'project'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function CreditGate({ bucket, children, fallback }: CreditGateProps) {
  const { balance, isPremium, canTakeExam, canEvalProject } = useCredits()
  const canProceed = bucket === 'skill' ? canTakeExam : canEvalProject

  if (isPremium || canProceed) return <>{children}</>

  if (fallback) return <>{fallback}</>

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-[color-mix(in_srgb,var(--color-danger)_5%,transparent)] border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] rounded-xl text-center">
      <Lock size={18} className="text-[var(--color-danger)]" />
      <p className="text-sm text-[var(--color-text)] font-medium">
        No {bucket === 'skill' ? 'exam' : 'project'} credits left
      </p>
      <p className="text-xs text-[var(--color-muted)]">
        Credits reset on {formatDate(balance.cycleResetAt)} or{' '}
        <Link to="/pricing" className="text-[var(--color-primary)] underline">buy more</Link>.
      </p>
    </div>
  )
}

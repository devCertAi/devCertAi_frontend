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

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Zap, BookOpen, FolderOpen, RefreshCw, Lock, Crown, AlertTriangle, ChevronRight, ChevronDown } from 'lucide-react'
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
  // No plan is unlimited — premium accounts show their real, larger balance
  // (topped up by their credit pack) instead of an infinity symbol.
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const isLow = remaining <= 1
  const isEmpty = remaining === 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <span className="text-[var(--color-muted)]">{icon}</span>
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          {isEmpty && <Lock size={12} className="text-[var(--color-danger)]" />}
          {isLow && !isEmpty && <AlertTriangle size={12} className="text-[var(--color-warning)]" />}
          <span className={cn(
            'text-sm font-medium',
            isEmpty ? 'text-[var(--color-danger)]' :
            isLow ? 'text-[var(--color-warning)]' :
            isPremium ? 'text-[var(--color-primary)]' :
            'text-[var(--color-text)]'
          )}>
            {remaining}
          </span>
          {bonus > 0 && (
            <span className="text-xs text-[var(--color-muted)]">
              ({Math.max(0, limit - used)} free + {bonus} bonus)
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
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
    </div>
  )
}

interface CreditWidgetProps {
  className?: string
  compact?: boolean
}

interface CreditPanelProps {
  balance: CreditBalance
  isPremium: boolean
  className?: string
}

function CreditPanel({ balance, isPremium, className }: CreditPanelProps) {
  const resetDays = daysUntil(balance.cycleResetAt)
  const bonusDays = daysUntil(balance.purchasedExpiresAt)
  const hasPurchasedCredits = (balance.skill.bonus + balance.project.bonus) > 0
  const anyEmpty = balance.skill.remaining === 0 || balance.project.remaining === 0

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

      {/* Buy more CTA — no plan is unlimited, so this is always useful */}
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
    </div>
  )
}

export function CreditWidget({ className, compact = false }: CreditWidgetProps) {
  const { balance, loading, isPremium } = useCredits()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close the popover on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (loading) {
    if (compact) {
      return (
        <div className={cn('h-9 w-28 rounded-full bg-[var(--color-surface2)] animate-pulse', className)} />
      )
    }
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

  const anyEmpty = balance.skill.remaining === 0 || balance.project.remaining === 0
  const anyLow = balance.skill.remaining <= 1 || balance.project.remaining <= 1

  if (compact) {
    return (
      <div ref={wrapperRef} className={cn('relative', className)}>
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            'flex items-center gap-1.5 sm:gap-3 h-9 pl-2 pr-1.5 sm:pl-3 sm:pr-2 rounded-full border transition-colors',
            'bg-[var(--color-surface)] hover:bg-[var(--color-surface2)]',
            anyEmpty && !isPremium
              ? 'border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)]'
              : 'border-[var(--color-border)]'
          )}
        >
          {isPremium ? (
            <div className="flex items-center gap-1 sm:gap-1.5 text-sm">
              <Crown size={13} className="text-[var(--color-primary)] shrink-0" />
              <BookOpen size={13} className="text-[var(--color-muted)] hidden sm:inline shrink-0" />
              <span className={cn('font-medium', balance.skill.remaining === 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]')}>
                {balance.skill.remaining}
              </span>
              <div className="w-px h-4 bg-[var(--color-border)]" />
              <FolderOpen size={13} className="text-[var(--color-muted)] hidden sm:inline shrink-0" />
              <span className={cn('font-medium', balance.project.remaining === 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]')}>
                {balance.project.remaining}
              </span>
              {anyLow && <AlertTriangle size={12} className="text-[var(--color-warning)] shrink-0" />}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 sm:gap-1.5 text-sm">
                <BookOpen size={13} className="text-[var(--color-muted)] shrink-0" />
                <span className={cn('font-medium', balance.skill.remaining === 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]')}>
                  {balance.skill.remaining}
                </span>
              </div>
              <div className="w-px h-4 bg-[var(--color-border)]" />
              <div className="flex items-center gap-1 sm:gap-1.5 text-sm">
                <FolderOpen size={13} className="text-[var(--color-muted)] shrink-0" />
                <span className={cn('font-medium', balance.project.remaining === 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]')}>
                  {balance.project.remaining}
                </span>
              </div>
              {anyLow && <AlertTriangle size={12} className="text-[var(--color-warning)] shrink-0" />}
            </>
          )}
          <ChevronDown size={12} className={cn('text-[var(--color-muted)] transition-transform hidden sm:inline', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-72 z-50 shadow-2xl rounded-2xl">
            <CreditPanel balance={balance} isPremium={isPremium} />
          </div>
        )}
      </div>
    )
  }

  return <CreditPanel balance={balance} isPremium={isPremium} className={className} />
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
  const { balance, canTakeExam, canEvalProject } = useCredits()
  const canProceed = bucket === 'skill' ? canTakeExam : canEvalProject

  if (canProceed) return <>{children}</>

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

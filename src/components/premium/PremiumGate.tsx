/**
 * PremiumGate.tsx — Locks premium-only features
 *
 * Usage:
 *   <PremiumGate feature="deep-analysis">
 *     <DeepProjectAnalysis />
 *   </PremiumGate>
 *
 * If user is premium → renders children
 * If not → renders blurred/locked preview with upgrade CTA
 *
 * Premium features:
 * - Deep project analysis (AI insights)
 * - Ads-free experience
 * - Priority ranking in job matches
 * - Advanced exam analytics
 * - Unlimited exam retakes
 */

import { Lock, Crown, Sparkles, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export type PremiumFeature =
  | 'deep-project-analysis'
  | 'advanced-analytics'
  | 'priority-matching'
  | 'unlimited-retakes'
  | 'ads-free'
  | 'ai-resume-review'
  | 'export-certificate'
  | 'generic'

const FEATURE_META: Record<PremiumFeature, { title: string; description: string; icon: string }> = {
  'deep-project-analysis': {
    title: 'Deep Project Analysis',
    description: 'Get detailed AI insights on code quality, architecture patterns, and specific improvement suggestions.',
    icon: '🔬'
  },
  'advanced-analytics': {
    title: 'Advanced Analytics',
    description: 'See detailed score breakdowns, skill gap analysis, and personalized improvement plans.',
    icon: '📊'
  },
  'priority-matching': {
    title: 'Priority Job Matching',
    description: 'Your profile ranks higher in recruiter searches and gets matched to exclusive opportunities.',
    icon: '⚡'
  },
  'unlimited-retakes': {
    title: 'More Exam Retakes',
    description: 'Retake exams up to 10 times (vs 3 on Free) to improve your score and skill level.',
    icon: '🔄'
  },
  'ads-free': {
    title: 'Ad-Free Experience',
    description: 'Enjoy a clean, distraction-free environment across the entire platform.',
    icon: '✨'
  },
  'ai-resume-review': {
    title: 'AI Resume Review',
    description: 'Get detailed AI feedback on your resume with actionable suggestions.',
    icon: '📄'
  },
  'export-certificate': {
    title: 'Custom Certificate Export',
    description: 'Export certificates in high resolution with custom branding.',
    icon: '🏆'
  },
  'generic': {
    title: 'Premium Feature',
    description: 'Unlock this feature and more with a Premium plan.',
    icon: '👑'
  }
}

interface PremiumGateProps {
  feature?: PremiumFeature
  children: React.ReactNode
  /**
   * If true, shows a blurred version of children instead of hiding them entirely.
   * Good for previews (e.g. blurred chart with lock overlay).
   */
  showBlurPreview?: boolean
  /**
   * Custom message to show instead of the default description
   */
  customMessage?: string
  className?: string
}

export function PremiumGate({
  feature = 'generic',
  children,
  showBlurPreview = false,
  customMessage,
  className
}: PremiumGateProps) {
  const { user } = useAuthStore()
  const isPremium = user?.isPremium ?? false

  // Let premium users through
  if (isPremium) return <>{children}</>

  const meta = FEATURE_META[feature]

  if (showBlurPreview) {
    return (
      <div className={cn('relative', className)}>
        {/* Blurred preview */}
        <div className="select-none pointer-events-none" style={{ filter: 'blur(6px)', userSelect: 'none' }}>
          {children}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xl max-w-xs w-full mx-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] flex items-center justify-center mx-auto mb-3">
              <Lock size={18} className="text-[var(--color-primary)]" />
            </div>
            <p className="text-xs font-semibold text-[var(--color-text)] mb-1">{meta.title}</p>
            <p className="text-xs text-[var(--color-muted)] mb-3">
              {customMessage ?? meta.description}
            </p>
            <Link to="/pricing">
              <Button size="sm" className="w-full text-xs">
                <Crown size={12} className="mr-1.5" />
                Upgrade to Premium
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Full lock — doesn't render children at all
  return (
    <div className={cn(
      'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 text-center',
      className
    )}>
      <div className="text-3xl mb-3">{meta.icon}</div>
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <Lock size={14} className="text-[var(--color-muted)]" />
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{meta.title}</h3>
      </div>
      <p className="text-xs text-[var(--color-muted)] mb-4 max-w-xs mx-auto">
        {customMessage ?? meta.description}
      </p>
      <Link to="/pricing">
        <Button size="sm" className="text-xs">
          <Sparkles size={12} className="mr-1.5" />
          Unlock with Premium
          <ChevronRight size={12} className="ml-1" />
        </Button>
      </Link>
    </div>
  )
}

/**
 * PremiumBadge — Small inline badge showing a feature is premium-only.
 * Click to navigate to pricing.
 */
export function PremiumBadge({ className }: { className?: string }) {
  return (
    <Link to="/pricing">
      <span className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)]',
        'border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]',
        'hover:bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-colors cursor-pointer',
        className
      )}>
        <Crown size={10} />
        Premium
      </span>
    </Link>
  )
}

/**
 * usePremium hook — convenience for checking premium status
 */
export function usePremium() {
  const { user } = useAuthStore()
  return {
    isPremium: user?.isPremium ?? false,
    premiumExpiresAt: user?.premiumExpiresAt ?? null,
  }
}

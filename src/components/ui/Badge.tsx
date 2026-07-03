import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' }
export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = { default: 'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)] border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]', success: 'bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_20%,transparent)]', warning: 'bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)]', danger: 'bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] text-[var(--color-danger)] border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)]', info: 'bg-[color-mix(in_srgb,var(--color-secondary)_10%,transparent)] text-[var(--color-secondary)] border-[color-mix(in_srgb,var(--color-secondary)_20%,transparent)]', muted: 'bg-[var(--color-surface2)] text-[var(--color-muted)] border-[var(--color-border)]' }
  return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)} {...props} />
}

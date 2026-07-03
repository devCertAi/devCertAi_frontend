import { ButtonHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] disabled:opacity-50 disabled:cursor-not-allowed'
    const variants = {
      primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-d)] text-[var(--color-inverse)] focus:ring-[var(--color-primary)]',
      secondary: 'bg-[color-mix(in_srgb,var(--color-secondary)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_20%,transparent)] text-[var(--color-secondary)] border border-[color-mix(in_srgb,var(--color-secondary)_20%,transparent)] focus:ring-[var(--color-secondary)]',
      ghost: 'hover:bg-[var(--color-surface2)] text-[var(--color-muted)] hover:text-[var(--color-text)] focus:ring-[var(--color-border)]',
      danger: 'bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] text-[var(--color-danger)] border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] focus:ring-[var(--color-danger)]',
      outline: 'border border-[var(--color-border)] hover:border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface2)] focus:ring-[var(--color-border)]',
    }
    const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'

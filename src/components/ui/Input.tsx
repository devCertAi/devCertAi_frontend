import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string; leftIcon?: ReactNode; rightIcon?: ReactNode
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{label}</label>}
      <div className="relative">
        {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">{leftIcon}</div>}
        <input ref={ref} className={cn('w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] placeholder-[var(--color-muted)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors', error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]', leftIcon && 'pl-10', rightIcon && 'pr-10', className)} {...props} />
        {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">{rightIcon}</div>}
      </div>
      {error && <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-[var(--color-muted)]">{hint}</p>}
    </div>
  )
)
Input.displayName = 'Input'

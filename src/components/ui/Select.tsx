import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; hint?: string; children?: ReactNode }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, children, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{label}</label>}
      <select ref={ref} className={cn('w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors appearance-none', error && 'border-[var(--color-danger)]', className)} {...props}>{children}</select>
      {error && <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-[var(--color-muted)]">{hint}</p>}
    </div>
  )
)
Select.displayName = 'Select'
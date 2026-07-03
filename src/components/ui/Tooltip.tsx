import { ReactNode, useState } from 'react'
interface TooltipProps { content: string; children: ReactNode }
export function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text)] whitespace-nowrap z-50 shadow-xl">{content}<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-surface2)]" /></div>}
    </div>
  )
}

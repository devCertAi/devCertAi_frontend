import { HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type MotionSafeDivAttrs = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'
>

interface CardProps extends MotionSafeDivAttrs { hover?: boolean; glass?: boolean; glow?: boolean; glowColor?: string }
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, glass, glow, glowColor, style, children, ...props }, ref) => {
    const base = 'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]'
    const glowStyle = glow ? ({ ...style, '--glow-card-color': glowColor || 'var(--color-primary)' } as React.CSSProperties) : style
    if (hover) return (
      <motion.div ref={ref} whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(108,99,255,0.1)' }} className={cn(base, glass && 'backdrop-blur-sm bg-[var(--color-surface2)]', glow && 'glow-card', 'cursor-pointer', className)} style={glowStyle} {...props}>{children}</motion.div>
    )
    return <div ref={ref} className={cn(base, glass && 'backdrop-blur-sm bg-[var(--color-surface2)]', glow && 'glow-card', className)} style={glowStyle} {...props}>{children}</div>
  }
)
Card.displayName = 'Card'
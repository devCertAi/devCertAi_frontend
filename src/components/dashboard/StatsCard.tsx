import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

interface StatsCardProps { title: string; value: string | number; icon: ReactNode; color: string; trend?: string }

export function StatsCard({ title, value, icon, color, trend }: StatsCardProps) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs text-[var(--color-success)]">
            <TrendingUp size={12} />{trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
      <p className="text-sm text-[var(--color-muted)] mt-0.5">{title}</p>
    </motion.div>
  )
}

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface ViolationWarningProps { count: number; show: boolean }

export function ViolationWarning({ count, show }: ViolationWarningProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-warning)_40%,transparent)] rounded-xl shadow-2xl"
        >
          <AlertTriangle size={18} className="text-[var(--color-warning)]" />
          <div>
            <p className="text-sm font-medium text-[var(--color-warning)]">Violation Detected</p>
            <p className="text-xs text-[color-mix(in_srgb,var(--color-warning)_70%,transparent)]">Tab switch {count}/3. At 3, exam auto-submits.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

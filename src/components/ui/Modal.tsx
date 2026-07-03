import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
interface ModalProps { open: boolean; onClose: () => void; title?: string; children: ReactNode; className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }
export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={cn('relative w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl', sizes[size], className)}>
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--color-surface2)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"><X size={18} /></button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

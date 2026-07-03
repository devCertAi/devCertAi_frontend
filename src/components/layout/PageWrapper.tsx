import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PageWrapperProps { children: ReactNode; className?: string }

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`min-h-screen ${className}`}
    >
      {children}
    </motion.div>
  )
}

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Layers } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

/**
 * Phase2ConfigModal
 *
 * Lets the candidate configure a Phase 2 attempt before it starts:
 *  1. Difficulty — Easy / Medium / Hard. Controls how deep the AI-generated
 *     questions probe and how much time per question they get.
 *  2. Number of questions (3-10). More questions -> more time.
 *
 * No category picker here (Phase 2 is scoped by the project itself, not a
 * technology sub-category) and no project source picker (GitHub URL vs ZIP
 * is chosen on the next screen, after the attempt is created).
 */

interface Phase2DifficultyOption {
  value: string
  label: string
  secPerQuestion: number
  description?: string
}

interface Phase2ConfigModalProps {
  domain: string
  difficulties: Phase2DifficultyOption[]
  baseBufferSec: number
  minQuestions: number
  maxQuestions: number
  defaultQuestions: number
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: (config: { difficulty: string; questionCount: number }) => void
}

function formatDuration(totalSec: number): string {
  const mins = Math.round(totalSec / 60)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}

export function Phase2ConfigModal({
  domain,
  difficulties,
  baseBufferSec,
  minQuestions,
  maxQuestions,
  defaultQuestions,
  isSubmitting,
  onCancel,
  onConfirm,
}: Phase2ConfigModalProps) {
  const [difficulty, setDifficulty] = useState<string>('medium')
  const [questionCount, setQuestionCount] = useState<number>(defaultQuestions)

  const selectedDifficulty = useMemo(
    () => difficulties.find((d) => d.value === difficulty) ?? difficulties[0],
    [difficulties, difficulty]
  )

  const estimatedSec = useMemo(() => {
    const secPerQuestion = selectedDifficulty?.secPerQuestion ?? 360
    return baseBufferSec + secPerQuestion * questionCount
  }, [selectedDifficulty, questionCount, baseBufferSec])

  // Portaled to document.body (see components/ui/Modal.tsx for why): this
  // modal is opened from a page wrapped in <PageWrapper>, a framer-motion
  // div that animates via an inline `transform`, which becomes the
  // containing block for any `position: fixed` descendant — without the
  // portal this backdrop renders as a small black box instead of a
  // full-screen overlay.
  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <Card className="p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">Configure Phase 2</h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5 capitalize">{domain} — Project Exam</p>
              </div>
              <button
                onClick={onCancel}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[var(--color-muted)] mb-5">
              After this, you'll submit your project (a GitHub link or a ZIP upload) and we'll
              generate questions from your actual code.
            </p>

            {/* Difficulty */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers size={13} className="text-[var(--color-muted)]" />
                <span className="text-xs font-medium text-[var(--color-text)]">Difficulty</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {difficulties.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      difficulty === d.value
                        ? 'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] border-[var(--color-primary)]'
                        : 'bg-[var(--color-surface2)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                    }`}
                  >
                    <span
                      className={`block text-xs font-semibold ${
                        difficulty === d.value ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
                      }`}
                    >
                      {d.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[var(--color-muted)] mt-1.5">
                {selectedDifficulty?.description ?? ''}
              </p>
            </div>

            {/* Question count */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--color-text)]">Number of Questions</span>
                <span className="text-xs font-semibold text-[var(--color-primary)]">{questionCount}</span>
              </div>
              <input
                type="range"
                min={minQuestions}
                max={maxQuestions}
                step={1}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-muted)] mt-1">
                <span>{minQuestions}</span>
                <span>{maxQuestions}</span>
              </div>
            </div>

            {/* Live time estimate */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] mb-5">
              <Clock size={15} className="text-[var(--color-primary)]" />
              <span className="text-xs text-[var(--color-muted)]">Estimated time:</span>
              <span className="text-sm font-bold text-[var(--color-text)]">{formatDuration(estimatedSec)}</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={isSubmitting}
                onClick={() => onConfirm({ difficulty, questionCount })}
              >
                {isSubmitting ? 'Starting…' : 'Continue'}
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
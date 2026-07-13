import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Layers, Gauge } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { QuestionAvailabilityTable } from '@/components/exam/QuestionAvailabilityTable'

/**
 * ExamConfigModal
 *
 * Lets the candidate configure a Phase 1 attempt before it starts:
 *  1. Technology category within the chosen domain (e.g. Frontend ->
 *     HTML & CSS / React / Angular / General Frontend). Required.
 *  2. Difficulty — Easy / Medium / Hard. Drives both the question-level
 *     mix and the per-question time budget.
 *  3. Number of questions (10-50). More questions -> more time.
 *
 * The estimated duration is computed the same way the backend does
 * (baseBufferSec + secPerQuestion * questionCount) so what the user sees
 * here matches the timeLimitSec they'll actually get in the exam room.
 */

interface DifficultyOption {
  value: string
  label: string
  secPerQuestion: number
}

interface CategoryQuestionCount {
  easy: number
  medium: number
  hard: number
  total: number
}

interface ExamConfigModalProps {
  domain: string
  categories: string[]
  difficulties: DifficultyOption[]
  baseBufferSec: number
  minQuestions: number
  maxQuestions: number
  defaultQuestions: number
  // { [category]: { easy, medium, hard, total } } — question availability
  // straight from the backend's QuestionBankStats table. Optional so this
  // still works against an older backend that doesn't send it yet.
  categoryQuestionCounts?: Record<string, CategoryQuestionCount>
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: (config: { category: string; difficulty: string; questionCount: number }) => void
}

const DIFFICULTY_DESCRIPTIONS: Record<string, string> = {
  easy: 'Mostly beginner-level questions. Good for a first attempt.',
  medium: 'A balanced mix of beginner, intermediate & expert questions.',
  hard: 'Mostly expert-level questions. For candidates who know the stack well.',
  mixed: 'A random, even blend of easy, medium & hard questions — different every attempt.',
}

function formatDuration(totalSec: number): string {
  const mins = Math.round(totalSec / 60)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}

export function ExamConfigModal({
  domain,
  categories,
  difficulties,
  baseBufferSec,
  minQuestions,
  maxQuestions,
  defaultQuestions,
  categoryQuestionCounts,
  isSubmitting,
  onCancel,
  onConfirm,
}: ExamConfigModalProps) {
  const [category, setCategory] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<string>('medium')
  const [questionCount, setQuestionCount] = useState<number>(defaultQuestions)

  const selectedDifficulty = useMemo(
    () => difficulties.find((d) => d.value === difficulty) ?? difficulties[0],
    [difficulties, difficulty]
  )

  // How many questions actually exist for this category AT THE SELECTED
  // DIFFICULTY. "Mixed" genuinely draws from every level, so its ceiling is
  // the category total — but Easy/Medium/Hard must anchor to that single
  // level's own count. Showing the category total for "Easy" let the
  // candidate drag the slider past what actually exists at Easy, and the
  // backend would (previously) quietly top up with Medium/Hard questions to
  // reach the count — i.e. an "Easy" exam that wasn't actually all easy
  // questions. The slider now reflects exactly what will be served.
  const availableInCategory = category ? categoryQuestionCounts?.[category] : undefined
  const availableForDifficulty =
    availableInCategory === undefined
      ? undefined
      : difficulty === 'mixed'
        ? availableInCategory.total
        : availableInCategory[difficulty as 'easy' | 'medium' | 'hard'] ?? 0

  const effectiveMax =
    availableForDifficulty !== undefined ? Math.max(0, Math.min(maxQuestions, availableForDifficulty)) : maxQuestions
  const effectiveMin = Math.min(minQuestions, effectiveMax)
  const notEnoughQuestions = availableForDifficulty !== undefined && availableForDifficulty < minQuestions

  // Keep the slider's value inside whatever range is actually available —
  // e.g. switching to a category/difficulty with only 5 questions should pull
  // the slider down from 25 automatically, not let the candidate submit 25
  // and get a "not enough questions" error (or a padded, mixed-difficulty
  // set) at Start time.
  useEffect(() => {
    setQuestionCount((prev) => Math.min(Math.max(prev, effectiveMin), Math.max(effectiveMax, 1)))
  }, [effectiveMin, effectiveMax])

  const estimatedSec = useMemo(() => {
    const secPerQuestion = selectedDifficulty?.secPerQuestion ?? 72
    return baseBufferSec + secPerQuestion * questionCount
  }, [selectedDifficulty, questionCount, baseBufferSec])

  const canStart = !!category && !isSubmitting && !notEnoughQuestions

  return (
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
                <h2 className="text-lg font-bold text-[var(--color-text)]">Configure Your Exam</h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5 capitalize">{domain} — Phase 1</p>
              </div>
              <button
                onClick={onCancel}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Category */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers size={13} className="text-[var(--color-muted)]" />
                <span className="text-xs font-medium text-[var(--color-text)]">Technology</span>
              </div>
              {categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        category === c
                          ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-surface2)] border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-[var(--color-danger)] px-3 py-2.5 rounded-xl border border-dashed border-[var(--color-border)]">
                  No sections have questions available for {domain} yet. Check back later.
                </p>
              )}
              {!category && categories.length > 0 && (
                <p className="text-[10px] text-[var(--color-muted)] mt-1.5">Pick a category to continue</p>
              )}
            </div>

            {/* Question availability per section — easy/medium/hard breakdown straight
                from the backend, so the candidate can see which sections actually have
                enough questions before picking one. */}
            <QuestionAvailabilityTable
              categoryQuestionCounts={categoryQuestionCounts}
              selectedCategory={category}
              minQuestions={minQuestions}
            />

            {/* Difficulty */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Gauge size={13} className="text-[var(--color-muted)]" />
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
                    <span className="block text-[10px] text-[var(--color-muted)] mt-0.5">
                      ~{d.secPerQuestion}s / question
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[var(--color-muted)] mt-1.5">
                {DIFFICULTY_DESCRIPTIONS[difficulty] ?? ''}
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
                min={effectiveMin}
                max={Math.max(effectiveMax, effectiveMin)}
                step={5}
                value={questionCount}
                disabled={effectiveMax < 1}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-muted)] mt-1">
                <span>{effectiveMin}</span>
                <span>{effectiveMax}</span>
              </div>
            </div>

            {/* Live time estimate — increases with more questions and/or harder difficulty */}
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
                disabled={!canStart}
                onClick={() => category && onConfirm({ category, difficulty, questionCount })}
              >
                {isSubmitting ? 'Starting…' : 'Start Exam'}
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

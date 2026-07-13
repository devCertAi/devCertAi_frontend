import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Layers, Gauge, Link2, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { QuestionAvailabilityTable } from '@/components/exam/QuestionAvailabilityTable'
import api from '@/services/api'

/**
 * ComboConfigModal
 *
 * Single form to start a "Combo (Phase 1 + Phase 2)" run: candidate fills in
 * technology category, level (difficulty), GitHub project URL, and question
 * counts for both phases — all at once, instead of configuring P1 and P2
 * separately through two different flows.
 *
 * Before letting the candidate start, the GitHub URL is checked against the
 * chosen domain (same domain-classification the backend uses for a standalone
 * Phase 2 submission) so a mismatch is caught up front — not after Phase 1 is
 * already passed and a Phase 2 credit has been spent.
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

interface ComboConfigModalProps {
  domain: string
  categories: string[]
  difficulties: DifficultyOption[]
  baseBufferSec: number
  minQuestions: number
  maxQuestions: number
  defaultQuestions: number
  categoryQuestionCounts?: Record<string, CategoryQuestionCount>
  phase2MinQuestions: number
  phase2MaxQuestions: number
  phase2DefaultQuestions: number
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: (config: {
    category: string
    difficulty: string
    questionCount: number
    githubUrl: string
    phase2QuestionCount: number
  }) => void
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

type CheckState = 'idle' | 'checking' | 'match' | 'mismatch' | 'error'

export function ComboConfigModal({
  domain,
  categories,
  difficulties,
  baseBufferSec,
  minQuestions,
  maxQuestions,
  defaultQuestions,
  categoryQuestionCounts,
  phase2MinQuestions,
  phase2MaxQuestions,
  phase2DefaultQuestions,
  isSubmitting,
  onCancel,
  onConfirm,
}: ComboConfigModalProps) {
  const [category, setCategory] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<string>('medium')
  const [questionCount, setQuestionCount] = useState<number>(defaultQuestions)
  const [phase2QuestionCount, setPhase2QuestionCount] = useState<number>(phase2DefaultQuestions)
  const [githubUrl, setGithubUrl] = useState('')
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const [checkMessage, setCheckMessage] = useState<string>('')

  const selectedDifficulty = useMemo(
    () => difficulties.find((d) => d.value === difficulty) ?? difficulties[0],
    [difficulties, difficulty]
  )

  // Same reasoning as ExamConfigModal: the category TOTAL is the real
  // ceiling, since the backend falls back across levels within a category.
  const availableInCategory = category ? categoryQuestionCounts?.[category] : undefined
  const effectiveMax = availableInCategory
    ? Math.max(0, Math.min(maxQuestions, availableInCategory.total))
    : maxQuestions
  const effectiveMin = Math.min(minQuestions, effectiveMax)
  const notEnoughQuestions = availableInCategory !== undefined && availableInCategory.total < minQuestions

  useEffect(() => {
    setQuestionCount((prev) => Math.min(Math.max(prev, effectiveMin), Math.max(effectiveMax, 1)))
  }, [effectiveMin, effectiveMax])

  const estimatedSec = useMemo(() => {
    const secPerQuestion = selectedDifficulty?.secPerQuestion ?? 72
    return baseBufferSec + secPerQuestion * questionCount
  }, [selectedDifficulty, questionCount, baseBufferSec])

  const githubLooksValid = githubUrl.trim().length > 0 && githubUrl.includes('github.com')

  // Re-checking the URL invalidates a previous verdict — the candidate must
  // re-verify before they can start again.
  const handleGithubChange = (value: string) => {
    setGithubUrl(value)
    setCheckState('idle')
    setCheckMessage('')
  }

  const handleVerify = async () => {
    if (!githubLooksValid) return
    setCheckState('checking')
    setCheckMessage('')
    try {
      const { data } = await api.post('/exam/check-github-domain', {
        domain,
        githubUrl: githubUrl.trim(),
      }, { timeout: 60_000 }) // repo/file-tree analysis can take a while — same order as the actual Phase 2 submission timeout
      const result = data.data ?? data
      if (result.compatible) {
        setCheckState('match')
        setCheckMessage(result.message || 'Repo matches this domain.')
      } else {
        setCheckState('mismatch')
        setCheckMessage(result.message || `This repo doesn't look like a ${domain} project.`)
      }
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } }
      setCheckState('error')
      setCheckMessage(errObj?.response?.data?.message || 'Could not verify this repository. Try again.')
    }
  }

  const canStart = !!category && checkState === 'match' && !isSubmitting && !notEnoughQuestions

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
                <h2 className="text-lg font-bold text-[var(--color-text)]">Configure Combo Exam</h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5 capitalize">{domain} — Phase 1 + Phase 2</p>
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
              Fill this in once — you'll take Phase 1 (MCQ) first, then Phase 2 (your GitHub project)
              starts automatically. Pass both to earn a combo certificate.
            </p>

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

            {/* Difficulty / Level */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Gauge size={13} className="text-[var(--color-muted)]" />
                <span className="text-xs font-medium text-[var(--color-text)]">Level</span>
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

            {/* Phase 1 question count */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--color-text)]">Phase 1 — Number of Questions</span>
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

            {/* Phase 2 question count */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--color-text)]">Phase 2 — Number of Questions</span>
                <span className="text-xs font-semibold text-[var(--color-primary)]">{phase2QuestionCount}</span>
              </div>
              <input
                type="range"
                min={phase2MinQuestions}
                max={phase2MaxQuestions}
                step={1}
                value={phase2QuestionCount}
                onChange={(e) => setPhase2QuestionCount(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-muted)] mt-1">
                <span>{phase2MinQuestions}</span>
                <span>{phase2MaxQuestions}</span>
              </div>
            </div>

            {/* GitHub URL + domain check */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Link2 size={13} className="text-[var(--color-muted)]" />
                <span className="text-xs font-medium text-[var(--color-text)]">GitHub Project URL</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => handleGithubChange(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="flex-1 px-3 py-2 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs whitespace-nowrap"
                  disabled={!githubLooksValid || checkState === 'checking'}
                  onClick={handleVerify}
                >
                  {checkState === 'checking' ? <Loader2 size={13} className="animate-spin" /> : 'Verify'}
                </Button>
              </div>
              {!githubLooksValid && githubUrl.trim().length > 0 && (
                <p className="text-[10px] text-[var(--color-danger)] mt-1.5">Enter a valid github.com repository URL</p>
              )}
              {checkState === 'match' && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-[var(--color-success)]">
                  <CheckCircle2 size={11} /> {checkMessage}
                </div>
              )}
              {(checkState === 'mismatch' || checkState === 'error') && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-[var(--color-danger)]">
                  <AlertTriangle size={11} /> {checkMessage}
                </div>
              )}
              {checkState !== 'match' && (
                <p className="text-[10px] text-[var(--color-muted)] mt-1.5">
                  Verify your repo matches the domain before starting — this is checked again automatically before Phase 2.
                </p>
              )}
            </div>

            {/* Live time estimate (Phase 1 only — Phase 2 timing depends on the project) */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border)] mb-5">
              <Clock size={15} className="text-[var(--color-primary)]" />
              <span className="text-xs text-[var(--color-muted)]">Phase 1 estimated time:</span>
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
                onClick={() =>
                  category &&
                  onConfirm({
                    category,
                    difficulty,
                    questionCount,
                    githubUrl: githubUrl.trim(),
                    phase2QuestionCount,
                  })
                }
              >
                {isSubmitting ? 'Starting…' : 'Start Combo Exam'}
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

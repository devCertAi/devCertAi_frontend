import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Shield, ChevronRight, CheckCircle, Lock, Trophy } from 'lucide-react'
import { DOMAINS } from '@/lib/constants'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ExamAttempt } from '@/types'
import { formatDate } from '@/lib/utils'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { AdBanner } from '@/components/ads/AdBanner'
import { ExamConfigModal } from '@/store/ExamConfigModal'
import { Phase2ConfigModal } from '@/store/Phase2ConfigModal'
import { ComboConfigModal } from '@/store/ComboConfigModal'
import { useComboStore } from '@/store/comboStore'

/**
 * ExamSelect — Domain picker with Phase 1 and Phase 2 start flows
 *
 * BUGS FIXED:
 * 1. Only Phase 1 could be started — clicking a domain ALWAYS started Phase 1,
 *    with no way to start Phase 2. Added Phase 2 button that appears after
 *    Phase 1 is passed.
 * 2. Domain status (phase1Passed, phase2Passed, scores) was never fetched —
 *    /exam/domains endpoint existed on the backend but was never called.
 *    Now fetched and shown on each domain card.
 * 3. If user had an in-progress attempt they'd get a backend 400 error with no
 *    helpful message. Now we detect and offer to resume.
 * 4. history endpoint returns { attempts } but code read data.attempts only if
 *    it existed — safe guard added.
 */

interface DomainStatus {
  domain: string
  categories: string[]
  categoryQuestionCounts?: Record<string, { easy: number; medium: number; hard: number; total: number }>
  // False when the question bank has nothing active for this domain yet —
  // categories will be empty in that case too. Lets the UI disable Phase 1 /
  // Combo start actions instead of opening a config modal with nothing to pick.
  hasQuestions?: boolean
  phase1: { attempted: boolean; passed: boolean; bestScore: number }
  phase2: { attempted: boolean; passed: boolean; bestScore: number; unlocked: boolean }
  combo?: { passed: boolean }
}

interface DifficultyOption {
  value: string
  label: string
  secPerQuestion: number
}

interface QuestionCountBounds {
  min: number
  max: number
  default: number
}

export default function ExamSelect() {
  const [history, setHistory] = useState<ExamAttempt[]>([])
  const [domainStatus, setDomainStatus] = useState<DomainStatus[]>([])
  const [difficulties, setDifficulties] = useState<DifficultyOption[]>([])
  const [questionBounds, setQuestionBounds] = useState<QuestionCountBounds>({ min: 10, max: 50, default: 25 })
  const [baseBufferSec, setBaseBufferSec] = useState(120)
  const [phase2Difficulties, setPhase2Difficulties] = useState<DifficultyOption[]>([])
  const [phase2QuestionBounds, setPhase2QuestionBounds] = useState<QuestionCountBounds>({ min: 3, max: 10, default: 6 })
  const [configDomain, setConfigDomain] = useState<string | null>(null)
  const [configPhase2Domain, setConfigPhase2Domain] = useState<string | null>(null)
  const [configComboDomain, setConfigComboDomain] = useState<string | null>(null)
  const [startingDomain, setStartingDomain] = useState<string | null>(null)
  const [startingPhase, setStartingPhase] = useState<number | null>(null)
  const [comboStarting, setComboStarting] = useState(false)
  const navigate = useNavigate()
  const comboStart = useComboStore((s) => s.start)

  useEffect(() => {
    // Fetch both history and domain status in parallel
    Promise.all([
      api.get('/exam/history').catch(() => ({ data: { attempts: [] } })),
      api.get('/exam/domains').catch(() => ({ data: { domains: [], difficulties: [], questionCount: undefined, baseBufferSec: undefined } })),
    ]).then(([histRes, domainRes]) => {
      setHistory(histRes.data.data?.attempts ?? histRes.data.attempts ?? [])
      const domainData = domainRes.data.data ?? domainRes.data ?? {}
      setDomainStatus(domainData.domains || [])
      setDifficulties(domainData.difficulties || [])
      if (domainData.questionCount) setQuestionBounds(domainData.questionCount)
      if (domainData.baseBufferSec) setBaseBufferSec(domainData.baseBufferSec)
      if (domainData.phase2?.difficulties) setPhase2Difficulties(domainData.phase2.difficulties)
      if (domainData.phase2?.questionCount) setPhase2QuestionBounds(domainData.phase2.questionCount)
    })
  }, [])

  // Phase 1 always goes through the config modal (technology + difficulty +
  // question count) since the backend requires `category` for phase 1.
  // Phase 2 stays a direct start — it's project-based and unaffected by these.
  const handleStartExam = async (
    domainName: string,
    phase: number,
    config?: { category?: string; difficulty: string; questionCount: number }
  ) => {
    if (startingDomain) return
    setStartingDomain(domainName)
    setStartingPhase(phase)
    try {
      const { data } = await api.post('/exam/start', {
        domain: domainName,
        phase,
        ...(config ? { category: config.category, difficulty: config.difficulty, questionCount: config.questionCount } : {}),
      })
      const attemptId = data.data?.attemptId ?? data.attemptId
      if (!attemptId) throw new Error('No attemptId in response')
      navigate(`/exam/room/${attemptId}`)
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } }
      const msg = errObj?.response?.data?.message || 'Could not start exam. Please try again.'
      toast.error(msg)
    } finally {
      setStartingDomain(null)
      setStartingPhase(null)
      setConfigDomain(null)
      setConfigPhase2Domain(null)
    }
  }

  // Combo: single form (category + level + question counts + GitHub URL,
  // already verified against the domain by the modal). Starts Phase 1 like a
  // normal attempt, but stashes the GitHub URL + Phase 2 config in comboStore
  // so ExamResult can auto-chain into Phase 2 once Phase 1 is passed.
  const handleStartCombo = async (
    domainName: string,
    config: { category: string; difficulty: string; questionCount: number; githubUrl: string; phase2QuestionCount: number }
  ) => {
    if (startingDomain) return
    setComboStarting(true)
    try {
      const { data } = await api.post('/exam/start', {
        domain: domainName,
        phase: 1,
        category: config.category,
        difficulty: config.difficulty,
        questionCount: config.questionCount,
      })
      const attemptId = data.data?.attemptId ?? data.attemptId
      if (!attemptId) throw new Error('No attemptId in response')
      comboStart({
        domain: domainName,
        githubUrl: config.githubUrl,
        phase2Difficulty: config.difficulty,
        phase2QuestionCount: config.phase2QuestionCount,
      })
      navigate(`/exam/room/${attemptId}`)
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } }
      const msg = errObj?.response?.data?.message || 'Could not start combo exam. Please try again.'
      toast.error(msg)
    } finally {
      setComboStarting(false)
      setConfigComboDomain(null)
    }
  }

  const getStatusForDomain = (domainName: string): DomainStatus | null =>
    domainStatus.find((d) => d.domain === domainName) || null

  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-39">
      <div className="min-w-5xl px-6 pt-8 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">Skill Exams</h1>
          <p className="text-[var(--color-muted)] text-sm">
            Prove your domain mastery with a proctored 2-phase certification exam
          </p>
        </div>

        {/* Phases explainer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[
            {
              phase: 'Phase 1',
              desc: 'Pick a technology, difficulty & question count.',
              time: '~15-70 min',
              color: 'var(--color-primary)',
              icon: <BookOpen size={18} />,
            },
            {
              phase: 'Phase 2',
              desc: 'Submit a GitHub project — AI generates questions from your actual code.',
              time: '60 min',
              color: 'var(--color-secondary)',
              icon: <Shield size={18} />,
            },
          ].map((p) => (
            <Card key={p.phase} className="p-5">
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: `${p.color}15`, color: p.color }}
                >
                  {p.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text)]">{p.phase}</h3>
                  <p className="text-sm text-[var(--color-muted)] mt-0.5">{p.desc}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                      <Clock size={11} /> {p.time}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mb-10"><AdBanner slot="topBanner" size="banner" className="w-full max-w-3xl" /></div>

        {/* Domain grid */}
        <h2 className="text-sm font-medium text-[var(--color-text)] mb-4">Choose a Domain</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {DOMAINS.map((d) => {
            const status = getStatusForDomain(d.name)
            const p1 = status?.phase1
            const p2 = status?.phase2
            const combo = status?.combo
            const isStarting1 = startingDomain === d.name && startingPhase === 1
            const isStarting2 = startingDomain === d.name && startingPhase === 2
            // Only true once /exam/domains has actually loaded and confirmed
            // this domain's question bank is empty — undefined (not yet
            // loaded) must NOT disable the buttons.
            const noQuestions = status !== null && status.hasQuestions === false

            return (
              <motion.div key={d.id} whileHover={{ y: -2 }}>
                <Card className="p-5 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: 'var(--color-primary)' }}
                    >
                      <d.icon size={18} strokeWidth={1.8} />
                    </div>
                    {combo?.passed ? (
                      <div className="flex items-center gap-1 text-xs text-[var(--color-success)]" title="Both Phase 1 and Phase 2 passed">
                        <Trophy size={12} />
                        <span>Combo Certified</span>
                      </div>
                    ) : p2?.passed ? (
                      <div className="flex items-center gap-1 text-xs text-[var(--color-success)]" title="Phase 2 skill certificate earned">
                        <Trophy size={12} />
                        <span>Certified</span>
                      </div>
                    ) : null}
                  </div>

                  <h3 className="font-semibold text-[var(--color-text)]">{d.name}</h3>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5 mb-4 flex-1">{d.description}</p>

                  {/* Phase status pills */}
                  {status && (
                    <div className="flex gap-2 mb-4">
                      <div className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${
                        p1?.passed
                          ? 'bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] text-[var(--color-success)]'
                          : p1?.attempted
                          ? 'bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)] text-[var(--color-warning)]'
                          : 'bg-[var(--color-surface2)] border-[var(--color-border)] text-[var(--color-muted)]'
                      }`}>
                        {p1?.passed && <CheckCircle size={9} />}
                        P1{p1?.bestScore ? `: ${p1.bestScore}%` : ''}
                      </div>
                      <div className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${
                        p2?.passed
                          ? 'bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] text-[var(--color-success)]'
                          : !p2?.unlocked
                          ? 'bg-[var(--color-surface2)] border-[var(--color-border)] text-[var(--color-muted)]'
                          : 'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] text-[var(--color-primary)]'
                      }`}>
                        {!p2?.unlocked && <Lock size={9} />}
                        {p2?.passed && <CheckCircle size={9} />}
                        P2{p2?.bestScore ? `: ${p2.bestScore}%` : ''}
                      </div>
                    </div>
                  )}

                  {noQuestions && (
                    <p className="text-[10px] text-[var(--color-danger)] mb-2">
                      No Phase 1 questions available for this domain yet.
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={p1?.passed ? 'outline' : 'primary'}
                      className="flex-1 text-xs"
                      disabled={!!startingDomain || noQuestions}
                      title={noQuestions ? 'No questions available for this domain yet' : undefined}
                      onClick={() => setConfigDomain(d.name)}
                    >
                      {isStarting1 ? 'Starting…' : p1?.attempted ? 'Retry P1' : 'Start P1'}
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1 text-xs"
                      disabled={!!startingDomain}
                      onClick={() => setConfigPhase2Domain(d.name)}
                    >
                      {isStarting2 ? 'Starting…' : p2?.attempted ? 'Retry P2' : 'Start P2'}
                    </Button>
                  </div>

                  {!combo?.passed && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs mt-2"
                      disabled={!!startingDomain || noQuestions}
                      title={noQuestions ? 'No questions available for this domain yet' : undefined}
                      onClick={() => setConfigComboDomain(d.name)}
                    >
                      Start Combo (P1+P2)
                    </Button>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Recent history */}
        {history.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-[var(--color-text)] mb-4">Recent Attempts</h2>
            <div className="space-y-2">
              {history.slice(0, 10).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                  onClick={() => navigate(`/exam/result/${a.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)] capitalize">
                      {a.domain} — Phase {a.phase}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">{formatDate(a.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.totalScore != null && (
                      <span className="text-sm font-semibold text-[var(--color-text)]">
                        {a.totalScore}/100
                      </span>
                    )}
                    <Badge
                      variant={
                        a.status === 'completed' ? 'success'
                        : a.status === 'terminated' ? 'danger'
                        : 'warning'
                      }
                    >
                      {a.status}
                    </Badge>
                    <ChevronRight size={14} className="text-[var(--color-muted)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {configDomain && (
        <ExamConfigModal
          domain={configDomain}
          categories={getStatusForDomain(configDomain)?.categories || []}
          difficulties={difficulties}
          baseBufferSec={baseBufferSec}
          minQuestions={questionBounds.min}
          maxQuestions={questionBounds.max}
          defaultQuestions={questionBounds.default}
          categoryQuestionCounts={getStatusForDomain(configDomain)?.categoryQuestionCounts}
          isSubmitting={startingDomain === configDomain && startingPhase === 1}
          onCancel={() => setConfigDomain(null)}
          onConfirm={(config) => handleStartExam(configDomain, 1, config)}
        />
      )}

      {configPhase2Domain && (
        <Phase2ConfigModal
          domain={configPhase2Domain}
          difficulties={phase2Difficulties}
          baseBufferSec={300}
          minQuestions={phase2QuestionBounds.min}
          maxQuestions={phase2QuestionBounds.max}
          defaultQuestions={phase2QuestionBounds.default}
          isSubmitting={startingDomain === configPhase2Domain && startingPhase === 2}
          onCancel={() => setConfigPhase2Domain(null)}
          onConfirm={(config) => handleStartExam(configPhase2Domain, 2, config)}
        />
      )}

      {configComboDomain && (
        <ComboConfigModal
          domain={configComboDomain}
          categories={getStatusForDomain(configComboDomain)?.categories || []}
          difficulties={difficulties}
          baseBufferSec={baseBufferSec}
          minQuestions={questionBounds.min}
          maxQuestions={questionBounds.max}
          defaultQuestions={questionBounds.default}
          categoryQuestionCounts={getStatusForDomain(configComboDomain)?.categoryQuestionCounts}
          phase2MinQuestions={phase2QuestionBounds.min}
          phase2MaxQuestions={phase2QuestionBounds.max}
          phase2DefaultQuestions={phase2QuestionBounds.default}
          isSubmitting={comboStarting}
          onCancel={() => setConfigComboDomain(null)}
          onConfirm={(config) => handleStartCombo(configComboDomain, config)}
        />
      )}
    </PageWrapper>
  )
}
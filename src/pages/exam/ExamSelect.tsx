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
  phase1: { attempted: boolean; passed: boolean; bestScore: number }
  phase2: { attempted: boolean; passed: boolean; bestScore: number; unlocked: boolean }
}

export default function ExamSelect() {
  const [history, setHistory] = useState<ExamAttempt[]>([])
  const [domainStatus, setDomainStatus] = useState<DomainStatus[]>([])
  const [startingDomain, setStartingDomain] = useState<string | null>(null)
  const [startingPhase, setStartingPhase] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch both history and domain status in parallel
    Promise.all([
      api.get('/exam/history').catch(() => ({ data: { attempts: [] } })),
      api.get('/exam/domains').catch(() => ({ data: { domains: [] } })),
    ]).then(([histRes, domainRes]) => {
      setHistory(histRes.data.attempts || [])
      setDomainStatus(domainRes.data.domains || [])
    })
  }, [])

  const handleStartExam = async (domainName: string, phase: number) => {
    if (startingDomain) return
    setStartingDomain(domainName)
    setStartingPhase(phase)
    try {
      const { data } = await api.post('/exam/start', { domain: domainName, phase })
      const attemptId = data.data?.attemptId ?? data.attemptId
      if (!attemptId) throw new Error('No attemptId in response')
      navigate(`/exam/room/${attemptId}`)
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string; attemptId?: string } } }
      const msg = errObj?.response?.data?.message || 'Could not start exam. Please try again.'
      const existingAttemptId = errObj?.response?.data?.attemptId ?? errObj?.response?.data?.attemptId

      if (msg.toLowerCase().includes('in-progress')) {
        // 1. Backend returned attemptId directly in error — navigate immediately
        if (existingAttemptId) {
          navigate(`/exam/room/${existingAttemptId}`)
          return
        }
        // 2. Search already-loaded history
        const inProgress = history.find(
          (a) => a.domain === domainName && a.phase === phase &&
            ['pending', 'active', 'in_progress'].includes(a.status as string)
        )
        if (inProgress) { navigate(`/exam/room/${inProgress.id}`); return }
        // 3. Last resort — fetch fresh history
        try {
          const { data: h } = await api.get('/exam/history?limit=20')
          const attempts: Array<{ domain: string; phase: number; status: string; id: string }> =
            h.data?.attempts ?? h.attempts ?? []
          const found = attempts.find(
            (a) => a.domain === domainName && a.phase === phase &&
              ['pending', 'active', 'in_progress'].includes(a.status)
          )
          if (found) { navigate(`/exam/room/${found.id}`); return }
        } catch {}
        toast.error('Could not find your in-progress exam. Please refresh.')
        return
      }
      toast.error(msg)
    } finally {
      setStartingDomain(null)
      setStartingPhase(null)
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
              desc: '25 multiple-choice questions on your domain. Pass with ≥50% to unlock Phase 2.',
              time: '45 min',
              color: 'var(--color-primary)',
              icon: <BookOpen size={18} />,
            },
            {
              phase: 'Phase 2',
              desc: 'Submit a GitHub project — AI generates 6 questions from your actual code.',
              time: '60 min',
              color: 'var(--color-secondary)',
              icon: <Shield size={18} />,
              req: 'Requires passing Phase 1',
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
                    {p.req && <Badge variant="warning" className="text-[10px]">{p.req}</Badge>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Domain grid */}
        <h2 className="text-sm font-medium text-[var(--color-text)] mb-4">Choose a Domain</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {DOMAINS.map((d) => {
            const status = getStatusForDomain(d.name)
            const p1 = status?.phase1
            const p2 = status?.phase2
            const isStarting1 = startingDomain === d.name && startingPhase === 1
            const isStarting2 = startingDomain === d.name && startingPhase === 2

            return (
              <motion.div key={d.id} whileHover={{ y: -2 }}>
                <Card className="p-5 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{d.icon}</span>
                    {p2?.passed && (
                      <div className="flex items-center gap-1 text-xs text-[var(--color-success)]">
                        <Trophy size={12} />
                        <span>Certified</span>
                      </div>
                    )}
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

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={p1?.passed ? 'outline' : 'primary'}
                      className="flex-1 text-xs"
                      disabled={!!startingDomain}
                      onClick={() => handleStartExam(d.name, 1)}
                    >
                      {isStarting1 ? 'Starting…' : p1?.attempted ? 'Retry P1' : 'Start P1'}
                    </Button>

                    {p1?.passed && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="flex-1 text-xs"
                        disabled={!!startingDomain}
                        onClick={() => handleStartExam(d.name, 2)}
                      >
                        {isStarting2 ? 'Starting…' : p2?.attempted ? 'Retry P2' : 'Start P2'}
                      </Button>
                    )}

                    {!p1?.passed && (
                      <div className="flex items-center justify-center flex-1 text-xs text-[var(--color-muted)]">
                        <Lock size={11} className="mr-1" /> P2 locked
                      </div>
                    )}
                  </div>
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
    </PageWrapper>
  )
}
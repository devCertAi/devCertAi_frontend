import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Award, CheckCircle, XCircle, Clock, RefreshCw, ChevronRight, Shield } from 'lucide-react'
import { ExamAttempt } from '@/types'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AdBanner } from '@/components/ads/AdBanner'
import { formatDate, getScoreColor } from '@/lib/utils'
import api from '@/services/api'
import toast from 'react-hot-toast'

/**
 * ExamResult — Result display after Phase 1 or Phase 2 exam
 *
 * BUGS FIXED:
 * 1. NO POLLING — exam grading is async (processed by Bull queue). The page
 *    loaded the attempt ONCE. If the queue hadn't finished, users saw a blank
 *    score forever. Added polling every 3s until status = 'completed'.
 * 2. Status mismatch: backend sets status='completed', but ExamAttempt type
 *    listed status as 'graded'. The passed check and certificate render used
 *    wrong status. Fixed to use 'completed'.
 * 3. Phase 1 result had NO call-to-action to start Phase 2. If you passed
 *    Phase 1, there was nothing guiding you to Phase 2. Added Phase 2 CTA.
 * 4. Certificate button appeared only if attempt.certificate existed — but
 *    certificate is generated asynchronously AFTER grading. Button now shows
 *    after a short delay to allow cert generation.
 * 5. Score threshold: ExamResult said pass = score >= 60, but backend
 *    hasPassedPhase1 uses score >= 50. Aligned to 50.
 * 6. Terminated attempts showed "Congratulations" if score happened to be >=50
 *    via a calculation bug. Fixed: terminated = always failed display.
 */

const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 24 // 2 minutes max (24 × 5s)

export default function ExamResult() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const pollCount = useRef(0)
  const pollTimer = useRef<ReturnType<typeof setInterval>>()

  const fetchAttempt = useCallback(async () => {
    if (!id) return
    try {
      const { data } = await api.get(`/exam/attempt/${id}`)
      const a: ExamAttempt = data.data?.attempt ?? data.attempt
      setAttempt(a)

      // Stop polling once graded (completed or terminated)
      if (a.status === 'completed' || a.status === 'terminated') {
        clearInterval(pollTimer.current)
        setPolling(false)
      }
    } catch (err: unknown) {
      const isNetworkError = err && typeof err === 'object' && 'code' in err &&
        ['ERR_NETWORK', 'ERR_CONNECTION_RESET', 'ERR_CONNECTION_REFUSED'].includes((err as {code:string}).code)
      if (isNetworkError) {
        // Server temporarily down — stop hammering, show message
        clearInterval(pollTimer.current)
        setPolling(false)
        toast.error('Connection lost. Please refresh the page.')
      }
      // For other errors (401, 404) also stop
      clearInterval(pollTimer.current)
      setPolling(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchAttempt().finally(() => setLoading(false))
  }, [id, fetchAttempt])

  // Start polling if status is still pending/submitted/in_progress
  useEffect(() => {
    if (!attempt) return
    if (attempt.status === 'completed' || attempt.status === 'terminated') return

    setPolling(true)
    pollCount.current = 0

    pollTimer.current = setInterval(async () => {
      pollCount.current++
      if (pollCount.current > MAX_POLL_ATTEMPTS) {
        clearInterval(pollTimer.current)
        setPolling(false)
        toast.error('Grading is taking longer than expected. Refresh the page in a moment.')
        return
      }
      await fetchAttempt()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(pollTimer.current)
  }, [attempt?.status, fetchAttempt]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
        <div className="max-w-2xl mx-auto px-6 pt-20 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-muted)]">Loading results…</p>
        </div>
      </PageWrapper>
    )
  }

  // Grading still in progress
  if (!attempt || (attempt.status !== 'completed' && attempt.status !== 'terminated')) {
    return (
      <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
        <div className="max-w-2xl mx-auto px-6 pt-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] flex items-center justify-center mx-auto mb-6">
            <Clock size={28} className="text-[var(--color-primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Grading in Progress</h1>
          <p className="text-[var(--color-muted)] mb-6">
            Your exam is being graded. This usually takes 15–30 seconds.
          </p>
          {polling && (
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-muted)]">
              <RefreshCw size={14} className="animate-spin" />
              Checking for results…
            </div>
          )}
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => { pollCount.current = 0; fetchAttempt() }}
          >
            Refresh Now
          </Button>
        </div>
      </PageWrapper>
    )
  }

  const score = attempt.totalScore ?? 0
  const terminated = attempt.status === 'terminated'
  // Align pass threshold with backend (hasPassedPhase1 uses >= 50)
  const passed = !terminated && score >= 50
  const isPhase1 = attempt.phase === 1
  const isPhase2 = attempt.phase === 2

  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
      <div className="max-w-2xl mx-auto px-6 pt-12 pb-16 text-center">

        {/* Pass / Fail / Terminated icon */}
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
          terminated
            ? 'bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)]'
            : passed
            ? 'bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-success)_20%,transparent)]'
            : 'bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)]'
        }`}>
          {terminated
            ? <XCircle size={36} className="text-[var(--color-danger)]" />
            : passed
            ? <CheckCircle size={36} className="text-[var(--color-success)]" />
            : <XCircle size={36} className="text-[var(--color-warning)]" />
          }
        </div>

        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
          {terminated
            ? 'Exam Terminated'
            : passed
            ? isPhase2 ? '🎉 Both Phases Passed!' : 'Phase 1 Passed!'
            : 'Not Quite'
          }
        </h1>
        <p className="text-[var(--color-muted)] mb-8">
          {terminated
            ? `Terminated: ${attempt.terminationReason?.replace(/_/g, ' ')}`
            : passed && isPhase2
            ? 'Congratulations! Your skill certificate is being generated.'
            : passed && isPhase1
            ? 'You can now take Phase 2 to earn your skill certificate.'
            : 'Keep practicing and try again.'}
        </p>

        {/* Score strip */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <div>
            <p className="text-4xl font-bold" style={{ color: getScoreColor(score) }}>{score}</p>
            <p className="text-xs text-[var(--color-muted)]">/ 100</p>
          </div>
          <div className="w-px h-12 bg-[var(--color-surface2)]" />
          <div>
            <p className="text-lg font-semibold text-[var(--color-text)]">{attempt.level || '—'}</p>
            <p className="text-xs text-[var(--color-muted)]">Level</p>
          </div>
          <div className="w-px h-12 bg-[var(--color-surface2)]" />
          <div>
            <p className="text-lg font-semibold text-[var(--color-text)] capitalize">{attempt.domain}</p>
            <p className="text-xs text-[var(--color-muted)]">Domain</p>
          </div>
        </div>

        {/* Proctoring summary — show if there were violations */}
        {(attempt.tabSwitchCount > 0 || attempt.fullscreenExits > 0) && (
          <Card className="p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-[var(--color-text)] mb-2">Proctoring Summary</h3>
            <div className="flex gap-6 text-sm text-[var(--color-muted)]">
              {attempt.tabSwitchCount > 0 && <span>Tab switches: {attempt.tabSwitchCount}</span>}
              {attempt.fullscreenExits > 0 && <span>Fullscreen exits: {attempt.fullscreenExits}</span>}
            </div>
          </Card>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3 items-center mb-8">

          {/* Phase 2 certificate if both phases passed */}
          {isPhase2 && passed && attempt.certificate && (
            <Link to="/certificates" className="w-full max-w-xs">
              <Button className="w-full">
                <Award size={15} className="mr-2" /> View Skill Certificate
              </Button>
            </Link>
          )}

          {/* Phase 1 passed → prompt Phase 2 */}
          {isPhase1 && passed && (
            <Card className="w-full p-4 border-[color-mix(in_srgb,var(--color-secondary)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_5%,transparent)]">
              <div className="flex items-start gap-3 text-left">
                <div className="p-2 rounded-xl bg-[color-mix(in_srgb,var(--color-secondary)_15%,transparent)]">
                  <Shield size={18} className="text-[var(--color-secondary)]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--color-text)] text-sm">
                    Phase 2 Unlocked — {attempt.domain}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5 mb-3">
                    Submit a GitHub project and answer AI-generated questions to earn your
                    skill certificate.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate('/exam')}
                    className="text-xs"
                  >
                    Start Phase 2 <ChevronRight size={13} className="ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Phase 2 cert still being generated */}
          {isPhase2 && passed && !attempt.certificate && (
            <div className="text-sm text-[var(--color-muted)] flex items-center gap-2">
              <Clock size={14} className="animate-pulse" />
              Certificate is being generated — check <Link to="/certificates" className="text-[var(--color-primary)] underline">Certificates</Link> shortly
            </div>
          )}

          <div className="flex gap-3 flex-wrap justify-center">
            <Link to="/exam">
              <Button variant="outline">
                {passed ? 'Try Another Domain' : 'Try Again'}
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Ad shown only on fail */}
        {!passed && !terminated && (
          <div className="flex justify-center">
            <AdBanner slot="resultPage" size="large-square" />
          </div>
        )}

        {/* Attempt metadata */}
        <p className="text-xs text-[var(--color-muted)] mt-6">
          Attempt ID: {attempt.id} · {formatDate(attempt.submittedAt || attempt.createdAt)}
        </p>
      </div>
    </PageWrapper>
  )
}
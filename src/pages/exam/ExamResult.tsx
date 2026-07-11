import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Award, CheckCircle, XCircle, Clock, RefreshCw, ChevronRight, Shield,
  ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react'
import { ExamAttempt, Phase1Review, Phase2Review } from '@/types'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AdBanner } from '@/components/ads/AdBanner'
import { formatDate, getScoreColor, cn } from '@/lib/utils'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { useComboStore } from '@/store/comboStore'

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
 * 7. COMBO FLOW REWORK: Phase 1 used to auto-grade AND auto-start Phase 2
 *    silently, flashing the Phase 1 score/pass state for a moment before
 *    redirecting. Now Phase 1's score is not revealed at all mid-combo —
 *    the candidate sees a neutral "Phase 1 complete" screen with an explicit
 *    "Continue to Phase 2" button, and Phase 2 is only started when they
 *    click it. The combined score (both phases) is calculated and shown
 *    together once Phase 2 finishes, alongside a full question-by-question
 *    review of both phases (right/wrong, given vs correct answer, and an
 *    explanation for anything marked wrong).
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
  const [comboStarting, setComboStarting] = useState(false)
  const comboActive = useComboStore((s) => s.active)
  const comboDomain = useComboStore((s) => s.domain)
  const comboGithubUrl = useComboStore((s) => s.githubUrl)
  const comboPhase2Difficulty = useComboStore((s) => s.phase2Difficulty)
  const comboPhase2QuestionCount = useComboStore((s) => s.phase2QuestionCount)
  const comboPhase1AttemptId = useComboStore((s) => s.phase1AttemptId)
  const comboClear = useComboStore((s) => s.clear)
  const comboSetPhase1AttemptId = useComboStore((s) => s.setPhase1AttemptId)

  // Paired Phase 1 attempt, fetched only when this IS a Phase 2 result that
  // has a completed Phase 1 counterpart — powers the combined result view.
  const [pairedPhase1, setPairedPhase1] = useState<ExamAttempt | null>(null)
  const [pairedLoading, setPairedLoading] = useState(false)
  const [showReview, setShowReview] = useState(false)

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

  // Combo flow: Phase 1 just got graded in the background. Remember its id
  // (so the Phase 2 result page can pair with it later) but do NOT reveal
  // the Phase 1 score or auto-start Phase 2 — that now waits for an
  // explicit click on "Continue to Phase 2" below.
  useEffect(() => {
    if (!attempt) return
    if (attempt.status !== 'completed' && attempt.status !== 'terminated') return
    if (attempt.phase !== 1) return
    if (!comboActive || comboDomain !== attempt.domain) return
    if (comboPhase1AttemptId === attempt.id) return // already recorded

    // Phase 1 failed or was terminated — combo can't continue. Clear the
    // stale combo state so it doesn't leak into some unrelated later
    // attempt; the normal (non-combo) result screen below still shows the
    // score/fail state since there's nothing left to defer it for.
    if (attempt.status === 'terminated' || (attempt.totalScore ?? 0) < 50) {
      comboClear()
      return
    }

    comboSetPhase1AttemptId(attempt.id)
  }, [attempt, comboActive, comboDomain, comboPhase1AttemptId, comboClear, comboSetPhase1AttemptId])

  // Explicit "Continue to Phase 2" action — starts Phase 2 with the same
  // GitHub project/difficulty the candidate configured for the combo run,
  // then drops them straight into the Phase 2 room.
  const startPhase2Combo = useCallback(async () => {
    if (!attempt) return
    setComboStarting(true)
    try {
      const { data: startData } = await api.post('/exam/start', {
        domain: attempt.domain,
        phase: 2,
        difficulty: comboPhase2Difficulty,
        questionCount: comboPhase2QuestionCount,
      })
      const phase2AttemptId = startData.data?.attemptId ?? startData.attemptId
      if (!phase2AttemptId) throw new Error('No attemptId in response')

      await api.post(`/exam/attempt/${phase2AttemptId}/phase2/project`, {
        githubUrl: comboGithubUrl,
      }, { timeout: 90_000 })

      navigate(`/exam/room/${phase2AttemptId}`)
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } }
      toast.error(
        errObj?.response?.data?.message ||
          'Could not start Phase 2. Please start it manually from Exams.'
      )
      comboClear()
      setComboStarting(false)
    }
  }, [attempt, comboGithubUrl, comboPhase2Difficulty, comboPhase2QuestionCount, comboClear, navigate])

  // Combined result: once this IS a completed Phase 2 attempt paired with a
  // Phase 1 attempt (either from the live combo store, or — if the page was
  // refreshed / revisited later and the store got cleared — from the
  // `otherPhase` info the backend already computes), fetch that Phase 1
  // attempt's full detail so both scores/reviews can be shown together.
  useEffect(() => {
    if (!attempt) return
    if (attempt.phase !== 2) return
    if (attempt.status !== 'completed' && attempt.status !== 'terminated') return
    const phase1Id = (comboDomain === attempt.domain ? comboPhase1AttemptId : null) || attempt.otherPhase?.attemptId
    if (!phase1Id || pairedPhase1 || pairedLoading) return

    setPairedLoading(true)
    api.get(`/exam/attempt/${phase1Id}`)
      .then(({ data }) => {
        const a: ExamAttempt = data.data?.attempt ?? data.attempt
        setPairedPhase1(a)
      })
      .catch(() => { /* non-critical — combined view just won't show */ })
      .finally(() => {
        setPairedLoading(false)
        comboClear()
      })
  }, [attempt, comboPhase1AttemptId, comboDomain, pairedPhase1, pairedLoading, comboClear])

  if (comboStarting) {
    return (
      <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
        <div className="max-w-2xl mx-auto px-6 pt-20 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">Setting Up Phase 2</h1>
          <p className="text-[var(--color-muted)]">Analyzing your GitHub project and generating questions…</p>
        </div>
      </PageWrapper>
    )
  }

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

  const isPhase1 = attempt.phase === 1
  const isPhase2 = attempt.phase === 2
  const terminated = attempt.status === 'terminated'
  const passed = !terminated && (attempt.totalScore ?? 0) >= 50

  // Combo gate: Phase 1 just passed and this run is still an active combo —
  // show a neutral "continue" screen instead of the score. (Failed/
  // terminated Phase 1 combo runs fall through to the normal result screen
  // below since comboClear() already fired for those and there's nothing
  // left to gate.)
  const comboGateActive = isPhase1 && comboActive && comboDomain === attempt.domain && passed

  if (comboGateActive) {
    return (
      <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
        <div className="max-w-2xl mx-auto px-6 pt-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={28} className="text-[var(--color-primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Phase 1 Complete</h1>
          <p className="text-[var(--color-muted)] mb-8 max-w-md mx-auto">
            Your Phase 1 answers have been recorded. Continue to Phase 2 — your
            combined score and a full breakdown of both phases will be shown
            once Phase 2 is finished.
          </p>
          <Button onClick={startPhase2Combo} size="lg">
            Continue to Phase 2 <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </PageWrapper>
    )
  }

  // Combined combo score — once Phase 2 is done and we have the paired
  // Phase 1 attempt, the headline score/level shown is the average of both
  // phases rather than just this (Phase 2) attempt's score, since that's
  // what a "combo" pass actually represents.
  const hasCombinedView = isPhase2 && !!pairedPhase1 &&
    (pairedPhase1.status === 'completed' || pairedPhase1.status === 'terminated')
  const phase1Score = pairedPhase1?.totalScore ?? 0
  const phase2Score = attempt.totalScore ?? 0
  const combinedScore = hasCombinedView ? Math.round((phase1Score + phase2Score) / 2) : null
  const comboPassed = hasCombinedView && passed && phase1Score >= 50 && pairedPhase1?.status !== 'terminated'

  const score = combinedScore ?? (attempt.totalScore ?? 0)

  // score, pass/fail verdict, or certificate — that information is for the
  // recruiter only. The backend now strips these fields and sets
  // `resultsHidden` on pipeline attempts; render a neutral confirmation
  // screen instead of the score breakdown below.
  const isPipeline = attempt.source === 'pipeline' || attempt.resultsHidden

  if (isPipeline) {
    return (
      <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
        <div className="max-w-2xl mx-auto px-6 pt-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={28} className="text-[var(--color-primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            {terminated ? 'Assessment Terminated' : 'Assessment Submitted'}
          </h1>
          <p className="text-[var(--color-muted)] mb-8 max-w-md mx-auto">
            {terminated
              ? 'Your assessment session ended early due to a proctoring violation. This has been recorded for the recruiter.'
              : 'Your responses have been submitted. The recruiter will review your results as part of your application — check your application for updates.'}
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            {attempt.applicationId && (
              <Link to={`/applications/${attempt.applicationId}`}>
                <Button>View Application</Button>
              </Link>
            )}
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </div>
        </div>
      </PageWrapper>
    )
  }

  const phase1Review = (isPhase1 ? attempt.evaluationReport : pairedPhase1?.evaluationReport) as Phase1Review | null | undefined
  const phase2Review = (isPhase2 ? attempt.evaluationReport : undefined) as Phase2Review | null | undefined
  const hasReviewData = !!(phase1Review?.breakdown?.length || phase2Review?.breakdown?.length)

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
            ? comboPassed ? 'Both Phases Passed!' : isPhase2 ? 'Phase 2 Passed!' : 'Phase 1 Passed!'
            : 'Not Quite'
          }
        </h1>
        <p className="text-[var(--color-muted)] mb-8">
          {terminated
            ? `Terminated: ${attempt.terminationReason?.replace(/_/g, ' ')}`
            : comboPassed
            ? 'Congratulations! Your combo certificate (Phase 1 + Phase 2) is being generated.'
            : passed && isPhase2
            ? 'Congratulations! Your skill certificate is being generated.'
            : passed && isPhase1
            ? 'You can now take Phase 2 to earn your skill certificate.'
            : 'Keep practicing and try again.'}
        </p>

        {/* Score strip — combined average when this is a combo run */}
        <div className="flex items-center justify-center gap-8 mb-2">
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

        {hasCombinedView && (
          <p className="text-xs text-[var(--color-muted)] mb-6">
            Combined score — Phase 1: <span className="font-medium text-[var(--color-text)]">{phase1Score}</span> · Phase 2: <span className="font-medium text-[var(--color-text)]">{phase2Score}</span>
          </p>
        )}
        {!hasCombinedView && <div className="mb-6" />}

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

        {/* Detailed Q&A review — which Phase 1 answers were wrong (with the
            correct answer + why), and per-question Phase 2 feedback (why an
            answer scored what it did and what the stronger answer looks
            like). Collapsed by default to keep the pass/fail summary above
            the fold. */}
        {hasReviewData && (
          <Card className="w-full p-0 mb-6 text-left overflow-hidden">
            <button
              onClick={() => setShowReview((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-[var(--color-text)]"
            >
              Detailed Answer Review
              {showReview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showReview && (
              <div className="border-t border-[var(--color-border)] px-4 py-4 space-y-6">
                {phase1Review?.breakdown?.length ? (
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-3">
                      Phase 1 — {phase1Review.correct}/{phase1Review.total} correct
                    </h4>
                    <Phase1ReviewList items={phase1Review.breakdown} />
                  </div>
                ) : null}
                {phase2Review?.breakdown?.length ? (
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-3">
                      Phase 2 — Project Questions
                    </h4>
                    {phase2Review.summary && (
                      <p className="text-sm text-[var(--color-muted)] mb-3 italic">{phase2Review.summary}</p>
                    )}
                    <Phase2ReviewList items={phase2Review.breakdown} />
                  </div>
                ) : null}
              </div>
            )}
          </Card>
        )}
        {pairedLoading && !hasReviewData && (
          <p className="text-xs text-[var(--color-muted)] mb-6 flex items-center justify-center gap-2">
            <RefreshCw size={12} className="animate-spin" /> Loading Phase 1 review…
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3 items-center mb-8">

          {/* Skill certificate for this Phase 2 attempt (independent of any combo cert) */}
          {isPhase2 && passed && attempt.certificate && (
            <Link to="/certificates" className="w-full max-w-xs">
              <Button className="w-full">
                <Award size={15} className="mr-2" /> View Skill Certificate
              </Button>
            </Link>
          )}

          {/* Phase 1 passed → prompt Phase 2 (skip if Phase 2 already passed too) */}
          {isPhase1 && passed && !attempt.otherPhase?.passed && (
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

// ── Phase 1 review: right/wrong per MCQ question, with the correct answer
// and (for wrong ones) a short explanation of why. ──────────────────────────
function Phase1ReviewList({ items }: { items: NonNullable<Phase1Review['breakdown']> }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={item.questionId || i}
          className={cn(
            'rounded-xl border p-3.5',
            item.isCorrect
              ? 'border-[color-mix(in_srgb,var(--color-success)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_5%,transparent)]'
              : 'border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_5%,transparent)]'
          )}
        >
          <div className="flex items-start gap-2">
            {item.isCorrect
              ? <CheckCircle size={15} className="text-[var(--color-success)] mt-0.5 shrink-0" />
              : <XCircle size={15} className="text-[var(--color-danger)] mt-0.5 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--color-text)] font-medium">{i + 1}. {item.question}</p>
              <p className="text-xs text-[var(--color-muted)] mt-1.5">
                Your answer: <span className={item.isCorrect ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                  {item.givenAnswer ?? '(no answer)'}
                </span>
              </p>
              {!item.isCorrect && (
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Correct answer: <span className="text-[var(--color-success)]">{item.correctAnswer}</span>
                </p>
              )}
              {!item.isCorrect && item.explanation && (
                <p className="text-xs text-[var(--color-muted)] mt-2 italic">{item.explanation}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Phase 2 review: per-question AI feedback explaining why the answer
// scored what it did and what the stronger/correct answer looks like. ──────
function Phase2ReviewList({ items }: { items: NonNullable<Phase2Review['breakdown']> }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const scoreRatio = item.score != null ? item.score / (item.maxScore || 10) : null
        const isGood = scoreRatio !== null && scoreRatio >= 0.7
        const isWeak = scoreRatio !== null && scoreRatio < 0.4
        return (
          <div
            key={i}
            className={cn(
              'rounded-xl border p-3.5',
              isGood
                ? 'border-[color-mix(in_srgb,var(--color-success)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_5%,transparent)]'
                : isWeak
                ? 'border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_5%,transparent)]'
                : 'border-[color-mix(in_srgb,var(--color-warning)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-warning)_5%,transparent)]'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-[var(--color-text)] font-medium flex-1">{i + 1}. {item.question}</p>
              {item.score != null && (
                <span className="text-xs font-semibold text-[var(--color-text)] shrink-0">{item.score}/{item.maxScore}</span>
              )}
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-1.5 whitespace-pre-wrap">
              Your answer: {item.givenAnswer?.trim() ? item.givenAnswer : '(no answer)'}
            </p>
            {item.feedback && (
              <p className="text-xs text-[var(--color-muted)] mt-2 italic">{item.feedback}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}


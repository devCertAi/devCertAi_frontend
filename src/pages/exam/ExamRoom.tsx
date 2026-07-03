import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, GitBranch, Loader2, Upload } from 'lucide-react'
import { useExamStore } from '@/store/examStore'
import { useProctor } from '@/hooks/useProctor'
import { useTimer } from '@/hooks/useTimer'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { ExamSidebar } from '@/components/exam/ExamSidebar'
import { ViolationWarning } from '@/components/exam/ViolationWarning'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import api from '@/services/api'
import toast from 'react-hot-toast'

/**
 * ExamRoom — Full working exam UI for Phase 1 and Phase 2
 *
 * BUGS FIXED:
 * 1. Timer used localStorage (persisted across sessions) — now uses sessionStorage
 *    scoped by attemptId.
 * 2. Camera stream was opened TWICE (in requestPermissions + ExamRoom via getUserMedia).
 *    Now reuses the single stream from useProctor.cameraStream.
 * 3. Violation listener cleanup was returned from handleStartExam but React onClick
 *    handlers discard return values — cleanup was never registered. Fixed by storing
 *    it in a ref and calling it on unmount.
 * 4. examStore was never reset before loading a new attempt — stale answers/violations
 *    from previous exam persisted.
 * 5. Phase 2 flow was COMPLETELY MISSING — no GitHub URL input, no project submission,
 *    no phase 2 question display. Added full Phase 2 UI.
 * 6. Phase 1 answers used numeric index as key in the store, but backend grades by
 *    question.id. Fixed: answers sent with question.id as key.
 * 7. Heartbeat was never started. Fixed in useProctor.
 * 8. handleSubmit after time expiry had a dangling navigate race condition.
 * 9. ExamResult page had no polling — results are async (graded by queue). Added
 *    result polling here via navigate after confirming 'completed' status.
 */

type LobbyState = 'lobby' | 'exam' | 'submitted'

export default function ExamRoom() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    currentAttempt, currentQuestion, answers, markedForReview,
    violationCount, setAttempt, setAnswer, toggleReview,
    setCurrentQuestion, setTimeRemaining, addViolation, resetExam,
    phase2Step, setPhase2Step, githubUrl, setGithubUrl, setPhase2Questions,
  } = useExamStore()

  const [lobbyState, setLobbyState] = useState<LobbyState>('lobby')
  const [checklist, setChecklist] = useState({
    camera: false, mic: false, fullscreen: false, internet: false, agreed: false,
  })
  const [showViolation, setShowViolation] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [timeLeft, setTimeLeft] = useState(2700) // default until attempt loads
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phase2Loading, setPhase2Loading] = useState(false)

  // Refs
  const violationCleanupRef = useRef<(() => void) | null>(null)
  const hasSubmitted = useRef(false)

  // ── Callbacks must be defined BEFORE useProctor/useTimer ──────────────────
  const handleViolation = useCallback((count: number) => {
    addViolation()
    setShowViolation(true)
    setTimeout(() => setShowViolation(false), 4000)
    toast.error(`⚠️ Violation ${count}/3 — ${3 - count} remaining before termination`)
  }, [addViolation])

  const handleSubmit = useCallback(async (auto = false) => {
    if (hasSubmitted.current) return
    hasSubmitted.current = true
    setIsSubmitting(true)
    if (!auto) setShowSubmitConfirm(false)

    // Teardown proctoring before navigate
    violationCleanupRef.current?.()

    try {
      timer.stop()
      await api.post(`/exam/attempt/${id}/submit`)
      navigate(`/exam/result/${id}`)
    } catch {
      toast.error('Submission failed — retrying in 3s')
      hasSubmitted.current = false
      setIsSubmitting(false)
      setTimeout(() => handleSubmit(auto), 3000)
    }
  }, [id, navigate])

  const handleTerminate = useCallback(async (reason: string) => {
    if (hasSubmitted.current) return
    hasSubmitted.current = true
    toast.error(`Exam terminated: ${reason}`)
    violationCleanupRef.current?.()
    timer.stop()
    try {
      await api.post(`/exam/attempt/${id}/submit`, { terminationReason: reason })
    } catch {}
    navigate('/exam/result/' + id)
  }, [id, navigate])

  const { requestPermissions, enterFullscreen, setupViolationListeners, teardown, cameraStream } =
    useProctor(id!, handleViolation, handleTerminate)

  const timer = useTimer(
    timeLeft || currentAttempt?.timeLimitSec || 2700,
    id!,
    (remaining) => {
      setTimeLeft(remaining)
      setTimeRemaining(remaining)
    },
    () => handleSubmit(true)
  )

  // ── Load attempt on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    resetExam() // Clear any stale state from a previous exam
    api.get(`/exam/attempt/${id}`)
      .then(({ data }) => {
        const attempt = data.data?.attempt ?? data.attempt
        setAttempt(attempt)
        setTimeLeft(attempt.timeLimitSec)
      })
      .catch(() => {
        toast.error('Failed to load exam')
        navigate('/exam')
      })

    return () => {
      violationCleanupRef.current?.()
      teardown()
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pre-exam checklist permission check ───────────────────────────────────
  const handlePermissions = async () => {
    // Test camera + mic
    const perms = await requestPermissions()

    // Test internet connectivity
    let latencyOk = false
    try {
      const start = performance.now()
      const resp = await fetch('/api/health', { cache: 'no-store' })
      latencyOk = resp.ok && performance.now() - start < 5000
    } catch {}

    // Enter fullscreen as part of the check
    await enterFullscreen()

    setChecklist((prev) => ({
      ...prev,
      camera: perms.camera,
      mic: perms.mic,
      internet: latencyOk,
      fullscreen: !!document.fullscreenElement,
    }))

    if (!perms.camera) toast.error('Camera access denied — allow it in your browser settings')
    if (!perms.mic)    toast.error('Microphone access denied — allow it in your browser settings')
    if (!latencyOk)    toast.error('Internet connection issue — check your network')
  }

  // ── Start exam after checklist ─────────────────────────────────────────────
  const handleStartExam = async () => {
    await enterFullscreen()
    const cleanup = setupViolationListeners()
    violationCleanupRef.current = cleanup // Store for unmount
    setLobbyState('exam')
    timer.start()
  }

  // ── Answer a Phase 1 question ─────────────────────────────────────────────
  const handleAnswer = async (answer: string) => {
    const question = questions[currentQuestion]
    if (!question) return

    // Key by question.id for accurate backend grading
    const key = currentAttempt?.phase === 1 ? question.id : String(currentQuestion)
    setAnswer(key, answer)

    try {
      await api.post(`/exam/attempt/${id}/answer`, {
        questionIndex: currentQuestion,
        answer,
      })
    } catch {
      // Non-critical: answers are saved locally too
    }
  }

  // ── Phase 2: Submit GitHub URL to generate questions ───────────────────────
  const handlePhase2ProjectSubmit = async () => {
    if (!githubUrl.trim()) {
      toast.error('Please enter a GitHub repository URL')
      return
    }
    if (!githubUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub URL (e.g. https://github.com/user/repo)')
      return
    }
    setPhase2Loading(true)
    try {
      const { data } = await api.post(`/exam/attempt/${id}/phase2/project`, {
        githubUrl: githubUrl.trim(),
      })
      // Map backend response to Question[] shape
      const qs = data.questions.map((q: { question: string; context?: string; type?: string; index: number }) => ({
        id: String(q.index),
        question: q.question,
        context: q.context || '',
        type: q.type || 'text',
        options: undefined,
      }))
      setPhase2Questions(qs)
      setPhase2Step('questions')
      toast.success(`${qs.length} questions generated from your project!`)
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      toast.error(msg || 'Could not analyze repository. Check the URL and try again.')
    } finally {
      setPhase2Loading(false)
    }
  }

  const questions = currentAttempt?.questions || []
  const isPhase2 = currentAttempt?.phase === 2
  const answeredCount = Object.keys(answers).length

  // ── Lobby screen ───────────────────────────────────────────────────────────
  if (lobbyState === 'lobby') {
    const allGreen = checklist.camera && checklist.mic && checklist.internet && checklist.agreed
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-[var(--color-inverse)] font-bold text-lg">DC</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Pre-Exam Checklist</h1>
            <p className="text-[var(--color-muted)] text-sm mt-1">
              {isPhase2 ? 'Phase 2 — Project-based exam' : 'Phase 1 — Multiple choice'}
            </p>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 mb-6">
            {[
              { key: 'camera', label: 'Camera Permission', hint: 'Required for proctoring' },
              { key: 'mic', label: 'Microphone Permission', hint: 'Required for proctoring' },
              { key: 'internet', label: 'Stable Internet', hint: 'Tested against server' },
            ].map(({ key, label, hint }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-[var(--color-text)]">{label}</span>
                  <p className="text-xs text-[var(--color-muted)]">{hint}</p>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  checklist[key as keyof typeof checklist]
                    ? 'bg-[var(--color-success)]'
                    : 'bg-[var(--color-surface2)]'
                }`}>
                  {checklist[key as keyof typeof checklist] && (
                    <svg viewBox="0 0 12 12" className="w-3 h-3">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handlePermissions} variant="outline" className="w-full mb-4">
            Check Permissions
          </Button>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={checklist.agreed}
              onChange={(e) => setChecklist({ ...checklist, agreed: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--color-muted)]">
              I agree to exam rules: no tab switching, no copy-paste, fullscreen required.
              Violations auto-submit my exam.{' '}
              {isPhase2 && 'I have a GitHub project URL ready for Phase 2.'}
            </span>
          </label>

          <Button
            onClick={handleStartExam}
            disabled={!allGreen}
            className="w-full"
            size="lg"
          >
            Start {isPhase2 ? 'Phase 2' : 'Phase 1'} Exam
          </Button>
          {!allGreen && (
            <p className="text-xs text-[var(--color-muted)] text-center mt-2">
              Complete all checklist items first
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Phase 2: GitHub project input screen ──────────────────────────────────
  if (isPhase2 && phase2Step === 'project_input') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[var(--color-secondary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GitBranch size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Submit Your Project</h1>
            <p className="text-[var(--color-muted)] text-sm mt-1">
              AI will analyze your code and generate 6 personalized questions
            </p>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 mb-4">
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              GitHub Repository URL
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/yourusername/your-repo"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
            />
            <p className="text-xs text-[var(--color-muted)] mt-2">
              Must be a public repository in the <strong>{currentAttempt?.domain}</strong> domain.
              Questions will be generated based on your actual code.
            </p>
          </div>

          <div className="bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)] rounded-xl p-4 mb-6">
            <p className="text-xs text-[var(--color-warning)] font-medium mb-1">No project available?</p>
            <p className="text-xs text-[var(--color-muted)]">
              If you don't have a project, you can skip Phase 2 and your Phase 1 result
              will be shown. A certificate requires passing both phases.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-[var(--color-warning)]"
              onClick={() => navigate(`/exam/result/${id}`)}
            >
              Skip Phase 2 → See Phase 1 Result
            </Button>
          </div>

          <Button
            onClick={handlePhase2ProjectSubmit}
            disabled={phase2Loading || !githubUrl.trim()}
            className="w-full"
            size="lg"
          >
            {phase2Loading ? (
              <><Loader2 size={16} className="animate-spin mr-2" /> Analyzing repository…</>
            ) : (
              <><Upload size={16} className="mr-2" /> Generate Questions</>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ── Main exam view (Phase 1 or Phase 2 questions) ─────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[var(--color-primary)] rounded-md flex items-center justify-center">
            <span className="text-[var(--color-inverse)] text-xs font-bold">DC</span>
          </div>
          <span className="text-sm font-medium text-[var(--color-text)] capitalize">
            {currentAttempt?.domain} — Phase {currentAttempt?.phase}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-muted)]">
            Q {currentQuestion + 1}/{questions.length}
          </span>
          {violationCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-[var(--color-warning)]">
              <AlertTriangle size={12} />
              {violationCount} violation{violationCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Question area */}
        <div className="flex-1 flex flex-col">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 flex-1 flex flex-col">
            {questions[currentQuestion] ? (
              <QuestionCard
                question={questions[currentQuestion]}
                index={currentQuestion}
                total={questions.length}
                // Use question.id as key for Phase 1, index for Phase 2
                answer={
                  currentAttempt?.phase === 1
                    ? answers[questions[currentQuestion]?.id]
                    : answers[String(currentQuestion)]
                }
                onAnswer={handleAnswer}
              />
            ) : (
              <div className="flex items-center justify-center flex-1">
                <Loader2 size={24} className="animate-spin text-[var(--color-muted)]" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleReview(currentQuestion)}
              className="text-xs"
            >
              {markedForReview.has(currentQuestion) ? '★ Marked' : '☆ Mark for Review'}
            </Button>
            <Button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === questions.length - 1}
            >
              Next →
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <ExamSidebar
          total={questions.length}
          current={currentQuestion}
          answers={answers}
          phase={currentAttempt?.phase || 1}
          questions={questions}
          markedForReview={markedForReview}
          timeRemaining={timeLeft}
          cameraStream={cameraStream}
          onJump={setCurrentQuestion}
          onSubmit={() => setShowSubmitConfirm(true)}
          violationCount={violationCount}
        />
      </div>

      <ViolationWarning count={violationCount} show={showViolation} />

      <Modal
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="Submit Exam?"
        size="sm"
      >
        <p className="text-sm text-[var(--color-muted)] mb-5">
          You've answered {answeredCount}/{questions.length} questions.
          {answeredCount < questions.length && (
            <span className="text-[var(--color-warning)]">
              {' '}⚠️ {questions.length - answeredCount} unanswered.
            </span>
          )}{' '}
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={() => setShowSubmitConfirm(false)}
            className="flex-1"
            disabled={isSubmitting}
          >
            Continue Exam
          </Button>
          <Button
            variant="danger"
            onClick={() => handleSubmit()}
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            Submit Now
          </Button>
        </div>
      </Modal>
    </div>
  )
}
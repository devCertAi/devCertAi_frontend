import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, GitBranch, Loader2, Upload, Star } from 'lucide-react'
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
  const [timeLeft, setTimeLeft] = useState(2700)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phase2Loading, setPhase2Loading] = useState(false)
  const [attemptLoadError, setAttemptLoadError] = useState<string | null>(null)
  const [phase2Source, setPhase2Source] = useState<'github' | 'zip'>('github')
  const [domainMismatch, setDomainMismatch] = useState<string | null>(null)
  const [phase2ZipFile, setPhase2ZipFile] = useState<File | null>(null)
  const [fsFrontendSource, setFsFrontendSource] = useState<'github' | 'zip'>('github')
  const [fsBackendSource, setFsBackendSource] = useState<'github' | 'zip'>('github')
  const [frontendGithubUrl, setFrontendGithubUrl] = useState('')
  const [backendGithubUrl, setBackendGithubUrl] = useState('')
  const [frontendZipFile, setFrontendZipFile] = useState<File | null>(null)
  const [backendZipFile, setBackendZipFile] = useState<File | null>(null)

  const violationCleanupRef = useRef<(() => void) | null>(null)
  const hasSubmitted = useRef(false)
  const submitRetryCount = useRef(0)
  const MAX_SUBMIT_RETRIES = 5

  const answerSaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const pendingAnswerRef = useRef<{ questionIndex: number; answer: string } | null>(null)

  const saveAnswerNow = useCallback(async (questionIndex: number, answer: string) => {
    try {
      await api.post(`/exam/attempt/${id}/answer`, { questionIndex, answer })
      if (pendingAnswerRef.current?.questionIndex === questionIndex) pendingAnswerRef.current = null
    } catch {
    }
  }, [id])

  const flushPendingAnswer = useCallback(() => {
    clearTimeout(answerSaveTimer.current)
    const pending = pendingAnswerRef.current
    if (pending) saveAnswerNow(pending.questionIndex, pending.answer)
  }, [saveAnswerNow])

  // Exit fullscreen (if we're in it) and give the browser's exit-fullscreen
  // animation a brief moment to finish BEFORE we navigate away. Fullscreen
  // Exit triggers an OS/compositor-level transition; doing it at the exact
  // moment the page unmounts (as a route-change cleanup) made that
  // transition visually collide with the DOM swap, which is what showed up
  // as a black flash outside the browser window right as the result/
  // certificate page loaded. Doing it here, a beat ahead of navigate(),
  // lets the transition complete cleanly on the still-mounted exam screen.
  const exitFullscreenBeforeLeaving = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        // ignore — worst case the unmount cleanup's exitFullscreen catches it
      }
      await new Promise((resolve) => setTimeout(resolve, 150))
    }
  }, [])

  const handleViolation = useCallback((count: number) => {
    addViolation()
    setShowViolation(true)
    setTimeout(() => setShowViolation(false), 4000)
    toast.error(`Violation ${count}/3 — ${3 - count} remaining before termination`)
  }, [addViolation])

  const handleSubmit = useCallback(async (auto = false) => {
    if (hasSubmitted.current) return
    hasSubmitted.current = true
    setIsSubmitting(true)
    if (!auto) setShowSubmitConfirm(false)

    violationCleanupRef.current?.()
    flushPendingAnswer()

    try {
      timer.stop()
      await api.post(`/exam/attempt/${id}/submit`)
      submitRetryCount.current = 0
      await exitFullscreenBeforeLeaving()
      navigate(`/exam/result/${id}`)
    } catch (err: unknown) {
      submitRetryCount.current += 1
      if (submitRetryCount.current > MAX_SUBMIT_RETRIES) {
        toast.error('Could not confirm submission — checking your result page instead.')
        navigate(`/exam/result/${id}`)
        return
      }
      const errObj = err as { response?: { status?: number } }
      const isRateLimited = errObj?.response?.status === 429
      toast.error(
        isRateLimited
          ? `Too many requests — retrying in 3s (${submitRetryCount.current}/${MAX_SUBMIT_RETRIES})`
          : `Submission failed — retrying in 3s (${submitRetryCount.current}/${MAX_SUBMIT_RETRIES})`
      )
      hasSubmitted.current = false
      setIsSubmitting(false)
      setTimeout(() => handleSubmit(auto), 3000)
    }
  }, [id, navigate, flushPendingAnswer, exitFullscreenBeforeLeaving])

  const handleTerminate = useCallback(async (reason: string) => {
    if (hasSubmitted.current) return
    hasSubmitted.current = true
    toast.error(`Exam terminated: ${reason}`)
    violationCleanupRef.current?.()
    flushPendingAnswer()
    timer.stop()
    try {
      await api.post(`/exam/attempt/${id}/submit`, { terminationReason: reason })
    } catch {}
    await exitFullscreenBeforeLeaving()
    navigate('/exam/result/' + id)
  }, [id, navigate, flushPendingAnswer, exitFullscreenBeforeLeaving])

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

  useEffect(() => {
    if (!id) return
    resetExam()
    api.get(`/exam/attempt/${id}`)
      .then(({ data }) => {
        const attempt = data.data?.attempt ?? data.attempt
        setAttempt(attempt)
        setTimeLeft(attempt.timeLimitSec)
        if (attempt.phase === 1 && (!attempt.questions || attempt.questions.length === 0)) {
          setAttemptLoadError('This assessment has no questions loaded yet. Please contact the recruiter/support — do not wait for the timer to run out.')
        }
      })
      .catch(() => {
        toast.error('Failed to load exam')
        navigate('/exam')
      })

    return () => {
      violationCleanupRef.current?.()
      teardown()
      flushPendingAnswer()
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePermissions = async () => {
    const perms = await requestPermissions()

    let latencyOk = false
    try {
      const start = performance.now()
      const resp = await fetch('/api/health', { cache: 'no-store' })
      latencyOk = resp.ok && performance.now() - start < 5000
    } catch {}

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

  const handleStartExam = async () => {
    await enterFullscreen()
    const cleanup = setupViolationListeners()
    violationCleanupRef.current = cleanup
    setLobbyState('exam')
    timer.start()
  }

  const handleAnswer = (answer: string) => {
    const question = questions[currentQuestion]
    if (!question) return

    const key = currentAttempt?.phase === 1 ? question.id : String(currentQuestion)
    setAnswer(key, answer)

    const isMcq = question.type === 'mcq'
    pendingAnswerRef.current = { questionIndex: currentQuestion, answer }
    clearTimeout(answerSaveTimer.current)

    if (isMcq) {
      saveAnswerNow(currentQuestion, answer)
    } else {
      answerSaveTimer.current = setTimeout(() => {
        saveAnswerNow(currentQuestion, answer)
      }, 900)
    }
  }

  const isFullStack = currentAttempt?.domain === 'Full Stack'

  const handlePhase2ProjectSubmit = async () => {
    if (isFullStack) {
      const frontendReady = fsFrontendSource === 'github' ? !!frontendGithubUrl.trim() : !!frontendZipFile
      const backendReady = fsBackendSource === 'github' ? !!backendGithubUrl.trim() : !!backendZipFile
      if (!frontendReady) {
        toast.error('Please provide your frontend project (GitHub URL or ZIP)')
        return
      }
      if (!backendReady) {
        toast.error('Please provide your backend project (GitHub URL or ZIP)')
        return
      }
      if (fsFrontendSource === 'github' && !frontendGithubUrl.includes('github.com')) {
        toast.error('Please enter a valid frontend GitHub URL')
        return
      }
      if (fsBackendSource === 'github' && !backendGithubUrl.includes('github.com')) {
        toast.error('Please enter a valid backend GitHub URL')
        return
      }
    } else if (phase2Source === 'github') {
      if (!githubUrl.trim()) {
        toast.error('Please enter a GitHub repository URL')
        return
      }
      if (!githubUrl.includes('github.com')) {
        toast.error('Please enter a valid GitHub URL (e.g. https://github.com/user/repo)')
        return
      }
    } else if (!phase2ZipFile) {
      toast.error('Please choose a ZIP file of your project')
      return
    }

    setPhase2Loading(true)
    setDomainMismatch(null)
    try {
      let data
      if (isFullStack) {
        const form = new FormData()
        if (fsFrontendSource === 'github') form.append('frontendGithubUrl', frontendGithubUrl.trim())
        else form.append('frontendZip', frontendZipFile as File)
        if (fsBackendSource === 'github') form.append('backendGithubUrl', backendGithubUrl.trim())
        else form.append('backendZip', backendZipFile as File)
        ;({ data } = await api.post(`/exam/attempt/${id}/phase2/project`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120_000,
        }))
      } else if (phase2Source === 'github') {
        ;({ data } = await api.post(`/exam/attempt/${id}/phase2/project`, {
          githubUrl: githubUrl.trim(),
        }, { timeout: 90_000 }))
      } else {
        const form = new FormData()
        form.append('zipFile', phase2ZipFile as File)
        ;({ data } = await api.post(`/exam/attempt/${id}/phase2/project`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 90_000,
        }))
      }
      const payload = data.data ?? data
      const qs = payload.questions.map((q: { question: string; context?: string; type?: string; index: number }) => ({
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
      const isTimeout = err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'ECONNABORTED'
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      if (msg?.startsWith('Domain mismatch')) {
        setDomainMismatch(msg)
      } else if (isTimeout) {
        toast.error('Analyzing a large repo can take a while — the request timed out. Please try again.')
      } else {
        toast.error(msg || 'Could not analyze your project. Please try again.')
      }
    } finally {
      setPhase2Loading(false)
    }
  }

  const questions = currentAttempt?.questions || []
  const isPhase2 = currentAttempt?.phase === 2
  const answeredCount = Object.keys(answers).length

  if (!currentAttempt && !attemptLoadError) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--color-muted)]" />
      </div>
    )
  }

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
              AI will analyze your code and generate {currentAttempt?.questionCount || 6} personalized questions
            </p>
          </div>

          {isFullStack ? (
            <>
              <ProjectSourcePanel
                label="Frontend Project"
                source={fsFrontendSource}
                onSourceChange={setFsFrontendSource}
                url={frontendGithubUrl}
                onUrlChange={setFrontendGithubUrl}
                urlPlaceholder="https://github.com/yourusername/your-frontend-repo"
                zipFile={frontendZipFile}
                onZipChange={setFrontendZipFile}
                domain={currentAttempt?.domain}
              />
              <ProjectSourcePanel
                label="Backend Project"
                source={fsBackendSource}
                onSourceChange={setFsBackendSource}
                url={backendGithubUrl}
                onUrlChange={setBackendGithubUrl}
                urlPlaceholder="https://github.com/yourusername/your-backend-repo"
                zipFile={backendZipFile}
                onZipChange={setBackendZipFile}
                domain={currentAttempt?.domain}
              />
            </>
          ) : (
            <>
              <div className="flex gap-2 mb-4 bg-[var(--color-surface2)] p-1 rounded-xl border border-[var(--color-border)]">
                <button
                  onClick={() => setPhase2Source('github')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    phase2Source === 'github'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <GitBranch size={13} /> GitHub URL
                </button>
                <button
                  onClick={() => setPhase2Source('zip')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    phase2Source === 'zip'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <Upload size={13} /> Upload ZIP
                </button>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 mb-4">
                {phase2Source === 'github' ? (
                  <>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      GitHub Repository URL
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => { setGithubUrl(e.target.value); setDomainMismatch(null) }}
                      placeholder="https://github.com/yourusername/your-repo"
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                    />
                    <p className="text-xs text-[var(--color-muted)] mt-2">
                      Must be a public repository in the <strong>{currentAttempt?.domain}</strong> domain.
                      Questions will be generated based on your actual code.
                    </p>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      Project ZIP File
                    </label>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={(e) => setPhase2ZipFile(e.target.files?.[0] ?? null)}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary)] file:text-white file:text-xs file:cursor-pointer cursor-pointer"
                    />
                    <p className="text-xs text-[var(--color-muted)] mt-2">
                      {phase2ZipFile
                        ? `Selected: ${phase2ZipFile.name} (${(phase2ZipFile.size / 1024 / 1024).toFixed(1)} MB)`
                        : <>Zip your source code (exclude <code>node_modules</code>). Max 50MB. Questions will be generated from the code inside.</>}
                    </p>
                  </>
                )}
              </div>
            </>
          )}

          {domainMismatch && (
            <div className="bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)] rounded-xl p-4 mb-6">
              <p className="text-xs text-[var(--color-danger)] font-semibold mb-1 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Domain mismatch — test can't start
              </p>
              <p className="text-xs text-[var(--color-muted)]">{domainMismatch}</p>
            </div>
          )}

          {currentAttempt?.otherPhase && (
            <div className="bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)] rounded-xl p-4 mb-6">
              <p className="text-xs text-[var(--color-warning)] font-medium mb-1">No project available?</p>
              <p className="text-xs text-[var(--color-muted)]">
                If you don't have a project, you can skip Phase 2 and your existing Phase 1 result
                for {currentAttempt?.domain} will be shown instead. Passing Phase 1 or Phase 2 each
                earns its own certificate independently.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-[var(--color-warning)]"
                onClick={() => navigate(`/exam/result/${currentAttempt.otherPhase!.attemptId}`)}
              >
                Skip Phase 2 → See Phase 1 Result
              </Button>
            </div>
          )}

          <Button
            onClick={handlePhase2ProjectSubmit}
            disabled={
              phase2Loading ||
              (isFullStack
                ? (fsFrontendSource === 'github' ? !frontendGithubUrl.trim() : !frontendZipFile) ||
                  (fsBackendSource === 'github' ? !backendGithubUrl.trim() : !backendZipFile)
                : phase2Source === 'github' ? !githubUrl.trim() : !phase2ZipFile)
            }
            className="w-full"
            size="lg"
          >
            {phase2Loading ? (
              <><Loader2 size={16} className="animate-spin mr-2" /> Analyzing your project{isFullStack ? 's' : ''}…</>
            ) : (
              <><Upload size={16} className="mr-2" /> Generate Questions</>
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (lobbyState === 'lobby') {
    const allGreen = checklist.camera && checklist.mic && checklist.internet && checklist.agreed
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src="/assets/logo.svg" alt="Proeva" className="w-full h-full object-cover" />
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
              Violations auto-submit my exam.
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

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center overflow-hidden">
            <img src="/assets/logo.svg" alt="Proeva" className="w-full h-full object-cover" />
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

      <div className="flex-1 flex gap-6 p-6 max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 flex-1 flex flex-col">
            {questions[currentQuestion] ? (
              <QuestionCard
                question={questions[currentQuestion]}
                index={currentQuestion}
                total={questions.length}
                answer={
                  currentAttempt?.phase === 1
                    ? answers[questions[currentQuestion]?.id]
                    : answers[String(currentQuestion)]
                }
                onAnswer={handleAnswer}
              />
            ) : attemptLoadError ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center gap-3 px-6">
                <AlertTriangle size={28} className="text-[var(--color-warning)]" />
                <p className="text-sm text-[var(--color-text)] font-medium">Couldn't load your questions</p>
                <p className="text-xs text-[var(--color-muted)] max-w-sm">{attemptLoadError}</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/exam')}>
                  Back to exams
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1">
                <Loader2 size={24} className="animate-spin text-[var(--color-muted)]" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              onClick={() => { flushPendingAnswer(); setCurrentQuestion(Math.max(0, currentQuestion - 1)) }}
              disabled={currentQuestion === 0}
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleReview(currentQuestion)}
              className="text-xs"
            >
              <span className="inline-flex items-center gap-1">
                <Star size={13} fill={markedForReview.has(currentQuestion) ? 'currentColor' : 'none'} />
                {markedForReview.has(currentQuestion) ? 'Marked' : 'Mark for Review'}
              </span>
            </Button>
            <Button
              onClick={() => { flushPendingAnswer(); setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1)) }}
              disabled={currentQuestion === questions.length - 1}
            >
              Next →
            </Button>
          </div>
        </div>

        <ExamSidebar
          total={questions.length}
          current={currentQuestion}
          answers={answers}
          phase={currentAttempt?.phase || 1}
          questions={questions}
          markedForReview={markedForReview}
          timeRemaining={timeLeft}
          cameraStream={cameraStream}
          onJump={(idx) => { flushPendingAnswer(); setCurrentQuestion(idx) }}
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
            <span className="inline-flex items-center gap-1 text-[var(--color-warning)]">
              <AlertTriangle size={12} /> {questions.length - answeredCount} unanswered.
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

interface ProjectSourcePanelProps {
  label: string
  source: 'github' | 'zip'
  onSourceChange: (source: 'github' | 'zip') => void
  url: string
  onUrlChange: (url: string) => void
  urlPlaceholder: string
  zipFile: File | null
  onZipChange: (file: File | null) => void
  domain?: string
}

function ProjectSourcePanel({
  label, source, onSourceChange, url, onUrlChange, urlPlaceholder, zipFile, onZipChange, domain,
}: ProjectSourcePanelProps) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-[var(--color-text)] mb-2">{label}</p>
      <div className="flex gap-2 mb-3 bg-[var(--color-surface2)] p-1 rounded-xl border border-[var(--color-border)]">
        <button
          onClick={() => onSourceChange('github')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
            source === 'github'
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <GitBranch size={13} /> GitHub URL
        </button>
        <button
          onClick={() => onSourceChange('zip')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
            source === 'zip'
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Upload size={13} /> Upload ZIP
        </button>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
        {source === 'github' ? (
          <>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              GitHub Repository URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder={urlPlaceholder}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
            />
            <p className="text-xs text-[var(--color-muted)] mt-2">
              Must be a public repository. Part of your <strong>{domain}</strong> submission.
            </p>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Project ZIP File
            </label>
            <input
              type="file"
              accept=".zip"
              onChange={(e) => onZipChange(e.target.files?.[0] ?? null)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary)] file:text-white file:text-xs file:cursor-pointer cursor-pointer"
            />
            <p className="text-xs text-[var(--color-muted)] mt-2">
              {zipFile
                ? `Selected: ${zipFile.name} (${(zipFile.size / 1024 / 1024).toFixed(1)} MB)`
                : <>Zip your source code (exclude <code>node_modules</code>). Max 50MB.</>}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
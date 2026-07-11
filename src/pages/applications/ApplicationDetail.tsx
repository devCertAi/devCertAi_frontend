/**
 * ApplicationDetail.tsx — Candidate view of a single application
 *
 * Route: /applications/:id
 *
 * This page was previously MISSING from the router entirely, even though:
 *  - The backend has always exposed GET /applications/:id, POST
 *    /applications/:id/submit-assignment and POST /applications/:id/exam/start
 *  - ApplyPage's "Already applied" view already tried to navigate() here
 *  - Dashboard's assignment/exam reminder banner needed a real destination
 *  - The assessment email link (see ExamGate.tsx) sends candidates to
 *    /applications/:id/exam, which itself needs this page as the natural
 *    "back" destination once the exam session is created
 *
 * Visiting any of those links previously hit the catch-all "*" route and
 * rendered NotFound — this page (plus the route registered in App.tsx)
 * is the fix.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Building2, ArrowLeft, Upload, GitBranch, Globe, Clock,
  CheckCircle2, XCircle, Trophy, FileText, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StageTracker } from '@/components/applications/StageTracker'
import { Application } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import api from '@/services/api'

interface ProjectInfo {
  id: string
  title: string
  status: string
  score?: number
  level?: string
  githubUrl?: string
  liveUrl?: string
  evaluationReport?: string
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [application, setApplication] = useState<Application | null>(null)
  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Assignment submission form state
  const [githubUrl, setGithubUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [submittingAssignment, setSubmittingAssignment] = useState(false)

  const [startingExam, setStartingExam] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    api.get(`/applications/${id}`)
      .then(r => {
        setApplication(r.data.data.application)
        setProject(r.data.data.project)
      })
      .catch((err) => {
        if (err?.response?.status === 404) setNotFound(true)
        else toast.error(err?.response?.data?.message || 'Failed to load application')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const handleSubmitAssignment = async () => {
    if (!githubUrl && !liveUrl && !zipFile) {
      toast.error('Provide a GitHub link, live URL, or upload a zip file')
      return
    }
    setSubmittingAssignment(true)
    try {
      const fd = new FormData()
      if (githubUrl) fd.append('githubUrl', githubUrl)
      if (liveUrl) fd.append('liveUrl', liveUrl)
      if (title) fd.append('title', title)
      if (description) fd.append('description', description)
      if (zipFile) fd.append('zipFile', zipFile)

      await api.post(`/applications/${id}/submit-assignment`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Assignment submitted! We\'ll email you once it\'s evaluated.')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit assignment')
    } finally {
      setSubmittingAssignment(false)
    }
  }

  const handleStartExam = async () => {
    if (!id) return
    setStartingExam(true)
    try {
      const { data } = await api.post(`/applications/${id}/exam/start`)
      const attemptId = data.data?.attemptId ?? data.attemptId
      if (!attemptId) throw new Error('No attemptId in response')
      navigate(`/exam/room/${attemptId}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not start the assessment')
    } finally {
      setStartingExam(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8 text-[var(--color-primary)]" />
      </div>
    )
  }

  if (notFound || !application) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <XCircle size={32} style={{ color: 'var(--color-danger)' }} />
        <h2 className="text-lg font-bold text-[var(--color-text)]">Application not found</h2>
        <p className="text-[var(--color-muted)] text-sm">It may have been removed, or it doesn't belong to your account.</p>
        <Link to="/dashboard" className="text-[var(--color-primary)] text-sm hover:underline">Back to dashboard</Link>
      </div>
    )
  }

  const hasAssignment = !!application.jobPosting?.assignmentBrief
  const canSubmitAssignment = application.stage === 'assignment_sent' && application.status === 'in_progress'
  // FIX: previously only 'exam_sent' (Phase 1) was recognized here, so once the
  // pipeline advanced the application to 'exam_phase2_sent' there was no button
  // anywhere to start it — the same handleStartExam/endpoint now supports both.
  const canStartExam = application.stage === 'exam_sent' && application.status === 'in_progress'
  const canStartPhase2 = application.stage === 'exam_phase2_sent' && application.status === 'in_progress'
  const isRejected = application.status === 'rejected'
  const isSelected = application.status === 'selected'

  return (
    <PageWrapper className="bg-[var(--color-bg)] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] mb-5">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] flex items-center justify-center flex-shrink-0">
              <Building2 size={22} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[var(--color-text)]">{application.jobPosting?.title}</h1>
              <p className="text-[var(--color-muted)] text-sm">{application.jobPosting?.companyName}</p>
            </div>
            <Badge variant={isSelected ? 'success' : isRejected ? 'danger' : 'info'}>
              {isSelected ? 'Selected 🎉' : isRejected ? 'Not selected' : 'In progress'}
            </Badge>
          </div>

          <StageTracker application={application} />
        </Card>

        {isRejected && application.rejectionReason && (
          <Card className="p-5 mb-6" style={{ border: '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)' }}>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1.5 flex items-center gap-2">
              <XCircle size={16} style={{ color: 'var(--color-danger)' }} /> Feedback
            </h3>
            <p className="text-sm text-[var(--color-muted)]">{application.rejectionReason}</p>
          </Card>
        )}

        {isSelected && application.selectionNarrative && (
          <Card className="p-5 mb-6" style={{ border: '1px solid color-mix(in srgb, var(--color-success) 25%, transparent)' }}>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1.5 flex items-center gap-2">
              <Trophy size={16} style={{ color: 'var(--color-success)' }} /> You were selected!
            </h3>
            <p className="text-sm text-[var(--color-muted)]">{application.selectionNarrative}</p>
          </Card>
        )}

        {/* Assignment submission */}
        {hasAssignment && canSubmitAssignment && (
          <Card className="p-5 mb-6">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1 flex items-center gap-2">
              <FileText size={16} /> Submit your assignment
            </h3>
            {application.assignmentDeadlineAt && (
              <p className="text-xs text-[var(--color-muted)] mb-4 flex items-center gap-1">
                <Clock size={12} /> Due {formatRelativeTime(application.assignmentDeadlineAt)}
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--color-muted)] mb-1 flex items-center gap-1"><GitBranch size={12} /> GitHub URL</label>
                <input
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/you/project"
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-muted)] mb-1 flex items-center gap-1"><Globe size={12} /> Live URL (optional)</label>
                <input
                  value={liveUrl}
                  onChange={e => setLiveUrl(e.target.value)}
                  placeholder="https://your-demo.com"
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-muted)] mb-1 block">Title (optional)</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-muted)] mb-1 block">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
                  style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-[var(--color-primary)]"
                style={{ borderColor: zipFile ? 'var(--color-success)' : 'var(--color-border)' }}>
                <Upload size={18} style={{ color: zipFile ? 'var(--color-success)' : 'var(--color-muted)' }} />
                <span className="text-xs text-[var(--color-muted)]">{zipFile ? zipFile.name : 'Or upload a .zip of your project (optional)'}</span>
                <input type="file" accept=".zip" className="hidden" onChange={e => setZipFile(e.target.files?.[0] || null)} />
              </label>
              <Button className="w-full" loading={submittingAssignment} onClick={handleSubmitAssignment}>
                Submit Assignment
              </Button>
            </div>
          </Card>
        )}

        {hasAssignment && project && (
          <Card className="p-5 mb-6">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2 flex items-center gap-2">
              <FileText size={16} /> Your submission
            </h3>
            <p className="text-sm text-[var(--color-text)] mb-1">{project.title}</p>
            <div className="flex gap-3 text-xs">
              {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline">GitHub</a>}
              {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline">Live demo</a>}
            </div>
            {typeof project.score === 'number' && (
              <p className="text-xs text-[var(--color-muted)] mt-2">Score: {project.score}/100 {project.level && `· ${project.level}`}</p>
            )}
          </Card>
        )}

        {/* Assessment */}
        {canStartExam && (
          <Card className="p-5 mb-6">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Technical assessment ready</h3>
            {application.examWindowExpiresAt && (
              <p className="text-xs text-[var(--color-muted)] mb-4 flex items-center gap-1">
                <Clock size={12} /> Window closes {formatRelativeTime(application.examWindowExpiresAt)}
              </p>
            )}
            <Button className="w-full" loading={startingExam} onClick={handleStartExam}>
              {startingExam ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Start Assessment
            </Button>
          </Card>
        )}

        {/* Phase 2 assessment — FIX: this section previously didn't exist, so
            there was no way to start Phase 2 once it was unlocked. Uses the same
            handleStartExam handler; the backend now resolves the correct attempt
            (Phase 1 vs Phase 2) based on the application's current stage. */}
        {canStartPhase2 && (
          <Card className="p-5 mb-6">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Phase 2 assessment ready</h3>
            <p className="text-xs text-[var(--color-muted)] mb-4">
              Personalized questions generated from your submitted project.
            </p>
            {application.examWindowExpiresAt && (
              <p className="text-xs text-[var(--color-muted)] mb-4 flex items-center gap-1">
                <Clock size={12} /> Window closes {formatRelativeTime(application.examWindowExpiresAt)}
              </p>
            )}
            <Button className="w-full" loading={startingExam} onClick={handleStartExam}>
              {startingExam ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Start Phase 2
            </Button>
          </Card>
        )}
      </div>
    </PageWrapper>
  )
}

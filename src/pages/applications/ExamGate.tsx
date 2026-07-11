/**
 * ExamGate.tsx — landing page for the assessment link recruiters/emails send:
 *   {FRONTEND_URL}/applications/:id/exam   (see backend/src/workers/emailWorker.js)
 *
 * This route did not exist in the frontend router at all, so following the
 * emailed link always rendered NotFound ("show not found"). This component
 * is the fix: it authenticates the request, calls
 * POST /applications/:id/exam/start (which flips the pipeline ExamAttempt
 * from "pending" to "in_progress"), and forwards the candidate into the
 * existing exam room (/exam/room/:attemptId) with no extra clicks needed.
 *
 * If the candidate isn't logged in yet, this route requires auth (see
 * App.tsx StudentRoute wrapper) so they're sent to /auth/login first, with
 * ?next= pointing right back here so they land on the exam after signing in.
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Clock } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import api from '@/services/api'

export default function ExamGate() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    api.post(`/applications/${id}/exam/start`)
      .then(({ data }) => {
        if (cancelled) return
        const attemptId = data.data?.attemptId ?? data.attemptId
        if (!attemptId) throw new Error('No attemptId in response')
        navigate(`/exam/room/${attemptId}`, { replace: true })
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.response?.data?.message || 'Could not start this assessment. Please try again.')
      })

    return () => { cancelled = true }
  }, [id, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <AlertCircle size={32} style={{ color: 'var(--color-danger)' }} />
        <h2 className="text-lg font-bold text-[var(--color-text)]">Can't start the assessment</h2>
        <p className="text-[var(--color-muted)] text-sm max-w-sm">{error}</p>
        <Link to={`/applications/${id}`} className="text-[var(--color-primary)] text-sm hover:underline flex items-center gap-1">
          <Clock size={14} /> View your application
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Spinner className="w-8 h-8 text-[var(--color-primary)]" />
      <p className="text-sm text-[var(--color-muted)]">Preparing your assessment…</p>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Copy, Lock, Users, Briefcase, Calendar, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { DateTimeInput } from '@/components/ui/DateTimeInput'
import { DeadlineDisplay } from '@/components/ui/DeadlineDisplay'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'
import { JobPosting } from '@/types'
import { getSocket } from '@/services/socket'

export default function Postings() {
  const navigate = useNavigate()
  const { user } = useAuthStore() as any
  const [postings, setPostings] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [deadlinePosting, setDeadlinePosting] = useState<JobPosting | null>(null)
  const [deadlineForm, setDeadlineForm] = useState({ applicationDeadline: '', assignmentDeadlineDate: '' })
  const [savingDeadlines, setSavingDeadlines] = useState(false)

  const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin'

  const load = () => {
    if (!isRecruiter) { setLoading(false); return }
    setLoading(true)
    api.get('/recruiter/postings')
      .then(({ data }) => setPostings(data.data.postings || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [isRecruiter])

  useEffect(() => {
    const socket = getSocket()
    const handlePostingUpdated = (data: { jobPostingId: string }) => {
      load()
    }
    const handleApplicationReceived = (data: { applicationId: string; jobPostingId: string }) => {
      load()
    }
    const handlePostingClosed = (data: { jobPostingId: string }) => {
      load()
    }
    
    socket.on('posting:updated', handlePostingUpdated)
    socket.on('application:received', handleApplicationReceived)
    socket.on('posting:closed', handlePostingClosed)
    
    return () => {
      socket.off('posting:updated', handlePostingUpdated)
      socket.off('application:received', handleApplicationReceived)
      socket.off('posting:closed', handlePostingClosed)
    }
  }, [])

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/apply/${slug}`)
    toast.success('Apply link copied')
  }

  const close = async (id: string) => {
    try {
      await api.patch(`/recruiter/postings/${id}/close`)
      toast.success('Posting closed successfully')
      load()
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to close posting'
      toast.error(errorMsg)
    }
  }

  const openDeadlineModal = (p: JobPosting) => {
    setDeadlinePosting(p)
    setDeadlineForm({
      applicationDeadline: (p as any).applicationDeadline || null,
      assignmentDeadlineDate: (p as any).assignmentDeadlineDate || null,
    })
  }

  const saveDeadlines = async () => {
    if (!deadlinePosting) return
    setSavingDeadlines(true)
    try {
      const payload: any = {}
      
      // Only include fields that were actually changed
      if (deadlineForm.applicationDeadline !== (deadlinePosting as any).applicationDeadline) {
        payload.applicationDeadline = deadlineForm.applicationDeadline || null
      }
      if (deadlineForm.assignmentDeadlineDate !== (deadlinePosting as any).assignmentDeadlineDate) {
        payload.assignmentDeadlineDate = deadlineForm.assignmentDeadlineDate || null
      }
      
      // Validate that at least one field is being changed
      if (Object.keys(payload).length === 0) {
        toast.error('No changes detected')
        setSavingDeadlines(false)
        return
      }
      
      await api.patch(`/recruiter/postings/${deadlinePosting.id}`, payload)
      toast.success('Deadlines updated successfully')
      setDeadlinePosting(null)
      load()
    } catch (err: any) {
      const errorMsg = err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message || 'Failed to update deadlines'
      toast.error(errorMsg)
    } finally {
      setSavingDeadlines(false)
    }
  }

  if (!isRecruiter) {
    return (
      <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
        <div className="max-w-xl mx-auto py-16 px-4 text-center">
          <Briefcase size={36} className="text-[var(--color-primary)] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">Hire from the Proeva talent pool</h1>
          <p className="text-[var(--color-muted)] text-sm mb-6">
            Post a job, get AI-screened candidates ranked automatically by skill match, project quality, and
            assessment scores — no manual resume sifting.
          </p>
          <Button onClick={() => navigate('/auth/register-recruiter')}>Start Hiring →</Button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Job Postings</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">Manage your hiring pipelines</p>
        </div>
        <Link to="/recruiter/postings/new">
          <Button><Plus size={16} /> New Posting</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner className="w-8 h-8 text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-muted)]">Loading your job postings...</p>
        </div>
      ) : postings.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-[var(--color-muted)]">No job postings yet.</p>
          <Link to="/recruiter/postings/new" className="inline-block mt-4">
            <Button><Plus size={16} /> Create your first posting</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {postings.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link to={`/recruiter/postings/${p.id}`} className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
                      {p.title}
                    </Link>
                    <Badge variant={p.status === 'active' ? 'success' : p.status === 'closed' ? 'muted' : 'warning'}>
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">{p.companyName} · {p.openings} opening{p.openings > 1 ? 's' : ''}</p>

                  <div className="flex items-center gap-1.5 mt-3 flex-wrap text-xs">
                    <span className="flex items-center gap-1 text-[var(--color-muted)]"><Users size={12} /> {p.applicationCount ?? 0} applicants</span>
                    {Object.entries(p.stageCounts || {}).map(([stage, count]) => (
                      <Badge key={stage} variant="muted" className="text-[10px]">{stage.replace(/_/g, ' ')}: {count}</Badge>
                    ))}
                  </div>

                  {(p as any).applicationDeadline || (p as any).assignmentDeadlineDate ? (
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {(p as any).applicationDeadline && (
                        <DeadlineDisplay 
                          date={(p as any).applicationDeadline} 
                          label="Apply by"
                          variant="compact"
                          showIcon={true}
                        />
                      )}
                      {(p as any).assignmentDeadlineDate && (
                        <DeadlineDisplay 
                          date={(p as any).assignmentDeadlineDate} 
                          label="Assignment by"
                          variant="compact"
                          showIcon={true}
                        />
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openDeadlineModal(p)}>
                    <Calendar size={14} /> Update Deadline
                  </Button>
                  {p.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => copyLink(p.applyLinkSlug)}>
                      <Copy size={14} /> Apply Link
                    </Button>
                  )}
                  {p.status === 'active' && (
                    <Button size="sm" variant="ghost" onClick={() => close(p.id)}><Lock size={14} /> Close</Button>
                  )}
                  <Link to={`/recruiter/postings/${p.id}`}>
                    <Button size="sm" variant="primary">View</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>

    {deadlinePosting && (
      <Modal open onClose={() => setDeadlinePosting(null)} title={`Deadlines — ${deadlinePosting.title}`} size="sm">
        <div className="space-y-5">
          <DateTimeInput
            label="Application Deadline"
            icon={Calendar}
            value={deadlineForm.applicationDeadline}
            onChange={(iso: string | null) => setDeadlineForm(f => ({ ...f, applicationDeadline: iso || '' }))}
            hint="Candidates cannot apply after this date. Leave empty for no deadline."
          />
          <DateTimeInput
            label="Assignment Submission Deadline"
            icon={Clock}
            value={deadlineForm.assignmentDeadlineDate}
            onChange={(iso: string | null) => setDeadlineForm(f => ({ ...f, assignmentDeadlineDate: iso || '' }))}
            hint="Candidates must submit their assignment by this date."
          />
          <div className="flex gap-2 pt-1">
            <Button onClick={saveDeadlines} loading={savingDeadlines}>Save Deadlines</Button>
            <Button variant="ghost" onClick={() => setDeadlinePosting(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    )}
    </PageWrapper>
  )
}

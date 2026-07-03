import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Copy, Lock, Users, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'
import { JobPosting } from '@/types'

export default function Postings() {
  const navigate = useNavigate()
  const { user } = useAuthStore() as any
  const [postings, setPostings] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)

  const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin'

  const load = () => {
    if (!isRecruiter) { setLoading(false); return }
    setLoading(true)
    api.get('/recruiter/postings')
      .then(({ data }) => setPostings(data.data.postings || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [isRecruiter])

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/apply/${slug}`)
    toast.success('Apply link copied')
  }

  const clone = async (id: string) => {
    try {
      const { data } = await api.post(`/recruiter/postings/${id}/clone`)
      toast.success('Cloned as draft')
      load()
      return data
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to clone posting')
    }
  }

  const close = async (id: string) => {
    try {
      await api.patch(`/recruiter/postings/${id}/close`)
      toast.success('Posting closed')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to close posting')
    }
  }

  if (!isRecruiter) {
    return (
      <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
        <div className="max-w-xl mx-auto py-16 px-4 text-center">
          <Briefcase size={36} className="text-[var(--color-primary)] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">Hire from the DevCert talent pool</h1>
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
        <div className="flex justify-center py-16"><Spinner className="w-8 h-8 text-[var(--color-primary)]" /></div>
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
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {p.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => copyLink(p.applyLinkSlug)}>
                      <Copy size={14} /> Apply Link
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => clone(p.id)}>Clone</Button>
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
    </PageWrapper>
  )
}

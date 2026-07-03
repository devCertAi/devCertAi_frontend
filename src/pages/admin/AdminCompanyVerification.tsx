import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ExternalLink, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageWrapper } from '@/components/layout/PageWrapper'
import  api  from '@/services/api'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Company {
  id: string
  name: string
  website?: string
  verificationDocUrl?: string
  verificationStatus: string
  verificationNote?: string
  createdAt: string
  recruiter: { name: string; email: string }
  _count: { jobPostings: number }
}

export default function AdminCompanyVerification() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending')
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [acting, setActing] = useState(false)

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const url = statusFilter === 'pending' ? '/admin/companies?status=pending' : '/admin/companies'
      const r = await api.get(url)
      setCompanies(r.data.data.companies || [])
    } catch {
      toast.error('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompanies() }, [statusFilter])

  const handleVerify = async (id: string, approve: boolean, note?: string) => {
    setActing(true)
    try {
      await api.post(`/admin/companies/${id}/verify`, { approve, note })
      toast.success(approve ? 'Company approved ✅' : 'Company rejected')
      setRejectTarget(null)
      setRejectNote('')
      fetchCompanies()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActing(false)
    }
  }

  const statusBadge = (s: string) => {
    if (s === 'verified') return <Badge variant="success">Verified</Badge>
    if (s === 'pending')  return <Badge variant="warning">Pending</Badge>
    if (s === 'rejected') return <Badge variant="danger">Rejected</Badge>
    return <Badge variant="default">Unverified</Badge>
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Company Verification</h1>
            <p style={{ color: 'var(--color-muted)' }}>Review and approve company verification requests.</p>
          </div>
          <div className="flex gap-2">
            {(['pending', 'all'] as const).map(f => (
              <Button key={f} variant={statusFilter === f ? 'primary' : 'ghost'} size="sm" onClick={() => setStatusFilter(f)}>
                {f === 'pending' ? 'Pending' : 'All'}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : companies.length === 0 ? (
          <Card className="p-12 text-center" style={{ background: 'var(--color-surface)' }}>
            <Building2 size={32} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
            <p style={{ color: 'var(--color-muted)' }}>No {statusFilter === 'pending' ? 'pending' : ''} companies to review.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {companies.map(c => (
              <Card key={c.id} className="p-5" style={{ background: 'var(--color-surface)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{c.name}</span>
                      {statusBadge(c.verificationStatus)}
                    </div>
                    <div className="text-sm space-y-0.5" style={{ color: 'var(--color-muted)' }}>
                      <div>{c.recruiter.name} · {c.recruiter.email}</div>
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--color-primary)' }}>
                          {c.website} <ExternalLink size={11} />
                        </a>
                      )}
                      {c.verificationDocUrl && (
                        <a href={c.verificationDocUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline ml-2" style={{ color: 'var(--color-secondary)' }}>
                          Supporting doc <ExternalLink size={11} />
                        </a>
                      )}
                      <div>Submitted {formatDate(c.createdAt)} · {c._count.jobPostings} posting{c._count.jobPostings !== 1 ? 's' : ''}</div>
                    </div>
                    {c.verificationNote && (
                      <div className="mt-2 text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.07)', color: 'var(--color-danger)' }}>
                        Rejection note: {c.verificationNote}
                      </div>
                    )}
                  </div>

                  {c.verificationStatus === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleVerify(c.id, true)}
                        disabled={acting}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle size={14} /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRejectTarget(c.id)}
                        disabled={acting}
                        className="flex items-center gap-1"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <XCircle size={14} /> Reject
                      </Button>
                    </div>
                  )}
                </div>

                {/* Inline reject note form */}
                {rejectTarget === c.id && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Rejection reason <span style={{ color: 'var(--color-muted)' }}>(shown to recruiter)</span>
                    </label>
                    <textarea
                      value={rejectNote}
                      onChange={e => setRejectNote(e.target.value)}
                      rows={3}
                      placeholder="e.g. We couldn't verify the company information provided…"
                      className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                      style={{
                        background: 'var(--color-surface2)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        outline: 'none'
                      }}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleVerify(c.id, false, rejectNote)}
                        disabled={acting}
                        style={{ background: 'var(--color-danger)', color: '#fff' }}
                      >
                        Confirm Rejection
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setRejectTarget(null); setRejectNote('') }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

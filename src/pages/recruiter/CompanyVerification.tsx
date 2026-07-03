import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, CheckCircle, Clock, XCircle, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { PageWrapper } from '@/components/layout/PageWrapper'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface Company {
  id: string
  name: string
  website?: string
  industry?: string
  size?: string
  description?: string
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected'
  verificationDocUrl?: string
  verificationNote?: string
}

const STATUS_CONFIG = {
  unverified: { label: 'Not submitted',  color: 'var(--color-muted)',   icon: Shield,      bg: 'rgba(139,147,165,0.1)' },
  pending:    { label: 'Under review',   color: 'var(--color-warning)', icon: Clock,       bg: 'rgba(251,191,84,0.1)'  },
  verified:   { label: 'Verified',       color: 'var(--color-success)', icon: CheckCircle, bg: 'rgba(34,197,94,0.1)'   },
  rejected:   { label: 'Not verified',   color: 'var(--color-danger)',  icon: XCircle,     bg: 'rgba(239,68,68,0.1)'   },
}

export default function CompanyVerification() {
  const [company, setCompany]     = useState<Company | null>(null)
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [docUrl, setDocUrl]       = useState('')

  useEffect(() => {
    api.get('/companies/me')
      .then(r => {
        const c = r.data.data?.company ?? null
        setCompany(c)
        setDocUrl(c?.verificationDocUrl || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!company) return

    // Guard: already verified or pending — don't hit the API
    if (company.verificationStatus === 'verified') {
      toast('Your company is already verified ✅')
      return
    }
    if (company.verificationStatus === 'pending') {
      toast('Your submission is already under review')
      return
    }

    setSubmitting(true)
    try {
      const r = await api.post('/companies/me/submit-verification', {
        verificationDocUrl: docUrl || undefined,
      })
      setCompany(r.data.data.company)
      toast.success("Submitted for verification — we'll email you within 1–2 business days")
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <PageWrapper>
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    </PageWrapper>
  )

  const status = company?.verificationStatus ?? 'unverified'
  const cfg    = STATUS_CONFIG[status]
  const Icon   = cfg.icon

  return (
    <PageWrapper>
      <div className="max-w-xl mx-auto py-10 px-4">

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            Company Verification
          </h1>
          <p style={{ color: 'var(--color-muted)' }}>
            Verified companies can publish job postings and receive AI-screened candidates.
          </p>
        </div>

        {/* ── Status badge ── */}
        <Card className="p-5 mb-6" style={{ background: 'var(--color-surface)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: cfg.bg }}
            >
              <Icon size={20} style={{ color: cfg.color }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: cfg.color }}>
                {cfg.label}
              </div>
              {company?.name && (
                <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  {company.name}
                </div>
              )}
            </div>
          </div>

          {status === 'rejected' && company?.verificationNote && (
            <div
              className="mt-4 rounded-lg p-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.07)', color: 'var(--color-danger)' }}
            >
              <strong>Reason:</strong> {company.verificationNote}
            </div>
          )}
        </Card>

        {/* ── Pending ── */}
        {status === 'pending' && (
          <Card className="p-5" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-start gap-3">
              <Clock size={18} style={{ color: 'var(--color-warning)', marginTop: 2 }} />
              <div>
                <p className="font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                  Your submission is being reviewed
                </p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  We'll email you within 1–2 business days. In the meantime you can save job postings as drafts.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ── Verified ── */}
        {status === 'verified' && (
          <Card className="p-5" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-start gap-3">
              <CheckCircle size={18} style={{ color: 'var(--color-success)', marginTop: 2 }} />
              <div>
                <p className="font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                  You're all set
                </p>
                <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>
                  Your company is verified. You can publish job postings and candidates will see a "Verified" badge on your listings.
                </p>
                <Link to="/recruiter/postings/new">
                  <Button size="sm">Post a Job →</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* ── No company yet ── */}
        {!company && status === 'unverified' && (
          <Card className="p-6" style={{ background: 'var(--color-surface)' }}>
            <div
              className="rounded-lg p-4 text-sm"
              style={{ background: 'rgba(251,191,84,0.08)', color: 'var(--color-warning)' }}
            >
              You need to create your company profile first. Go to{' '}
              <Link to="/recruiter/settings" className="underline font-medium">
                Settings → Company Info
              </Link>{' '}
              and fill in your company details, then come back here to submit for verification.
            </div>
          </Card>
        )}

        {/* ── Submit form (unverified or rejected, and company exists) ── */}
        {company && (status === 'unverified' || status === 'rejected') && (
          <Card className="p-6" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center gap-2 mb-5">
              <Building2 size={16} style={{ color: 'var(--color-primary)' }} />
              <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {status === 'rejected' ? 'Re-submit for verification' : 'Submit for verification'}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--color-text)' }}
                >
                  Supporting document URL{' '}
                  <span style={{ color: 'var(--color-muted)' }}>(optional)</span>
                </label>
                <Input
                  value={docUrl}
                  onChange={e => setDocUrl(e.target.value)}
                  placeholder="e.g. company registration, LinkedIn, Crunchbase…"
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>
                  Any public URL that helps us confirm your company — registration doc, LinkedIn page, etc.
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                loading={submitting}
                className="w-full"
              >
                {status === 'rejected' ? 'Re-submit for Verification' : 'Submit for Verification'}
              </Button>
            </div>
          </Card>
        )}

      </div>
    </PageWrapper>
  )
}
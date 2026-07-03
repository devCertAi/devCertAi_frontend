/**
 * RankedList.tsx
 *
 * Shows the final ranked shortlist for a posting after ranking is complete.
 * Recruiter can hire or reject candidates from this view.
 *
 * Route: /recruiter/postings/:id/ranked
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Trophy, CheckCircle2, XCircle, RefreshCw,
  ChevronDown, ChevronUp, Download, ExternalLink, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Spinner } from '@/components/ui/Spinner'
import { PageWrapper } from '@/components/layout/PageWrapper'
import api from '@/services/api'
import { formatDate } from '@/lib/utils'

interface RankedCandidate {
  id: string
  rank: number | null
  stage: string
  status: string
  finalScore: number | null
  ruleScore: number | null
  aiMatchScore: number | null
  projectScore: number | null
  examScore: number | null
  selectionNarrative: string | null
  rejectionReason: string | null
  missingSkills: string[]
  createdAt: string
  user: {
    id: string
    name: string
    username: string
    email: string
    avatar: string | null
    skills: { skill: { id: string; name: string } }[]
  }
}

interface RankedData {
  postingId: string
  postingTitle: string
  rankedAt: string | null
  selected: RankedCandidate[]
  ranked: RankedCandidate[]
  rejected: RankedCandidate[]
  total: number
}

function ScoreBar({ value, label }: { value: number | null; label: string }) {
  if (value == null) return null
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5" style={{ color: 'var(--color-muted)' }}>
        <span>{label}</span><span>{Math.round(value)}</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  )
}

function CandidateCard({
  app, rank, onHire, onReject, actioning,
}: {
  app: RankedCandidate
  rank: number
  onHire: (id: string) => void
  onReject: (id: string, reason: string) => void
  actioning: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: app.status === 'selected'
          ? 'color-mix(in srgb, var(--color-success) 4%, var(--color-surface))'
          : app.status === 'rejected'
          ? 'color-mix(in srgb, var(--color-danger) 3%, var(--color-surface))'
          : 'var(--color-surface)',
        border: app.status === 'selected'
          ? '1px solid color-mix(in srgb, var(--color-success) 25%, transparent)'
          : app.status === 'rejected'
          ? '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)'
          : '1px solid var(--color-border)',
      }}
    >
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Rank */}
          <div className="flex-shrink-0 text-center w-10">
            <div className="text-lg">{medals[rank] || rank}</div>
            {!medals[rank] && <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>#{rank}</div>}
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {app.user.avatar ? (
              <img src={app.user.avatar} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt={app.user.name} />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{ background: 'var(--gradient-brand)', color: 'white' }}
              >
                {app.user.name[0]}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{app.user.name}</div>
              <div className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{app.user.email}</div>
            </div>
          </div>

          {/* Score */}
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-primary)' }}>
              {app.finalScore != null ? Math.round(app.finalScore) : '—'}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>/ 100</div>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mt-3 ml-[3.5rem]">
          {app.user.skills.slice(0, 5).map(s => (
            <Badge key={s.skill.id} variant="muted" className="text-[10px]">{s.skill.name}</Badge>
          ))}
          {app.user.skills.length > 5 && (
            <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>+{app.user.skills.length - 5}</span>
          )}
        </div>

        {/* Status badge + action buttons */}
        <div className="flex items-center gap-2 mt-3 ml-[3.5rem] flex-wrap">
          <Badge
            variant={app.status === 'selected' ? 'success' : app.status === 'rejected' ? 'danger' : 'info'}
            className="text-[10px]"
          >
            {app.status === 'in_progress' ? 'Pending decision' : app.status}
          </Badge>

          {app.status === 'in_progress' && (
            <>
              <Button
                size="xs"
                loading={actioning === `hire-${app.id}`}
                onClick={() => onHire(app.id)}
                style={{ background: 'var(--color-success)', color: 'white', fontSize: 11 }}
              >
                <CheckCircle2 size={11} /> Hire
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setShowRejectForm(!showRejectForm)}
                style={{ color: 'var(--color-danger)', fontSize: 11 }}
              >
                <XCircle size={11} /> Pass
              </Button>
            </>
          )}

          {app.status === 'selected' && (
            <span className="text-[10px] font-medium" style={{ color: 'var(--color-success)' }}>✓ Hired</span>
          )}

          <button
            className="ml-auto text-[10px] flex items-center gap-1"
            style={{ color: 'var(--color-muted)' }}
            onClick={() => setExpanded(!expanded)}
          >
            Details {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Reject form */}
        {showRejectForm && (
          <div className="mt-3 ml-[3.5rem]">
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="Optional: feedback for candidate (will be emailed to them)"
              rows={2}
              className="w-full text-xs rounded-lg px-3 py-2 resize-none"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}
            />
            <div className="flex gap-2 mt-1.5">
              <Button
                size="xs"
                loading={actioning === `reject-${app.id}`}
                onClick={() => { onReject(app.id, rejectNote); setShowRejectForm(false) }}
                style={{ background: 'var(--color-danger)', color: 'white', fontSize: 11 }}
              >
                Confirm
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setShowRejectForm(false)} style={{ fontSize: 11 }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--color-border)] pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <ScoreBar value={app.ruleScore} label="Rule-based screening" />
            <ScoreBar value={app.aiMatchScore} label="AI match" />
            <ScoreBar value={app.projectScore} label="Project evaluation" />
            <ScoreBar value={app.examScore} label="Assessment" />
          </div>

          {app.selectionNarrative && (
            <p className="text-xs mt-2 p-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--color-success) 6%, transparent)', color: 'var(--color-muted)' }}>
              {app.selectionNarrative}
            </p>
          )}
          {app.rejectionReason && (
            <p className="text-xs mt-2 p-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--color-danger) 5%, transparent)', color: 'var(--color-muted)' }}>
              {app.rejectionReason}
            </p>
          )}
          {app.missingSkills?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>Missing skills:</span>
              {app.missingSkills.map(s => <Badge key={s} variant="warning" className="text-[10px]">{s}</Badge>)}
            </div>
          )}
          <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
            Applied {formatDate(app.createdAt)}
          </p>
        </div>
      )}
    </div>
  )
}

export default function RankedList() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<RankedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)
  const [showRejected, setShowRejected] = useState(false)
  const [ranking, setRanking] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/recruiter/postings/${id}/ranked`)
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load ranked list'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const handleHire = async (applicationId: string) => {
    setActioning(`hire-${applicationId}`)
    try {
      await api.patch(`/recruiter/applications/${applicationId}/hire`)
      toast.success('Candidate marked as hired! 🎉')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to hire')
    } finally { setActioning(null) }
  }

  const handleReject = async (applicationId: string, reason: string) => {
    setActioning(`reject-${applicationId}`)
    try {
      await api.patch(`/recruiter/applications/${applicationId}/reject`, { reason: reason || undefined })
      toast.success('Candidate passed')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject')
    } finally { setActioning(null) }
  }

  const triggerRerank = async () => {
    setRanking(true)
    try {
      await api.post(`/recruiter/postings/${id}/rank`)
      toast.success('Ranking started — refresh in a moment')
      setTimeout(load, 3000)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to trigger ranking')
    } finally { setRanking(false) }
  }

  const exportCSV = () => {
    if (!data) return
    const all = [...(data.selected || []), ...(data.ranked || []), ...(data.rejected || [])]
    const rows = [
      ['Rank', 'Name', 'Email', 'Status', 'Final Score', 'Rule', 'AI Match', 'Project', 'Exam'].join(','),
      ...all.map(a => [
        a.rank ?? '',
        `"${a.user.name}"`,
        a.user.email,
        a.status,
        a.finalScore != null ? Math.round(a.finalScore) : '',
        a.ruleScore ?? '',
        a.aiMatchScore != null ? Math.round(a.aiMatchScore) : '',
        a.projectScore != null ? Math.round(a.projectScore) : '',
        a.examScore != null ? Math.round(a.examScore) : '',
      ].join(','))
    ].join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ranked-candidates-${id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <PageWrapper className="pl-0 lg:pl-56">
      <div className="flex justify-center py-24"><Spinner className="w-8 h-8 text-[var(--color-primary)]" /></div>
    </PageWrapper>
  )

  if (!data) return (
    <PageWrapper className="pl-0 lg:pl-56">
      <div className="flex flex-col items-center py-24 gap-3">
        <AlertCircle size={28} style={{ color: 'var(--color-danger)' }} />
        <p className="text-[var(--color-muted)]">Failed to load ranked list</p>
        <Button onClick={() => navigate(`/recruiter/postings/${id}`)}>Back to Posting</Button>
      </div>
    </PageWrapper>
  )

  const allRanked = [...(data.selected || []), ...(data.ranked || [])]
  const hasRanked = allRanked.length > 0 || (data.rejected || []).length > 0

  return (
    <PageWrapper className="pl-0 lg:pl-56">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Link
          to={`/recruiter/postings/${id}`}
          className="inline-flex items-center gap-1.5 text-sm mb-5 transition-colors hover:text-[var(--color-text)]"
          style={{ color: 'var(--color-muted)' }}
        >
          <ArrowLeft size={14} /> Back to posting
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              Ranked Shortlist
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {data.postingTitle}
              {data.rankedAt && ` · Ranked ${formatDate(data.rankedAt)}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCSV}>
              <Download size={14} /> Export CSV
            </Button>
            <Button size="sm" loading={ranking} onClick={triggerRerank}>
              <RefreshCw size={14} /> Re-rank
            </Button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total ranked', value: data.total, icon: Trophy, color: 'var(--color-primary)' },
            { label: 'Hired', value: (data.selected || []).length, icon: CheckCircle2, color: 'var(--color-success)' },
            { label: 'Rejected', value: (data.rejected || []).length, icon: XCircle, color: 'var(--color-danger)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="p-4 text-center">
              <Icon size={20} className="mx-auto mb-1" style={{ color }} />
              <div className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)' }}>{value}</div>
              <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</div>
            </Card>
          ))}
        </div>

        {!hasRanked && (
          <Card className="p-10 text-center">
            <Trophy size={32} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
            <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>No ranked candidates yet</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
              Trigger ranking from the posting detail page after candidates have completed the pipeline.
            </p>
            <Button onClick={triggerRerank} loading={ranking}>
              <RefreshCw size={14} /> Generate Rankings Now
            </Button>
          </Card>
        )}

        {/* Hired candidates first */}
        {(data.selected || []).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-success)' }}>
              <CheckCircle2 size={15} /> Hired ({data.selected.length})
            </h3>
            <div className="space-y-3">
              {data.selected.map((app, i) => (
                <CandidateCard
                  key={app.id}
                  app={app}
                  rank={app.rank ?? i + 1}
                  onHire={handleHire}
                  onReject={handleReject}
                  actioning={actioning}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pending ranked */}
        {(data.ranked || []).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Trophy size={15} style={{ color: 'var(--color-primary)' }} /> Ranked Candidates ({data.ranked.length})
            </h3>
            <div className="space-y-3">
              {data.ranked.map((app, i) => (
                <CandidateCard
                  key={app.id}
                  app={app}
                  rank={app.rank ?? i + 1}
                  onHire={handleHire}
                  onReject={handleReject}
                  actioning={actioning}
                />
              ))}
            </div>
          </div>
        )}

        {/* Rejected — collapsible */}
        {(data.rejected || []).length > 0 && (
          <div>
            <button
              className="flex items-center gap-2 text-sm font-semibold mb-3 transition-colors"
              style={{ color: 'var(--color-muted)' }}
              onClick={() => setShowRejected(!showRejected)}
            >
              <XCircle size={15} style={{ color: 'var(--color-danger)' }} />
              Screened Out ({data.rejected.length})
              {showRejected ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showRejected && (
              <div className="space-y-3">
                {data.rejected.map((app, i) => (
                  <CandidateCard
                    key={app.id}
                    app={app}
                    rank={app.rank ?? 999 + i}
                    onHire={handleHire}
                    onReject={handleReject}
                    actioning={actioning}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

/**
 * RankedList.tsx
 *
 * Shows the ranked candidate list for a posting after "Generate Rankings"
 * has run. No selection/rejection email is sent at that point — the
 * recruiter reviews the list here, checks who to select (top candidates
 * are pre-checked based on openings/cutoff), and clicks "Send Decisions".
 *
 * Send Decisions is the ONLY action that emails anyone:
 *   - every checked candidate gets a "selected" email
 *   - every other ranked candidate gets a "rejected" email
 * The posting is then closed automatically so it stops accepting applicants.
 *
 * Route: /recruiter/postings/:id/ranked
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Trophy, CheckCircle2, XCircle, RefreshCw,
  ChevronDown, ChevronUp, Download, AlertCircle, Send, Lock, CheckSquare, Square,
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
  finalized: boolean
  recommendedSelectedIds: string[]
  applications: RankedCandidate[]
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
  app, rank, selectable, checked, onToggle, readOnlyStatus,
}: {
  app: RankedCandidate
  rank: number
  selectable: boolean
  checked?: boolean
  onToggle?: (id: string) => void
  readOnlyStatus?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const status = readOnlyStatus ?? app.status

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: status === 'selected'
          ? 'color-mix(in srgb, var(--color-success) 4%, var(--color-surface))'
          : status === 'rejected'
          ? 'color-mix(in srgb, var(--color-danger) 3%, var(--color-surface))'
          : checked
          ? 'color-mix(in srgb, var(--color-primary) 5%, var(--color-surface))'
          : 'var(--color-surface)',
        border: status === 'selected'
          ? '1px solid color-mix(in srgb, var(--color-success) 25%, transparent)'
          : status === 'rejected'
          ? '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)'
          : checked
          ? '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)'
          : '1px solid var(--color-border)',
      }}
    >
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox (only while reviewing, before decisions are sent) */}
          {selectable && (
            <button
              type="button"
              onClick={() => onToggle?.(app.id)}
              className="flex-shrink-0 mt-1"
              style={{ color: checked ? 'var(--color-primary)' : 'var(--color-muted)' }}
              aria-label={checked ? 'Deselect candidate' : 'Select candidate'}
            >
              {checked ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
          )}

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

        {/* Status badge */}
        <div className="flex items-center gap-2 mt-3 ml-[3.5rem] flex-wrap">
          {selectable ? (
            <Badge variant={checked ? 'success' : 'muted'} className="text-[10px]">
              {checked ? 'Will be selected' : 'Will be rejected'}
            </Badge>
          ) : (
            <Badge
              variant={status === 'selected' ? 'success' : status === 'rejected' ? 'danger' : 'info'}
              className="text-[10px]"
            >
              {status === 'in_progress' ? 'Pending decision' : status}
            </Badge>
          )}

          <button
            className="ml-auto text-[10px] flex items-center gap-1"
            style={{ color: 'var(--color-muted)' }}
            onClick={() => setExpanded(!expanded)}
          >
            Details {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
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
  const [showRejected, setShowRejected] = useState(false)
  const [ranking, setRanking] = useState(false)
  const [sending, setSending] = useState(false)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/recruiter/postings/${id}/ranked`)
      .then(r => {
        const d: RankedData = r.data.data
        setData(d)
        // Pre-check the recommended candidates every time we (re)load,
        // as long as decisions haven't been sent yet.
        if (!d.finalized) {
          setCheckedIds(new Set(d.recommendedSelectedIds || []))
        }
      })
      .catch(() => toast.error('Failed to load ranked list'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const toggleChecked = (applicationId: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(applicationId)) next.delete(applicationId)
      else next.add(applicationId)
      return next
    })
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

  const sendDecisions = async () => {
    if (checkedIds.size === 0) {
      toast.error('Select at least one candidate to send decisions')
      return
    }
    setSending(true)
    try {
      const res = await api.post(`/recruiter/postings/${id}/finalize-selection`, {
        selectedApplicationIds: Array.from(checkedIds)
      })
      toast.success(res.data?.data?.message || 'Decisions sent — posting closed')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send decisions')
    } finally { setSending(false) }
  }

  const exportCSV = () => {
    if (!data) return
    const all = data.applications || []
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

  const finalized = data.finalized
  const allApplications = data.applications || []
  const hasRanked = allApplications.length > 0
  const pendingReview = allApplications.filter(a => a.status === 'in_progress')

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
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={exportCSV}>
              <Download size={14} /> Export CSV
            </Button>
            {!finalized && (
              <Button size="sm" variant="outline" loading={ranking} onClick={triggerRerank}>
                <RefreshCw size={14} /> Re-rank
              </Button>
            )}
          </div>
        </div>

        {finalized && (
          <Card className="p-3 mb-6 flex items-center gap-2" style={{ background: 'color-mix(in srgb, var(--color-muted) 6%, transparent)' }}>
            <Lock size={14} style={{ color: 'var(--color-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Decisions have been sent. Selected candidates got a selection email, everyone else got a rejection email, and this posting is now closed.
            </p>
          </Card>
        )}

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total ranked', value: data.total, icon: Trophy, color: 'var(--color-primary)' },
            { label: finalized ? 'Selected' : 'Checked to select', value: finalized ? (data.selected || []).length : checkedIds.size, icon: CheckCircle2, color: 'var(--color-success)' },
            { label: finalized ? 'Rejected' : 'Will be rejected', value: finalized ? (data.rejected || []).length : Math.max(0, allApplications.length - checkedIds.size), icon: XCircle, color: 'var(--color-danger)' },
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

        {/* ── Before decisions are sent: single checklist + Send Decisions ── */}
        {!finalized && hasRanked && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Trophy size={15} style={{ color: 'var(--color-primary)' }} /> Review & select ({allApplications.length})
              </h3>
              <Button size="sm" loading={sending} onClick={sendDecisions} disabled={checkedIds.size === 0}>
                <Send size={14} /> Send Decisions
              </Button>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
              Top candidates are pre-checked based on this posting's openings/cutoff. Adjust the checkboxes, then click <strong>Send Decisions</strong> — checked candidates get a selection email, everyone else gets a rejection email, and the posting closes.
            </p>
            <div className="space-y-3 mb-6">
              {pendingReview.map((app, i) => (
                <CandidateCard
                  key={app.id}
                  app={app}
                  rank={app.rank ?? i + 1}
                  selectable
                  checked={checkedIds.has(app.id)}
                  onToggle={toggleChecked}
                />
              ))}
            </div>
          </>
        )}

        {/* ── After decisions are sent: read-only selected/rejected split ── */}
        {finalized && (data.selected || []).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-success)' }}>
              <CheckCircle2 size={15} /> Selected ({data.selected.length})
            </h3>
            <div className="space-y-3">
              {data.selected.map((app, i) => (
                <CandidateCard key={app.id} app={app} rank={app.rank ?? i + 1} selectable={false} />
              ))}
            </div>
          </div>
        )}

        {finalized && (data.rejected || []).length > 0 && (
          <div>
            <button
              className="flex items-center gap-2 text-sm font-semibold mb-3 transition-colors"
              style={{ color: 'var(--color-muted)' }}
              onClick={() => setShowRejected(!showRejected)}
            >
              <XCircle size={15} style={{ color: 'var(--color-danger)' }} />
              Not Selected ({data.rejected.length})
              {showRejected ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showRejected && (
              <div className="space-y-3">
                {data.rejected.map((app, i) => (
                  <CandidateCard key={app.id} app={app} rank={app.rank ?? 999 + i} selectable={false} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

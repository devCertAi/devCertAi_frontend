import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CheckCircle2, Copy, AlertTriangle, ChevronDown, ChevronUp,
  Lock, Eye, EyeOff, Calendar, Clock, Wrench, Zap
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { SkillsInput } from '@/components/profile/SkillsInput'
import api from '@/services/api'
import { Skill } from '@/types'

const EXAM_DOMAINS = ['Frontend', 'Backend', 'Full Stack', 'Mobile', 'Data Science', 'DevOps', 'Blockchain', 'AI/ML']

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface2)]'}`}
      aria-label={label}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({
  title, subtitle, children, badge
}: { title: string; subtitle?: string; children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <Card className="p-6 space-y-4 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CreatePosting() {
  const navigate = useNavigate()

  // Basics
  const [title, setTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState<(Skill & { required?: boolean })[]>([])
  const [minExperience, setMinExperience] = useState(0)
  const [openings, setOpenings] = useState(1)
  const [ruleScoreThreshold, setRuleScoreThreshold] = useState(60)
  const [aiMatchThreshold, setAiMatchThreshold] = useState(50)

  // Assignment
  const [assignmentEnabled, setAssignmentEnabled] = useState(false)
  const [assignmentBrief, setAssignmentBrief] = useState('')
  const [assignmentEvalCriteria, setAssignmentEvalCriteria] = useState('')
  const [assignmentDeadlineDate, setAssignmentDeadlineDate] = useState('')
  const [showEvalCriteria, setShowEvalCriteria] = useState(false)

  // Exam
  const [examEnabled, setExamEnabled] = useState(true)
  const [examPhase1, setExamPhase1] = useState(true)
  const [examPhase2, setExamPhase2] = useState(false)
  const [examDomain, setExamDomain] = useState('Full Stack')
  const [examDurationMin, setExamDurationMin] = useState(30)
  const [examWindowHours, setExamWindowHours] = useState(48)

  // Pipeline mode
  const [manualMode, setManualMode] = useState(false)

  // Cutoff
  const [cutoffMode, setCutoffMode] = useState<'count' | 'percentage'>('count')
  const [cutoffPercentage, setCutoffPercentage] = useState(20)

  // State
  const [submitting, setSubmitting] = useState(false)
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)
  const [company, setCompany] = useState<{ name: string; verificationStatus: string } | null | undefined>(undefined)

  useEffect(() => {
    api.get('/companies/me')
      .then(r => setCompany(r.data.data.company))
      .catch(() => setCompany(null))
  }, [])

  // Min deadline: tomorrow
  const minDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  const canPublish = company?.verificationStatus === 'verified'

  const validate = () => {
    if (!title.trim()) { toast.error('Job title is required'); return false }
    if (!description.trim()) { toast.error('Description is required'); return false }
    if (skills.length === 0) { toast.error('Add at least one required skill'); return false }
    if (assignmentEnabled && !assignmentBrief.trim()) {
      toast.error('Assignment brief is required when assignment stage is enabled')
      return false
    }
    if (assignmentEnabled && !assignmentDeadlineDate) {
      toast.error('Set an assignment submission deadline')
      return false
    }
    if (examEnabled && examPhase2 && !examPhase1) {
      toast.error('Phase 1 must be enabled to use Phase 2')
      return false
    }
    return true
  }

  const handleSubmit = async (status: 'draft' | 'active') => {
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        companyName: companyName.trim() || undefined,
        description: description.trim(),
        requiredSkills: skills.map(s => ({ name: s.name, required: (s as any).required !== false })),
        minExperience,
        openings,
        ruleScoreThreshold,
        aiMatchThreshold,
        cutoffMode,
        cutoffPercentage: cutoffMode === 'percentage' ? cutoffPercentage : undefined,

        // Assignment
        assignmentEnabled,
        assignmentBrief: assignmentEnabled ? assignmentBrief.trim() : undefined,
        assignmentEvalCriteria: assignmentEnabled && assignmentEvalCriteria.trim()
          ? assignmentEvalCriteria.trim()
          : undefined,
        assignmentDeadlineDate: assignmentEnabled && assignmentDeadlineDate
          ? new Date(assignmentDeadlineDate).toISOString()
          : undefined,

        // Exam
        examEnabled,
        examPhase1: examEnabled ? examPhase1 : false,
        examPhase2: examEnabled && examPhase1 ? examPhase2 : false,
        examDomain: examEnabled ? examDomain : undefined,
        examDurationMin: examEnabled ? examDurationMin : undefined,
        examWindowHours: examEnabled ? examWindowHours : undefined,

        // Pipeline
        manualMode,
        status
      }

      const { data } = await api.post('/recruiter/postings', payload)
      const posting = data.data.posting
      if (status === 'active') {
        setCreatedSlug(posting.applyLinkSlug)
      } else {
        toast.success('Saved as draft')
        navigate(`/recruiter/postings/${posting.id}`)
      }
    } catch (err: any) {
      if (!err?.response) {
        toast.error('Network error — check your connection')
      } else {
        // Validation errors come back as { message, errors: [{ field, message }] }
        // (see backend/src/middleware/validate.js). Show the first specific
        // field error if present, otherwise the top-level message.
        const fieldErrors = err.response.data?.errors
        const detail = Array.isArray(fieldErrors) && fieldErrors.length > 0
          ? fieldErrors[0].message
          : err.response.data?.message
        toast.error(detail || 'Could not save this posting. Please check the form and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (createdSlug) {
    const link = `${window.location.origin}/apply/${createdSlug}`
    return (
      <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
        <div className="max-w-xl mx-auto py-16 px-4 text-center">
          <CheckCircle2 size={40} className="text-[var(--color-success)] mx-auto mb-3" />
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">Posting published!</h1>
          <p className="text-[var(--color-muted)] text-sm mb-6">
            Share this link with candidates — applications flow straight into your pipeline.
          </p>
          <Card className="p-4 flex items-center justify-between gap-3 mb-6">
            <code className="text-sm text-[var(--color-primary)] truncate">{link}</code>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(link); toast.success('Copied') }}>
              <Copy size={14} /> Copy
            </Button>
          </Card>
          <Button onClick={() => navigate('/recruiter/postings')}>Go to Postings</Button>
        </div>
      </PageWrapper>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">New Job Posting</h1>
        <p className="text-[var(--color-muted)] text-sm mb-6">
          Configure your full hiring pipeline — screening, assignment, exam, and ranking.
        </p>

        {/* Company verification banners */}
        {company === null && (
          <div className="flex items-start gap-3 p-4 mb-4 rounded-xl border"
            style={{ background: 'color-mix(in srgb, var(--color-warning) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--color-warning) 25%, transparent)' }}>
            <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-warning)' }}>No company profile</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                <Link to="/recruiter/company/verify" className="underline" style={{ color: 'var(--color-primary)' }}>Create and verify your company</Link> before publishing.
              </p>
            </div>
          </div>
        )}
        {company && company.verificationStatus !== 'verified' && (
          <div className="flex items-start gap-3 p-4 mb-4 rounded-xl border"
            style={{ background: 'color-mix(in srgb, var(--color-warning) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--color-warning) 25%, transparent)' }}>
            <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-warning)' }}>Company verification {company.verificationStatus}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                Save as draft, then <Link to="/recruiter/company/verify" className="underline" style={{ color: 'var(--color-primary)' }}>complete verification</Link> to publish.
              </p>
            </div>
          </div>
        )}

        {/* ── 1. Basics ──────────────────────────────────────────────────── */}
        <Section title="Basics">
          <Input label="Job Title *" placeholder="e.g. Senior Full Stack Engineer" value={title} onChange={e => setTitle(e.target.value)} />
          <Input label="Company Name" placeholder="Defaults to your verified company name" value={companyName} onChange={e => setCompanyName(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Job Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe the role, responsibilities, and what you're looking for…"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
            />
          </div>
        </Section>

        {/* ── 2. Skills & Screening ───────────────────────────────────────── */}
        <Section title="Skills & Screening" subtitle="Auto-screen candidates by skills and AI resume match">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Required Skills *</label>
            <SkillsInput value={skills} onChange={setSkills as any} showRequired placeholder="e.g. React, Node.js, PostgreSQL…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input type="number" min={0} max={40} label="Min experience (years)" value={minExperience} onChange={e => setMinExperience(Number(e.target.value))} />
            <Input type="number" min={1} max={1000} label="Openings" value={openings} onChange={e => setOpenings(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number" min={0} max={100}
              label="Rule-score threshold (Stage 1)"
              hint="Below this skill/exp match → auto-rejected, no AI used"
              value={ruleScoreThreshold}
              onChange={e => setRuleScoreThreshold(Number(e.target.value))}
            />
            <Input
              type="number" min={0} max={100}
              label="AI match threshold (Stage 2)"
              hint="Min AI resume match score to be shortlisted"
              value={aiMatchThreshold}
              onChange={e => setAiMatchThreshold(Number(e.target.value))}
            />
          </div>
          {/* Cutoff mode */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Final selection cutoff</label>
            <div className="flex gap-3">
              {(['count', 'percentage'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCutoffMode(m)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-colors ${cutoffMode === m ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-muted)]'}`}
                >
                  {m === 'count' ? `Top ${openings} (openings)` : 'Top percentage'}
                </button>
              ))}
            </div>
            {cutoffMode === 'percentage' && (
              <Input
                type="number" min={1} max={100}
                label="Top % to select"
                className="mt-3"
                value={cutoffPercentage}
                onChange={e => setCutoffPercentage(Number(e.target.value))}
              />
            )}
          </div>
        </Section>

        {/* ── 3. Assignment ───────────────────────────────────────────────── */}
        <Card className="p-6 space-y-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Project Assignment</h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Shortlisted candidates build a project — scored by AI against your private criteria
              </p>
            </div>
            <Toggle on={assignmentEnabled} onChange={setAssignmentEnabled} label="Enable assignment" />
          </div>

          {assignmentEnabled && (
            <div className="space-y-4 pt-1">
              {/* Brief — student sees this */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Eye size={13} className="text-[var(--color-muted)]" />
                  <label className="text-sm font-medium text-[var(--color-text)]">
                    Assignment Brief <span className="text-xs font-normal text-[var(--color-success)]">(visible to student)</span>
                  </label>
                </div>
                <textarea
                  value={assignmentBrief}
                  onChange={e => setAssignmentBrief(e.target.value)}
                  rows={4}
                  placeholder="Describe what the candidate should build. This is exactly what they'll see. e.g. 'Build a REST API with authentication, CRUD for tasks, and deployed to a public URL.'"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">The candidate will see this task description exactly as written.</p>
              </div>

              {/* Eval criteria — private */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowEvalCriteria(!showEvalCriteria)}
                  className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text)] mb-1.5 hover:text-[var(--color-primary)] transition-colors"
                >
                  <Lock size={13} className="text-[var(--color-danger)]" />
                  Private Evaluation Criteria
                  <span className="text-xs font-normal text-[var(--color-danger)]">(not shown to student)</span>
                  {showEvalCriteria ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showEvalCriteria && (
                  <>
                    <textarea
                      value={assignmentEvalCriteria}
                      onChange={e => setAssignmentEvalCriteria(e.target.value)}
                      rows={4}
                      placeholder="What specifically should AI check? e.g. 'Must use JWT auth, database must be PostgreSQL, code should have error handling, README required, no hardcoded secrets.' Leave blank to use general quality scoring."
                      className="w-full bg-[color-mix(in_srgb,var(--color-danger)_3%,transparent)] border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-danger)] resize-none"
                    />
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      🔒 This is private — candidates never see this. AI uses it to evaluate their project submission.
                    </p>
                  </>
                )}
              </div>

              {/* Deadline */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Calendar size={13} className="text-[var(--color-muted)]" />
                  <label className="text-sm font-medium text-[var(--color-text)]">Submission Deadline *</label>
                </div>
                <input
                  type="datetime-local"
                  min={minDeadline}
                  value={assignmentDeadlineDate}
                  onChange={e => setAssignmentDeadlineDate(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">Must be a future date. Students see this deadline in their dashboard.</p>
              </div>
            </div>
          )}
        </Card>

        {/* ── 4. Exam / Assessment ────────────────────────────────────────── */}
        <Card className="p-6 space-y-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Skills Assessment</h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">Proctored exam with MCQ + optional project-based Phase 2</p>
            </div>
            <Toggle on={examEnabled} onChange={v => { setExamEnabled(v); if (!v) { setExamPhase1(false); setExamPhase2(false) } else { setExamPhase1(true) } }} label="Enable exam" />
          </div>

          {examEnabled && (
            <div className="space-y-4 pt-1">
              {/* Domain */}
              <Select
                label="Exam Domain"
                value={examDomain}
                onChange={e => setExamDomain(e.target.value)}
                hint="Questions are generated specifically for this domain"
              >
                {EXAM_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>

              {/* Phase toggles */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-[var(--color-text)]">Exam Phases</p>

                {/* Phase 1 */}
                <div className="flex items-start gap-3 p-3 rounded-xl border border-[var(--color-border)]">
                  <Toggle on={examPhase1} onChange={v => { setExamPhase1(v); if (!v) setExamPhase2(false) }} label="Phase 1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)]">Phase 1 — MCQ Exam</p>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      Auto-generated multiple choice questions from the selected domain. Candidates see results immediately.
                      Recruiter can view all scores.
                    </p>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className={`flex items-start gap-3 p-3 rounded-xl border transition-opacity ${examPhase1 ? 'border-[var(--color-border)]' : 'border-[var(--color-border)] opacity-40 pointer-events-none'}`}>
                  <Toggle on={examPhase2} onChange={setExamPhase2} label="Phase 2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      Phase 2 — Project-Based Questions
                      {!examPhase1 && <span className="text-xs text-[var(--color-muted)] ml-2">(requires Phase 1)</span>}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      AI generates personalized coding + explanation questions <strong>from the candidate's own submitted project.</strong>
                      Only triggered if the student has submitted a project. Includes typing answers and code comprehension.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="Duration (per phase)" value={examDurationMin} onChange={e => setExamDurationMin(Number(e.target.value))}>
                  {[20, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} minutes</option>)}
                </Select>
                <Select label="Exam window" value={examWindowHours} onChange={e => setExamWindowHours(Number(e.target.value))}>
                  {[24, 48, 72, 96, 168].map(h => <option key={h} value={h}>{h}h ({Math.round(h / 24)}d)</option>)}
                </Select>
              </div>
            </div>
          )}
        </Card>

        {/* ── 5. Pipeline Mode ─────────────────────────────────────────────── */}
        <Card className="p-6 space-y-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Pipeline Control</h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">Auto-advance vs manual review at every stage</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Auto mode */}
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className={`p-4 rounded-xl border text-left transition-colors ${!manualMode ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]' : 'border-[var(--color-border)]'}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Zap size={14} className={!manualMode ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'} />
                <span className={`text-sm font-medium ${!manualMode ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>Automatic</span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Candidates advance automatically after each stage. Best for high-volume pipelines.
              </p>
            </button>

            {/* Manual mode */}
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className={`p-4 rounded-xl border text-left transition-colors ${manualMode ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]' : 'border-[var(--color-border)]'}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Wrench size={14} className={manualMode ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'} />
                <span className={`text-sm font-medium ${manualMode ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>Manual Review</span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                You review and trigger each stage. You'll get reminders for pending actions.
              </p>
            </button>
          </div>

          {manualMode && (
            <div className="p-3 rounded-xl bg-[color-mix(in_srgb,var(--color-warning)_6%,transparent)] border border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)]">
              <p className="text-xs text-[var(--color-muted)]">
                📋 In manual mode, you manually advance each candidate at every stage — screening, assignment, exam, and ranking.
                You can reject individual candidates at any point with custom feedback.
              </p>
            </div>
          )}
        </Card>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <Button variant="outline" loading={submitting} onClick={() => handleSubmit('draft')}>
            Save as Draft
          </Button>
          <Button
            className="flex-1"
            loading={submitting}
            disabled={!canPublish}
            title={!canPublish ? 'Verify your company before publishing' : undefined}
            onClick={() => handleSubmit('active')}
          >
            Publish & Get Apply Link →
          </Button>
        </div>
        {!canPublish && (
          <p className="text-xs text-center mt-2" style={{ color: 'var(--color-muted)' }}>
            Save as draft, then <Link to="/recruiter/company/verify" style={{ color: 'var(--color-primary)' }}>verify your company</Link> to publish.
          </p>
        )}
      </div>
    </PageWrapper>
  )
}

/**
 * ApplyPage.tsx — Full internship/job apply flow
 *
 * FLOW:
 *  1. Load public posting info (no auth)
 *  2. Not logged in → show posting + CTA to register (with ?next=/apply/:slug)
 *  3. Logged in, profile < 70% → show completeness gate → redirect to /profile (profile tab)
 *  4. Logged in, profile ≥ 70%, already applied → show status tracker
 *  5. Logged in, profile ≥ 70%, not applied → show pre-filled apply form (CV upload optional)
 *
 * Filter mechanism runs on PROFILE data (skills, experience, education) NOT CV file.
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Building2, Briefcase, CheckCircle2, AlertCircle, ArrowRight, Upload,
  ChevronDown, ChevronUp, User, GraduationCap, Wrench, FileText, Globe,
  MapPin, Phone, Mail, Pencil, Loader2, Lock, UserPlus, ClipboardList,
  Clock, Star, XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Skill { name: string; required: boolean }

interface Posting {
  id: string
  title: string
  companyName: string
  description: string
  minExperience: number
  examEnabled: boolean
  assignmentBrief: string | null
  applyLinkSlug: string
  requiredSkills: Skill[]
  location?: string
  stipend?: string
  duration?: string
}

interface CompletenessSection {
  key: string
  label: string
  description: string
  weight: number
  done: boolean
  missing: string[]
}

interface Completeness {
  percentage: number
  isComplete: boolean
  sections: CompletenessSection[]
  missingFields: string[]
}

interface Education {
  institution: string
  degree: string | null
  fieldOfStudy: string | null
  startYear: number | null
  endYear: number | null
}

interface Experience {
  company: string
  title: string
  isCurrent: boolean
  startDate: string | null
  endDate: string | null
}

interface Prefill {
  name: string
  email: string
  phone: string | null
  headline: string | null
  location: string | null
  summary: string | null
  cvUrl: string | null
  cvParsedAt: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  skills: string[]
  education: Education[]
  experience: Experience[]
}

interface PreflightData {
  posting: Posting
  alreadyApplied: boolean
  existingApplication: { id: string; stage: string; status: string } | null
  completeness: Completeness
  prefill: Prefill
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STAGE_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  applied:                { label: 'Application Received',     icon: <ClipboardList size={16} />, color: 'var(--color-primary)' },
  screened:               { label: 'Profile Screened',         icon: <Star size={16} />,         color: 'var(--color-primary)' },
  assignment_sent:        { label: 'Assignment Sent',          icon: <FileText size={16} />,      color: 'var(--color-warning)' },
  assignment_submitted:   { label: 'Assignment Submitted',     icon: <CheckCircle2 size={16} />, color: 'var(--color-success)' },
  project_evaluated:      { label: 'Project Reviewed',         icon: <Star size={16} />,         color: 'var(--color-success)' },
  exam_sent:              { label: 'Assessment Ready',         icon: <Clock size={16} />,        color: 'var(--color-warning)' },
  exam_completed:         { label: 'Assessment Submitted',     icon: <CheckCircle2 size={16} />, color: 'var(--color-success)' },
  ranked:                 { label: 'Ranking Complete',         icon: <Star size={16} />,         color: 'var(--color-primary)' },
}

function CompletenessBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'
  return (
    <div className="w-full bg-[var(--color-border)] rounded-full h-2.5 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ─── Guest view — show posting + register/login CTA ─────────────────────────

function GuestView({ posting, slug }: { posting: Posting; slug: string }) {
  const navigate = useNavigate()
  const next = `/apply/${slug}`

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Posting card */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] flex items-center justify-center flex-shrink-0">
              <Building2 size={22} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)]">{posting.title}</h1>
              <p className="text-[var(--color-muted)] text-sm">{posting.companyName}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {posting.location && (
                  <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                    <MapPin size={12} /> {posting.location}
                  </span>
                )}
                {posting.stipend && (
                  <span className="text-xs text-[var(--color-muted)]">{posting.stipend}</span>
                )}
              </div>
            </div>
          </div>

          {posting.requiredSkills.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Required Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {posting.requiredSkills.map((s) => (
                  <Badge key={s.name} variant={s.required ? 'default' : 'muted'}>{s.name}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-[var(--color-muted)] mb-4">
            <span>Min. {posting.minExperience} yr{posting.minExperience !== 1 ? 's' : ''} exp</span>
            {posting.assignmentBrief && <Badge variant="warning" className="text-xs">Assignment included</Badge>}
            {posting.examEnabled && <Badge variant="info" className="text-xs">Technical assessment</Badge>}
          </div>

          {posting.description && (
            <p className="text-sm text-[var(--color-muted)] leading-relaxed line-clamp-4">{posting.description}</p>
          )}
        </Card>

        {/* Auth gate */}
        <Card className="p-7 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] flex items-center justify-center mb-4">
            <Lock size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">Create an account to apply</h2>
          <p className="text-[var(--color-muted)] text-sm mb-6 max-w-xs mx-auto">
            You need a DevCert account with a complete profile to apply. It only takes a minute.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate(`/auth/register?next=${encodeURIComponent(next)}`)}
              className="flex items-center gap-2"
            >
              <UserPlus size={16} /> Create Free Account
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate(`/auth/login?next=${encodeURIComponent(next)}`)}
            >
              Sign In
            </Button>
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-4">
            Already have an account?{' '}
            <Link
              to={`/auth/login?next=${encodeURIComponent(next)}`}
              className="text-[var(--color-primary)] hover:underline"
            >
              Log in to apply
            </Link>
          </p>
        </Card>

        {/* Pipeline preview */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: <ClipboardList size={16} />, label: 'Apply with profile', sub: 'No manual form-filling' },
            { icon: <FileText size={16} />, label: 'Complete assignment', sub: 'Real work, not quizzes' },
            { icon: <Star size={16} />, label: 'Get ranked by AI', sub: 'Transparent scoring' },
          ].map((item, i) => (
            <div key={i} className="text-center p-4 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex justify-center mb-2" style={{ color: 'var(--color-primary)' }}>{item.icon}</div>
              <p className="text-xs font-semibold text-[var(--color-text)]">{item.label}</p>
              <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Profile completeness gate ────────────────────────────────────────────────

function ProfileGate({ completeness, posting }: { completeness: Completeness; posting: Posting }) {
  const { user: authUser } = useAuthStore()
  const profilePath = (extra = '') => `/profile/${authUser?.username ?? 'me'}${extra}`
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] flex items-center justify-center mb-3">
            <AlertCircle size={24} style={{ color: 'var(--color-warning)' }} />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Complete your profile to apply</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            {posting.companyName} · {posting.title}
          </p>
        </div>

        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[var(--color-text)]">Profile completeness</span>
            <span className="text-sm font-bold" style={{
              color: completeness.percentage >= 70 ? 'var(--color-success)' : 'var(--color-warning)'
            }}>
              {completeness.percentage}% / 70% required
            </span>
          </div>
          <CompletenessBar pct={completeness.percentage} />

          <div className="mt-4 space-y-0">
            {completeness.sections.map((s) => (
              <div key={s.key} className="flex items-start gap-3 py-2.5 border-b border-[var(--color-border)] last:border-0">
                <div
                  className="mt-0.5 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: 18, height: 18,
                    background: s.done ? 'var(--color-success)' : 'var(--color-border)'
                  }}
                >
                  {s.done && (
                    <svg viewBox="0 0 18 18" fill="none" className="w-full h-full">
                      <path d="M4 9l3.5 3.5L14 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium ${s.done ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]'}`}>
                      {s.label}
                      <span className="ml-1.5 text-xs text-[var(--color-muted)]">+{s.weight}%</span>
                    </span>
                  </div>
                  {!s.done && s.missing.length > 0 && (
                    <p className="text-xs text-[var(--color-warning)] mt-0.5">{s.missing.join(' · ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <p className="text-xs text-[var(--color-muted)] text-center mb-4">
          Your profile is used to match you to this role — the AI screens on your actual skills and experience, not just CV text.
        </p>

        <Button className="w-full" size="lg" onClick={() => navigate(profilePath('?tab=edit&returnTo=' + encodeURIComponent(window.location.pathname)))}>
          <Pencil size={15} /> Complete Profile Now <ArrowRight size={15} />
        </Button>
        <Button className="w-full mt-2" variant="ghost" onClick={() => navigate('/')}>
          Maybe later
        </Button>
      </div>
    </div>
  )
}

// ─── Already applied — status tracker ────────────────────────────────────────

function AlreadyApplied({ app, posting }: { app: { id: string; stage: string; status: string }; posting: Posting }) {
  const stages = ['applied', 'screened', 'assignment_sent', 'assignment_submitted', 'project_evaluated', 'exam_sent', 'exam_completed', 'ranked']
  const currentIdx = stages.indexOf(app.stage)
  const isRejected = app.status === 'rejected'
  const isSelected = app.status === 'selected'
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          {isSelected ? (
            <div className="w-14 h-14 mx-auto rounded-full bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] flex items-center justify-center mb-3">
              <CheckCircle2 size={24} style={{ color: 'var(--color-success)' }} />
            </div>
          ) : isRejected ? (
            <div className="w-14 h-14 mx-auto rounded-full bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] flex items-center justify-center mb-3">
              <XCircle size={24} style={{ color: 'var(--color-danger)' }} />
            </div>
          ) : (
            <div className="w-14 h-14 mx-auto rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] flex items-center justify-center mb-3">
              <Briefcase size={24} style={{ color: 'var(--color-primary)' }} />
            </div>
          )}
          <h1 className="text-xl font-bold text-[var(--color-text)]">
            {isSelected ? 'You\'ve been selected! 🎉' : isRejected ? 'Application closed' : 'Application in progress'}
          </h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">{posting.title} · {posting.companyName}</p>
        </div>

        <Card className="p-5 mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">Pipeline Progress</h3>
          <div className="space-y-2">
            {stages.map((stage, idx) => {
              const info = STAGE_INFO[stage]
              const done = idx <= currentIdx
              const current = idx === currentIdx
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
                    style={{
                      background: done ? (current ? 'var(--color-primary)' : 'var(--color-success)') : 'var(--color-border)',
                      color: done ? '#fff' : 'var(--color-muted)',
                    }}
                  >
                    {done && !current ? (
                      <svg viewBox="0 0 12 12" fill="none" className="w-full h-full p-1">
                        <path d="M2 6l2.5 2.5L10 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs ${done ? 'text-[var(--color-text)] font-medium' : 'text-[var(--color-muted)]'}`}>
                    {info?.label || stage}
                  </span>
                  {current && !isRejected && !isSelected && (
                    <Badge variant="info" className="text-[10px] ml-auto">Current</Badge>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {app.stage === 'exam_sent' && (
          <Card className="p-4 mb-4" style={{ borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)' }}>
            <p className="text-sm font-semibold text-[var(--color-warning)] mb-1">Technical assessment ready</p>
            <p className="text-xs text-[var(--color-muted)] mb-3">Your assessment is waiting. Open the application to start it.</p>
            <Button size="sm" onClick={() => navigate(`/applications/${app.id}`)}>
              Start Assessment <ArrowRight size={14} />
            </Button>
          </Card>
        )}

        {app.stage === 'assignment_sent' && (
          <Card className="p-4 mb-4" style={{ borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)' }}>
            <p className="text-sm font-semibold text-[var(--color-warning)] mb-1">Assignment waiting</p>
            <p className="text-xs text-[var(--color-muted)] mb-3">You have an assignment to complete. Check your email or open the application detail.</p>
            <Button size="sm" onClick={() => navigate(`/applications/${app.id}`)}>
              View Assignment <ArrowRight size={14} />
            </Button>
          </Card>
        )}

        <Button className="w-full" variant="outline" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}

// ─── Main apply form ─────────────────────────────────────────────────────────

function ApplyForm({ data, slug }: { data: PreflightData; slug: string }) {
  const { user: authUser } = useAuthStore()
  const profilePath = (extra = '') => `/profile/${authUser?.username ?? 'me'}${extra}`
  const { posting, prefill, completeness } = data
  const navigate = useNavigate()
  const [coverNote, setCoverNote] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const handleApply = async () => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('coverNote', coverNote)
      if (cvFile) fd.append('resume', cvFile)

      await api.post(`/apply/${slug}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Application submitted! We\'ll email you as you progress through the pipeline.')
      navigate(`/apply/${slug}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const matchedSkills = prefill.skills.filter(s => posting.requiredSkills.some(r => r.name.toLowerCase() === s.toLowerCase()))
  const missingRequired = posting.requiredSkills.filter(r => r.required && !prefill.skills.some(s => s.toLowerCase() === r.name.toLowerCase()))

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] flex items-center justify-center flex-shrink-0">
            <Building2 size={22} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">{posting.title}</h1>
            <p className="text-[var(--color-muted)] text-sm">{posting.companyName}</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {posting.assignmentBrief && <Badge variant="warning" className="text-xs">Assignment</Badge>}
              {posting.examEnabled && <Badge variant="info" className="text-xs">Assessment</Badge>}
            </div>
          </div>
        </div>

        {/* Profile match card */}
        <Card className="p-5 mb-4" style={{ borderColor: completeness.isComplete ? 'color-mix(in srgb, var(--color-success) 25%, transparent)' : undefined }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Your profile match</h3>
            <span className="text-xs font-bold" style={{ color: 'var(--color-success)' }}>
              Profile complete ✓
            </span>
          </div>
          <CompletenessBar pct={completeness.percentage} />
          <p className="text-xs text-[var(--color-muted)] mt-2">
            {completeness.percentage}% — AI will screen based on your skills, experience, and education, not just your CV text.
          </p>

          {missingRequired.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)]">
              <p className="text-xs font-semibold text-[var(--color-warning)] mb-1">Missing required skills</p>
              <div className="flex flex-wrap gap-1">
                {missingRequired.map(s => <Badge key={s.name} variant="warning" className="text-[10px]">{s.name}</Badge>)}
              </div>
              <p className="text-[10px] text-[var(--color-muted)] mt-1.5">You can still apply — the AI will factor this into your score.</p>
            </div>
          )}

          {matchedSkills.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-[var(--color-muted)] mb-1.5">Matched skills from your profile:</p>
              <div className="flex flex-wrap gap-1">
                {matchedSkills.map(s => <Badge key={s} variant="success" className="text-[10px]">{s}</Badge>)}
              </div>
            </div>
          )}
        </Card>

        {/* Pre-filled profile preview */}
        <Card className="p-5 mb-4">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setShowProfile(!showProfile)}
          >
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Profile being used for this application</h3>
            {showProfile ? <ChevronUp size={16} style={{ color: 'var(--color-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-muted)' }} />}
          </button>

          {showProfile && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <User size={15} style={{ color: 'var(--color-muted)' }} />
                <div>
                  <p className="font-medium text-[var(--color-text)]">{prefill.name}</p>
                  {prefill.headline && <p className="text-xs text-[var(--color-muted)]">{prefill.headline}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={15} style={{ color: 'var(--color-muted)' }} />
                <span className="text-[var(--color-muted)]">{prefill.email}</span>
              </div>
              {prefill.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={15} style={{ color: 'var(--color-muted)' }} />
                  <span className="text-[var(--color-muted)]">{prefill.phone}</span>
                </div>
              )}
              {prefill.location && (
                <div className="flex items-center gap-3">
                  <MapPin size={15} style={{ color: 'var(--color-muted)' }} />
                  <span className="text-[var(--color-muted)]">{prefill.location}</span>
                </div>
              )}
              {prefill.skills.length > 0 && (
                <div className="flex items-start gap-3">
                  <Wrench size={15} style={{ color: 'var(--color-muted)' }} className="mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {prefill.skills.map(s => <Badge key={s} variant="muted" className="text-[10px]">{s}</Badge>)}
                  </div>
                </div>
              )}
              {prefill.education.length > 0 && (
                <div className="flex items-start gap-3">
                  <GraduationCap size={15} style={{ color: 'var(--color-muted)' }} className="mt-0.5" />
                  <div>
                    {prefill.education.slice(0, 2).map((e, i) => (
                      <p key={i} className="text-xs text-[var(--color-muted)]">
                        {e.degree} {e.fieldOfStudy ? `in ${e.fieldOfStudy}` : ''} — {e.institution}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {prefill.experience.length > 0 && (
                <div className="flex items-start gap-3">
                  <Briefcase size={15} style={{ color: 'var(--color-muted)' }} className="mt-0.5" />
                  <div>
                    {prefill.experience.slice(0, 2).map((e, i) => (
                      <p key={i} className="text-xs text-[var(--color-muted)]">{e.title} at {e.company}</p>
                    ))}
                  </div>
                </div>
              )}
              {(prefill.githubUrl || prefill.linkedinUrl || prefill.portfolioUrl) && (
                <div className="flex items-start gap-3">
                  <Globe size={15} style={{ color: 'var(--color-muted)' }} className="mt-0.5" />
                  <div className="flex flex-wrap gap-3 text-xs">
                    {prefill.githubUrl && <a href={prefill.githubUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline">GitHub</a>}
                    {prefill.linkedinUrl && <a href={prefill.linkedinUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline">LinkedIn</a>}
                    {prefill.portfolioUrl && <a href={prefill.portfolioUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline">Portfolio</a>}
                  </div>
                </div>
              )}
              <Link
                to={profilePath('?tab=edit')}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
              >
                <Pencil size={12} /> Update profile
              </Link>
            </div>
          )}
        </Card>

        {/* Cover note */}
        <Card className="p-5 mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Cover note (optional)</h3>
          <textarea
            value={coverNote}
            onChange={e => setCoverNote(e.target.value)}
            placeholder="Tell the recruiter why you're a great fit for this role..."
            rows={4}
            className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2"
            style={{
              background: 'var(--color-surface2)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              '--tw-ring-color': 'var(--color-primary)',
            } as React.CSSProperties}
          />
        </Card>

        {/* CV upload — optional since profile has one */}
        <Card className="p-5 mb-6">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Resume / CV</h3>
          {prefill.cvUrl ? (
            <p className="text-xs text-[var(--color-muted)] mb-3">
              We'll use the resume from your profile.{' '}
              <a href={prefill.cvUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline">View it</a>
              {' '}· Upload a new one below to override (optional).
            </p>
          ) : (
            <p className="text-xs text-[var(--color-muted)] mb-3">
              No CV on your profile. Upload one below (optional — the AI screens on your profile data).
            </p>
          )}
          <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-[var(--color-primary)]"
            style={{ borderColor: cvFile ? 'var(--color-success)' : 'var(--color-border)' }}>
            <Upload size={20} style={{ color: cvFile ? 'var(--color-success)' : 'var(--color-muted)' }} />
            <span className="text-xs text-[var(--color-muted)]">
              {cvFile ? cvFile.name : 'Click to upload PDF or DOCX (max 10 MB)'}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={e => setCvFile(e.target.files?.[0] || null)}
            />
          </label>
        </Card>

        {/* Pipeline info */}
        <Card className="p-4 mb-6 bg-[color-mix(in_srgb,var(--color-primary)_4%,transparent)]" style={{ border: '1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)' }}>
          <p className="text-xs font-semibold text-[var(--color-text)] mb-2">What happens next</p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
              <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} />
              AI screens your profile against role requirements
            </li>
            {posting.assignmentBrief && (
              <li className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} />
                If shortlisted: you'll receive a real-world assignment via email
              </li>
            )}
            {posting.examEnabled && (
              <li className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} />
                After assignment: a personalised technical assessment
              </li>
            )}
            <li className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
              <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} />
              Final ranked shortlist sent to recruiter
            </li>
          </ul>
        </Card>

        <Button
          className="w-full"
          size="lg"
          loading={submitting}
          onClick={handleApply}
        >
          Submit Application <ArrowRight size={16} />
        </Button>
        <p className="text-xs text-[var(--color-muted)] text-center mt-3">
          Your application uses data from your DevCert profile — not just your CV.
        </p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ApplyPage() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated, isInitializing } = useAuthStore()
  const [publicPosting, setPublicPosting] = useState<Posting | null>(null)
  const [publicLoading, setPublicLoading] = useState(true)
  const [preflight, setPreflight] = useState<PreflightData | null>(null)
  const [preflightLoading, setPreflightLoading] = useState(false)

  // Always load public posting info
  useEffect(() => {
    if (!slug) return
    api.get(`/apply/${slug}`)
      .then(r => setPublicPosting(r.data.data.posting))
      .catch(() => {})
      .finally(() => setPublicLoading(false))
  }, [slug])

  // Load preflight when authenticated
  const loadPreflight = useCallback(() => {
    if (!slug || !isAuthenticated) return
    setPreflightLoading(true)
    api.get(`/apply/${slug}/preflight`)
      .then(r => setPreflight(r.data.data))
      .catch(() => {})
      .finally(() => setPreflightLoading(false))
  }, [slug, isAuthenticated])

  useEffect(() => { loadPreflight() }, [loadPreflight])

  if (isInitializing || publicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8 text-[var(--color-primary)]" />
      </div>
    )
  }

  if (!publicPosting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <AlertCircle size={32} style={{ color: 'var(--color-danger)' }} />
        <h2 className="text-lg font-bold text-[var(--color-text)]">Posting not found</h2>
        <p className="text-[var(--color-muted)] text-sm">This position may have been closed or the link is invalid.</p>
        <Link to="/" className="text-[var(--color-primary)] text-sm hover:underline">Back to home</Link>
      </div>
    )
  }

  // Not logged in → show posting + register gate
  if (!isAuthenticated) {
    return <GuestView posting={publicPosting} slug={slug!} />
  }

  // Loading preflight
  if (preflightLoading || !preflight) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8 text-[var(--color-primary)]" />
      </div>
    )
  }

  // Already applied
  if (preflight.alreadyApplied && preflight.existingApplication) {
    return <AlreadyApplied app={preflight.existingApplication} posting={preflight.posting} />
  }

  // Profile incomplete
  if (!preflight.completeness.isComplete) {
    return <ProfileGate completeness={preflight.completeness} posting={preflight.posting} />
  }

  // All good — show apply form
  return <ApplyForm data={preflight} slug={slug!} />
}
import { useState } from 'react'
import { Plus, Trash2, Loader2, UploadCloud, CheckCircle, Wand2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import api from '@/services/api'

// ─── types ────────────────────────────────────────────────────────────────────

export interface Education {
  institution: string
  degree: string
  fieldOfStudy: string
  startYear: string
  endYear: string
  grade: string
  description: string
}

export interface Experience {
  company: string
  title: string
  employmentType: string
  location: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
}

export interface ProfileCertification {
  name: string
  issuer: string
  issueDate: string
  expiryDate: string
  credentialUrl: string
}

export interface Project {
  title: string
  startDate: string
  endDate: string
  isOngoing: boolean
  projectUrl: string
  description: string
}

export interface Training {
  program: string
  organization: string
  location: string
  isOnline: boolean
  startDate: string
  endDate: string
  isOngoing: boolean
  description: string
}

export interface Portfolio {
  title: string
  url: string
}

export interface ProfileDetailData {
  headline: string
  summary: string
  phone: string
  location: string
  gender: string
  dob: string
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
  education: Education[]
  experience: Experience[]
  certifications: ProfileCertification[]
  projects: Project[]
  trainings: Training[]
  portfolios: Portfolio[]
  extraCurricular: string
  accomplishments: string
}

interface Props {
  initial?: Partial<ProfileDetailData>
  onSaved?: (data: ProfileDetailData) => void
}

// ─── blank templates ──────────────────────────────────────────────────────────

const blankEdu = (): Education => ({ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '', description: '' })
const blankExp = (): Experience => ({ company: '', title: '', employmentType: 'full_time', location: '', startDate: '', endDate: '', isCurrent: false, description: '' })
const blankCert = (): ProfileCertification => ({ name: '', issuer: '', issueDate: '', expiryDate: '', credentialUrl: '' })
const blankProject = (): Project => ({ title: '', startDate: '', endDate: '', isOngoing: false, projectUrl: '', description: '' })
const blankTraining = (): Training => ({ program: '', organization: '', location: '', isOnline: false, startDate: '', endDate: '', isOngoing: false, description: '' })
const blankPortfolio = (): Portfolio => ({ title: '', url: '' })

const empty: ProfileDetailData = {
  headline: '', summary: '', phone: '', location: '', gender: '', dob: '',
  linkedinUrl: '', githubUrl: '', portfolioUrl: '',
  education: [blankEdu()],
  experience: [],
  certifications: [],
  projects: [],
  trainings: [],
  portfolios: [],
  extraCurricular: '',
  accomplishments: '',
}

// ─── input components ─────────────────────────────────────────────────────────

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-[var(--color-muted)] tracking-wide uppercase">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
)

const inputCls = "w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
const textareaCls = `${inputCls} resize-none min-h-[80px]`

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-widest border-b border-[var(--color-border)] pb-2 mb-4">{children}</h3>
)

// ─── main component ───────────────────────────────────────────────────────────

export default function ProfileDetailForm({ initial, onSaved }: Props) {
  const [form, setForm] = useState<ProfileDetailData>({ ...empty, ...initial })
  const [saving, setSaving] = useState(false)
  const [cvUploading, setCvUploading] = useState(false)
  const [cvUrl, setCvUrl] = useState('')
  const [extractingSkills, setExtractingSkills] = useState(false)

  const set = (key: keyof ProfileDetailData, value: any) =>
    setForm(f => ({ ...f, [key]: value }))

  // ── array helpers ──
  const addItem = <T,>(key: keyof ProfileDetailData, blank: () => T) =>
    setForm(f => ({ ...f, [key]: [...(f[key] as T[]), blank()] }))

  const removeItem = (key: keyof ProfileDetailData, idx: number) =>
    setForm(f => ({ ...f, [key]: (f[key] as any[]).filter((_, i) => i !== idx) }))

  const updateItem = <T,>(key: keyof ProfileDetailData, idx: number, patch: Partial<T>) =>
    setForm(f => ({
      ...f,
      [key]: (f[key] as T[]).map((item, i) => i === idx ? { ...item, ...patch } : item)
    }))

  // ── CV upload ──
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCvUploading(true)
    try {
      const formData = new FormData()
      formData.append('cv', file)
      const { data } = await api.post('/users/upload-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setCvUrl(data.data.url)
      toast.success('CV uploaded!')
    } catch {
      toast.error('CV upload failed')
    } finally {
      setCvUploading(false)
      e.target.value = ''
    }
  }

  // ── auto-extract skills from projects ──
  const extractSkillsFromProjects = async () => {
    const text = form.projects.map(p => `${p.title}: ${p.description}`).join('\n')
    if (!text.trim()) { toast.error('Add some projects first'); return }
    setExtractingSkills(true)
    try {
      // Parse tech stacks from project descriptions
      const techMatches = text.match(/(?:Tech Stack|Technologies|Stack|Built with|Using)[:\s]+([^\n.]+)/gi) || []
      const skills: string[] = []
      techMatches.forEach(match => {
        const after = match.replace(/^.*?[:\s]+/, '')
        after.split(/[,;]/).forEach(s => {
          const t = s.trim().replace(/\band\b/i, '').trim()
          if (t && t.length > 1 && t.length < 30) skills.push(t)
        })
      })
      if (skills.length > 0) {
        toast.success(`Found ${skills.length} skills from your projects!`)
        // Return extracted skills list to parent via a custom event or callback
        // For now show as toast - parent can use the skills section
        const unique = [...new Set(skills)]
        toast((t) => (
          <div>
            <p className="font-semibold mb-1">Skills found:</p>
            <p className="text-sm">{unique.join(', ')}</p>
            <p className="text-xs text-gray-500 mt-1">Add these in the Skills section of your profile.</p>
          </div>
        ), { duration: 6000 })
      } else {
        toast.error('No tech stack found. Try adding "Tech Stack: ..." to your project descriptions.')
      }
    } finally {
      setExtractingSkills(false)
    }
  }

  // ── save ──
  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, cvUrl: cvUrl || undefined }
      const { data } = await api.put('/users/profile-detail', payload)
      toast.success('Profile saved!')
      onSaved?.(data.data || payload)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Edit Resume</h2>
        <Button onClick={handleSave} loading={saving} size="sm">
          {saving ? 'Saving…' : 'Save All'}
        </Button>
      </div>

      {/* ── Personal Info ── */}
      <section id="edit-personal">
        <SectionTitle>Personal Info</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Headline">
            <input className={inputCls} placeholder="e.g. Flutter Developer" value={form.headline} onChange={e => set('headline', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Location">
            <input className={inputCls} placeholder="e.g. Delhi" value={form.location} onChange={e => set('location', e.target.value)} />
          </Field>
          <Field label="Gender">
            <select className={inputCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Date of Birth">
            <input className={inputCls} type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
          </Field>
          <Field label="LinkedIn URL">
            <input className={inputCls} placeholder="https://linkedin.com/in/…" value={form.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} />
          </Field>
          <Field label="GitHub URL">
            <input className={inputCls} placeholder="https://github.com/…" value={form.githubUrl} onChange={e => set('githubUrl', e.target.value)} />
          </Field>
          <Field label="Portfolio URL">
            <input className={inputCls} placeholder="https://yoursite.com" value={form.portfolioUrl} onChange={e => set('portfolioUrl', e.target.value)} />
          </Field>
        </div>

        {/* CV Upload */}
        <div className="mt-4">
          <Field label="Upload CV (PDF)">
            <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-[var(--color-border)] rounded-xl px-4 py-3 hover:border-[var(--color-primary)] transition-colors">
              {cvUploading
                ? <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />
                : cvUrl
                  ? <CheckCircle size={16} className="text-green-500" />
                  : <UploadCloud size={16} className="text-[var(--color-muted)]" />
              }
              <span className="text-sm text-[var(--color-muted)]">
                {cvUrl ? 'CV uploaded ✓' : cvUploading ? 'Uploading…' : 'Click to upload your CV'}
              </span>
              <input type="file" accept=".pdf" className="hidden" onChange={handleCvUpload} />
            </label>
          </Field>
        </div>
      </section>

      {/* ── Career Objective ── */}
      <section id="edit-summary">
        <SectionTitle>Career Objective</SectionTitle>
        <textarea
          className={textareaCls}
          placeholder="Write a brief career objective or summary..."
          value={form.summary}
          onChange={e => set('summary', e.target.value)}
          rows={4}
        />
      </section>

      {/* ── Education ── */}
      <section id="edit-education">
        <SectionTitle>Education</SectionTitle>
        <div className="space-y-4">
          {form.education.map((edu, i) => (
            <div key={i} className="border border-[var(--color-border)] rounded-xl p-4 space-y-3 relative">
              {form.education.length > 1 && (
                <button onClick={() => removeItem('education', i)} className="absolute top-3 right-3 text-[var(--color-muted)] hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Degree / Qualification" required>
                  <input className={inputCls} placeholder="e.g. B.Tech" value={edu.degree} onChange={e => updateItem('education', i, { degree: e.target.value })} />
                </Field>
                <Field label="Field of Study">
                  <input className={inputCls} placeholder="e.g. Computer Science" value={edu.fieldOfStudy} onChange={e => updateItem('education', i, { fieldOfStudy: e.target.value })} />
                </Field>
                <Field label="Institution" required>
                  <input className={inputCls} placeholder="e.g. IIT Delhi" value={edu.institution} onChange={e => updateItem('education', i, { institution: e.target.value })} />
                </Field>
                <Field label="Grade / CGPA / Percentage">
                  <input className={inputCls} placeholder="e.g. 7.8/10 or 85%" value={edu.grade} onChange={e => updateItem('education', i, { grade: e.target.value })} />
                </Field>
                <Field label="Start Year">
                  <input className={inputCls} type="number" placeholder="2021" value={edu.startYear} onChange={e => updateItem('education', i, { startYear: e.target.value })} />
                </Field>
                <Field label="End Year">
                  <input className={inputCls} type="number" placeholder="2025" value={edu.endYear} onChange={e => updateItem('education', i, { endYear: e.target.value })} />
                </Field>
              </div>
              <Field label="Description (Optional)">
                <textarea className={textareaCls} rows={2} value={edu.description} onChange={e => updateItem('education', i, { description: e.target.value })} placeholder="Relevant coursework, achievements..." />
              </Field>
            </div>
          ))}
          <button onClick={() => addItem('education', blankEdu)} className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:opacity-70 transition-opacity">
            <Plus size={14} /> Add education
          </button>
        </div>
      </section>

      {/* ── Work Experience ── */}
      <section id="edit-experience">
        <SectionTitle>Work Experience</SectionTitle>
        <div className="space-y-4">
          {form.experience.length === 0 && (
            <p className="text-sm text-[var(--color-muted)] italic">No work experience added yet.</p>
          )}
          {form.experience.map((exp, i) => (
            <div key={i} className="border border-[var(--color-border)] rounded-xl p-4 space-y-3 relative">
              <button onClick={() => removeItem('experience', i)} className="absolute top-3 right-3 text-[var(--color-muted)] hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Profile / Role" required>
                  <input className={inputCls} placeholder="e.g. Software Engineer" value={exp.title} onChange={e => updateItem('experience', i, { title: e.target.value })} />
                </Field>
                <Field label="Organization" required>
                  <input className={inputCls} placeholder="e.g. Google" value={exp.company} onChange={e => updateItem('experience', i, { company: e.target.value })} />
                </Field>
                <Field label="Type">
                  <select className={inputCls} value={exp.employmentType} onChange={e => updateItem('experience', i, { employmentType: e.target.value })}>
                    <option value="full_time">Full Time</option>
                    <option value="internship">Internship</option>
                    <option value="part_time">Part Time</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </Field>
                <Field label="Location">
                  <input className={inputCls} placeholder="e.g. Mumbai" value={exp.location} onChange={e => updateItem('experience', i, { location: e.target.value })} />
                </Field>
                <Field label="Start Date">
                  <input className={inputCls} type="month" value={exp.startDate} onChange={e => updateItem('experience', i, { startDate: e.target.value })} />
                </Field>
                <Field label="End Date">
                  <input className={inputCls} type="month" value={exp.endDate} disabled={exp.isCurrent} onChange={e => updateItem('experience', i, { endDate: e.target.value })} />
                  <label className="flex items-center gap-2 text-xs text-[var(--color-muted)] mt-1">
                    <input type="checkbox" checked={exp.isCurrent} onChange={e => updateItem('experience', i, { isCurrent: e.target.checked })} className="accent-[var(--color-primary)]" />
                    Currently working here
                  </label>
                </Field>
              </div>
              <Field label="Description (Optional)">
                <textarea className={textareaCls} rows={3} value={exp.description} onChange={e => updateItem('experience', i, { description: e.target.value })} placeholder="Key responsibilities and achievements..." />
              </Field>
            </div>
          ))}
          <div className="flex gap-4">
            <button onClick={() => addItem('experience', blankExp)} className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:opacity-70 transition-opacity">
              <Plus size={14} /> Add internship
            </button>
            <button onClick={() => addItem('experience', () => ({ ...blankExp(), employmentType: 'full_time' }))} className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:opacity-70 transition-opacity">
              <Plus size={14} /> Add job
            </button>
          </div>
        </div>
      </section>

      {/* ── Extra Curricular Activities ── */}
      <section id="edit-extracurricular">
        <SectionTitle>Extra Curricular Activities</SectionTitle>
        <textarea
          className={textareaCls}
          placeholder={`List your activities, one per line:\n1. Hackathon Winner\n2. Member of coding club...`}
          value={form.extraCurricular}
          onChange={e => set('extraCurricular', e.target.value)}
          rows={5}
        />
      </section>

      {/* ── Trainings / Courses ── */}
      <section id="edit-trainings">
        <SectionTitle>Trainings / Courses</SectionTitle>
        <div className="space-y-4">
          {form.trainings.length === 0 && (
            <p className="text-sm text-[var(--color-muted)] italic">No trainings added yet.</p>
          )}
          {form.trainings.map((tr, i) => (
            <div key={i} className="border border-[var(--color-border)] rounded-xl p-4 space-y-3 relative">
              <button onClick={() => removeItem('trainings', i)} className="absolute top-3 right-3 text-[var(--color-muted)] hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Training Program" required>
                  <input className={inputCls} placeholder="e.g. Full Stack Web Dev" value={tr.program} onChange={e => updateItem('trainings', i, { program: e.target.value })} />
                </Field>
                <Field label="Organization">
                  <input className={inputCls} placeholder="e.g. Internshala Trainings" value={tr.organization} onChange={e => updateItem('trainings', i, { organization: e.target.value })} />
                </Field>
                <Field label="Start Date">
                  <input className={inputCls} type="month" value={tr.startDate} onChange={e => updateItem('trainings', i, { startDate: e.target.value })} />
                </Field>
                <Field label="End Date">
                  <input className={inputCls} type="month" value={tr.endDate} disabled={tr.isOngoing} onChange={e => updateItem('trainings', i, { endDate: e.target.value })} />
                  <label className="flex items-center gap-2 text-xs text-[var(--color-muted)] mt-1">
                    <input type="checkbox" checked={tr.isOngoing} onChange={e => updateItem('trainings', i, { isOngoing: e.target.checked })} className="accent-[var(--color-primary)]" />
                    Currently ongoing
                  </label>
                </Field>
                <Field label="Location">
                  <input className={inputCls} placeholder="e.g. Mumbai" value={tr.location} disabled={tr.isOnline} onChange={e => updateItem('trainings', i, { location: e.target.value })} />
                  <label className="flex items-center gap-2 text-xs text-[var(--color-muted)] mt-1">
                    <input type="checkbox" checked={tr.isOnline} onChange={e => updateItem('trainings', i, { isOnline: e.target.checked })} className="accent-[var(--color-primary)]" />
                    Online
                  </label>
                </Field>
              </div>
              <Field label="Description (Optional)">
                <textarea className={textareaCls} rows={2} value={tr.description} onChange={e => updateItem('trainings', i, { description: e.target.value })} placeholder="What you learned..." />
              </Field>
            </div>
          ))}
          <button onClick={() => addItem('trainings', blankTraining)} className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:opacity-70 transition-opacity">
            <Plus size={14} /> Add training / course
          </button>
        </div>
      </section>

      {/* ── Academics / Personal Projects ── */}
      <section id="edit-projects">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Academics / Personal Projects</SectionTitle>
          <button
            onClick={extractSkillsFromProjects}
            disabled={extractingSkills}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] hover:opacity-80 transition-opacity"
          >
            <Wand2 size={12} />
            {extractingSkills ? 'Extracting…' : 'Auto-detect Skills'}
          </button>
        </div>
        <div className="space-y-4">
          {form.projects.length === 0 && (
            <p className="text-sm text-[var(--color-muted)] italic">No projects added yet.</p>
          )}
          {form.projects.map((proj, i) => (
            <div key={i} className="border border-[var(--color-border)] rounded-xl p-4 space-y-3 relative">
              <button onClick={() => removeItem('projects', i)} className="absolute top-3 right-3 text-[var(--color-muted)] hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Project Title" required>
                  <input className={inputCls} placeholder="e.g. Location-Based Audio Social Platform" value={proj.title} onChange={e => updateItem('projects', i, { title: e.target.value })} />
                </Field>
                <Field label="Project Link (Optional)">
                  <input className={inputCls} placeholder="https://github.com/…" value={proj.projectUrl} onChange={e => updateItem('projects', i, { projectUrl: e.target.value })} />
                </Field>
                <Field label="Start Month">
                  <input className={inputCls} type="month" value={proj.startDate} onChange={e => updateItem('projects', i, { startDate: e.target.value })} />
                </Field>
                <Field label="End Month">
                  <input className={inputCls} type="month" value={proj.endDate} disabled={proj.isOngoing} onChange={e => updateItem('projects', i, { endDate: e.target.value })} />
                  <label className="flex items-center gap-2 text-xs text-[var(--color-muted)] mt-1">
                    <input type="checkbox" checked={proj.isOngoing} onChange={e => updateItem('projects', i, { isOngoing: e.target.checked })} className="accent-[var(--color-primary)]" />
                    Currently ongoing
                  </label>
                </Field>
              </div>
              <Field label="Description">
                <textarea className={textareaCls} rows={4} value={proj.description}
                  onChange={e => updateItem('projects', i, { description: e.target.value })}
                  placeholder={`Tech Stack: Flutter, Firebase, ...\n• Developed a feature that...\n• Implemented...`}
                />
              </Field>
            </div>
          ))}
          <button onClick={() => addItem('projects', blankProject)} className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:opacity-70 transition-opacity">
            <Plus size={14} /> Add academic / personal project
          </button>
        </div>
      </section>

      {/* ── Portfolio / Work Samples ── */}
      <section id="edit-portfolios">
        <SectionTitle>Portfolio / Work Samples</SectionTitle>
        <div className="space-y-3">
          {form.portfolios.length === 0 && (
            <p className="text-sm text-[var(--color-muted)] italic">No portfolio links added yet.</p>
          )}
          {form.portfolios.map((p, i) => (
            <div key={i} className="flex gap-3 items-start border border-[var(--color-border)] rounded-xl p-4 relative">
              <button onClick={() => removeItem('portfolios', i)} className="absolute top-3 right-3 text-[var(--color-muted)] hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Title">
                  <input className={inputCls} placeholder="e.g. GitHub link" value={p.title} onChange={e => updateItem('portfolios', i, { title: e.target.value })} />
                </Field>
                <Field label="URL">
                  <input className={inputCls} placeholder="https://…" value={p.url} onChange={e => updateItem('portfolios', i, { url: e.target.value })} />
                </Field>
              </div>
            </div>
          ))}
          <button onClick={() => addItem('portfolios', blankPortfolio)} className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:opacity-70 transition-opacity">
            <Plus size={14} /> Add portfolio / work sample
          </button>
        </div>
      </section>

      {/* ── Certifications ── */}
      <section id="edit-certifications">
        <SectionTitle>Certifications</SectionTitle>
        <div className="space-y-4">
          {form.certifications.length === 0 && (
            <p className="text-sm text-[var(--color-muted)] italic">No certifications added yet.</p>
          )}
          {form.certifications.map((c, i) => (
            <div key={i} className="border border-[var(--color-border)] rounded-xl p-4 space-y-3 relative">
              <button onClick={() => removeItem('certifications', i)} className="absolute top-3 right-3 text-[var(--color-muted)] hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Certification Name" required>
                  <input className={inputCls} placeholder="e.g. AWS Solutions Architect" value={c.name} onChange={e => updateItem('certifications', i, { name: e.target.value })} />
                </Field>
                <Field label="Issuer">
                  <input className={inputCls} placeholder="e.g. Amazon" value={c.issuer} onChange={e => updateItem('certifications', i, { issuer: e.target.value })} />
                </Field>
                <Field label="Issue Date">
                  <input className={inputCls} type="month" value={c.issueDate} onChange={e => updateItem('certifications', i, { issueDate: e.target.value })} />
                </Field>
                <Field label="Credential URL">
                  <input className={inputCls} placeholder="https://…" value={c.credentialUrl} onChange={e => updateItem('certifications', i, { credentialUrl: e.target.value })} />
                </Field>
              </div>
            </div>
          ))}
          <button onClick={() => addItem('certifications', blankCert)} className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:opacity-70 transition-opacity">
            <Plus size={14} /> Add certification
          </button>
        </div>
      </section>

      {/* ── Accomplishments / Additional Details ── */}
      <section id="edit-accomplishments">
        <SectionTitle>Accomplishments / Additional Details</SectionTitle>
        <textarea
          className={textareaCls}
          placeholder={`List accomplishments, one per line:\nCGPA: 7.8/10; showing consistent academic performance\nStrong foundation in DSA...`}
          value={form.accomplishments}
          onChange={e => set('accomplishments', e.target.value)}
          rows={5}
        />
      </section>

      {/* ── Save button ── */}
      <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
        <Button onClick={handleSave} loading={saving}>
          {saving ? 'Saving…' : 'Save Profile'}
        </Button>
      </div>
    </Card>
  )
}
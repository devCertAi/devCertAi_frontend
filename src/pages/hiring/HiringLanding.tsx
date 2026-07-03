/**
 * HiringLanding.tsx
 *
 * Standalone hiring page shown when a recruiter (or prospective recruiter) 
 * clicks the "Hire" / "Start Hiring" button anywhere on the site.
 *
 * After login this page is also the landing — recruiter sees their own 
 * dashboard CTA immediately, not the student landing.
 *
 * Req 5: "When user click on hire button then only show hiring and after 
 *         login show only hiring dashboard not user dashboard"
 * Req 6: "Add about hiring in landing page of website"
 */

import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Zap, Code2, BarChart2, Shield, MessageSquare, ChevronDown, ChevronUp,
  CheckCircle, Filter, FileCode, Brain, Trophy, ArrowRight, Building2,
  Users, Clock, Star, Briefcase, TrendingUp, Lock, Search, Award,
  GitBranch, CheckCircle2, BarChart, Target, Send,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Footer } from '@/components/layout/Footer'
import { useAuthStore } from '@/store/authStore'

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

const PIPELINE_STEPS = [
  {
    icon: Filter, num: '01',
    title: 'Post your role',
    desc: 'Define required skills, set screening thresholds, and choose how many candidates to advance — a fixed number or a top percentage. Takes under 5 minutes.',
  },
  {
    icon: Brain, num: '02',
    title: 'AI screens every applicant',
    desc: 'Every application is scored against your requirements using the candidate\'s actual profile — skills, education, experience — not just CV keywords. Only top candidates advance automatically.',
  },
  {
    icon: FileCode, num: '03',
    title: 'Real assignment, not a quiz',
    desc: 'Shortlisted candidates complete a real-world project tied to your stack. Our AI evaluates code quality, architecture, and completeness against a detailed rubric — no manual review needed.',
  },
  {
    icon: Brain, num: '04',
    title: 'Personalised technical assessment',
    desc: 'Each candidate takes an exam generated from your required skills — plus personalised questions about the project they just submitted. No copy-pasting gets through.',
  },
  {
    icon: Trophy, num: '05',
    title: 'Ranked shortlist, ready to hire',
    desc: 'Weighted scoring you control produces a final ranked list with AI-written candidate summaries. Rejected candidates automatically receive specific, honest feedback — no ghosting.',
  },
]

const VALUE_PROPS = [
  { icon: Filter,        title: 'Skip resume screening',         desc: 'AI handles the first pass — 200 applicants become 10 qualified candidates, automatically.' },
  { icon: Code2,         title: 'See real code, not claims',      desc: 'Every shortlisted candidate submits a real project graded on architecture and quality.' },
  { icon: BarChart2,     title: 'Tunable AI, not a black box',    desc: 'You control every threshold, weight, and cutoff. See score distributions to calibrate.' },
  { icon: MessageSquare, title: 'Candidates get closure',         desc: 'Auto-generated rejection emails include specific feedback. No silence, no ghosting.' },
  { icon: Shield,        title: 'Privacy-first',                  desc: 'Candidate data is used only for their application to you — never shared or used to train models.' },
  { icon: Clock,         title: 'From post to ranked in days',    desc: 'No scheduling, no back-and-forth. The pipeline runs asynchronously around your calendar.' },
]

const FAQS = [
  { q: 'How does AI scoring work?', a: 'Each application is scored across four dimensions — rule-based skill match, AI resume analysis, project code quality, and a technical assessment. You control the weights so the final ranking reflects your priorities.' },
  { q: 'Can I review every candidate manually?', a: 'Yes. The AI pipeline automatically screens and ranks candidates, but you can view every individual application, score breakdown, and project report at any time.' },
  { q: "What if no candidates pass my threshold?", a: "You'll be notified immediately. You can lower thresholds from your dashboard — the tuning tool shows how many additional candidates pass at different settings." },
  { q: 'How is pricing calculated?', a: 'Pricing is per active posting or via monthly subscription for multiple concurrent postings. See the pricing section below for details.' },
  { q: 'Can I message candidates directly?', a: 'Yes. Once a candidate is in your pipeline, you can message them directly from the recruiter dashboard. They receive both an in-app notification and an email.' },
  { q: "Is my candidates' data private?", a: "Candidate data is used only to process their application to your posting. It is never shared with other recruiters or used to train AI models." },
  { q: 'Can I use DevCert for full-time hiring too?', a: 'Yes. The pipeline works equally well for internships and full-time roles. You set the role type, requirements, and pipeline stages when creating a posting.' },
  { q: 'What does the assignment stage look like for candidates?', a: 'After being shortlisted, candidates receive an email with your assignment brief and a submission deadline. They submit via GitHub link or zip file. Results are automatically evaluated and fed into their final score.' },
]

const RECRUITER_PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    desc: '1 active posting with the full AI pipeline. No credit card needed.',
    features: ['Full AI screening & ranking', 'Up to 50 applicants', 'Assignment + assessment stages', 'Candidate messaging', 'Auto-rejection emails with feedback'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$49',
    period: '/month',
    desc: 'Up to 5 concurrent postings. Best for growing teams.',
    features: ['Everything in Starter', 'Up to 5 active postings', 'Unlimited applicants per posting', 'Priority AI pipeline processing', 'Custom scoring weights', 'CSV export of ranked candidates'],
    cta: 'Start hiring',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Unlimited postings, custom integrations, dedicated support.',
    features: ['Everything in Growth', 'Unlimited postings', 'ATS integrations (Greenhouse, Lever)', 'White-label apply pages', 'SLA support', 'Custom AI rubrics'],
    cta: 'Contact us',
    highlight: false,
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{q}</span>
        {open
          ? <ChevronUp size={16} style={{ color: 'var(--color-muted)' }} />
          : <ChevronDown size={16} style={{ color: 'var(--color-muted)' }} />
        }
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 text-sm leading-relaxed"
              style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)' }}>
              <p className="pt-3">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HiringLanding() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin'

  const handleHireClick = () => {
    if (isAuthenticated && isRecruiter) {
      navigate('/recruiter/dashboard')
    } else if (isAuthenticated) {
      // Normal user — send to recruiter register
      navigate('/auth/register-recruiter')
    } else {
      navigate('/auth/register-recruiter')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Standalone nav for hiring page */}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md"
        style={{ background: 'var(--color-glass)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--gradient-brand)' }}>
                <span className="text-[var(--color-inverse)] font-bold text-sm">DC</span>
              </div>
              <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>DevCert</span>
              <Badge variant="muted" className="text-[10px] hidden sm:flex">for Recruiters</Badge>
            </Link>
            <div className="flex items-center gap-3">
              {isAuthenticated && isRecruiter ? (
                <Button size="sm" onClick={() => navigate('/recruiter/dashboard')}>
                  <BarChart2 size={14} /> Go to Dashboard
                </Button>
              ) : isAuthenticated ? (
                <Button size="sm" onClick={handleHireClick}>Start Hiring</Button>
              ) : (
                <>
                  <Link to="/auth/login" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
                    Sign in
                  </Link>
                  <Button size="sm" onClick={handleHireClick}>Start Hiring Free</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        {/* ── HERO ── */}
        <section className="relative py-24 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-20 rounded-full"
              style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }} />
          </div>
          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 text-xs font-mono uppercase tracking-wider"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)', background: 'var(--color-surface)' }}>
                <Zap size={11} style={{ color: 'var(--color-primary)' }} />
                AI-powered hiring pipeline
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="font-bold mb-5 leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(32px, 5vw, 58px)', letterSpacing: '-0.025em', color: 'var(--color-text)' }}
            >
              Hire verified developers.<br />
              <span style={{ color: 'var(--color-primary)' }}>Zero resume sifting.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg max-w-2xl mx-auto mb-8 leading-relaxed"
              style={{ color: 'var(--color-muted)' }}
            >
              Post a role. DevCert screens every applicant against your requirements, sends them a real assignment,
              runs a personalised assessment, and delivers a ranked shortlist — automatically.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button size="lg" onClick={handleHireClick} className="px-8">
                {isAuthenticated && isRecruiter ? 'Go to Dashboard' : 'Start Hiring Free'} <ArrowRight size={16} />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                See how it works
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <section className="py-8 px-4" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '10×', label: 'faster than manual screening' },
              { value: '4 stages', label: 'from apply to ranked shortlist' },
              { value: '0', label: 'ghost rejections' },
              { value: '100%', label: 'real-code evaluation' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-primary)' }}>{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-14">
                <p className="font-mono text-[11px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>The pipeline</p>
                <h2 className="font-bold text-3xl mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                  From application to hire in 5 steps
                </h2>
                <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--color-muted)' }}>
                  Every stage runs automatically. You review the output, not the process.
                </p>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              {PIPELINE_STEPS.map((step, i) => {
                const Icon = step.icon
                return (
                  <ScrollReveal key={i} delay={i * 0.07}>
                    <div className="flex gap-5 p-5 rounded-2xl"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}>
                          <Icon size={18} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <span className="font-mono text-[10px] font-bold" style={{ color: 'var(--color-muted)' }}>{step.num}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--color-text)' }}>{step.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{step.desc}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── VALUE PROPS ── */}
        <section className="py-20 px-4" style={{ background: 'color-mix(in srgb, var(--color-surface) 50%, transparent)' }}>
          <div className="max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-14">
                <p className="font-mono text-[11px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-secondary)' }}>Why DevCert</p>
                <h2 className="font-bold text-3xl mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                  Built to fix what's broken in hiring
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {VALUE_PROPS.map((v, i) => {
                const Icon = v.icon
                return (
                  <ScrollReveal key={i} delay={i * 0.06}>
                    <div className="p-5 rounded-2xl h-full"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}>
                        <Icon size={16} style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <h3 className="font-semibold text-sm mb-1.5" style={{ color: 'var(--color-text)' }}>{v.title}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{v.desc}</p>
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── CANDIDATE PROFILE SCREENING — explains Req 2 to recruiters ── */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="font-mono text-[11px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>Profile-based filtering</p>
                <h2 className="font-bold text-3xl mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                  We screen on verified profile data,<br />not CV formatting
                </h2>
                <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--color-muted)' }}>
                  Every DevCert candidate maintains a structured profile — verified skills, education, experience,
                  and portfolio links. Screening happens against this structured data, so you see actual capability,
                  not keyword density.
                </p>
              </div>
            </ScrollReveal>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: <Target size={18} />, title: 'Structured skill matching', desc: 'Required and preferred skills are matched against the candidate\'s verified skill list — not guessed from CV text.' },
                { icon: <Award size={18} />, title: 'Education & experience', desc: 'Degree level, field of study, and years of experience are structured fields on the profile — enabling precise filtering.' },
                { icon: <GitBranch size={18} />, title: 'Portfolio & GitHub', desc: 'Profile links let candidates prove work before the assignment stage. Linked repositories are part of the AI analysis.' },
              ].map((item, i) => (
                <ScrollReveal key={i} delay={i * 0.08}>
                  <div className="p-5 rounded-2xl text-center h-full"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-3"
                      style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}>
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-text)' }}>{item.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── RANK LIST EXPLAINED ── */}
        <section className="py-20 px-4" style={{ background: 'color-mix(in srgb, var(--color-surface) 50%, transparent)' }}>
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>Final ranking</p>
                  <h2 className="font-bold text-2xl mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                    A ranked shortlist you can trust
                  </h2>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-muted)' }}>
                    After assessment completion, DevCert runs a final weighted ranking across all four pipeline scores.
                    You control the weights — prioritise project quality for senior roles, or assessment speed for 
                    high-volume hiring.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      { label: 'Rule-based skill match', sub: 'Structured profile vs your requirements' },
                      { label: 'AI resume analysis', sub: 'Qualitative depth beyond keywords' },
                      { label: 'Project evaluation', sub: 'Real code graded by AI rubric' },
                      { label: 'Technical assessment', sub: 'Personalised per-candidate exam' },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{item.label}</p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{item.sub}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  {/* Mock ranked shortlist UI */}
                  {[
                    { name: 'Aryan Mehta', score: 91, skills: ['React', 'TypeScript', 'Node.js'], badge: '🥇 Top candidate' },
                    { name: 'Priya Sharma', score: 84, skills: ['Python', 'ML', 'FastAPI'], badge: '🥈' },
                    { name: 'Rohan Das', score: 79, skills: ['Go', 'PostgreSQL', 'Docker'], badge: '🥉' },
                  ].map((c, i) => (
                    <div key={i} className="p-4 rounded-xl"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] flex items-center justify-center text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                            {c.name[0]}
                          </div>
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{c.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{c.badge}</span>
                          <div className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>{c.score}/100</div>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--color-border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: 'var(--color-primary)' }} />
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {c.skills.map(s => <Badge key={s} variant="muted" className="text-[10px]">{s}</Badge>)}
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-center" style={{ color: 'var(--color-muted)' }}>
                    * Illustrative — actual scores depend on your rubric settings
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-14">
                <p className="font-mono text-[11px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-secondary)' }}>Pricing</p>
                <h2 className="font-bold text-3xl mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                  Simple, transparent pricing
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Start free. Scale when you need to.</p>
              </div>
            </ScrollReveal>
            <div className="grid md:grid-cols-3 gap-4">
              {RECRUITER_PLANS.map((plan, i) => (
                <ScrollReveal key={i} delay={i * 0.08}>
                  <div
                    className="p-6 rounded-2xl flex flex-col h-full relative"
                    style={{
                      background: plan.highlight
                        ? 'linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 8%, transparent), var(--color-surface))'
                        : 'var(--color-surface)',
                      border: plan.highlight
                        ? '1px solid color-mix(in srgb, var(--color-primary) 40%, transparent)'
                        : '1px solid var(--color-border)',
                    }}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ background: 'var(--color-primary)' }}>
                        Most popular
                      </div>
                    )}
                    <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text)' }}>{plan.name}</h3>
                    <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>{plan.desc}</p>
                    <div className="flex items-end gap-1 mb-6">
                      <span className="font-bold text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)' }}>{plan.price}</span>
                      {plan.period && <span className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>{plan.period}</span>}
                    </div>
                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                          <CheckCircle size={12} style={{ color: 'var(--color-success)' }} className="flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.highlight ? 'primary' : 'outline'}
                      className="w-full"
                      onClick={handleHireClick}
                    >
                      {plan.cta}
                    </Button>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQS ── */}
        <section className="py-20 px-4" style={{ background: 'color-mix(in srgb, var(--color-surface) 50%, transparent)' }}>
          <div className="max-w-2xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="font-mono text-[11px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-secondary)' }}>FAQ</p>
                <h2 className="font-bold text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                  Common questions
                </h2>
              </div>
            </ScrollReveal>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <ScrollReveal key={i} delay={i * 0.04}>
                  <FaqItem q={faq.q} a={faq.a} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 px-4 text-center">
          <ScrollReveal>
            <div className="max-w-xl mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'var(--color-primary)' }}>
                <Send size={24} style={{ color: 'white' }} />
              </div>
              <h2 className="font-bold text-3xl mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                Ready to hire smarter?
              </h2>
              <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
                Post your first role free. No credit card required. Get a ranked shortlist in days, not weeks.
              </p>
              <Button size="lg" className="px-10" onClick={handleHireClick}>
                {isAuthenticated && isRecruiter ? 'Open Dashboard' : 'Start Hiring Free'} <ArrowRight size={16} />
              </Button>
            </div>
          </ScrollReveal>
        </section>

        <Footer />
      </div>
    </div>
  )
}

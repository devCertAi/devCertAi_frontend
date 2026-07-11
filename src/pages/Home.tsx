import { useNavigate } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight, GitBranch, Zap, Award, Check, Shield, BarChart2, FileText, Cpu, Star,
  Monitor,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AdBanner } from '@/components/ads/AdBanner'
import { Footer } from '@/components/layout/Footer'
import { DOMAINS, PRICING_PLANS } from '@/lib/constants'
import { TestimonialsCarousel } from '@/components/home/TestimonialsCarousel'
import { HeroDomainStack } from '@/components/home/HeroDomainStack'
import { TutorialWalkthrough } from '@/components/home/TutorialWalkthrough'
import { EvalPanel } from '@/components/home/EvalPanel'
import { BuildTower } from '@/components/home/BuildTower'
import { Hero3DObject } from '@/components/home/Hero3DObject'
import { ScrollGlowBackground } from '@/components/home/ScrollGlowBackground'
import { CategoryFlipCard } from '@/components/home/CategoryFlipCard'
import { useAuthStore } from '@/store/authStore'
import { DevBot as DevBotCharacter } from '@/components/ui/Devbot'

// ─── TYPING ANIMATION HOOK ───────────────────────────────────────
function useTypingAnimation(texts: string[], speed = 60) {
  const [displayed, setDisplayed] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[textIndex]
    const timeout = setTimeout(() => {
      if (!deleting) {
        if (charIndex < current.length) { setDisplayed(current.slice(0, charIndex + 1)); setCharIndex(c => c + 1) }
        else { setTimeout(() => setDeleting(true), 2000) }
      } else {
        if (charIndex > 0) { setDisplayed(current.slice(0, charIndex - 1)); setCharIndex(c => c - 1) }
        else { setDeleting(false); setTextIndex(i => (i + 1) % texts.length) }
      }
    }, deleting ? speed / 2 : speed)
    return () => clearTimeout(timeout)
  }, [charIndex, deleting, textIndex, texts, speed])

  return displayed
}

// ─── SCORE METER ─────────────────────────────────────────────────
function ScoreMeter({ score, color }: { score: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(0)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = () => { start += 2; setCount(Math.min(start, score)); if (start < score) requestAnimationFrame(step) }
    requestAnimationFrame(step)
  }, [inView, score])

  return (
    <div ref={ref} className="mt-3">
      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
        <span>Avg score</span><span style={{ color }}>{count}/100</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(127,127,127,.15)' }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: inView ? `${score}%` : '0%', backgroundColor: color }} />
      </div>
    </div>
  )
}

// ─── SCROLL REVEAL ────────────────────────────────────────────────
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

// ─── SECTION HEAD ─────────────────────────────────────────────────
function SectionHead({ eyebrow, title, desc, eyebrowColor = 'var(--color-secondary)' }: { eyebrow: string; title: string; desc?: string; eyebrowColor?: string }) {
  return (
    <ScrollReveal>
      <div className="max-w-[640px] mx-auto mb-[52px] text-center">
        <div
          className="font-mono text-[11.5px] uppercase tracking-[.1em] mb-3.5 inline-flex items-center gap-2"
          style={{ color: eyebrowColor }}
        >
          {eyebrow}
        </div>
        <h2
          className="font-bold mb-3 leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(27px,3.3vw,38px)', letterSpacing: '-0.02em', color: 'var(--color-text)' }}
        >
          {title}
        </h2>
        {desc && <p className="text-[15px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>{desc}</p>}
      </div>
    </ScrollReveal>
  )
}

// ─── HERO TYPING ─────────────────────────────────────────────────
const HERO_TEXTS = ['Your Real Projects.', 'Your GitHub Code.', 'Your Skills.']

const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } }

export default function Home() {
  const navigate = useNavigate()
  const typed = useTypingAnimation(HERO_TEXTS, 70)
  const { isAuthenticated } = useAuthStore()

  const CATEGORIES = [
    { icon: <Cpu size={18} strokeWidth={1.8} />, title: 'Code Quality', desc: 'Clean, readable, maintainable code analysis.', score: 82, color: 'var(--color-primary)', checks: ['Naming & readability', 'Function complexity', 'Duplication detection'] },
    { icon: <GitBranch size={18} strokeWidth={1.8} />, title: 'Architecture', desc: 'Project structure, patterns and design.', score: 76, color: 'var(--color-secondary)', checks: ['Folder structure', 'Separation of concerns', 'Design patterns used'] },
    { icon: <Shield size={18} strokeWidth={1.8} />, title: 'Security', desc: 'Vulnerability detection and best practices.', score: 71, color: 'var(--color-danger)', checks: ['Dependency vulnerabilities', 'Secrets & input handling', 'Auth best practices'] },
    { icon: <BarChart2 size={18} strokeWidth={1.8} />, title: 'Performance', desc: 'Efficiency, complexity and optimization.', score: 79, color: 'var(--color-warning)', checks: ['Algorithmic complexity', 'Bundle & query efficiency', 'Render/runtime cost'] },
    { icon: <FileText size={18} strokeWidth={1.8} />, title: 'Documentation', desc: 'Comments, README quality and clarity.', score: 68, color: 'var(--color-success)', checks: ['README completeness', 'Inline comments', 'API/usage docs'] },
    { icon: <Star size={18} strokeWidth={1.8} />, title: 'Best Practices', desc: 'Industry standards and coding conventions.', score: 85, color: 'var(--color-purple)', checks: ['Linting & formatting', 'Testing coverage', 'Convention adherence'] },
  ]

  const FLOW = [
    { icon: <GitBranch size={20} strokeWidth={1.8} />, title: 'Submit Your GitHub Project', desc: 'Share your repository URL or upload a ZIP file. Our AI reads your code instantly.' },
    { icon: <Zap size={20} strokeWidth={1.8} />, title: 'AI Evaluates Your Code', desc: 'Get detailed feedback on code quality, architecture, security, and best practices in 2–3 minutes.' },
    { icon: <Award size={20} strokeWidth={1.8} />, title: 'Earn a Verifiable Certificate', desc: 'Download your PDF certificate and share it on LinkedIn with a unique verification URL.' },
  ]

  const TRACKS = [
    { sub: 'Project Evaluation Certificate', title: 'ProjCert', color: 'var(--color-primary)',
      desc: 'Submit any project for AI evaluation. Get detailed scoring across 6 categories, identify bugs, and earn a certificate for projects scoring ≥40/100.',
      feats: ['Code quality analysis', 'Architecture review', 'Security audit', 'Performance insights', 'Bug detection', 'PDF certificate'],
      cta: 'Submit a Project', href: '/submit' },
    { sub: 'Verified Skill Certificate', title: 'SkillCert', color: 'var(--color-secondary)',
      desc: 'Prove your domain mastery with a two-phase exam. Phase 1: 25 MCQs in 45 min. Phase 2: AI-generated questions about YOUR submitted project code.',
      feats: ['25 MCQ questions', 'Project code analysis', 'Proctored examination', 'Anti-cheat monitoring', 'Instant results', 'Premium certificate'],
      cta: 'Take an Exam', href: '/exam' },
  ]

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--color-bg)' }}>
      <div className="bg-grid-overlay" />
      <div className="hero-glow" />
      <ScrollGlowBackground />
      <div className="super-glow" />

      <DevBotCharacter />

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden" style={{ zIndex: 1 }}>
        <div className="max-w-[1320px] mx-auto flex flex-col lg:flex-row items-center gap-[60px]">
          {/* hero left */}
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="flex-[1.1] min-w-0 text-center lg:text-left">
            <span
              className="font-mono inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{ color: 'var(--color-primary)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
            >
              <Zap size={12} /> AI-Powered Code Evaluation
            </span>

            <h1
              className="font-bold leading-[1.06] mb-2.5"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(36px,5vw,60px)', letterSpacing: '-0.03em', color: 'var(--color-text)' }}
            >
              Get AI-Certified by
            </h1>
            <div
              className="font-bold mb-[22px] min-h-[1.2em] leading-[1.06]"
              style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(36px,5vw,60px)', letterSpacing: '-0.03em',
                backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}
            >
              {typed}
              <span
                className="inline-block w-[5px] h-[0.85em] ml-[3px] align-[-0.08em]"
                style={{ background: 'var(--color-primary)', animation: 'heroBlink 1s step-end infinite' }}
              />
            </div>

            <p className="text-[16.5px] leading-relaxed max-w-[490px] mb-8 mx-auto lg:mx-0" style={{ color: 'var(--color-muted)' }}>
              Submit your GitHub project, get a detailed AI evaluation in minutes, and earn a verifiable certificate that proves your skills to employers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start flex-wrap">
              <Button size="lg" onClick={() => navigate('/submit')}>Submit a Project <ArrowRight size={18} /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/exam')}>Take Skill Exam</Button>
            </div>
            <p className="mt-4 text-[12.5px]" style={{ color: 'var(--color-muted)' }}>Free to start · No credit card required</p>

            <div className="flex gap-[34px] mt-[46px] flex-wrap justify-center lg:justify-start">
              {[['3', 'Steps to certified'], ['2–3 min', 'AI evaluation time'], [String(DOMAINS.length), 'Domains supported']].map(([b, s]) => (
                <div key={s}>
                  <b className="font-mono text-[21px] block" style={{ color: 'var(--color-text)' }}>{b}</b>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{s}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* hero right — 3D domain stack */}
          <div className="flex-1 w-full flex justify-center relative">
           
            <HeroDomainStack />
          </div>
        </div>
      </section>
 {/* <Hero3DObject /> */}
      {/* Ad */}
      <div className="flex justify-center py-4" style={{ position: 'relative', zIndex: 1 }}>
        <AdBanner slot="topBanner" size="banner" />
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-[130px] px-4" style={{ position: 'relative', zIndex: 1 }}>
        <div className="max-w-6xl mx-auto">
          <SectionHead eyebrow="The pipeline" title="Get certified in 3 simple steps" desc="Every submission moves through the same sequence, so every certificate means the same thing to every employer reading it." />

          <div className="relative">
            <div className="hidden md:block absolute top-[46px] left-[14%] right-[14%] h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--color-border) 15%, var(--color-border) 85%, transparent)' }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[26px] relative z-[1]">
              {FLOW.map((item, i) => (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <div
                    className="p-7 rounded-2xl h-full transition-all hover:-translate-y-1 glow-card"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', '--glow-card-color': 'var(--color-primary)' } as React.CSSProperties}
                  >
                    <div
                      className="w-11 h-11 rounded-[10px] flex items-center justify-center mb-5"
                      style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
                    >
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-2.5" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)' }}>{item.title}</h3>
                    <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TUTORIAL WALKTHROUGH ── */}
      <section className="py-[70px] pb-[130px] px-4" style={{ position: 'relative', zIndex: 1 }}>
        <div className="max-w-[1000px] mx-auto">
          <SectionHead eyebrow="Watch it happen" title="Submit → Evaluate → Certify" desc="The same flow every project goes through, end to end." />
          <ScrollReveal>
            <TutorialWalkthrough />
          </ScrollReveal>
        </div>
      </section>

      {/* ── WHAT GETS ANALYZED ── */}
      <section id="evaluate" className="py-[30px] pb-[120px] px-4" style={{ position: 'relative', zIndex: 1 }}>
        <div className="max-w-6xl mx-auto">
          <SectionHead eyebrow="Live evaluation" title="6 categories. Real feedback. No fluff." desc="No black box. Every metric is broken out so you know precisely what to improve." />

          <ScrollReveal>
            <EvalPanel
              radials={[
                { label: 'Code Quality', value: 82, color: 'var(--color-primary)' },
                { label: 'Architecture', value: 76, color: 'var(--color-secondary)' },
              ]}
              bars={[
                { label: 'SECURITY', value: 71, color: 'var(--color-danger)' },
                { label: 'PERF', value: 79, color: 'var(--color-warning)' },
                { label: 'DOCS', value: 68, color: 'var(--color-success)' },
                { label: 'PRACTICE', value: 85, color: 'var(--color-purple)' },
              ]}
              overall={77}
            />
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {CATEGORIES.map((cat, i) => (
              <ScrollReveal key={i} delay={i * 0.06}>
                <CategoryFlipCard
                  icon={cat.icon}
                  title={cat.title}
                  desc={cat.desc}
                  score={cat.score}
                  color={cat.color}
                  checks={cat.checks}
                  delay={i * 0.15}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO TRACKS ── */}
      <section id="tracks" className="py-[30px] pb-[120px] px-4" style={{ position: 'relative', zIndex: 1 }}>
        <div className="max-w-[1100px] mx-auto">
          <SectionHead eyebrow="Two ways to certify" title="Choose the path that fits your goals" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRACKS.map((track, i) => (
              <ScrollReveal key={i} delay={i * 0.12}>
                <div
                  className="p-[30px] rounded-[18px] relative overflow-hidden h-full glow-card"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', '--glow-card-color': track.color } as React.CSSProperties}
                >
                  <div
                    className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full opacity-50"
                    style={{ background: track.color, filter: 'blur(60px)', transform: 'translate(40%,-40%)' }}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[.08em]" style={{ color: 'var(--color-muted)' }}>{track.sub}</span>
                  <div className="font-bold text-2xl mt-1.5 mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: track.color }}>{track.title}</div>
                  <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: 'var(--color-muted)' }}>{track.desc}</p>
                  <ul className="flex flex-col gap-[9px] mb-6">
                    {track.feats.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-[13.5px]" style={{ color: 'var(--color-text)' }}>
                        <Check size={14} style={{ color: track.color }} className="flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => navigate(track.href)} style={{ backgroundColor: track.color }} className="w-full">
                    {track.cta} <ArrowRight size={16} />
                  </Button>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNDER THE HOOD — BUILD TOWER ── */}
      <section className="py-[30px] pb-[140px] px-4 max-w-[1000px] mx-auto text-center" style={{ position: 'relative', zIndex: 1 }}>
        <SectionHead eyebrow="Under the hood" title="Every project becomes a structure we can score" desc="DevCert decomposes a repo into layers — quality, architecture, security, docs — and stacks them into one certified result." />
        <ScrollReveal>
          <BuildTower />
        </ScrollReveal>
        <p className="font-mono text-xs mt-[26px]" style={{ color: 'var(--color-muted)' }}>repo → quality → architecture → security → certified score</p>
      </section>

      {/* ── DOMAINS ── */}
      <section id="domains" className="py-20 px-4" style={{ position: 'relative', zIndex: 1, background: 'color-mix(in srgb, var(--color-surface) 50%, transparent)' }}>
        <div className="max-w-6xl mx-auto">
          <SectionHead eyebrow="Supported domains" title="Get certified across every track" desc="Seven domains, each with its own evaluation profile and average score baseline." />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {DOMAINS.map((domain, i) => {
              const Icon = domain.icon || Monitor
              return (
                <ScrollReveal key={domain.id} delay={i * 0.07}>
                  <motion.div whileHover={{ y: -4 }}>
                    <div
                      className="p-6 rounded-2xl cursor-pointer transition-all glow-card"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', '--glow-card-color': domain.color } as React.CSSProperties}
                      onClick={() => navigate('/submit')}
                    >
                      <div
                        className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center mb-3.5"
                        style={{ background: `color-mix(in srgb, ${domain.color} 15%, transparent)`, color: domain.color }}
                      >
                        <Icon size={20} strokeWidth={1.8} />
                      </div>
                      <h3 className="font-semibold text-[16px] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)' }}>{domain.name}</h3>
                      <p className="text-xs mb-3.5" style={{ color: 'var(--color-muted)' }}>{domain.description}</p>
                      <ScoreMeter score={domain.avgScore} color={domain.color} />
                    </div>
                  </motion.div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING — only for guests ── */}
      {!isAuthenticated && (
        <section id="pricing" className="py-20 px-4" style={{ position: 'relative', zIndex: 1 }}>
          <div className="max-w-5xl mx-auto">
            <SectionHead eyebrow="Simple pricing" title="Start free, upgrade when you need more" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PRICING_PLANS.map((plan, i) => (
                <ScrollReveal key={plan.id} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="relative rounded-2xl p-6 h-full flex flex-col transition-all glow-card"
                    style={{
                      border: plan.highlighted ? '1px solid color-mix(in srgb, var(--color-primary) 45%, transparent)' : '1px solid var(--color-border)',
                      background: plan.highlighted ? 'linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 8%, transparent), var(--color-surface))' : 'var(--color-surface)',
                      '--glow-card-color': plan.highlighted ? 'var(--color-primary)' : 'var(--color-secondary)',
                    } as React.CSSProperties}
                  >
                    {plan.highlighted && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium text-[var(--color-inverse)] font-mono"
                        style={{ background: 'var(--color-primary)' }}
                      >
                        Most Popular
                      </div>
                    )}
                    <h3 className="font-bold text-lg mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)' }}>{plan.name}</h3>
                    <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>{plan.description}</p>
                    <div className="flex items-end gap-1 mb-6">
                      <span className="font-bold text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)' }}>₹{plan.price}</span>
                      {plan.period && <span className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>{plan.period}</span>}
                    </div>
                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                          <Check size={13} style={{ color: 'var(--color-success)' }} className="flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant={plan.highlighted ? 'primary' : 'outline'} onClick={() => navigate(plan.price === 0 ? '/auth/register' : '/pricing')}>{plan.cta}</Button>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4" style={{ position: 'relative', zIndex: 1, background: 'color-mix(in srgb, var(--color-surface) 50%, transparent)' }}>
        <div className="max-w-5xl mx-auto">
          <SectionHead eyebrow="Trusted by developers" title="What certified devs are saying" desc="Drag the stack, or let it cycle on its own." />
          <TestimonialsCarousel />
        </div>
      </section>

      {/* ── FOR RECRUITERS / ABOUT HIRING ── */}
      <section className="py-[80px] pb-[120px] px-4" style={{ position: 'relative', zIndex: 1 }}>
        <div className="max-w-[1100px] mx-auto">
          <ScrollReveal>
            <div className="max-w-[640px] mx-auto mb-[52px] text-center">
              <div className="font-mono text-[11.5px] uppercase tracking-[.1em] mb-3.5 inline-flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                For Recruiters
              </div>
              <h2 className="font-bold mb-3 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(27px,3.3vw,38px)', letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
                Hire verified developers. No resume sifting.
              </h2>
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                Post a role, set your criteria, and DevCert's AI pipeline handles screening, assignments, and assessment —
                delivering a ranked shortlist of real candidates, not keyword matches.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: '🎯',
                title: 'Profile-based screening',
                desc: 'AI scores every applicant against your role requirements using their structured profile — skills, experience, education — not just CV text formatting.',
              },
              {
                icon: '💻',
                title: 'Real assignments, AI-graded',
                desc: 'Shortlisted candidates submit a real project. Our AI evaluates code quality, architecture, and completeness — no manual review needed from your team.',
              },
              {
                icon: '🏆',
                title: 'Ranked shortlist, ready to hire',
                desc: 'Weighted scoring across all pipeline stages produces a final ranked list with AI summaries. Rejected candidates get specific, honest feedback automatically.',
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div
                  className="p-6 rounded-2xl h-full"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-[16px] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)' }}>
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.2}>
            <div className="rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
              style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 8%, transparent), var(--color-surface))', border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
              <div>
                <h3 className="font-bold text-xl mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)' }}>
                  Ready to find your next developer?
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Post a role free. AI-screened, assignment-tested, ranked candidates — delivered automatically.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/hiring')}
                style={{ flexShrink: 0 }}
              >
                Start Hiring Free <ArrowRight size={16} />
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-[140px] px-4 text-center" style={{ position: 'relative', zIndex: 1 }}>
        <div
          className="font-mono text-[11.5px] uppercase tracking-[.1em] mb-[18px] inline-flex items-center gap-2 justify-center"
          style={{ color: 'var(--color-secondary)' }}
        >
          Ready when you are
        </div>
        <h2
          className="font-bold mb-[18px]"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(30px,4.4vw,50px)', letterSpacing: '-.02em', color: 'var(--color-text)' }}
        >
          Your next project could<br />be your next certificate.
        </h2>
        <p className="text-[15.5px] mb-[34px]" style={{ color: 'var(--color-muted)' }}>Upload it. Let the AI do the reviewing.</p>
        <Button size="lg" onClick={() => navigate('/submit')}>Submit a Project <ArrowRight size={18} /></Button>
      </section>

      <Footer />

      <style>{`@keyframes heroBlink { 50% { opacity: 0; } }`}</style>
    </div>
  )
}
// About.tsx – Proeva brand, full‑width professional layout
import { Users, Target, Shield, ThumbsUp, Award, Globe, Zap, BarChart3, Code, Brain, Rocket, ExternalLink } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useState } from 'react'

export default function About() {
  const [imgError, setImgError] = useState(false)

  // Stats data
const stats = [
  { label: 'Certified Developers', value: '1,000+', icon: Award },
  { label: 'Projects Reviewed', value: '1,000+', icon: Code },
  { label: 'Average Rating', value: '4.5/5', icon: BarChart3 },
  { label: 'Satisfaction Rate', value: '98%', icon: ThumbsUp }, // ← new
]

  // Core values
  const values = [
    { icon: Shield, title: 'Trust & Transparency', desc: 'Every evaluation is objective, consistent, and openly documented.' },
    { icon: Zap, title: 'Speed & Agility', desc: 'We move fast—get your results in days, not weeks.' },
    { icon: Brain, title: 'Practical Intelligence', desc: 'We test what you actually do on the job, not theory.' },
    { icon: Rocket, title: 'Career Acceleration', desc: 'A Proeva certificate opens doors to top companies worldwide.' },
  ]

  // How it works steps
  const steps = [
    { number: '01', title: 'Submit a Project', desc: 'Share a real piece of your work—open source, a side project, or a work sample.' },
    { number: '02', title: 'AI + Human Review', desc: 'Our hybrid engine analyzes code quality, architecture, and problem-solving.' },
    { number: '03', title: 'Get Your Report', desc: 'Receive a detailed scorecard with strengths, growth areas, and a verifiable certificate.' },
  ]

  return (
    <PageWrapper className="bg-white">
      {/* ─── HERO – full width with background image ─── */}
      <section className="relative w-full min-h-[600px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-white w-full">
          <div className="max-w-3xl">
            <div className="inline-block bg-blue-500/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-blue-200 border border-blue-400/30 mb-4">
              Welcome to Proeva
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 tracking-tight">
              About Proeva
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-2xl">
              Making developer skills visible, verifiable, and valued—beyond the résumé.
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/20">
                <Award size={18} className="text-blue-400" /> 1,000+ certified
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/20">
                <Globe size={18} className="text-blue-400" /> World wide
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MISSION – light background ─── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-start gap-6">
            <div className="p-3 bg-blue-100 rounded-full shrink-0 mt-1">
              <Target size={28} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                We believe that what you build says more about you than any credential ever could. Yet for too long, developers have been judged by degrees, years of experience, or keyword-stuffed résumés—all poor proxies for actual ability. <strong>Proeva</strong> flips that. We evaluate real projects, test practical skills, and issue verifiable certificates that prove you can ship quality code. Our goal is to create a world where talent is discovered through demonstrated work, not filtered out by outdated filters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS – full width with gradient background ─── */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <stat.icon size={36} className="mx-auto mb-3 text-blue-200" />
                <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
                <div className="text-sm text-blue-100 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS – plain light background ─── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How Proeva Works</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
            A simple, transparent process that turns your code into a career‑boosting credential.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="bg-gray-50 p-8 relative">
                <div className="text-5xl font-extrabold text-blue-100 absolute top-2 right-4 select-none">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CORE VALUES – alternating background ─── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Why Proeva</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
            We’re built on principles that ensure fairness, speed, and real‑world relevance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, idx) => (
              <div key={idx} className="bg-white p-6 flex gap-4">
                <div className="p-2 bg-blue-50 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                  <value.icon size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{value.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TEAM / CULTURE – full width image grid ─── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-center text-gray-900 mb-8">Meet the Proeva Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop&crop=face',
              'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&h=400&fit=crop&crop=face',
              'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=400&fit=crop&crop=face',
              'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&crop=face',
            ].map((src, idx) => (
              <div key={idx} className="aspect-[4/3] bg-gray-200 overflow-hidden">
                <img
                  src={src}
                  alt={`Proeva team ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                />
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-4">
            A diverse group of engineers, designers, and hiring experts.
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA – dark background ─── */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to showcase your skills?</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of developers who have turned their code into career opportunities with Proeva.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 transition rounded-full font-medium"
            >
              Get Started <Rocket size={18} />
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 transition rounded-full font-medium border border-white/20"
            >
              Contact Us <ExternalLink size={18} />
            </a>
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}
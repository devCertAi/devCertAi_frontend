import { Users, Target, Shield, Sparkles } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'

export default function About() {
  return (
    <PageWrapper className="bg-[var(--color-bg)]">
      <div className="max-w-4xl mx-auto px-6 py-16">

        <div className="text-center mb-14">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-4">About DevCert</h1>
          <p className="text-[var(--color-muted)] text-base max-w-2xl mx-auto leading-relaxed">
            DevCert helps developers prove what they can build. We combine AI-powered project
            evaluation with skills-based certification, so your work speaks for itself.
          </p>
        </div>

        <Card className="p-8 mb-8">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Our Mission</h2>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            Traditional resumes and credentials often fail to capture what a developer can actually
            do. DevCert was built to close that gap. By evaluating real projects and testing practical
            skills, we give developers a way to demonstrate their abilities objectively, and give
            employers a faster, more reliable signal of who can deliver.
          </p>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]">
                <Target size={18} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">What We Do</h3>
            </div>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              We evaluate developer projects using AI-assisted review, run practical skills exams,
              and issue verifiable certificates that reflect real, demonstrated ability.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] text-[var(--color-success)]">
                <Shield size={18} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Why It Matters</h3>
            </div>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              Skills change faster than degrees can keep up with. Our evaluations are built to
              reflect current, practical, job-relevant ability rather than credentials alone.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--color-secondary)_12%,transparent)] text-[var(--color-secondary)]">
                <Sparkles size={18} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">How We Evaluate</h3>
            </div>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              Every submission is assessed against clear, consistent criteria covering code
              quality, architecture, and problem-solving, supported by AI review and periodic
              human oversight.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-warning)]">
                <Users size={18} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Who We Serve</h3>
            </div>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              Developers looking to prove their skills, and employers looking to hire with
              confidence. DevCert is built to serve both sides of that relationship fairly.
            </p>
          </Card>
        </div>

        <Card className="p-8">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Get in Touch</h2>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            Have questions about DevCert, partnerships, or how our certification process works?
            Visit our <a href="/contact" className="text-[var(--color-primary)] hover:underline">Contact</a> page
            and we'll get back to you.
          </p>
        </Card>

      </div>
    </PageWrapper>
  )
}

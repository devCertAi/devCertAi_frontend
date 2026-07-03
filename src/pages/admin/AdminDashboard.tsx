import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, FolderOpen, Award, DollarSign, Briefcase, Building2,
  CheckCircle, Clock, TrendingUp, FileText, BarChart2, Activity,
  UserCheck, AlertTriangle
} from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import api from '@/services/api'

interface Stats {
  userCount: number
  recruiterCount: number
  projectCount: number
  certCount: number
  examCount: number
  passRate: number
  revenue: number
  recruiting: {
    totalCompanies: number
    verifiedCompanies: number
    pendingVerifications: number
    activePostingsCount: number
    totalApplications: number
    totalHired: number
    avgConversionRate: number
    topMissingSkillsPlatformWide: { skill: string; count: number }[]
  }
}

function StatCard({
  title, value, sub, icon, color, href
}: {
  title: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
  href?: string
}) {
  const inner = (
    <Card className="p-5 flex items-start gap-4 hover:shadow-md transition-shadow cursor-default">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted)' }}>{title}</p>
        <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{sub}</p>}
      </div>
    </Card>
  )
  return href ? <Link to={href}>{inner}</Link> : inner
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-muted)' }}>{title}</h2>
      {children}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const r = stats?.recruiting

  if (loading) return (
    <PageWrapper>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    </PageWrapper>
  )

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-16 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Admin Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Platform-wide overview</p>
        </div>

        {/* ── Users & Platform ── */}
        <Section title="Users & Platform">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Users" value={stats?.userCount ?? '—'}
              sub="students / admins"
              icon={<Users size={18} />} color="var(--color-primary)" href="/admin/users"
            />
            <StatCard
              title="Recruiters" value={stats?.recruiterCount ?? '—'}
              sub="registered accounts"
              icon={<UserCheck size={18} />} color="var(--color-secondary)"
            />
            <StatCard
              title="Projects" value={stats?.projectCount ?? '—'}
              sub="submitted total"
              icon={<FolderOpen size={18} />} color="var(--color-warning)"
            />
            <StatCard
              title="Revenue" value={stats ? `₹${stats.revenue.toLocaleString('en-IN')}` : '—'}
              sub="from premium plans"
              icon={<DollarSign size={18} />} color="var(--color-success)"
            />
          </div>
        </Section>

        {/* ── Certifications & Exams ── */}
        <Section title="Certifications & Exams">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Certificates Issued" value={stats?.certCount ?? '—'}
              icon={<Award size={18} />} color="var(--color-success)"
            />
            <StatCard
              title="Exams Completed" value={stats?.examCount ?? '—'}
              icon={<FileText size={18} />} color="var(--color-primary)"
            />
            <StatCard
              title="Pass Rate" value={stats ? `${stats.passRate}%` : '—'}
              sub="of completed exams"
              icon={<TrendingUp size={18} />} color="var(--color-warning)"
            />
          </div>
        </Section>

        {/* ── Recruiting ── */}
        <Section title="Recruiting Pipeline">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard
              title="Companies" value={r?.totalCompanies ?? '—'}
              sub={r ? `${r.verifiedCompanies} verified` : undefined}
              icon={<Building2 size={18} />} color="var(--color-secondary)" href="/admin/companies"
            />
            <StatCard
              title="Pending Verification" value={r?.pendingVerifications ?? '—'}
              sub="awaiting review"
              icon={<Clock size={18} />} color="var(--color-warning)" href="/admin/companies"
            />
            <StatCard
              title="Active Postings" value={r?.activePostingsCount ?? '—'}
              sub="live job postings"
              icon={<Briefcase size={18} />} color="var(--color-primary)"
            />
            <StatCard
              title="Total Applications" value={r?.totalApplications ?? '—'}
              sub={r ? `${r.totalHired} hired · ${r.avgConversionRate}% conversion` : undefined}
              icon={<BarChart2 size={18} />} color="var(--color-success)"
            />
          </div>

          {/* Top missing skills */}
          {r?.topMissingSkillsPlatformWide && r.topMissingSkillsPlatformWide.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={15} style={{ color: 'var(--color-warning)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Top Missing Skills (from rejected applications)
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.topMissingSkillsPlatformWide.map(({ skill, count }) => (
                  <div key={skill}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}>
                    {skill}
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Section>

        {/* ── Quick Links ── */}
        <Section title="Quick Actions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Manage Users', href: '/admin/users', icon: <Users size={16} />, color: 'var(--color-primary)' },
              { label: 'Verify Companies', href: '/admin/companies', icon: <CheckCircle size={16} />, color: 'var(--color-success)' },
              { label: 'Question Bank', href: '/admin/questions', icon: <FileText size={16} />, color: 'var(--color-secondary)' },
              { label: 'Queue Status', href: '/admin/queues', icon: <Activity size={16} />, color: 'var(--color-warning)' },
            ].map(({ label, href, icon, color }) => (
              <Link key={href} to={href}>
                <Card className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
                    {icon}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</span>
                </Card>
              </Link>
            ))}
          </div>
        </Section>

      </div>
    </PageWrapper>
  )
}
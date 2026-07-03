import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, Award, BarChart2, BookOpen, Plus, ClipboardList, AlertCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ProjectTable } from '@/components/dashboard/ProjectTable'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { StageTracker } from '@/components/applications/StageTracker'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DashboardStats, Application } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import api from '@/services/api'
import { DevBot as DevBotCharacter  } from '@/components/ui/Devbot'
import { CreditWidget } from '@/components/credits/CreditWidget'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboard = () => {
    api.get('/users/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))

    api.get('/applications', { params: { limit: 5 } })
      .then(({ data }) => setApplications(data.data.applications || []))
      .catch(() => {})
  }

  useEffect(() => { fetchDashboard() }, [])

  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-39">
      <div className="px-10 pt-8 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-[var(--color-muted)] text-sm mt-1">Here's what's happening with your projects</p>
          </div>
          <Link to="/submit"><Button size="sm"><Plus size={15} /> New Project</Button></Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Projects"     value={stats?.stats?.projectCount ?? '—'} icon={<FolderOpen size={20} />} color="var(--color-primary)" />
          <StatsCard title="Certificates" value={stats?.stats?.certCount ?? '—'}    icon={<Award size={20} />}      color="var(--color-success)" />
          <StatsCard title="Avg Score"    value={stats?.stats?.avgScore ? `${stats.stats.avgScore}/100` : '—'} icon={<BarChart2 size={20} />} color="var(--color-secondary)" />
          <StatsCard title="Exams Taken"  value={stats?.stats?.examCount ?? '—'}    icon={<BookOpen size={20} />}   color="var(--color-warning)" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-[var(--color-text)]">Recent Projects</h2>
                <Link to="/projects" className="text-xs text-[var(--color-primary)] hover:underline">View all →</Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map((i) => <div key={i} className="h-12 bg-[var(--color-surface2)] rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <ProjectTable
                  projects={stats?.recentProjects || []}
                  onDelete={(id) => {
                    setStats(prev => prev ? {
                      ...prev,
                      stats: prev.stats ? {
                        ...prev.stats,
                        projectCount: (prev.stats.projectCount ?? 1) - 1
                      } : prev.stats,
                      recentProjects: prev.recentProjects.filter(p => p.id !== id)
                    } : prev)
                  }}
                />
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <CreditWidget />
            <Card className="p-6 h-full">
              <h2 className="font-semibold text-[var(--color-text)] mb-5">Recent Activity</h2>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map((i) => <div key={i} className="h-8 bg-[var(--color-surface2)] rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <ActivityFeed items={stats?.recentActivity || []} />
              )}
            </Card>
          </div>
        </div>

        {/* Pending actions */}
        {!loading && (stats as any)?.pendingApplications?.length > 0 && (
          <div className="mt-6 space-y-2">
            {(stats as any).pendingApplications.map((app: any) => {
              const deadline = app.stage === 'assignment_sent' ? app.assignmentDeadlineAt : app.examWindowExpiresAt
              const label = app.stage === 'assignment_sent' ? 'Assignment due' : 'Assessment available'
              return (
                <Link key={app.id} to={`/dashboard`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[color-mix(in_srgb,var(--color-warning)_5%,transparent)] border border-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] hover:border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)] transition-colors">
                    <AlertCircle size={16} className="text-[var(--color-warning)] shrink-0" />
                    <p className="text-sm text-[var(--color-text)] flex-1">
                      {label} for <strong>{app.jobPosting?.title}</strong> at {app.jobPosting?.companyName}
                      {deadline && <span className="text-[var(--color-muted)]"> · by {formatRelativeTime(deadline)}</span>}
                    </p>
                    <ArrowRight size={14} className="text-[var(--color-muted)]" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* My Applications */}
        {!loading && applications.length > 0 && (
          <Card className="p-6 mt-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[var(--color-text)] flex items-center gap-2"><ClipboardList size={16} /> My Applications</h2>
            </div>
            <div className="space-y-5">
              {applications.map((app) => (
                <div key={app.id} className="pb-5 border-b border-[var(--color-border)] last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">{app.jobPosting?.title}</p>
                      <p className="text-xs text-[var(--color-muted)]">{app.jobPosting?.companyName}</p>
                    </div>
                    <Badge variant={app.status === 'selected' ? 'success' : app.status === 'rejected' ? 'danger' : 'info'}>
                      {app.status === 'in_progress' ? 'In Progress' : app.status === 'selected' ? 'Selected 🎉' : 'Not Selected'}
                    </Badge>
                  </div>
                  <StageTracker application={app} />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Submit a Project', desc: 'Get AI evaluation', href: '/submit', color: 'var(--color-primary)', icon: <FolderOpen size={18} /> },
            { label: 'Take an Exam',     desc: 'Prove your skills', href: '/exam',   color: 'var(--color-secondary)', icon: <BookOpen size={18} /> },
            { label: 'View Certificates',desc: 'Download & share',  href: '/certificates', color: 'var(--color-success)', icon: <Award size={18} /> },
          ].map((item) => (
            <Link key={item.href} to={item.href}>
              <motion.div whileHover={{ y: -2 }} className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl flex items-center gap-3 hover:border-[var(--color-border)] transition-colors">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${item.color}15`, color: item.color }}>{item.icon}</div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{item.label}</p>
                  <p className="text-xs text-[var(--color-muted)]">{item.desc}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
        <DevBotCharacter/>

      </div>
    </PageWrapper>
  )
}
import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, Users, Briefcase, Clock, AlertTriangle, ChevronRight, Trophy, CheckCircle2, PlusCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StatsCard } from '@/components/dashboard/StatsCard'
import  api  from '@/services/api'
import toast from 'react-hot-toast'

interface PostingSummary {
  id: string
  title: string
  status: string
  applicantCount: number
  conversionRate: number
  stalledCount: number
}

interface Overview {
  activePostingsCount: number
  totalApplicantsThisMonth: number
  totalHiredAllTime: number
  avgTimeToHireHours: number | null
  postings: PostingSummary[]
}

function formatDuration(hours: number | null) {
  if (hours == null) return '—'
  if (hours < 24) return `${hours}h`
  return `${(hours / 24).toFixed(1)}d`
}

export default function RecruiterDashboard() {
  const { user } = useAuthStore()
  const isRecruiterOrAdmin = user?.role === 'recruiter' || user?.role === 'admin'

  // Hard redirect if a student somehow lands here
  if (user && !isRecruiterOrAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/recruiter/overview')
      .then(r => setOverview(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <PageWrapper>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    </PageWrapper>
  )

  const topPostings = overview?.postings.slice(0, 5) || []
  const chartData = (overview?.postings || []).slice(0, 8).map(p => ({
    name: p.title.slice(0, 18) + (p.title.length > 18 ? '…' : ''),
    applicants: p.applicantCount,
    conversion: p.conversionRate
  }))

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Recruiting Overview</h1>
            <p style={{ color: 'var(--color-muted)' }}>Your hiring pipeline at a glance.</p>
          </div>
          <Link to="/recruiter/postings/new">
            <Button size="sm">+ Post a Job</Button>
          </Link>
        </div>

        {/* Top stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Active postings"
            value={overview?.activePostingsCount ?? 0}
            icon={<Briefcase size={18} />}
            color="var(--color-primary)"
          />
          <StatsCard
            title="Applicants this month"
            value={overview?.totalApplicantsThisMonth ?? 0}
            icon={<Users size={18} />}
            color="var(--color-primary)"
          />
          <StatsCard
            title="Total hired"
            value={overview?.totalHiredAllTime ?? 0}
            icon={<TrendingUp size={18} />}
            color="var(--color-success)"
          />
          <StatsCard
            title="Avg time-to-hire"
            value={formatDuration(overview?.avgTimeToHireHours ?? null)}
            icon={<Clock size={18} />}
            color="var(--color-warning)"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Needs attention */}
          <Card className="p-5" style={{ background: 'var(--color-surface)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Needs Attention</h2>
            {topPostings.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No postings yet. Create your first job posting to get started.</p>
            ) : (
              <div className="space-y-2">
                {topPostings.map(p => (
                  <Link
                    key={p.id}
                    to={`/recruiter/postings/${p.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-opacity-60 transition-colors group"
                    style={{ background: 'var(--color-surface2)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{p.title}</span>
                        {p.stalledCount > 0 && (
                          <Badge variant="warning" className="text-xs flex items-center gap-1">
                            <AlertTriangle size={10} /> {p.stalledCount} stalled
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {p.applicantCount} applicant{p.applicantCount !== 1 ? 's' : ''} · {p.conversionRate}% hired
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--color-muted)' }} className="group-hover:translate-x-0.5 transition-transform ml-2" />
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <Link to="/recruiter/postings" className="text-sm font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
                View all postings →
              </Link>
            </div>
          </Card>

          {/* Applicants per posting bar chart */}
          <Card className="p-5" style={{ background: 'var(--color-surface)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Applicants by Posting</h2>
            {chartData.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--color-text)' }}
                    itemStyle={{ color: 'var(--color-primary)' }}
                  />
                  <Bar dataKey="applicants" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}

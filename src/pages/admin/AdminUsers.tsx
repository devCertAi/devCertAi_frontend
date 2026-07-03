import { useEffect, useState } from 'react'
import { Search, Shield, Trash2, RefreshCw, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { User } from '@/types'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async (p = page, q = search) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (q) params.set('search', q)
      const { data } = await api.get(`/admin/users?${params}`)
      setUsers(data.data.users ?? [])
      setPagination(data.data.pagination ?? null)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load users'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers(1, '') }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(1, search) }, 400)
    return () => clearTimeout(t)
  }, [search])

  const promote = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole })
      setUsers(us => us.map(u => u.id === id ? { ...u, role: newRole } as User : u))
      toast.success(`User ${newRole === 'admin' ? 'promoted to admin' : 'demoted to user'}`)
    } catch {}
  }

  const banUser = async (id: string, name: string) => {
    if (!confirm(`Ban "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers(us => us.filter(u => u.id !== id))
      setPagination(p => p ? { ...p, total: p.total - 1 } : null)
      toast.success('User banned')
    } catch {}
  }

  const goToPage = (p: number) => {
    setPage(p)
    fetchUsers(p, search)
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>User Management</h1>
            {pagination && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
                {pagination.total.toLocaleString()} total users
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => fetchUsers(page, search)} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder="Search by name, email or username…"
          leftIcon={<Search size={15} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-4"
        />

        {/* Error */}
        {error && (
          <Card className="p-6 mb-4 text-center" style={{ borderColor: 'var(--color-danger)' }}>
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => fetchUsers(page, search)}>
              Try again
            </Button>
          </Card>
        )}

        {/* Table */}
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-[var(--color-border)]">
              <tr>
                {['User', 'Username', 'Role', 'Premium', 'Verified', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ background: 'var(--color-surface2)', width: j === 0 ? '140px' : '60px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      {search ? `No users matching "${search}"` : 'No users found'}
                    </p>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-[var(--color-surface2)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar
                          ? <img src={u.avatar} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                          : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}>
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                        }
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{u.name}</p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>@{u.username}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'admin' ? 'default' : u.role === 'recruiter' ? 'warning' : 'muted'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isPremium ? 'success' : 'muted'}>{u.isPremium ? 'Yes' : 'No'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isEmailVerified ? 'success' : 'danger'}>
                        {u.isEmailVerified ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{formatDate(u.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => promote(u.id, u.role)}>
                          <Shield size={13} />
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => banUser(u.id, u.name)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Page {pagination.page} of {pagination.pages} · {pagination.total} users
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                <ChevronLeft size={14} /> Prev
              </Button>
              <Button size="sm" variant="ghost" disabled={page >= pagination.pages} onClick={() => goToPage(page + 1)}>
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

      </div>
    </PageWrapper>
  )
}
import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import api from '@/services/api'

export default function AdminQueues() {
  const [queues, setQueues] = useState<any>({})
  const [loading, setLoading] = useState(true)

  const fetchQueues = () => {
    setLoading(true)
    api.get('/admin/queues').then(({ data }) => setQueues(data.data.queues || {})).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchQueues() }, [])

  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Queue Monitor</h1>
          <Button size="sm" variant="outline" onClick={fetchQueues} loading={loading}><RefreshCw size={14} /> Refresh</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(queues).map(([name, stats]: any) => (
            <Card key={name} className="p-5">
              <h3 className="font-semibold text-[var(--color-text)] mb-4 capitalize">{name.replace(/-/g, ' ')}</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[['Waiting', stats?.waiting || 0, 'var(--color-warning)'], ['Active', stats?.active || 0, 'var(--color-primary)'], ['Completed', stats?.completed || 0, 'var(--color-success)'], ['Failed', stats?.failed || 0, 'var(--color-danger)'], ['Delayed', stats?.delayed || 0, 'var(--color-muted)']].slice(0, 4).map(([label, val, color]) => (
                  <div key={label as string} className="p-3 bg-[var(--color-bg)] rounded-xl">
                    <p className="text-lg font-bold" style={{ color: color as string }}>{val as number}</p>
                    <p className="text-xs text-[var(--color-muted)]">{label as string}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
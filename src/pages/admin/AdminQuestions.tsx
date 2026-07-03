import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { DOMAINS } from '@/lib/constants'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface Question { id: string; domain: string; phase: number; level: string; question: string; type: string; isActive: boolean }

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ domain: '', phase: 1, level: 'Beginner', question: '', type: 'mcq', options: '', answer: '' })

  useEffect(() => {
    api.get('/admin/questions').then(({ data }) => setQuestions(data.data.questions || [])).catch(() => {})
  }, [])

  const addQuestion = async () => {
    try {
      const { data } = await api.post('/admin/questions', { ...form, options: form.options ? form.options.split('\n').filter(Boolean) : undefined })
      setQuestions((q) => [data.data.question, ...q])
      setShowAdd(false)
      toast.success('Question added')
    } catch {}
  }

  const deleteQuestion = async (id: string) => {
    try {
      await api.delete(`/admin/questions/${id}`)
      setQuestions((q) => q.filter((x) => x.id !== id))
      toast.success('Question deleted')
    } catch {}
  }

  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Question Bank</h1>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Question</Button>
        </div>

        <Card className="overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]">
            {questions.map((q) => (
              <div key={q.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-[var(--color-surface2)] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--color-text)] mb-1.5">{q.question}</p>
                  <div className="flex gap-2">
                    <Badge variant="muted">{q.domain}</Badge>
                    <Badge variant="info">Phase {q.phase}</Badge>
                    <Badge variant={q.level === 'Advanced' ? 'warning' : 'muted'}>{q.level}</Badge>
                  </div>
                </div>
                <Button size="sm" variant="danger" onClick={() => deleteQuestion(q.id)}><Trash2 size={13} /></Button>
              </div>
            ))}
          </div>
        </Card>

        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Question" size="lg">
          <div className="space-y-4">
            <Select label="Domain" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}>
              <option value="">Select domain</option>
              {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Phase" value={form.phase} onChange={(e) => setForm({ ...form, phase: Number(e.target.value) })}>
                <option value={1}>Phase 1 (MCQ)</option>
                <option value={2}>Phase 2 (Project)</option>
              </Select>
              <Select label="Level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {['Beginner', 'Intermediate', 'Advanced'].map((l) => <option key={l}>{l}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Question</label>
              <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} rows={3} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Options (one per line, for MCQ)</label>
              <textarea value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} rows={4} placeholder="Option A&#10;Option B&#10;Option C&#10;Option D" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none" />
            </div>
            <Input label="Correct Answer" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Exact text of correct option" />
            <Button onClick={addQuestion} className="w-full">Add Question</Button>
          </div>
        </Modal>
      </div>
    </PageWrapper>
  )
}
import { useState } from 'react'
import { Mail, MessageSquare, MapPin, Send, CheckCircle2 } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import api from '@/services/api'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      await api.post('/contact', form)
      setStatus('sent')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <PageWrapper className="bg-[var(--color-bg)]">
      <div className="max-w-4xl mx-auto px-6 py-16">

        <div className="text-center mb-14">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-4">Contact Us</h1>
          <p className="text-[var(--color-muted)] text-base max-w-2xl mx-auto leading-relaxed">
            Questions about your account, an evaluation, or a partnership? Send us a message
            and our team will respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">Email</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">support@devcert.com</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] text-[var(--color-success)] shrink-0">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">Support</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">We typically reply within 1–2 business days.</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--color-secondary)_12%,transparent)] text-[var(--color-secondary)] shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">Registered Office</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">Add your company's registered business address here.</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="p-8">
              {status === 'sent' ? (
                <div className="flex flex-col items-center text-center py-10">
                  <CheckCircle2 size={36} className="text-[var(--color-success)] mb-4" />
                  <h2 className="text-base font-semibold text-[var(--color-text)] mb-1">Message sent</h2>
                  <p className="text-sm text-[var(--color-muted)]">Thanks for reaching out — we'll get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--color-text)] mb-1.5 block">Name</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--color-text)] mb-1.5 block">Email</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text)] mb-1.5 block">Subject</label>
                    <input
                      required
                      value={form.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text)] mb-1.5 block">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                      placeholder="Tell us more..."
                    />
                  </div>
                  {status === 'error' && (
                    <p className="text-xs text-[var(--color-danger)]">Something went wrong. Please try again.</p>
                  )}
                  <Button type="submit" disabled={status === 'sending'}>
                    <Send size={15} /> {status === 'sending' ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </Card>
          </div>

        </div>
      </div>
    </PageWrapper>
  )
}

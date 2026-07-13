// Contact.tsx – Proeva contact page with email, form, and imagery
import { useState } from 'react'
import { Mail, Send, CheckCircle2, Phone, Globe, Briefcase , GitBranch, ImageOff } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import api from '@/services/api'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [imgError, setImgError] = useState(false)

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
    <PageWrapper className="bg-white">
      {/* Hero */}
      <section className="relative w-full min-h-[450px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1600&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-white w-full">
          <div className="max-w-3xl">
            <div className="inline-block bg-blue-500/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-blue-200 border border-blue-400/30 mb-4">
              Get in Touch
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4 tracking-tight">
              Contact Proeva
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-2xl">
              We'd love to hear from you. Reach out for support, partnerships, or just to say hello.
            </p>
          </div>
        </div>
      </section>

      {/* Email + Phone (no address, no map) */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
            {/* Email */}
            <div className="bg-white p-8 flex flex-col items-start">
              <div className="p-3 bg-blue-100 rounded-full mb-4">
                <Mail size={28} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
              <a
                href="mailto: hello@proeva.dev"
                className="text-2xl md:text-3xl font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                hello@proeva.dev
              </a>
              <p className="text-gray-500 text-sm mt-2">We aim to respond within 24 hours.</p>
              <div className="mt-4 flex gap-4">
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59H300M36.01 19.54h40.65l187.13 262.13h-40.66"/>
</svg>
                </a>
                <a href="" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Briefcase  size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <GitBranch size={20} />
                </a>
              </div>
            </div>

            {/* Phone */}
            {/* <div className="bg-white p-8 flex flex-col items-start">
              <div className="p-3 bg-green-100 rounded-full mb-4">
                <Phone size={28} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-xl font-medium text-gray-800">+1 (555) 123-4567</p>
              <p className="text-gray-500 text-sm mt-2">Mon–Fri, 9am–6pm UTC</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <Globe size={16} />
                <span>International support available</span>
              </div>
            </div> */}

          </div>
        </div>
      </section>

      {/* Form + decorative image (no address) */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-gray-50 p-8">
              {status === 'sent' ? (
                <div className="flex flex-col items-center text-center py-12">
                  <CheckCircle2 size={48} className="text-green-600 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Message sent!</h2>
                  <p className="text-gray-600">
                    Thanks for reaching out — we'll get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-2xl font-bold text-gray-900">Send a Message</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1.5">Name</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500 transition"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1.5">Email</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500 transition"
                        placeholder="jane@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1.5">Subject</label>
                    <input
                      required
                      value={form.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500 transition"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1.5">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500 transition resize-none"
                      placeholder="Tell us more..."
                    />
                  </div>
                  {status === 'error' && (
                    <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
                  )}
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Send size={16} /> {status === 'sending' ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            {/* Decorative image */}
            <div className="bg-gray-100 overflow-hidden flex items-center justify-center relative">
              {!imgError ? (
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&crop=center"
                  alt="Proeva team"
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400 p-8">
                  <ImageOff size={48} className="mb-2" />
                  <span>Team image</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
                <p className="text-lg font-semibold">We're a remote‑first team</p>
                <p className="text-sm text-gray-200">Based in San Francisco, but we work from everywhere.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-3">Let’s build better hiring together</h2>
          <p className="text-gray-300 text-lg mb-6">
            Whether you're a developer looking to validate your skills or an employer seeking reliable talent, we're here to help.
          </p>
          <a
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 transition rounded-full font-medium"
          >
            Get Started <Send size={18} />
          </a>
        </div>
      </section>
    </PageWrapper>
  )
}
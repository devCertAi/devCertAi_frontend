import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { PRICING_PLANS } from '@/lib/constants'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { refreshCredits, notifyCreditsUpdate } from '@/hooks/useCredits'

export default function Pricing() {
  const { user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState<string | null>(null)
  const navigate = useNavigate()

  // Filter out the recruiter plan
  const visiblePlans = PRICING_PLANS.filter(plan => plan.id !== 'recruiter')

  const loadRazorpay = () => new Promise<boolean>((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handlePayment = async (planId: string, amount: number) => {
    if (!isAuthenticated) {
      navigate('/auth/register')
      return
    }
    setLoading(planId)
    try {
      const ok = await loadRazorpay()
      if (!ok) {
        toast.error('Payment gateway failed to load')
        return
      }
      const { data: orderRes } = await api.post('/payments/create-order', { plan: planId })
      const order = orderRes.data // unwrap ApiResponse — matches convention used elsewhere (e.g. Submit.tsx)
      const options = {
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Proeva',
        description: `${planId} plan`,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: 'var(--color-primary)' },
        handler: async (response: any) => {
          try {
            const { data: verifyRes } = await api.post('/payments/verify', response)
            // Push the just-verified balance straight into the credits cache so
            // Dashboard doesn't show a stale (pre-payment) count on redirect.
            const credits = verifyRes?.data?.credits
            if (credits) notifyCreditsUpdate(credits)
            else await refreshCredits()
            toast.success('🎉 Credits added to your account!')
            navigate('/dashboard')
          } catch {
            // Payment succeeded on Razorpay's side but our /verify call failed
            // (bad signature, network drop, etc). Do NOT touch credits here —
            // the webhook is the fallback that will apply them once Razorpay
            // confirms capture server-to-server. Just tell the user.
            toast.error('Payment verification failed. If money was deducted, credits will be added automatically within a few minutes — contact support if not.')
          }
        },
        modal: {
          // Fires if the user closes the checkout without paying / payment fails.
          // No credit changes should ever happen on this path.
          ondismiss: () => {
            setLoading(null)
          },
        },
      }
      new (window as any).Razorpay(options).open()
    } finally {
      setLoading(null)
    }
  }

  // Table data (without recruiter column)
  const featureRows = [
    ['Project evaluation credits', '3/month', '+3', '+10', '+22', '+50'],
    ['Skill exam credits', '1/month', '+2', '+6', '+14', '+20'],
    ['Exam phases', 'Phase 1 only', 'Phase 1 + 2', 'Phase 1 + 2', 'Phase 1 + 2', 'Phase 1 + 2'],
    ['Evaluation detail', 'Basic', 'Full report', 'Full report', 'Full report', 'Full report'],
    ['PDF download', '✗', '✓', '✓', '✓', '✓'],
    ['LinkedIn sharing', '✗', '✗', '✓', '✓', '✓'],
    ['Ads shown', '✓', '✓', '✗ (No ads)', '✗ (No ads)', '✗ (No ads)'],
    ['Re-evaluations', '0', '3 per project', '3 per project', '10 per project', '10 per project'],
    ['Credit validity', '30-day reset', '30 days', '45 days', '60 days', '180 days'],
    ['API access', '✗', '✗', '✗', '✗', '✓'],
  ].map(([feat, ...vals]) => [feat, ...vals.slice(0, -1)]) // remove last value (recruiter)

  return (
    <div className="bg-[var(--color-bg)] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] rounded-full text-xs text-[var(--color-primary)] font-medium mb-4">
            <Zap size={12} /> Simple Pricing
          </span>
          <h1 className="text-4xl font-bold text-[var(--color-text)] mb-3">Invest in your career</h1>
          <p className="text-[var(--color-muted)] text-lg">Start free, upgrade when you need more power</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {visiblePlans.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div
                className={`relative rounded-2xl border p-7 h-full flex flex-col ${
                  plan.highlighted
                    ? 'border-[color-mix(in_srgb,var(--color-primary)_50%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] to-transparent'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 bg-[var(--color-primary)] rounded-full text-xs font-semibold text-[var(--color-inverse)] shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[var(--color-text)] mb-1">{plan.name}</h2>
                  <p className="text-xs text-[var(--color-muted)] mb-4">{plan.description}</p>
                  <div className="flex items-end gap-1">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold text-[var(--color-text)]">Free</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-[var(--color-text)]">
                          ₹{plan.price.toLocaleString('en-IN')}
                        </span>
                        {plan.period && (
                          <span className="text-[var(--color-muted)] mb-1 text-sm">{plan.period}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--color-muted)]">
                      <Check size={14} className="text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  size="lg"
                  loading={loading === plan.id}
                  onClick={() => {
                    if (plan.price === 0) {
                      navigate(isAuthenticated ? '/submit' : '/auth/register')
                    } else if (plan.id === 'recruiter') {
                      // This branch is kept for safety but the recruiter card is no longer rendered
                      toast('Contact us at hello@proeva.io')
                    } else {
                      handlePayment(plan.id, plan.razorpayAmount || 0)
                    }
                  }}
                >
                  {plan.cta}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature comparison */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h3 className="font-semibold text-[var(--color-text)]">Feature Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-muted)]">Feature</th>
                  {visiblePlans.map((plan) => (
                    <th key={plan.id} className="px-6 py-3 text-xs font-medium text-[var(--color-muted)]">
                      {plan.name}{plan.price > 0 ? ` ₹${plan.price}` : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {featureRows.map(([feat, ...vals], idx) => (
                  <tr key={feat} className="hover:bg-[var(--color-surface2)] transition-colors">
                    <td className="px-6 py-3 text-sm text-[var(--color-text)]">{feat}</td>
                    {vals.map((val, i) => (
                      <td key={i} className="px-6 py-3 text-sm text-[var(--color-muted)] text-center">
                        {val === '✓' ? (
                          <Check size={15} className="text-[var(--color-success)] mx-auto" />
                        ) : val === '✗' ? (
                          <span className="text-[var(--color-danger)]">✗</span>
                        ) : (
                          val
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
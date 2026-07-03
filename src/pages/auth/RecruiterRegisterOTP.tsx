import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, User, Eye, EyeOff, Building2, Globe,
  ArrowRight, CheckCircle, RotateCcw, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'
import toast from 'react-hot-toast'

// ── SessionStorage helpers ────────────────────────────────────────────────────
const OTP_KEY = 'recruiter_reg'
const saveOtpSession = (email: string) =>
  sessionStorage.setItem(OTP_KEY, JSON.stringify({ email }))
const loadOtpSession = () => {
  try { return JSON.parse(sessionStorage.getItem(OTP_KEY) || 'null') } catch { return null }
}
const clearOtpSession = () => sessionStorage.removeItem(OTP_KEY)

// ── Validators ────────────────────────────────────────────────────────────────
const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  companyWebsite: z.string().url('Enter a valid URL (e.g. https://acme.com)').optional().or(z.literal('')),
  industry: z.string().max(50).optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type Step1Input = z.infer<typeof step1Schema>

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education',
  'Media & Entertainment', 'Consulting', 'Manufacturing', 'Other',
]

function getPasswordStrength(p: string) {
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
}
const STRENGTH_COLORS = ['', 'var(--color-danger)', 'var(--color-warning)', 'var(--color-success)', 'var(--color-success)']
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

// ── OTP Input Component ───────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[index] = digit
    onChange(next)
    if (digit && index < 5) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputs.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      onChange(pasted.split(''))
      inputs.current[5]?.focus()
    }
    e.preventDefault()
  }

  return (
    <div className="flex gap-3 justify-center my-6">
      {[0,1,2,3,4,5].map(i => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-[var(--color-bg)] text-[var(--color-text)] transition-all focus:outline-none"
          style={{
            borderColor: value[i] ? 'var(--color-primary)' : 'var(--color-border)',
            boxShadow: value[i]
              ? '0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent)'
              : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RecruiterRegisterOTP() {
  const [step, setStep] = useState<1 | 2>(1)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [countdown, setCountdown] = useState(0)
  const [agreed, setAgreed] = useState(false)
  const navigate = useNavigate()

  const { recruiterLogin } = useAuthStore()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Step1Input>({
    resolver: zodResolver(step1Schema),
  })

  const password = watch('password', '')
  const strength = getPasswordStrength(password)

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ✅ Restore OTP step on refresh
  useEffect(() => {
    const saved = loadOtpSession()
    if (saved?.email) {
      setPendingEmail(saved.email)
      setStep(2)
    }
  }, [])

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const onStep1 = async (data: Step1Input) => {
    if (!agreed) { toast.error('Please accept the Terms of Service'); return }
    setLoading(true)
    try {
      await api.post('/auth/recruiter/register/send-otp', {
        name: data.name,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
        companyWebsite: data.companyWebsite || undefined,
        industry: data.industry || undefined,
      })
      setPendingEmail(data.email)
      saveOtpSession(data.email)
      setStep(2)
      setCountdown(60)
      toast.success('OTP sent! Check your email inbox.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const onVerifyOtp = async () => {
    const code = otp.join('')
    if (code.length < 6) { toast.error('Please enter all 6 digits'); return }

    // ✅ Guard: if email lost on refresh, send back to step 1
    if (!pendingEmail) {
      toast.error('Session expired, please register again')
      clearOtpSession()
      setStep(1)
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/recruiter/register/verify-otp', {
        email: pendingEmail,
        otp: code,
      })

      // ✅ Backend returns `recruiter`, not `user`
      const { accessToken, recruiter } = res.data.data

      // Goes through the store's single recruiterLogin action instead of
      // calling setToken/setUser/connectSocket/startRefreshTimer by hand.
      // The manual version here previously never set the cached role flag
      // and never added role:'recruiter' onto the user object — both of
      // which broke ProtectedRoute's recruiter check and the axios
      // refresh-token interceptor's endpoint selection right after signup.
      recruiterLogin(accessToken, recruiter)
      clearOtpSession()
      toast.success('Account created! Welcome to DevCert 🎉')
      navigate('/recruiter/dashboard', { replace: true })
    } catch (err: any) {
      console.error('OTP verify error:', err?.response?.data || err?.message)
      toast.error(err?.response?.data?.message || 'Verification failed. Please try again.')
      setOtp(Array(6).fill(''))
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ───────────────────────────────────────────────────────────────
  const onResend = async () => {
    if (countdown > 0) return
    setLoading(true)
    try {
      await api.post('/auth/recruiter/resend-otp', { email: pendingEmail, purpose: 'register' })
      setOtp(Array(6).fill(''))
      setCountdown(60)
      toast.success('New OTP sent!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[color-mix(in_srgb,var(--color-secondary)_4%,transparent)] rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-[var(--color-inverse)] font-bold text-sm">DC</span>
            </div>
            <span className="text-xl font-bold text-[var(--color-text)]">DevCert</span>
          </Link>

          <div className="flex items-center justify-center gap-3 mb-4">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: step >= s ? 'var(--color-primary)' : 'var(--color-surface2)',
                    color: step >= s ? 'var(--color-inverse)' : 'var(--color-muted)',
                  }}
                >
                  {step > s ? <CheckCircle size={14} /> : s}
                </div>
                {s < 2 && (
                  <div
                    className="w-10 h-0.5 transition-all"
                    style={{ background: step > s ? 'var(--color-primary)' : 'var(--color-border)' }}
                  />
                )}
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            {step === 1 ? 'Start hiring on DevCert' : 'Verify your email'}
          </h1>
          <p className="text-[var(--color-muted)] mt-1 text-sm">
            {step === 1
              ? 'Create your recruiter account with company profile'
              : `Enter the 6-digit code sent to ${pendingEmail}`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="p-6">
                <form onSubmit={handleSubmit(onStep1)} className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">
                      Your account
                    </p>
                    <div className="space-y-3">
                      <Input
                        label="Full Name"
                        placeholder="Jane Smith"
                        leftIcon={<User size={15} />}
                        error={errors.name?.message}
                        {...register('name')}
                      />
                      <Input
                        label="Work Email"
                        type="email"
                        placeholder="jane@acme.com"
                        leftIcon={<Mail size={15} />}
                        error={errors.email?.message}
                        {...register('email')}
                      />
                      <div>
                        <Input
                          label="Password"
                          type={showPass ? 'text' : 'password'}
                          placeholder="Min. 8 characters"
                          leftIcon={<Lock size={15} />}
                          rightIcon={
                            <button type="button" onClick={() => setShowPass(s => !s)}>
                              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          }
                          error={errors.password?.message}
                          {...register('password')}
                        />
                        {password && (
                          <div className="mt-2">
                            <div className="flex gap-1 mb-1">
                              {[1,2,3,4].map(i => (
                                <div
                                  key={i}
                                  className="h-1 flex-1 rounded-full transition-colors"
                                  style={{ backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : 'var(--color-surface2)' }}
                                />
                              ))}
                            </div>
                            <span className="text-xs" style={{ color: STRENGTH_COLORS[strength] }}>
                              {STRENGTH_LABELS[strength]}
                            </span>
                          </div>
                        )}
                      </div>
                      <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Same as above"
                        leftIcon={<Lock size={15} />}
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                      />
                    </div>
                  </div>

                  <div className="border-t border-[var(--color-border)]" />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">
                      Your company
                    </p>
                    <div className="space-y-3">
                      <Input
                        label="Company Name"
                        placeholder="Acme Inc."
                        leftIcon={<Building2 size={15} />}
                        error={errors.companyName?.message}
                        {...register('companyName')}
                      />
                      <Input
                        label="Company Website (optional)"
                        type="url"
                        placeholder="https://acme.com"
                        leftIcon={<Globe size={15} />}
                        error={errors.companyWebsite?.message}
                        {...register('companyWebsite')}
                      />
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                          Industry <span className="text-[var(--color-muted)] font-normal">(optional)</span>
                        </label>
                        <select
                          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                          {...register('industry')}
                        >
                          <option value="">Select industry…</option>
                          {INDUSTRIES.map(ind => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-start gap-3 p-3 rounded-xl text-sm"
                    style={{ background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
                  >
                    <ShieldCheck size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <p style={{ color: 'var(--color-primary)' }}>
                      We'll send a 6-digit OTP to your email to verify your account. No link-clicking required.
                    </p>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-primary)]"
                    />
                    <span className="text-xs text-[var(--color-muted)]">
                      I agree to the{' '}
                      <a href="#" className="text-[var(--color-primary)] hover:underline">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="text-[var(--color-primary)] hover:underline">Privacy Policy</a>
                    </span>
                  </label>

                  <Button type="submit" loading={loading} className="w-full" size="lg">
                    Send Verification Code <ArrowRight size={16} />
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}
                  >
                    <Mail size={12} />
                    {pendingEmail}
                  </div>
                </div>

                <p className="text-center text-sm text-[var(--color-muted)] mb-2">
                  Check your inbox and enter the 6-digit code below
                </p>

                <OtpInput value={otp} onChange={setOtp} />

                <Button
                  onClick={onVerifyOtp}
                  loading={loading}
                  disabled={otp.join('').length < 6}
                  className="w-full"
                  size="lg"
                >
                  Verify & Create Account
                </Button>

                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={countdown > 0 || loading}
                    className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-40"
                    style={{ color: countdown > 0 ? 'var(--color-muted)' : 'var(--color-primary)' }}
                  >
                    <RotateCcw size={13} />
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { clearOtpSession(); setStep(1); setOtp(Array(6).fill('')) }}
                  className="w-full mt-3 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  ← Back to registration form
                </button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          Already have an account?{' '}
          <Link to="/auth/recruiter-login" className="text-[var(--color-primary)] hover:text-[var(--color-primary-d)] font-medium transition-colors">
            Sign in as recruiter
          </Link>
          {' · '}
          <Link to="/auth/register" className="text-[var(--color-primary)] hover:text-[var(--color-primary-d)] font-medium transition-colors">
            Register as developer
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
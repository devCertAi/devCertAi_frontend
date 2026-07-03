/**
 * RecruiterLogin.tsx
 *
 * Dedicated recruiter login page with OTP second factor.
 *
 * Step 1 — Enter email + password → backend validates credentials, sends OTP
 * Step 2 — Enter 6-digit OTP → user logged in, redirected to /recruiter/dashboard
 *
 * Route: /auth/recruiter-login
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, Briefcase, RotateCcw, CheckCircle, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'
import toast from 'react-hot-toast'

// ── Validators ────────────────────────────────────────────────────────────────
const step1Schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type Step1Input = z.infer<typeof step1Schema>

// ── OTP Input (identical helper to RecruiterRegisterOTP) ──────────────────────
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
    if (e.key === 'ArrowLeft' && index > 0)  inputs.current[index - 1]?.focus()
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
export default function RecruiterLogin() {
  const [step, setStep] = useState<1 | 2>(1)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()
  const { recruiterLogin } = useAuthStore()

  const { register, handleSubmit, formState: { errors } } = useForm<Step1Input>({
    resolver: zodResolver(step1Schema),
  })

  // Countdown for OTP resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const onStep1 = async (data: Step1Input) => {
    setLoading(true)
    try {
      await api.post('/auth/recruiter/login/send-otp', {
        email: data.email,
        password: data.password,
      })
      setPendingEmail(data.email)
      setStep(2)
      setCountdown(60)
      toast.success('OTP sent! Check your email.')
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
    setLoading(true)
    try {
      const res = await api.post('/auth/recruiter/login/verify-otp', {
        email: pendingEmail,
        otp: code,
      })
      const { accessToken, recruiter } = res.data.data
      // Goes through the store's single recruiterLogin action — this is
      // what guarantees the token, the user object's `role` field, the
      // cached role flag (used to pick the right refresh endpoint), and
      // the socket connection all get set together, in one place, every
      // time. Calling setToken/setUser/startRefreshTimer separately here
      // (the old code) was exactly what let the role flag get missed.
      recruiterLogin(accessToken, recruiter)
      toast.success('Welcome back!')
      navigate('/recruiter/dashboard', { replace: true })
    } catch {
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
      await api.post('/auth/recruiter/resend-otp', { email: pendingEmail, purpose: 'login' })
      setOtp(Array(6).fill(''))
      setCountdown(60)
      toast.success('New OTP sent!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-[var(--color-inverse)] font-bold">DC</span>
            </div>
            <span className="text-xl font-bold text-[var(--color-text)]">DevCert</span>
          </Link>

          {/* Recruiter badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-medium"
            style={{
              background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              color: 'var(--color-primary)',
            }}
          >
            <Briefcase size={12} />
            Recruiter Portal
          </div>

          {/* Step indicator */}
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
            {step === 1 ? 'Recruiter sign in' : 'Verify your identity'}
          </h1>
          <p className="text-[var(--color-muted)] mt-1 text-sm">
            {step === 1
              ? 'Access your hiring dashboard'
              : `Enter the OTP sent to ${pendingEmail}`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Credentials ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="p-6">
                <form onSubmit={handleSubmit(onStep1)} className="space-y-4">
                  <Input
                    label="Work Email"
                    type="email"
                    placeholder="you@company.com"
                    leftIcon={<Mail size={15} />}
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <div>
                    <Input
                      label="Password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Your password"
                      leftIcon={<Lock size={15} />}
                      rightIcon={
                        <button type="button" onClick={() => setShowPass(!showPass)}>
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                      error={errors.password?.message}
                      {...register('password')}
                    />
                    <div className="flex justify-end mt-1.5">
                      <Link
                        to="/auth/forgot-password"
                        className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-d)] transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  {/* OTP notice */}
                  <div
                    className="flex items-start gap-3 p-3 rounded-xl text-sm"
                    style={{ background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
                  >
                    <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <p style={{ color: 'var(--color-primary)' }}>
                      After verifying credentials, a one-time code will be sent to your email for added security.
                    </p>
                  </div>

                  <Button type="submit" loading={loading} className="w-full" size="lg">
                    Continue
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 2: OTP entry ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="p-6">
                {/* Email chip */}
                <div className="flex items-center justify-center mb-4">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}
                  >
                    <Mail size={12} />
                    {pendingEmail}
                  </div>
                </div>

                <p className="text-center text-sm text-[var(--color-muted)]">
                  Enter your 6-digit verification code
                </p>

                <OtpInput value={otp} onChange={setOtp} />

                <Button
                  onClick={onVerifyOtp}
                  loading={loading}
                  disabled={otp.join('').length < 6}
                  className="w-full"
                  size="lg"
                >
                  Verify & Sign In
                </Button>

                {/* Resend */}
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
                  onClick={() => { setStep(1); setOtp(Array(6).fill('')) }}
                  className="w-full mt-3 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  ← Back
                </button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          New to DevCert?{' '}
          <Link
            to="/auth/register-recruiter"
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-d)] font-medium transition-colors"
          >
            Create a recruiter account
          </Link>
          {' · '}
          <Link
            to="/auth/login"
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-d)] font-medium transition-colors"
          >
            Developer login
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

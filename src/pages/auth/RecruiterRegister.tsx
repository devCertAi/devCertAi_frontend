import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Building2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import api from '@/services/api'
import toast from 'react-hot-toast'

// Validator mirrors backend registerRecruiterSchema
const recruiterRegisterSchema = z.object({
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

type RecruiterRegisterInput = z.infer<typeof recruiterRegisterSchema>

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education',
  'Media & Entertainment', 'Consulting', 'Manufacturing', 'Other',
]

export default function RecruiterRegister() {
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RecruiterRegisterInput>({
    resolver: zodResolver(recruiterRegisterSchema),
  })

  const password = watch('password', '')

  const getStrength = (p: string) => {
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }
  const strength = getStrength(password)
  const strengthColors = ['', 'var(--color-danger)', 'var(--color-warning)', 'var(--color-success)', 'var(--color-success)']
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  const onSubmit = async (data: RecruiterRegisterInput) => {
    setLoading(true)
    try {
      await api.post('/auth/register-recruiter', {
        name: data.name,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
        companyWebsite: data.companyWebsite || undefined,
        industry: data.industry || undefined,
      })
      toast.success('Account created! Check your email to verify.')
      navigate('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/assets/logo.svg" alt="Proeva" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text)]">Proeva</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Start hiring on Proeva</h1>
          <p className="text-[var(--color-muted)] mt-1 text-sm">Create your recruiter account and company profile</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Account details ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">Your account</p>
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
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-colors"
                            style={{ backgroundColor: i <= strength ? strengthColors[strength] : 'var(--color-surface2)' }}
                          />
                        ))}
                      </div>
                      <span className="text-xs" style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
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

            {/* ── Divider ── */}
            <div className="border-t border-[var(--color-border)]" />

            {/* ── Company details ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">Your company</p>
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

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                required
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
              Create recruiter account
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-[var(--color-primary)] hover:text-[var(--color-primary-d)] font-medium transition-colors">
            Sign in
          </Link>
          {' · '}
          <Link to="/auth/register" className="text-[var(--color-primary)] hover:text-[var(--color-primary-d)] font-medium transition-colors">
            Register as a developer
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Briefcase, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { loginSchema, LoginInput } from '@/lib/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'
// Google login disabled — no VITE_GOOGLE_CLIENT_ID configured

export default function Login() {
  const [showPass, setShowPass] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const stateFrom = (location.state as { from?: { pathname: string } })?.from?.pathname || null
  const queryNext = searchParams.get('next')
  const nextPath = queryNext || stateFrom

  const isApplyFlow = !!(nextPath && nextPath.includes('/apply/'))
  const isProfileFlow = !!(nextPath && nextPath.includes('/profile/'))
  const isExamFlow = !!(nextPath && nextPath.includes('/exam/'))


  useEffect(() => {
    let flagged = false
    try { flagged = sessionStorage.getItem('sessionExpiredNotice') === '1' } catch {}
    if (!flagged) return
    try { sessionStorage.removeItem('sessionExpiredNotice') } catch {}
    toast(
      isExamFlow
        ? 'Your session expired. Sign back in and you\u2019ll be returned right to your exam.'
        : 'Your session expired. Please sign back in.',
      { icon: '\u23F1\uFE0F' }
    )
  }, [isExamFlow])

  const resolveRedirect = (role?: string) => {
    if (role === 'admin') return '/admin'
    if (role === 'recruiter') return '/recruiter/dashboard'
    return nextPath || '/dashboard'
  }

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.email, data.password)
      const freshUser = useAuthStore.getState().user
      toast.success('Welcome back!')
      navigate(resolveRedirect(freshUser?.role), { replace: true })
    } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Invalid email or password')
    }
  }

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/assets/logo.svg" alt="Proeva" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text)]">Proeva</span>
          </Link>

          {isApplyFlow && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 text-xs font-medium"
              style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}>
              <Briefcase size={12} /> Sign in to complete your application
            </div>
          )}

          {isProfileFlow && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 text-xs font-medium"
              style={{ background: 'color-mix(in srgb, var(--color-warning) 10%, transparent)', color: 'var(--color-warning)' }}>
              <ArrowRight size={12} /> Sign in to continue to your profile
            </div>
          )}

          {isExamFlow && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 text-xs font-medium"
              style={{ background: 'color-mix(in srgb, var(--color-warning) 10%, transparent)', color: 'var(--color-warning)' }}>
              <ArrowRight size={12} /> Sign back in to resume your exam
            </div>
          )}

          <h1 className="text-2xl font-bold text-[var(--color-text)]">Welcome back</h1>
          <p className="text-[var(--color-muted)] mt-1 text-sm">Sign in to your account</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail size={15} />}
              error={errors.email?.message}
              {...register('email')}
            />
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

            <div className="flex justify-end">
              <Link
                to="/auth/forgot-password"
                className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-d)] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={isLoading} className="w-full" size="lg">
              Sign In
            </Button>
          </form>

        </Card>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          Don't have an account?{' '}
          <Link
            to={nextPath ? `/auth/register?next=${encodeURIComponent(nextPath)}` : '/auth/register'}
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-d)] font-medium transition-colors"
          >
            Sign up as developer
          </Link>
          {' · '}
          <Link to="/auth/register-recruiter">Hire with Proeva</Link>
        </p>
      </motion.div>
    </div>
  )
}
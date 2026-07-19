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
import { useGoogleLogin } from '@react-oauth/google'

export default function Login() {
  const [showPass, setShowPass] = useState(false)
  const { login, googleLogin, isLoading } = useAuthStore()
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

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await googleLogin(tokenResponse.access_token)
        const freshUser = useAuthStore.getState().user
        toast.success('Welcome!')
        navigate(resolveRedirect(freshUser?.role), { replace: true })
      } catch (err: any) {
        // The axios interceptor only handles 401 (silent refresh) — it
        // shows no message for anything else, so this must toast its own.
        toast.error(err?.response?.data?.message || 'Google login failed')
      }
    },
    onError: () => toast.error('Google login failed'),
  })

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

          <div className="mt-4 relative flex items-center">
            <div className="flex-1 border-t border-[var(--color-border)]" />
            <span className="mx-3 text-xs text-[var(--color-muted)]">or</span>
            <div className="flex-1 border-t border-[var(--color-border)]" />
          </div>

          <button
            type="button"
            onClick={() => handleGoogle()}
            className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
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
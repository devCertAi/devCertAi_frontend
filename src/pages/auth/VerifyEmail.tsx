import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'

type Status = 'verifying' | 'success' | 'error'

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { setToken, setUser, startRefreshTimer, isAuthenticated, isInitializing } = useAuthStore()
  const [status, setStatus] = useState<Status>('verifying')

  useEffect(() => {
    // If already authenticated (e.g. page refresh after successful verify),
    // skip re-calling the API (one-time token is already spent) and go to dashboard.
    if (!isInitializing && isAuthenticated) {
      setStatus('success')
      navigate('/dashboard', { replace: true })
      return
    }

    if (!token) { setStatus('error'); return }

    api.get(`/auth/verify-email/${token}`)
      .then(({ data }) => {
        // Save token + user into the store (same as login)
        setToken(data.data.accessToken)
        setUser(data.data.user)
        startRefreshTimer('user')
        setStatus('success')
        setTimeout(() => navigate('/dashboard', { replace: true }), 2500)
      })
      .catch(() => setStatus('error'))
  }, [token, isAuthenticated, isInitializing])

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/assets/logo.svg" alt="Proeva" className="w-full h-full object-cover" />
            </div>
          <span className="text-xl font-bold text-[var(--color-text)]">Proeva</span>
        </Link>

        {/* Verifying */}
        {status === 'verifying' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Loader size={52} className="mx-auto text-[var(--color-primary)] animate-spin mb-5" />
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Verifying your email…</h1>
            <p className="text-[var(--color-muted)] text-sm">Just a moment, please hang tight.</p>
          </motion.div>
        )}

        {/* Success */}
        {status === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <CheckCircle size={52} className="mx-auto text-[var(--color-success)] mb-5" />
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Email Verified!</h1>
            <p className="text-[var(--color-muted)] text-sm mb-6">
              Your account is ready. Redirecting you to the dashboard…
            </p>
            <Button onClick={() => navigate('/dashboard', { replace: true })} className="w-full" size="lg">
              Go to Dashboard
            </Button>
          </motion.div>
        )}

        {/* Error */}
        {status === 'error' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <XCircle size={52} className="mx-auto text-[var(--color-danger)] mb-5" />
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Link Invalid or Expired</h1>
            <p className="text-[var(--color-muted)] text-sm mb-6">
              This verification link has already been used or has expired.
              Please register again to get a new link.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/auth/register')} className="w-full" size="lg">
                Register Again
              </Button>
              <Button onClick={() => navigate('/auth/login')} variant="outline" className="w-full" size="lg">
                Back to Login
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
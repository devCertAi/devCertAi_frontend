import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft } from 'lucide-react'
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', data)
      setSent(true)
      toast.success('Reset link sent if that email exists')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center"><span className="text-[var(--color-inverse)] font-bold">DC</span></div>
            <span className="text-xl font-bold text-[var(--color-text)]">DevCert</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Forgot password?</h1>
          <p className="text-[var(--color-muted)] mt-1 text-sm">We'll send you a reset link</p>
        </div>
        <Card className="p-6">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] flex items-center justify-center mx-auto mb-4">
                <Mail size={20} className="text-[var(--color-success)]" />
              </div>
              <p className="font-medium text-[var(--color-text)] mb-2">Check your email</p>
              <p className="text-sm text-[var(--color-muted)]">If that email exists, you'll receive a reset link within a few minutes.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Email address" type="email" placeholder="you@example.com" leftIcon={<Mail size={15} />} error={errors.email?.message} {...register('email')} />
              <Button type="submit" loading={loading} className="w-full" size="lg">Send Reset Link</Button>
            </form>
          )}
        </Card>
        <div className="text-center mt-6">
          <Link to="/auth/login" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"><ArrowLeft size={14} /> Back to login</Link>
        </div>
      </div>
    </div>
  )
}

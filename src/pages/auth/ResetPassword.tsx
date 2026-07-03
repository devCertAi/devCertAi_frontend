import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import { resetPasswordSchema, ResetPasswordInput } from '@/lib/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [loading, setLoading] = useState(false)
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true)
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.password })
      toast.success('Password updated! Please log in.')
      navigate('/auth/login')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Set new password</h1>
          <p className="text-[var(--color-muted)] mt-1 text-sm">Enter your new password below</p>
        </div>
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="New Password" type="password" placeholder="Min. 8 characters" leftIcon={<Lock size={15} />} error={errors.password?.message} {...register('password')} />
            <Input label="Confirm Password" type="password" placeholder="Same as above" leftIcon={<Lock size={15} />} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" loading={loading} className="w-full" size="lg">Update Password</Button>
          </form>
        </Card>
        <p className="text-center mt-4 text-sm text-[var(--color-muted)]"><Link to="/auth/login" className="text-[var(--color-primary)] hover:underline">Back to login</Link></p>
      </div>
    </div>
  )
}

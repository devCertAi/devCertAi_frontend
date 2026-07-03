import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { User, Lock, Bell, Trash2, Building2, Mail, Shield, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import api from '@/services/api'
import toast from 'react-hot-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

type EmailChangeStep = 'idle' | 'otp-sent' | 'verified'

// ─── Shared section wrapper ───────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  danger = false,
  children,
}: {
  icon: React.ElementType
  title: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <Card
      className={`p-6 ${
        danger
          ? 'border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)]'
          : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-5">
        <Icon
          size={16}
          className={danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-primary)]'}
        />
        <h2
          className={`font-semibold ${
            danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'
          }`}
        >
          {title}
        </h2>
      </div>
      {children}
    </Card>
  )
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'admin'
  const isRecruiter = role === 'recruiter'
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[var(--color-muted)]">Role:</span>
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          background: isAdmin
            ? 'color-mix(in srgb, var(--color-danger) 10%, transparent)'
            : isRecruiter
            ? 'color-mix(in srgb, var(--color-secondary) 10%, transparent)'
            : 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
          color: isAdmin
            ? 'var(--color-danger)'
            : isRecruiter
            ? 'var(--color-secondary)'
            : 'var(--color-primary)',
        }}
      >
        {isAdmin ? 'Administrator' : isRecruiter ? 'Recruiter' : 'Developer'}
      </span>
    </div>
  )
}

// ─── OTP Email-change (Recruiter only) ───────────────────────────────────────
// Backend endpoints needed:
//   POST /recruiter/settings/change-email/send-otp   { newEmail }
//   POST /recruiter/settings/change-email/verify-otp { newEmail, otp }

function RecruiterEmailChange({ currentEmail }: { currentEmail: string }) {
  const [step, setStep] = useState<EmailChangeStep>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const { user, setUser } = useAuthStore()

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const sendOtp = async () => {
    if (!newEmail) { toast.error('Enter a new email'); return }
    if (newEmail === currentEmail) { toast.error('New email must differ from current'); return }
    setLoading(true)
    try {
      await api.post('/recruiter/settings/change-email/send-otp', { newEmail })
      setStep('otp-sent')
      setResendCooldown(60)
      toast.success('OTP sent to ' + newEmail)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const verifyOtp = async () => {
    if (!otp) { toast.error('Enter the OTP'); return }
    setLoading(true)
    try {
      const res = await api.post('/recruiter/settings/change-email/verify-otp', { newEmail, otp })
      setUser({ ...user!, email: res.data.data?.email || newEmail })
      setStep('verified')
      toast.success('Email updated successfully')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired OTP')
    } finally { setLoading(false) }
  }

  const reset = () => { setStep('idle'); setNewEmail(''); setOtp('') }

  if (step === 'verified') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]">
        <CheckCircle size={16} className="text-[var(--color-primary)] shrink-0" />
        <p className="text-sm text-[var(--color-text)]">
          Email updated to <strong>{newEmail}</strong>.
        </p>
        <button onClick={reset} className="ml-auto text-xs text-[var(--color-muted)] underline">
          Change again
        </button>
      </div>
    )
  }

  if (step === 'otp-sent') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[color-mix(in_srgb,var(--color-secondary)_8%,transparent)]">
          <AlertTriangle size={14} className="text-[var(--color-secondary)] mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--color-muted)]">
            A 6-digit OTP has been sent to <strong className="text-[var(--color-text)]">{newEmail}</strong>. It expires in 10 minutes.
          </p>
        </div>
        <Input
          label="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="123456"
          maxLength={6}
          inputMode="numeric"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={verifyOtp} loading={loading} className="flex-1">
            Verify & Update Email
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={resendCooldown > 0 ? undefined : sendOtp}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
          </Button>
        </div>
        <button onClick={reset} className="text-xs text-[var(--color-muted)] underline">
          ← Use a different email
        </button>
      </div>
    )
  }

  // idle
  return (
    <div className="space-y-3">
      <Input
        label="Current Email"
        value={currentEmail}
        disabled
        hint="An OTP will be sent to the new address"
      />
      <Input
        label="New Email"
        type="email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        placeholder="new@company.com"
      />
      <Button size="sm" onClick={sendOtp} loading={loading}>
        Send OTP to New Email
      </Button>
    </div>
  )
}

// ─── Main Settings component ──────────────────────────────────────────────────

export default function Settings() {
  const { user, setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')   // password confirm for user; "DELETE" text for recruiter

  const isRecruiter = user?.role === 'recruiter'
  const isAdmin     = user?.role === 'admin'
  const isUser      = !isRecruiter && !isAdmin

  // ── Profile form ──
  const { register: regProfile, handleSubmit: handleProfile } = useForm({
    defaultValues: { name: user?.name || '' },
  })

  // ── Password form ──
  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
  } = useForm<{ oldPassword: string; newPassword: string; confirmPassword: string }>()

  // ── Company form ──
  const { register: regCompany, handleSubmit: handleCompany, reset: resetCompany } = useForm({
    defaultValues: { companyName: '', website: '', industry: '', size: '', description: '' },
  })

  // ── Load company info for recruiter ──
  useEffect(() => {
    if (!isRecruiter) return
    api.get('/companies/me')
      .then((res) => {
        const c = res.data.data?.company
        if (c) {
          resetCompany({
            companyName: c.name || '',
            website: c.website || '',
            industry: c.industry || '',
            size: c.size || '',
            description: c.description || '',
          })
        }
      })
      .catch(() => {})
  }, [isRecruiter])

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const saveProfile = async (data: { name: string }) => {
    setLoading(true)
    try {
      if (isRecruiter) {
        // Backend needed: PUT /recruiter/settings/profile  { name }
        const res = await api.put('/recruiter/settings/profile', data)
        setUser({ ...user!, name: res.data.data?.name || data.name })
      } else {
        const res = await api.put('/users/profile', data)
        setUser(res.data.user)
      }
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile')
    } finally { setLoading(false) }
  }

  const changePassword = async (data: {
    oldPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords don't match")
      return
    }
    if (data.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      // Backend needed: PUT /recruiter/settings/change-password  { oldPassword, newPassword }
      const endpoint = isRecruiter
        ? '/recruiter/settings/change-password'
        : '/users/change-password'
      await api.put(endpoint, {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      })
      toast.success('Password changed successfully')
      resetPassword()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password')
    } finally { setLoading(false) }
  }

  const saveCompany = async (data: {
    companyName: string
    website: string
    industry: string
    size: string
    description: string
  }) => {
    setLoading(true)
    try {
      await api.put('/companies/me', {
        name: data.companyName,
        website: data.website,
        industry: data.industry,
        size: data.size,
        description: data.description,
      })
      toast.success('Company info updated')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update company info')
    } finally { setLoading(false) }
  }

  const handleDeleteAccount = async () => {
    try {
      if (isRecruiter) {
        if (deleteInput !== 'DELETE') {
          toast.error('Type DELETE to confirm')
          return
        }
        // Backend needed: DELETE /recruiter/settings/account
        await api.delete('/recruiter/settings/account')
      } else {
        // Regular user — requires password
        await api.delete('/users/account', { data: { password: deleteInput } })
      }
      await logout()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete account')
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-16 space-y-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>

        {/* ── ADMIN VIEW ── */}
        {isAdmin && (
          <>
            {/* Admin: read-only identity card */}
            <Section icon={Shield} title="Administrator Account">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-[color-mix(in_srgb,var(--color-danger)_6%,transparent)] text-sm text-[var(--color-muted)]">
                  Admin accounts use internal authentication. Profile details and passwords are managed by the platform owner.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-muted)] mb-1">Name</p>
                    <p className="text-sm font-medium text-[var(--color-text)]">{user?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-muted)] mb-1">Email</p>
                    <p className="text-sm font-medium text-[var(--color-text)]">{user?.email || '—'}</p>
                  </div>
                </div>
                <RoleBadge role="admin" />
              </div>
            </Section>

            {/* Admin: system preferences (notifications) */}
            <Section icon={Bell} title="System Notifications">
              <div className="space-y-3">
                {[
                  ['new_user', 'New user registrations'],
                  ['company_verify', 'Company verification requests'],
                  ['flag_report', 'Flagged content reports'],
                  ['payment_event', 'Payment events'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-[var(--color-text)]">{label}</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-primary)]"
                    />
                  </label>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* ── RECRUITER VIEW ── */}
        {isRecruiter && (
          <>
            {/* Recruiter: profile (name only) */}
            <Section icon={User} title="Profile">
              <form onSubmit={handleProfile(saveProfile)} className="space-y-4">
                <Input label="Full Name" {...regProfile('name')} />
                <RoleBadge role="recruiter" />
                <Button type="submit" loading={loading} size="sm">
                  Save Changes
                </Button>
              </form>
            </Section>

            {/* Recruiter: email change via OTP */}
            <Section icon={Mail} title="Update Email">
              <p className="text-sm text-[var(--color-muted)] mb-4">
                Your email address is used for login and notifications. We'll send an OTP to the new address to confirm the change.
              </p>
              <RecruiterEmailChange currentEmail={user?.email || ''} />
            </Section>

            {/* Recruiter: company info */}
            <Section icon={Building2} title="Company Info">
              <form onSubmit={handleCompany(saveCompany)} className="space-y-4">
                <Input label="Company Name" {...regCompany('companyName')} />
                <Input
                  label="Website"
                  type="url"
                  placeholder="https://acme.com"
                  {...regCompany('website')}
                />
                <Input label="Industry" placeholder="e.g. FinTech, HealthTech" {...regCompany('industry')} />
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                    Company Size
                  </label>
                  <select
                    {...regCompany('size')}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1–10 employees</option>
                    <option value="11-50">11–50 employees</option>
                    <option value="51-200">51–200 employees</option>
                    <option value="201-500">201–500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                    Description
                  </label>
                  <textarea
                    {...regCompany('description')}
                    rows={3}
                    placeholder="Brief description of your company..."
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <Button type="submit" loading={loading} size="sm">
                  Save Company Info
                </Button>
              </form>
            </Section>

            {/* Recruiter: change password */}
            <Section icon={Lock} title="Change Password">
              <form onSubmit={handlePassword(changePassword)} className="space-y-4">
                <Input label="Current Password" type="password" {...regPassword('oldPassword')} />
                <Input label="New Password" type="password" {...regPassword('newPassword')} hint="Minimum 8 characters" />
                <Input label="Confirm New Password" type="password" {...regPassword('confirmPassword')} />
                <Button type="submit" loading={loading} size="sm">
                  Update Password
                </Button>
              </form>
            </Section>

            {/* Recruiter: danger zone */}
            <Section icon={Trash2} title="Danger Zone" danger>
              <p className="text-sm text-[var(--color-muted)] mb-4">
                Permanently deletes your recruiter account, all job postings, and applicant data. This cannot be undone.
              </p>
              <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
                Delete Recruiter Account
              </Button>
            </Section>
          </>
        )}

        {/* ── USER (DEVELOPER) VIEW ── */}
        {isUser && (
          <>
            {/* User: profile */}
            <Section icon={User} title="Profile">
              <form onSubmit={handleProfile(saveProfile)} className="space-y-4">
                <Input label="Full Name" {...regProfile('name')} />
                <Input label="Email" value={user?.email || ''} disabled hint="Email cannot be changed" />
                <Input
                  label="Username"
                  value={`@${user?.username}`}
                  disabled
                  hint="Username cannot be changed"
                />
                <RoleBadge role="developer" />
                <Button type="submit" loading={loading} size="sm">
                  Save Changes
                </Button>
              </form>
            </Section>

            {/* User: change password */}
            <Section icon={Lock} title="Change Password">
              <form onSubmit={handlePassword(changePassword)} className="space-y-4">
                <Input label="Current Password" type="password" {...regPassword('oldPassword')} />
                <Input label="New Password" type="password" {...regPassword('newPassword')} hint="Minimum 8 characters" />
                <Input label="Confirm New Password" type="password" {...regPassword('confirmPassword')} />
                <Button type="submit" loading={loading} size="sm">
                  Update Password
                </Button>
              </form>
            </Section>

            {/* User: notifications */}
            <Section icon={Bell} title="Email Notifications">
              <div className="space-y-3">
                {[
                  ['evaluation_complete', 'Project evaluation complete'],
                  ['exam_result', 'Exam results'],
                  ['certificate_ready', 'Certificate generated'],
                  ['payment_confirmed', 'Payment confirmations'],
                  ['application_update', 'Job application status updates'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-[var(--color-text)]">{label}</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-primary)]"
                    />
                  </label>
                ))}
              </div>
            </Section>

            {/* User: danger zone */}
            <Section icon={Trash2} title="Danger Zone" danger>
              <p className="text-sm text-[var(--color-muted)] mb-4">
                Permanently delete your account and all associated data — projects, certificates, and exam history. This action cannot be undone.
              </p>
              <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
                Delete Account
              </Button>
            </Section>
          </>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      <Modal
        open={showDelete}
        onClose={() => { setShowDelete(false); setDeleteInput('') }}
        title="Delete Account"
        size="sm"
      >
        {isRecruiter ? (
          <>
            <p className="text-sm text-[var(--color-muted)] mb-4">
              This will permanently delete your recruiter account, all job postings, and associated applicant data.
              Type <strong className="text-[var(--color-danger)]">DELETE</strong> to confirm.
            </p>
            <Input
              label=""
              placeholder="Type DELETE to confirm"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="mb-4"
            />
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--color-muted)] mb-4">
              Are you absolutely sure? Enter your password to confirm permanent deletion.
            </p>
            <Input
              label="Password"
              type="password"
              placeholder="Your current password"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="mb-4"
            />
          </>
        )}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={() => { setShowDelete(false); setDeleteInput('') }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleDeleteAccount}
            disabled={
              isRecruiter ? deleteInput !== 'DELETE' : deleteInput.length < 1
            }
          >
            Yes, Delete Everything
          </Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
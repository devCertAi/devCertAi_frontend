/**
 * RewardedAdModal.tsx — "Watch an ad, earn a credit"
 *
 * Shows an ad for a fixed duration (can't be skipped early), then lets the
 * user claim a bonus credit. The countdown is just UX — the actual grant is
 * server-side rate-limited (see creditService.grantAdRewardCredit), so this
 * can't be abused by messing with client timers.
 *
 * Usage:
 *   const [open, setOpen] = useState(false)
 *   <RewardedAdButton bucket="project" onRewarded={() => refetchCredits()} />
 *   // or render <RewardedAdModal open={open} onClose={...} bucket="project" onRewarded={...} />
 *   // directly if you want your own trigger button.
 */

import { useEffect, useState } from 'react'
import { Gift, Loader2, PlayCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AdBanner } from './AdBanner'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { usePremium } from '@/components/premium/PremiumGate'
import { refreshCredits } from '@/hooks/useCredits'

const WATCH_SECONDS = 15

interface RewardedAdModalProps {
  open: boolean
  onClose: () => void
  bucket?: 'project' | 'skill'
  onRewarded?: () => void
}

export function RewardedAdModal({ open, onClose, bucket = 'project', onRewarded }: RewardedAdModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(WATCH_SECONDS)
  const [claiming, setClaiming] = useState(false)

  const watching = secondsLeft > 0

  useEffect(() => {
    if (!open) return
    setSecondsLeft(WATCH_SECONDS)
  }, [open])

  useEffect(() => {
    if (!open || secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [open, secondsLeft])

  const claim = async () => {
    setClaiming(true)
    try {
      const { data } = await api.post('/credits/watch-ad-reward', { bucket })
      toast.success(data.message || 'Credit added!')
      await refreshCredits()
      onRewarded?.()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not claim reward. Try again later.')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={watching ? () => {} : onClose} // locked while the ad is "playing"
      title="Watch & Earn"
      size="sm"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <AdBanner slot="postSubmit" size="square" />

        {watching ? (
          <>
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <Loader2 size={14} className="animate-spin" />
              Reward unlocks in {secondsLeft}s — please keep this open
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--color-surface2)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] transition-all duration-1000 ease-linear"
                style={{ width: `${((WATCH_SECONDS - secondsLeft) / WATCH_SECONDS) * 100}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-success)]">
              <Gift size={16} />
              Ad complete — your credit is ready!
            </div>
            <Button className="w-full" onClick={claim} loading={claiming}>
              Claim +1 {bucket === 'project' ? 'Project Eval' : 'Exam'} Credit
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}

/**
 * RewardedAdButton — drop-in trigger + modal in one. Hidden automatically
 * for premium users (they already have unlimited credits).
 */
export function RewardedAdButton({
  bucket = 'project',
  onRewarded,
  className,
}: {
  bucket?: 'project' | 'skill'
  onRewarded?: () => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const { isPremium } = usePremium()

  if (isPremium) return null

  return (
    <>
      <Button variant="outline" size="sm" className={className} onClick={() => setOpen(true)}>
        <PlayCircle size={14} className="mr-1.5" />
        Watch ad for a free credit
      </Button>
      <RewardedAdModal open={open} onClose={() => setOpen(false)} bucket={bucket} onRewarded={onRewarded} />
    </>
  )
}

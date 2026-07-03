/**
 * InterstitialAdModal.tsx — brief ad shown before proceeding with an action.
 *
 * Usage pattern (e.g. gating a "Submit for Evaluation" button):
 *
 *   const [showAd, setShowAd] = useState(false)
 *   const [pendingArgs, setPendingArgs] = useState<X | null>(null)
 *
 *   const onSubmit = (data) => {
 *     if (isPremium) return doSubmit(data)   // premium = no ads
 *     setPendingArgs(data)
 *     setShowAd(true)
 *   }
 *
 *   <InterstitialAdModal
 *     open={showAd}
 *     onClose={() => setShowAd(false)}
 *     onContinue={() => { setShowAd(false); if (pendingArgs) doSubmit(pendingArgs) }}
 *   />
 *
 * Skippable after a short minimum view time so it's not a dead-end.
 */

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AdBanner } from './AdBanner'

const MIN_VIEW_SECONDS = 5

interface InterstitialAdModalProps {
  open: boolean
  onClose: () => void
  onContinue: () => void
  title?: string
}

export function InterstitialAdModal({ open, onClose, onContinue, title = 'One moment…' }: InterstitialAdModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(MIN_VIEW_SECONDS)

  useEffect(() => {
    if (!open) return
    setSecondsLeft(MIN_VIEW_SECONDS)
  }, [open])

  useEffect(() => {
    if (!open || secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [open, secondsLeft])

  const canContinue = secondsLeft <= 0

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <AdBanner slot="postSubmit" size="square" />
        <Button className="w-full" disabled={!canContinue} onClick={onContinue}>
          {canContinue ? 'Continue' : `Continue in ${secondsLeft}s`}
        </Button>
      </div>
    </Modal>
  )
}

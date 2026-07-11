/**
 * AdBanner.tsx — Smart ad placement component
 *
 * Features:
 * - Hidden for premium users (ads-free)
 * - Hidden on protected routes (exam, dashboard, pricing, etc.)
 * - Shows placeholder in test/dev mode with ad dimensions
 * - Loads Google AdSense in production
 * - Lazy-initializes adsbygoogle to avoid repeat push errors
 */

import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import AD_CONFIG, { AdSlot } from './AdManager'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

type AdSize = 'banner' | 'sidebar' | 'square' | 'large-square' | 'responsive'

const SIZE_MAP: Record<Exclude<AdSize, 'responsive'>, { width: number; height: number }> = {
  banner: { width: 728, height: 90 },
  sidebar: { width: 300, height: 250 },
  square: { width: 300, height: 250 },
  'large-square': { width: 336, height: 280 },
}

interface AdBannerProps {
  slot: AdSlot
  size?: AdSize
  className?: string
}

export function AdBanner({ slot, size = 'square', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null)
  const initialized = useRef(false)
  const { user } = useAuthStore()
  const location = useLocation()

  // Premium users: no ads
  const isPremium = user?.isPremium ?? false

  // Route check
  const isProtectedRoute = AD_CONFIG.neverShowOnRoutes.some(r =>
    location.pathname.startsWith(r)
  )

  const shouldHide = isPremium || isProtectedRoute

  useEffect(() => {
    if (shouldHide || !AD_CONFIG.enabled || initialized.current) return
    if (AD_CONFIG.testMode) return  // Test mode uses placeholder, not real adsbygoogle

    const w = window as unknown as { adsbygoogle?: unknown[] }

    // The adsbygoogle.js loader script is never injected anywhere else in
    // this app, so window.adsbygoogle would never exist and every <ins> tag
    // would render empty. Inject it once (idempotent) before pushing.
    const SCRIPT_ID = 'adsbygoogle-loader'
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.async = true
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CONFIG.client}`
      script.crossOrigin = 'anonymous'
      document.head.appendChild(script)
    }
    w.adsbygoogle = w.adsbygoogle || []

    try {
      w.adsbygoogle.push({})
      initialized.current = true
    } catch {}
  }, [shouldHide])

  if (shouldHide) return null

  const dimensions = size !== 'responsive' ? SIZE_MAP[size] : null

  // Dev/test mode: show a styled placeholder so developers can see ad placement
  if (AD_CONFIG.testMode || !AD_CONFIG.enabled) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'bg-[rgba(94,234,212,0.08)] border-2 border-dashed border-[var(--color-primary)]',
          'rounded-lg text-xs text-[var(--color-primary)] font-mono font-bold gap-1',
          className
        )}
        style={dimensions ? {
          width: dimensions.width,
          height: dimensions.height,
          minWidth: dimensions.width,
          minHeight: dimensions.height,
          maxWidth: '100%'
        } : { width: '100%', minHeight: 90 }}
        title="Ad placeholder (test mode)"
      >
        <span className="text-sm">AD PLACEHOLDER</span>
        {dimensions && (
          <span className="text-[11px]">{dimensions.width}×{dimensions.height} · slot: {slot}</span>
        )}
      </div>
    )
  }

  // Production: real Google AdSense
  if (size === 'responsive') {
    return (
      <ins
        ref={adRef}
        className={cn('adsbygoogle block', className)}
        style={{ display: 'block' }}
        data-ad-client={AD_CONFIG.client}
        data-ad-slot={AD_CONFIG.slots[slot]}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    )
  }

  return (
    <ins
      ref={adRef}
      className={cn('adsbygoogle block', className)}
      style={dimensions ? {
        display: 'block',
        width: dimensions.width,
        height: dimensions.height
      } : { display: 'block' }}
      data-ad-client={AD_CONFIG.client}
      data-ad-slot={AD_CONFIG.slots[slot]}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
import { useEffect, useRef } from 'react'

/**
 * A fixed glow layer that drifts and re-colors itself as the page scrolls.
 * Three soft orbs are repositioned and re-tinted based on scroll progress,
 * giving the page an ambient "alive" backdrop without any extra
 * dependencies — just rAF-throttled scroll math driving CSS variables.
 */
export function ScrollGlowBackground() {
  const orb1 = useRef<HTMLDivElement>(null)
  const orb2 = useRef<HTMLDivElement>(null)
  const orb3 = useRef<HTMLDivElement>(null)
  const ticking = useRef(false)

  useEffect(() => {
    const update = () => {
      ticking.current = false
      const doc = document.documentElement
      const max = Math.max(doc.scrollHeight - window.innerHeight, 1)
      const progress = Math.min(window.scrollY / max, 1) // 0 → 1 across the page

      if (orb1.current) {
        orb1.current.style.transform = `translate(${-10 + progress * 30}%, ${progress * 60}%)`
        orb1.current.style.background = `radial-gradient(circle, color-mix(in srgb, var(--color-primary) ${28 - progress * 10}%, transparent), transparent 70%)`
      }
      if (orb2.current) {
        orb2.current.style.transform = `translate(${70 - progress * 40}%, ${20 + progress * 50}%) rotate(${progress * 60}deg)`
        orb2.current.style.background = `radial-gradient(circle, color-mix(in srgb, var(--color-secondary) ${22 + progress * 12}%, transparent), transparent 72%)`
      }
      if (orb3.current) {
        orb3.current.style.transform = `translate(${30 - progress * 20}%, ${90 - progress * 70}%)`
        orb3.current.style.background = `radial-gradient(circle, color-mix(in srgb, var(--color-purple) ${18 + progress * 16}%, transparent), transparent 72%)`
        orb3.current.style.opacity = String(0.5 + progress * 0.5)
      }
    }

    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="scroll-glow-bg" aria-hidden="true">
      <div ref={orb1} className="orb" style={{ width: '60vw', height: '60vw', left: '-15vw', top: '-10vh', transition: 'transform 1.1s cubic-bezier(.22,1,.36,1), background .8s ease' }} />
      <div ref={orb2} className="orb" style={{ width: '46vw', height: '46vw', right: '-10vw', top: '20vh', transition: 'transform 1.3s cubic-bezier(.22,1,.36,1), background .8s ease' }} />
      <div ref={orb3} className="orb" style={{ width: '38vw', height: '38vw', left: '10vw', bottom: '-10vh', transition: 'transform 1.4s cubic-bezier(.22,1,.36,1), background .8s ease, opacity .8s ease' }} />
    </div>
  )
}
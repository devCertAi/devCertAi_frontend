import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion'

type BotMood = 'idle' | 'happy' | 'excited' | 'eating' | 'dizzy' | 'sleeping' | 'chasing' | 'winking'

// The bot's own card/bubble UI is always rendered on a fixed dark
// gradient, regardless of the host page's theme. So its icon/text
// colors must be fixed light colors too — NOT var(--color-text),
// which flips to a dark color in light theme and becomes invisible
// against the bot's dark background.
const BOT_TEXT = '#E9EAF2'
const BOT_MUTED = '#8B93A5'

// ─── BOT FACE ────────────────────────────────────────────────────
function BotFace({ mood, blinking }: { mood: BotMood; blinking: boolean }) {
  if (blinking || mood === 'sleeping') return (
    <svg viewBox="0 0 36 36" width="36" height="36" style={{ color: BOT_TEXT }}>
      <line x1="8" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="22" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {mood === 'sleeping'
        ? <path d="M 10 22 Q 18 20 26 22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
        : <path d="M 11 22 Q 18 26 25 22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      }
      {mood === 'sleeping' && <text x="26" y="10" fontSize="8" fill={BOT_MUTED}>z</text>}
    </svg>
  )
  if (mood === 'dizzy') return (
    <svg viewBox="0 0 36 36" width="36" height="36" style={{ color: BOT_TEXT }}>
      <text x="6" y="18" fontSize="10" fill="currentColor">×</text>
      <text x="22" y="18" fontSize="10" fill="currentColor">×</text>
      <path d="M 10 24 Q 14 20 18 24 Q 22 28 26 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  )
  if (mood === 'winking') return (
    <svg viewBox="0 0 36 36" width="36" height="36" style={{ color: BOT_TEXT }}>
      <circle cx="11" cy="14" r="3" fill="currentColor"/>
      <line x1="22" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M 10 22 Q 18 28 26 22" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  )
  if (mood === 'excited') return (
    <svg viewBox="0 0 36 36" width="36" height="36" style={{ color: BOT_TEXT }}>
      <circle cx="11" cy="14" r="4" fill="currentColor"/>
      <circle cx="25" cy="14" r="4" fill="currentColor"/>
      <circle cx="12" cy="13" r="1.5" fill="white"/>
      <circle cx="26" cy="13" r="1.5" fill="white"/>
      <path d="M 8 21 Q 18 30 28 21" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  )
  if (mood === 'eating') return (
    <svg viewBox="0 0 36 36" width="36" height="36" style={{ color: BOT_TEXT }}>
      <circle cx="11" cy="14" r="3" fill="currentColor"/>
      <circle cx="25" cy="14" r="3" fill="currentColor"/>
      <circle cx="12" cy="13" r="1" fill="white"/>
      <circle cx="26" cy="13" r="1" fill="white"/>
      <path d="M 8 20 Q 18 30 28 20" stroke="currentColor" strokeWidth="2.5" fill="var(--color-primary)" strokeLinecap="round"/>
    </svg>
  )
  if (mood === 'happy') return (
    <svg viewBox="0 0 36 36" width="36" height="36" style={{ color: BOT_TEXT }}>
      <circle cx="11" cy="14" r="3" fill="currentColor"/>
      <circle cx="25" cy="14" r="3" fill="currentColor"/>
      <circle cx="12" cy="13" r="1" fill="white"/>
      <circle cx="26" cy="13" r="1" fill="white"/>
      <path d="M 10 22 Q 18 28 26 22" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" style={{ color: BOT_TEXT }}>
      <circle cx="11" cy="14" r="3" fill="currentColor"/>
      <circle cx="25" cy="14" r="3" fill="currentColor"/>
      <circle cx="12" cy="13" r="1" fill="white"/>
      <circle cx="26" cy="13" r="1" fill="white"/>
      <path d="M 11 22 Q 18 26 25 22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// ─── HELPERS ─────────────────────────────────────────────────────

/** Is this element actually visible within the current viewport bounds (geometry + computed visibility)? */
function isInViewport(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return false
  const vw = window.innerWidth || document.documentElement.clientWidth
  const vh = window.innerHeight || document.documentElement.clientHeight
  if (!(r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw)) return false
  const cs = window.getComputedStyle(el)
  if (cs.visibility === 'hidden' || cs.display === 'none') return false
  if (parseFloat(cs.opacity || '1') < 0.05) return false
  return true
}

/** Get ALL elements matching selector, excluding fixed/sticky ancestors, off-viewport, and currently-animating elements */
function getPageEls(selector: string, exclude?: Set<HTMLElement>): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(el => {
    if (exclude?.has(el)) return false
    if (!isInViewport(el)) return false
    let node: HTMLElement | null = el
    while (node) {
      const cs = window.getComputedStyle(node)
      if (cs.position === 'fixed' || cs.position === 'sticky') return false
      node = node.parentElement
    }
    return (el.textContent?.trim().length ?? 0) > 2
  })
}

// Friendly fallback lines when an action finds nothing eligible to touch
const NOTHING_LINES = ['nothing to play with here 🤷', 'quiet spot, huh? 🧐', "can't find anything here 👀", 'scroll around more! 🔎']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── MAIN BOT ────────────────────────────────────────────────────
export function DevBot() {
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const botPos = useRef({ x: window.innerWidth - 100, y: window.innerHeight - 100 })
  const rafRef = useRef(0)
  const idleTimer = useRef<ReturnType<typeof setTimeout>>()
  const speechTimer = useRef<ReturnType<typeof setTimeout>>()
  // Elements currently mid-animation — never pick these again until they're released,
  // otherwise a second action can capture a mid-animation style as "original" and
  // leave the element permanently broken/invisible when it later restores.
  const animatingEls = useRef<Set<HTMLElement>>(new Set())

  const [mood, setMood] = useState<BotMood>('idle')
  const [blinking, setBlinking] = useState(false)
  const [bubble, setBubble] = useState('')
  const [isChasing, setIsChasing] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)

  const x = useMotionValue(window.innerWidth - 100)
  const y = useMotionValue(window.innerHeight - 100)
  const springX = useSpring(x, { stiffness: 80, damping: 18 })
  const springY = useSpring(y, { stiffness: 80, damping: 18 })

  const speak = useCallback((text: string, duration = 3000) => {
    setBubble(text)
    clearTimeout(speechTimer.current)
    speechTimer.current = setTimeout(() => setBubble(''), duration)
  }, [])

  const setMoodTemp = useCallback((m: BotMood, duration = 2000) => {
    setMood(m)
    setTimeout(() => setMood('idle'), duration)
  }, [])

  // ── blinking ──
  useEffect(() => {
    const blink = () => {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 150)
      setTimeout(blink, 2000 + Math.random() * 3000)
    }
    const t = setTimeout(blink, 1500)
    return () => clearTimeout(t)
  }, [])

  // ── mouse tracking ──
  useEffect(() => {
    const h = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  // ── movement loop ──
  useEffect(() => {
    const tick = () => {
      const { x: mx, y: my } = mousePos.current
      const { x: bx, y: by } = botPos.current
      const dist = Math.hypot(mx - bx, my - by)
      if (isChasing) {
        if (dist > 80) {
          const speed = Math.min(dist * 0.06, 12)
          const angle = Math.atan2(my - by, mx - bx)
          botPos.current.x += Math.cos(angle) * speed
          botPos.current.y += Math.sin(angle) * speed
          setRotation(Math.atan2(my - by, mx - bx) * (180 / Math.PI) * 0.15)
        } else {
          setMoodTemp('winking', 1500)
          speak('gotcha! 😄')
          setIsChasing(false)
        }
      } else {
        const time = Date.now() / 2000
        const tx = window.innerWidth - 120 + Math.sin(time) * 40
        const ty = window.innerHeight - 120 + Math.cos(time * 0.7) * 30
        botPos.current.x += (tx - bx) * 0.015
        botPos.current.y += (ty - by) * 0.015
        setRotation(r => r * 0.9)
      }
      botPos.current.x = Math.max(40, Math.min(window.innerWidth - 40, botPos.current.x))
      botPos.current.y = Math.max(40, Math.min(window.innerHeight - 40, botPos.current.y))
      x.set(botPos.current.x - 32)
      y.set(botPos.current.y - 32)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isChasing, x, y, speak, setMoodTemp])

  // ──────────────────────────────────────────────────────────────
  // DOM INTERACTIONS
  // ──────────────────────────────────────────────────────────────

  // 1. Eat words
  const eatRandomWord = useCallback(() => {
    const els = getPageEls('p, h3, h2, h1, li', animatingEls.current)
      .filter(el => (el.textContent?.trim().split(/\s+/).length ?? 0) >= 4)
    if (!els.length) { speak('nothing to eat! 😢', 1500); return }

    const target = pick(els)
    animatingEls.current.add(target)
    const originalHTML = target.innerHTML
    const words = (target.textContent ?? '').trim().split(/\s+/)
    const eatCount = Math.min(Math.floor(words.length * 0.45) + 1, words.length - 1)

    setMood('eating')
    speak('nom nom nom 😋', 3500)

    let i = 0
    const iv = setInterval(() => {
      if (i >= eatCount) {
        clearInterval(iv)
        setTimeout(() => {
          if (target.isConnected) target.innerHTML = originalHTML
          setMoodTemp('happy', 2000)
          speak('burp! restored! 🍽️', 2000)
          animatingEls.current.delete(target)
        }, 1000)
        return
      }
      if (target.isConnected) target.textContent = '...' + words.slice(i + 1).join(' ')
      i++
    }, 200)
  }, [speak, setMoodTemp])

  // 2. Flip heading
  const flipHeading = useCallback(() => {
    const els = getPageEls('h1, h2, h3', animatingEls.current)
    if (!els.length) { speak(pick(NOTHING_LINES), 1500); return }
    const target = pick(els)
    animatingEls.current.add(target)
    const ot = target.style.transform, otr = target.style.transition, od = target.style.display
    target.style.display = 'inline-block'
    target.style.transition = 'transform 0.5s cubic-bezier(0.68,-0.55,0.27,1.55)'
    target.style.transform = 'scaleY(-1)'
    speak('hehe! flipped 🙃 click to fix', 3500)
    setMoodTemp('happy', 2500)
    let fixed = false
    const fix = () => {
      if (fixed) return
      fixed = true
      target.style.transform = 'scaleY(1)'
      setTimeout(() => {
        target.style.transform = ot; target.style.transition = otr; target.style.display = od
        animatingEls.current.delete(target)
      }, 400)
      target.removeEventListener('click', fix)
    }
    target.addEventListener('click', fix)
    setTimeout(fix, 5000)
  }, [speak, setMoodTemp])

  // 3. Rainbow heading
  const rainbowHeading = useCallback(() => {
    const els = getPageEls('h1, h2, h3', animatingEls.current)
    if (!els.length) { speak(pick(NOTHING_LINES), 1500); return }
    const target = pick(els)
    animatingEls.current.add(target)
    const ob = target.style.background, oc = (target.style as any).webkitBackgroundClip
    const of_ = (target.style as any).webkitTextFillColor, od = target.style.display
    target.style.display = 'inline-block'
    target.style.background = 'linear-gradient(90deg,#5EEAD4,#8B7CF6,#22C55E,#FBBF54,#EF4444,#5EEAD4)'
    ;(target.style as any).webkitBackgroundClip = 'text'
    ;(target.style as any).webkitTextFillColor = 'transparent'
    speak('rainbow mode! 🌈', 2500)
    setMoodTemp('excited', 2000)
    setTimeout(() => {
      target.style.background = ob
      ;(target.style as any).webkitBackgroundClip = oc
      ;(target.style as any).webkitTextFillColor = of_
      target.style.display = od
      animatingEls.current.delete(target)
    }, 3500)
  }, [speak, setMoodTemp])

  // 4. Wobble element
  const wobbleEl = useCallback(() => {
    const els = getPageEls('h1,h2,h3,button,p,li', animatingEls.current).filter(el => el.getBoundingClientRect().width > 40)
    if (!els.length) { speak(pick(NOTHING_LINES), 1500); return }
    const target = pick(els)
    animatingEls.current.add(target)
    const ot = target.style.transform, otr = target.style.transition, od = target.style.display
    target.style.display = 'inline-block'
    target.style.transition = 'transform 0.1s ease'
    ;[-7, 7, -5, 5, -3, 3, -1, 1, 0].forEach((deg, i) => {
      setTimeout(() => { target.style.transform = `rotate(${deg}deg)` }, i * 80)
    })
    setTimeout(() => {
      target.style.transform = ot; target.style.transition = otr; target.style.display = od
      animatingEls.current.delete(target)
    }, 9 * 80 + 200)
    speak('wiggle wiggle! 🕺', 2000)
    setMoodTemp('happy', 2000)
  }, [speak, setMoodTemp])

  // 5. Glow any section/div (viewport-only)
  const glowEl = useCallback(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('section,article,main > div,[class*="card"],[class*="Card"]'))
      .filter(el => {
        if (animatingEls.current.has(el)) return false
        if (!isInViewport(el)) return false
        let n: HTMLElement | null = el
        while (n) { if (window.getComputedStyle(n).position === 'fixed') return false; n = n.parentElement }
        const r = el.getBoundingClientRect()
        return r.width > 100 && r.height > 60
      })
    if (!els.length) { speak(pick(NOTHING_LINES), 1500); return }
    const target = pick(els)
    animatingEls.current.add(target)
    const oo = target.style.outline, os = target.style.boxShadow, ot = target.style.transition
    target.style.transition = 'outline 0.3s,box-shadow 0.4s'
    target.style.outline = '2px solid #5EEAD4'
    target.style.boxShadow = '0 0 32px rgba(108,99,255,0.55),0 0 64px rgba(108,99,255,0.2)'
    speak('nice element! ✨', 2500)
    setMoodTemp('excited', 2000)
    setTimeout(() => {
      target.style.outline = oo; target.style.boxShadow = os; target.style.transition = ot
      animatingEls.current.delete(target)
    }, 2500)
  }, [speak, setMoodTemp])

  // 6. Troll button
  const trollButton = useCallback(() => {
    const els = getPageEls('button', animatingEls.current).filter(el => {
      const t = el.textContent?.trim() ?? ''
      return t.length > 1 && t.length < 50
    })
    if (!els.length) { speak(pick(NOTHING_LINES), 1500); return }
    const target = pick(els)
    animatingEls.current.add(target)
    const origHTML = target.innerHTML
    const ot = target.style.transition, otr = target.style.transform
    target.style.transition = 'transform 0.07s'
    ;[-5, 5, -4, 4, -2, 2, 0].forEach((v, i) => {
      setTimeout(() => { target.style.transform = `translateX(${v}px)` }, i * 70)
    })
    const funTexts = ['click me! 🎉','are you sure? 🤔','go on... 👀','do it! 🚀',"don't click! 😱",'free pizza? 🍕','trust me 😈']
    setTimeout(() => { if (target.isConnected) { target.innerHTML = pick(funTexts); speak('I changed that button 😈', 2500); setMoodTemp('excited', 2500) } }, 500)
    setTimeout(() => {
      if (target.isConnected) { target.innerHTML = origHTML; target.style.transition = ot; target.style.transform = otr }
      animatingEls.current.delete(target)
    }, 3000)
  }, [speak, setMoodTemp])

  // 7. Shake element (viewport-only)
  const shakeEl = useCallback(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('section,div,p,li'))
      .filter(el => {
        if (animatingEls.current.has(el)) return false
        if (!isInViewport(el)) return false
        let n: HTMLElement | null = el
        while (n) { if (window.getComputedStyle(n).position === 'fixed') return false; n = n.parentElement }
        const r = el.getBoundingClientRect()
        return r.width > 80 && r.height > 30
      })
    if (!els.length) { speak(pick(NOTHING_LINES), 1500); return }
    const target = pick(els)
    animatingEls.current.add(target)
    const ot = target.style.transition, otr = target.style.transform
    target.style.transition = 'transform 0.07s'
    const xs = [0, -8, 8, -6, 6, -4, 4, -2, 2, 0]
    const ys = [0, -3, 3, -2, 2, -1, 1, 0, 0, 0]
    xs.forEach((v, i) => { setTimeout(() => { if (target.isConnected) target.style.transform = `translate(${v}px,${ys[i]}px)` }, i * 60) })
    setTimeout(() => {
      if (target.isConnected) { target.style.transition = ot; target.style.transform = otr }
      animatingEls.current.delete(target)
    }, xs.length * 60 + 100)
    speak('earthquake! 🌍', 2000)
    setMoodTemp('dizzy', 1500)
  }, [speak, setMoodTemp])

  // 8. Scramble text
  const scrambleText = useCallback(() => {
    const els = getPageEls('h2,h3,p,span,li,button', animatingEls.current)
      .filter(el => {
        const t = el.textContent?.trim() ?? ''
        return t.length > 3 && t.length < 60 && el.children.length === 0
      })
    if (!els.length) { speak(pick(NOTHING_LINES), 1500); return }
    const target = pick(els)
    animatingEls.current.add(target)
    const originalText = target.textContent ?? ''
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
    speak('scrambling text... 🔀', 2500)
    setMoodTemp('excited', 2500)
    let frame = 0
    const totalFrames = 20
    const iv = setInterval(() => {
      if (frame >= totalFrames) {
        clearInterval(iv)
        if (target.isConnected) target.textContent = originalText
        animatingEls.current.delete(target)
        return
      }
      if (!target.isConnected) { clearInterval(iv); animatingEls.current.delete(target); return }
      const revealCount = Math.floor((frame / totalFrames) * originalText.length)
      target.textContent = originalText.slice(0, revealCount) +
        Array.from({ length: originalText.length - revealCount }, () =>
          chars[Math.floor(Math.random() * chars.length)]
        ).join('')
      frame++
    }, 90)
  }, [speak, setMoodTemp])

  // 9. Invert page colors
  const invertPage = useCallback(() => {
    const root = document.documentElement
    root.style.transition = 'filter 0.3s'
    root.style.filter = 'invert(1) hue-rotate(180deg)'
    speak('dark side! 🌑', 2000)
    setMoodTemp('dizzy', 2000)
    setTimeout(() => { root.style.filter = '' }, 1800)
  }, [speak, setMoodTemp])

  // 10. Cursor sparkle trail
  const startCursorTrail = useCallback(() => {
    speak('sparkle trail! ✨', 3000)
    setMoodTemp('excited', 3000)
    const colors = ['#5EEAD4','#8B7CF6','#22C55E','#FBBF54','#EF4444']
    let count = 0
    const onMove = (e: MouseEvent) => {
      if (count >= 40) return
      count++
      const dot = document.createElement('div')
      const size = 6 + Math.random() * 6
      dot.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;
        width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;
        background:${colors[Math.floor(Math.random() * colors.length)]};z-index:99999;
        transform:translate(-50%,-50%);transition:opacity 0.8s ease,transform 0.8s ease;`
      document.body.appendChild(dot)
      requestAnimationFrame(() => {
        dot.style.opacity = '0'
        dot.style.transform = `translate(${-50 + (Math.random()-0.5)*80}%,${-200 + Math.random()*-100}%) scale(0.1)`
      })
      setTimeout(() => dot.remove(), 900)
    }
    window.addEventListener('mousemove', onMove)
    setTimeout(() => { window.removeEventListener('mousemove', onMove); count = 0 }, 3500)
  }, [speak, setMoodTemp])

  // ── scroll reaction ──
  useEffect(() => {
    let lastY = window.scrollY
    const h = () => {
      const diff = Math.abs(window.scrollY - lastY)
      if (diff > 180) { setMoodTemp('dizzy', 1500); speak('whoosh! 🌪️', 1500) }
      lastY = window.scrollY
    }
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [setMoodTemp, speak])

  // ── word hover (viewport-only, re-scanned periodically) ──
  useEffect(() => {
    const map: Record<string, string> = {
      certificate: 'treasure 🏆', evaluate: 'x-ray 🔬', project: 'masterpiece 🎨',
      code: 'magic spells ✨', ai: 'robot brain 🤖', score: 'power level 💪',
      submit: 'launch 🚀', free: 'FREE!! 🎁', developer: 'code wizard 🧙',
      github: 'wizard vault 🧙', exam: 'boss battle 🎮', skill: 'superpower 🦸',
      security: 'fortress 🏰', performance: 'turbo boost ⚡',
    }
    const wrapHeadings = () => {
      document.querySelectorAll<HTMLElement>('h1,h2,h3').forEach(el => {
        if (el.dataset.bw || el.children.length > 0) return
        if (!isInViewport(el)) return
        let n: HTMLElement | null = el; let skip = false
        while (n) { if (window.getComputedStyle(n).position === 'fixed') { skip = true; break }; n = n.parentElement }
        if (skip) return
        const text = el.textContent?.trim(); if (!text) return
        el.dataset.bw = '1'
        el.innerHTML = text.split(' ').map(w => `<span data-ow="${w}" style="transition:color 0.2s;cursor:default">${w}</span>`).join(' ')
      })
    }
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement; if (!t.dataset.ow) return
      if (!isInViewport(t)) return
      const key = t.dataset.ow.toLowerCase().replace(/[^a-z]/g, '')
      if (map[key]) { t.textContent = map[key]; t.style.color = 'var(--color-primary)'; setMoodTemp('winking', 800) }
    }
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement; if (!t.dataset.ow) return
      t.textContent = t.dataset.ow; t.style.color = ''
    }
    const t1 = setTimeout(wrapHeadings, 1500)
    const t2 = setTimeout(wrapHeadings, 4000)
    const t3 = setTimeout(wrapHeadings, 8000)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); document.removeEventListener('mouseover', onOver); document.removeEventListener('mouseout', onOut) }
  }, [setMoodTemp])

  // ── idle loop ──
  useEffect(() => {
    const actions = [
      { w: 1, fn: () => { setMood('chasing'); setIsChasing(true); speak('I see you! 👀'); setTimeout(() => setIsChasing(false), 4000) } },
      { w: 2, fn: eatRandomWord },
      { w: 2, fn: flipHeading },
      { w: 2, fn: rainbowHeading },
      { w: 2, fn: wobbleEl },
      { w: 2, fn: glowEl },
      { w: 2, fn: trollButton },
      { w: 2, fn: shakeEl },
      { w: 2, fn: scrambleText },
      { w: 1, fn: invertPage },
      { w: 2, fn: startCursorTrail },
      { w: 2, fn: () => { speak(pick(['psst... submit a project! 🚀','hello! 👋','click me! 😊','need a cert? 📜',"I'm watching 👀",'try the exam! 🎮','ship it! 🚢'])); setMoodTemp('happy', 2000) } },
      { w: 1, fn: () => { setMood('excited'); speak('wheee! 🌀'); setScale(1.3); setRotation(360); setTimeout(() => { setRotation(0); setScale(1); setMood('idle') }, 1000) } },
      { w: 1, fn: () => { setMood('sleeping'); speak('zzz... 💤'); setTimeout(() => setMood('idle'), 3000) } },
    ]
    const totalW = actions.reduce((s, a) => s + a.w, 0)
    const pickAction = () => {
      let r = Math.random() * totalW
      for (const a of actions) { r -= a.w; if (r <= 0) return a.fn }
      return actions[0].fn
    }
    const loop = () => {
      try { pickAction()() } catch (e) { speak('oops, tricky page 🤔', 1500) }
      idleTimer.current = setTimeout(loop, 4500 + Math.random() * 5500)
    }
    idleTimer.current = setTimeout(loop, 5000)
    return () => clearTimeout(idleTimer.current)
  }, [eatRandomWord, flipHeading, rainbowHeading, wobbleEl, glowEl, trollButton, shakeEl, scrambleText, invertPage, startCursorTrail, speak, setMoodTemp])

  // ── click handler ──
  const handleClick = useCallback(() => {
    const fns = [eatRandomWord, flipHeading, rainbowHeading, wobbleEl, glowEl, trollButton, shakeEl, scrambleText, startCursorTrail,
      () => { setMoodTemp('excited', 2000); speak('yay! 🎉'); setScale(1.4); setTimeout(() => setScale(1), 300) },
      () => { setMoodTemp('dizzy', 2000); speak('dizzy! 😵'); setRotation(r => r + 720); setTimeout(() => setRotation(0), 1000) },
    ]
    pick(fns)()
  }, [eatRandomWord, flipHeading, rainbowHeading, wobbleEl, glowEl, trollButton, shakeEl, scrambleText, startCursorTrail, setMoodTemp, speak])

  useEffect(() => () => {
    clearTimeout(idleTimer.current)
    clearTimeout(speechTimer.current)
    cancelAnimationFrame(rafRef.current)
  }, [])

  // ─── RENDER ──────────────────────────────────────────────────
  const bodyBg = mood === 'sleeping' ? 'linear-gradient(135deg,#1A1A2E,#0F0F1A)'
    : mood === 'excited' || mood === 'eating' ? 'linear-gradient(135deg,#5EEAD4,#C084FC)'
    : mood === 'dizzy' ? 'linear-gradient(135deg,#EF4444,#FBBF54)'
    : 'linear-gradient(135deg,#13131F,#1E1E30)'
  const bodyBorder = mood === 'sleeping' ? 'rgba(108,99,255,0.2)'
    : mood === 'dizzy' ? 'rgba(239,68,68,0.6)'
    : mood === 'eating' || mood === 'excited' ? 'rgba(108,99,255,0.8)' : 'rgba(108,99,255,0.4)'
  const bodyShadow = mood === 'excited' || mood === 'eating'
    ? '0 0 24px rgba(108,99,255,0.6),0 0 48px rgba(108,99,255,0.2)'
    : mood === 'dizzy' ? '0 0 24px rgba(239,68,68,0.4)' : '0 0 16px rgba(108,99,255,0.2)'

  return (
    <motion.div
      style={{ position: 'fixed', left: springX, top: springY, zIndex: 9999, width: 64, height: 64, cursor: 'pointer', userSelect: 'none' }}
      onClick={handleClick}
      whileTap={{ scale: 0.85 }}
    >
      <AnimatePresence>
        {bubble && (
          <motion.div
            key={bubble}
            initial={{ opacity: 0, scale: 0.7, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              position: 'absolute', bottom: 74, left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg,#1A1A2E,#13131F)',
              border: '1.5px solid rgba(108,99,255,0.5)', borderRadius: 12,
              padding: '6px 12px', fontSize: 12, color: BOT_TEXT,
              textAlign: 'center', boxShadow: '0 4px 20px rgba(108,99,255,0.25)',
              whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10001,
            }}
          >
            {bubble}
            <div style={{ position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)', width: 12, height: 7, background: '#1A1A2E', clipPath: 'polygon(0 0,100% 0,50% 100%)' }}/>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ rotate: rotation, scale }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{
          width: 64, height: 64, borderRadius: 20, background: bodyBg,
          border: `2px solid ${bodyBorder}`, boxShadow: bodyShadow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          transition: 'background 0.3s,border-color 0.3s,box-shadow 0.3s',
        }}
      >
        <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', width: 2, height: 10, background: 'rgba(108,99,255,0.6)', borderRadius: 1 }}>
          <motion.div
            animate={{ scale: [1,1.4,1], opacity: [0.6,1,0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)',
              width: 6, height: 6, borderRadius: '50%',
              background: mood === 'dizzy' ? '#EF4444' : mood === 'sleeping' ? '#8B93A5' : '#5EEAD4',
              boxShadow: `0 0 6px ${mood === 'dizzy' ? '#EF4444' : '#5EEAD4'}`,
            }}
          />
        </div>
        <div style={{ position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)', width: 8, height: 20, borderRadius: '4px 0 0 4px', background: 'rgba(108,99,255,0.3)', border: '1px solid rgba(108,99,255,0.4)' }}/>
        <div style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 8, height: 20, borderRadius: '0 4px 4px 0', background: 'rgba(108,99,255,0.3)', border: '1px solid rgba(108,99,255,0.4)' }}/>
        <BotFace mood={mood} blinking={blinking}/>
        {(mood === 'excited' || mood === 'eating') && (
          <motion.div
            animate={{ x: [-80,80] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)', pointerEvents: 'none' }}
          />
        )}
      </motion.div>

      <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 40, height: 8, borderRadius: '50%', background: 'rgba(108,99,255,0.15)', filter: 'blur(4px)' }}/>
    </motion.div>
  )
}

export default DevBot
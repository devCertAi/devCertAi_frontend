import { useEffect, useState, useRef } from 'react'
import { useInView } from 'framer-motion'
import { ReactNode } from 'react'

interface CategoryFlipCardProps {
  icon: ReactNode
  title: string
  desc: string
  score: number
  color: string
  checks: string[]
  delay?: number
}

function grade(score: number) {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  return 'D'
}

/** Small certificate seal — same visual language as the real certificate emblem. */
function CertSeal({ color }: { color: string }) {
  return (
    <svg width="56" height="56" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="29" cy="29" r="27" stroke={color} strokeWidth="0.8" opacity="0.7" />
      <circle cx="29" cy="29" r="22" stroke={color} strokeWidth="0.5" opacity="0.4" />
      <circle cx="29" cy="29" r="10" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <path
        d="M29 4 L30.5 16 L41 8 L34 19 L46 21 L35 26 L40 37 L29 31 L18 37 L23 26 L12 21 L24 19 L17 8 L27.5 16 Z"
        fill={color} opacity="0.18"
      />
      <text x="29" y="33" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontSize="9" fill={color} fontWeight={700} opacity="0.95">DC</text>
    </svg>
  )
}

export function CategoryFlipCard({ icon, title, desc, score, color, checks, delay = 0 }: CategoryFlipCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const inView = useInView(cardRef, { once: true, margin: '-60px' })
  const [flipped, setFlipped] = useState(false)
  const [hasAutoFlipped, setHasAutoFlipped] = useState(false)

  // automatic flip shortly after the card enters view, then settles back
  useEffect(() => {
    if (!inView || hasAutoFlipped) return
    const flipIn = setTimeout(() => setFlipped(true), 600 + delay * 1000)
    const flipOut = setTimeout(() => { setFlipped(false); setHasAutoFlipped(true) }, 2600 + delay * 1000)
    return () => { clearTimeout(flipIn); clearTimeout(flipOut) }
  }, [inView, hasAutoFlipped, delay])

  return (
    <div
      ref={cardRef}
      className="flip-card-scene glow-card rounded-2xl"
      style={{ height: 340, '--glow-card-color': color } as React.CSSProperties}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped(f => !f)}
    >
      <div className={`flip-card-inner${flipped ? ' is-flipped' : ''}`}>
        {/* ── FRONT ── */}
        <div
          className="flip-card-face flex flex-col p-[22px] rounded-2xl cursor-pointer"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>{icon}</div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h3>
          </div>
          <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{desc}</p>

          <ul className="flex flex-col gap-1.5 mb-4">
            {checks.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] leading-snug" style={{ color: 'var(--color-muted)' }}>
                <span className="mt-[5px] w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: color }} />
                {c}
              </li>
            ))}
          </ul>

          <div className="mt-auto">
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
              <span>Avg score</span><span style={{ color }}>{score}/100</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(127,127,127,.15)' }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: inView ? `${score}%` : '0%', backgroundColor: color }} />
            </div>
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          className="flip-card-face flip-card-back flex flex-col items-center justify-center text-center p-[22px] rounded-2xl cursor-pointer"
          style={{
            background: `linear-gradient(165deg, color-mix(in srgb, ${color} 16%, var(--color-surface)), var(--color-surface2))`,
            border: `1px solid color-mix(in srgb, ${color} 45%, var(--color-border))`,
          }}
        >
          <CertSeal color={color} />
          <div className="font-mono text-[10px] uppercase tracking-[.12em] mt-3 mb-1" style={{ color: 'var(--color-muted)' }}>
            {title} · Verified
          </div>
          <div className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 44, color, lineHeight: 1 }}>
            {score}
          </div>
          <div className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>out of 100</div>
          <span
            className="font-mono text-[11px] px-3 py-1 rounded-full"
            style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 40%, transparent)` }}
          >
            Grade {grade(score)}
          </span>
        </div>
      </div>
    </div>
  )
}
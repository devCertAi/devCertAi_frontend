import { useEffect, useRef, useState } from 'react'

const BLOCKS = [
  { t: 'repo', c: '#5EEAD4', top: 86 },
  { t: 'quality', c: '#8B7CF6', top: 40 },
  { t: 'architecture', c: '#8B7CF6', top: -6 },
  { t: 'security', c: '#EF4444', top: -52 },
  { t: 'score: 77', c: '#FBBF54', top: -98 },
]

const BLOCK_DELAY = 0.35
const BLOCK_DURATION = 0.95
const START_DELAY = 0.1

const WIDTH = 134
const HEIGHT = 44
const DEPTH = 54

const BASE_RX = -18   // constant X tilt so we always see the top face
const BASE_RY = -32   // constant Y tilt so we always see a side face

export function BuildTower() {
  const [inView, setInView] = useState(false)
  const [assembled, setAssembled] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    const totalTime =
      (START_DELAY + (BLOCKS.length - 1) * BLOCK_DELAY + BLOCK_DURATION) * 1000
    const timer = setTimeout(() => setAssembled(true), totalTime + 150)
    return () => clearTimeout(timer)
  }, [inView])

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center h-[360px] mt-[46px]"
      style={{ perspective: 1200 }}
    >
      <div
        className="relative"
        style={{
          width: 210,
          height: 250,
          transformStyle: 'preserve-3d',
          // always tilted in 3/4 view — never viewed dead-on, so depth is
          // always visible, both before and during the spin
          transform: assembled ? undefined : `rotateX(${BASE_RX}deg) rotateY(${BASE_RY}deg)`,
          animation: assembled ? 'towerSpin 14s linear infinite' : 'none',
          transition: 'filter .6s ease',
          filter: assembled ? 'drop-shadow(0 10px 18px rgba(0,0,0,.35))' : 'none',
        }}
      >
        {BLOCKS.map((b, i) => (
          <div
            key={b.t}
            className="absolute left-1/2"
            style={{
              top: `calc(50% + ${b.top}px)`,
              width: WIDTH,
              height: HEIGHT,
              marginLeft: -WIDTH / 2,
              transformStyle: 'preserve-3d',
              opacity: 0,
              animation: inView
                ? `blockFlyIn ${BLOCK_DURATION}s cubic-bezier(.22,.85,.25,1) forwards`
                : 'none',
              animationDelay: `${START_DELAY + i * BLOCK_DELAY}s`,
            }}
          >
            {/* front */}
            <div
              className="absolute inset-0 rounded-[6px] flex items-center justify-center gap-1.5 font-mono text-[10.5px] text-[var(--color-inverse)] font-bold"
              style={{
                background: b.c,
                transform: `translateZ(${DEPTH / 2}px)`,
                backfaceVisibility: 'hidden',
              }}
            >
              {b.t}
            </div>

            {/* back */}
            <div
              className="absolute inset-0 rounded-[6px]"
              style={{
                background: b.c,
                transform: `translateZ(${-DEPTH / 2}px) rotateY(180deg)`,
                filter: 'brightness(.55)',
                backfaceVisibility: 'hidden',
              }}
            />

            {/* right */}
            <div
              className="absolute top-0 rounded-[6px]"
              style={{
                width: DEPTH,
                height: HEIGHT,
                left: '50%',
                marginLeft: -DEPTH / 2,
                background: b.c,
                filter: 'brightness(.42)',
                transform: `rotateY(90deg) translateZ(${WIDTH / 2}px)`,
                backfaceVisibility: 'hidden',
              }}
            />

            {/* left */}
            <div
              className="absolute top-0 rounded-[6px]"
              style={{
                width: DEPTH,
                height: HEIGHT,
                left: '50%',
                marginLeft: -DEPTH / 2,
                background: b.c,
                filter: 'brightness(.42)',
                transform: `rotateY(-90deg) translateZ(${WIDTH / 2}px)`,
                backfaceVisibility: 'hidden',
              }}
            />

            {/* top */}
            <div
              className="absolute left-0 rounded-[6px]"
              style={{
                width: WIDTH,
                height: DEPTH,
                top: '50%',
                marginTop: -DEPTH / 2,
                background: b.c,
                filter: 'brightness(.8)',
                transform: `rotateX(90deg) translateZ(${HEIGHT / 2}px)`,
                backfaceVisibility: 'hidden',
              }}
            />

            {/* bottom */}
            <div
              className="absolute left-0 rounded-[6px]"
              style={{
                width: WIDTH,
                height: DEPTH,
                top: '50%',
                marginTop: -DEPTH / 2,
                background: b.c,
                filter: 'brightness(.28)',
                transform: `rotateX(-90deg) translateZ(${HEIGHT / 2}px)`,
                backfaceVisibility: 'hidden',
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes towerSpin {
          from { transform: rotateY(${BASE_RY}deg) rotateX(${BASE_RX}deg); }
          to   { transform: rotateY(${BASE_RY + 360}deg) rotateX(${BASE_RX}deg); }
        }

        @keyframes blockFlyIn {
          0% {
            opacity: 0;
            transform: translateX(-440px) translateZ(-60px) rotateY(45deg)
                       scaleX(.6) scaleY(1.5) scaleZ(.6);
          }
          35% {
            opacity: 1;
            transform: translateX(30px) translateZ(10px) rotateY(-10deg)
                       scaleX(1.22) scaleY(.78) scaleZ(1.15);
          }
          55% {
            transform: translateX(-14px) rotateY(5deg)
                       scaleX(.9) scaleY(1.1) scaleZ(.92);
          }
          72% {
            transform: translateX(6px) rotateY(-2deg)
                       scaleX(1.05) scaleY(.95) scaleZ(1.03);
          }
          88% {
            transform: translateX(-2px) scaleX(.98) scaleY(1.02) scaleZ(.99);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateZ(0) rotateY(0deg)
                       scaleX(1) scaleY(1) scaleZ(1);
          }
        }
      `}</style>
    </div>
  )
}
import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor } from 'lucide-react'
import { DOMAINS } from '@/lib/constants'

type Role = 'front' | 'mid' | 'back'

// resting transform for each slot in the stack — front is fully visible,
// mid/back recede in depth and fan out slightly behind it
const ROLE_TARGET: Record<Role, { x: number; y: number; z: number; rotate: number; scale: number; opacity: number; zIndex: number }> = {
  front: { x: 0, y: 0, z: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 6 },
  mid: { x: 34, y: 30, z: -46, rotate: -7, scale: 0.93, opacity: 0.85, zIndex: 4 },
  back: { x: 64, y: 56, z: -96, rotate: 12, scale: 0.86, opacity: 0.62, zIndex: 3 },
}

// where a brand-new card "deals in" from — off to the right of the deck,
// mirroring the back-card-peels-out motion
const OFFSTAGE = { x: 240, y: -50, z: 70, rotate: 22, scale: 0.88, opacity: 0, zIndex: 7 }
// the apex of the arc as a card swoops up and over to become the new front
const ARC_PEAK = { x: 76, y: -90, z: 120, rotate: -16, scale: 1.08, opacity: 1, zIndex: 7 }
// where the dropped (oldest) card exits to
const EXIT_TARGET = { x: 56, y: 64, z: -150, rotate: 6, scale: 0.78, opacity: 0, zIndex: 1 }

const DEAL_DURATION = 0.95

const ROLE_PLACEHOLDER: Record<Role, string> = {
  front: '',
  mid: 'Running test suite…',
  back: 'Scanning dependencies…',
}

function subMetrics(avgScore: number) {
  const clamp = (v: number) => Math.max(38, Math.min(99, v))
  return [
    { label: 'Architecture', value: clamp(avgScore - 7) },
    { label: 'Code quality', value: clamp(avgScore + 9) },
    { label: 'Test coverage', value: clamp(avgScore - 16) },
  ]
}

// bring `idx` to the front; if it's already in the stack it's promoted
// in place, otherwise it's dealt in fresh and the oldest card is dropped
function nextOrder(idx: number, current: number[]) {
  const rest = current.filter((o) => o !== idx)
  return [idx, ...rest].slice(0, 3)
}

export function HeroDomainStack() {
  const arenaRef = useRef<HTMLDivElement>(null)
  const [order, setOrder] = useState<number[]>([0, 1, 2]) // [front, mid, back] domain indices
  const nextIdxRef = useRef(3)
  const [isAnimating, setIsAnimating] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [meterFilled, setMeterFilled] = useState(true)
  const [hovering, setHovering] = useState(false)

  // live yaw/roll while the user is actively dragging to rotate the deck —
  // spinning it far enough is what pulls the back card around to the front
  const [liveRotate, setLiveRotate] = useState({ yaw: 0, roll: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ down: false, lastX: 0, moved: 0, deg: 0, triggered: false })

  // gentle ambient sway so the cards behind the front one are visible even
  // without the user touching the deck
  const [idleYaw, setIdleYaw] = useState(0)
  useEffect(() => {
    let raf: number
    const tick = (t: number) => {
      if (!hovering && !isDragging && !isAnimating) {
        setIdleYaw(Math.sin(t / 1700) * 8)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [hovering, isDragging, isAnimating])

  // metadata for whichever card is currently dealing itself in to the
  // front slot, so we know which arc to animate it through
  const enteringRef = useRef<{ id: number; cameFromRole: Role | null } | null>(null)

  const doAdvance = useCallback((forceIdx?: number) => {
    if (isAnimating) return
    const domainIdx = forceIdx !== undefined ? forceIdx : nextIdxRef.current
    if (forceIdx === undefined) {
      nextIdxRef.current = (nextIdxRef.current + 1) % DOMAINS.length
    }

    const prevSlot = order.indexOf(domainIdx)
    const cameFromRole: Role | null = prevSlot === -1 ? null : (['front', 'mid', 'back'][prevSlot] as Role)
    enteringRef.current = { id: domainIdx, cameFromRole }

    setMeterFilled(false)
    setIsAnimating(true)
    setOrder((prev) => nextOrder(domainIdx, prev))
  }, [isAnimating, order])

  const handleFrontClick = () => doAdvance()
  const handleTabClick = (idx: number) => {
    if (idx === order[0] || isAnimating) return
    doAdvance(idx)
  }

  // auto-cycle
  useEffect(() => {
    const id = setInterval(() => {
      if (!isAnimating && !hovering) doAdvance()
    }, 1500)
    return () => clearInterval(id)
  }, [isAnimating, hovering, doAdvance])

  const onMouseMove = (e: React.MouseEvent | React.PointerEvent) => {
    if (!arenaRef.current) return
    const r = arenaRef.current.getBoundingClientRect()
    setTilt({
      x: (e.clientY - r.top) / r.height - 0.5,
      y: (e.clientX - r.left) / r.width - 0.5,
    })
    if (!hovering) setHovering(true)
  }
  const onMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setHovering(false)
  }

  const onFrontLanded = () => {
    setIsAnimating(false)
    enteringRef.current = null
    setTimeout(() => setMeterFilled(true), 100)
  }

  // drag-to-rotate: spin the whole deck around Y; cross the threshold and
  // the back card swings around the front, same arc the auto-deal uses
  const ROTATE_THRESHOLD = 58

  const onArenaPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { down: true, lastX: e.clientX, moved: 0, deg: 0, triggered: false }
    setIsDragging(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onArenaPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.down) {
      onMouseMove(e)
      return
    }
    const dx = e.clientX - dragRef.current.lastX
    dragRef.current.lastX = e.clientX
    dragRef.current.moved += Math.abs(dx)
    dragRef.current.deg += dx * 0.6
    setLiveRotate({ yaw: dragRef.current.deg, roll: dragRef.current.deg * 0.12 })

    if (!dragRef.current.triggered && !isAnimating && Math.abs(dragRef.current.deg) > ROTATE_THRESHOLD) {
      dragRef.current.triggered = true
      doAdvance(order[2]) // rotate the current back card around to the front
    }
  }

  const onArenaPointerUp = () => {
    const wasClick = dragRef.current.down && dragRef.current.moved < 6
    dragRef.current.down = false
    setIsDragging(false)
    setLiveRotate({ yaw: 0, roll: 0 })
    if (wasClick) handleFrontClick()
  }

  const onArenaPointerLeave = () => {
    if (dragRef.current.down) {
      dragRef.current.down = false
      setIsDragging(false)
      setLiveRotate({ yaw: 0, roll: 0 })
    }
    onMouseLeave()
  }

  const arenaTransform =
    `rotateX(${4 - tilt.x * 10}deg) ` +
    `rotateY(${-8 + tilt.y * 12 + liveRotate.yaw}deg) ` +
    `rotateZ(${liveRotate.roll}deg)`

  return (
    <div className="flex flex-col items-center justify-center gap-[18px] min-h-[420px] sm:min-h-[540px]">
      {/* context tabs */}
      <div className="flex gap-1.5 flex-wrap justify-center max-w-[360px]">
        {DOMAINS.map((d, i) => (
          <button
            key={d.id}
            onClick={() => handleTabClick(i)}
            className="font-mono text-[10.5px] px-[11px] py-1.5 rounded-md transition-all"
            style={{
              border: `1px solid ${i === order[0] ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color: i === order[0] ? 'var(--color-primary)' : 'var(--color-muted)',
              background: i === order[0] ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'var(--color-surface)',
            }}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* stack arena — was a hard-coded 340×430, which overflows on phones
          narrower than ~375px (the hero's own px-4 padding only leaves
          ~288px there). Scale it down with clamp() instead, keeping the
          same aspect ratio, so it never exceeds the viewport. */}
      <div className="relative" style={{ width: 'clamp(240px, 78vw, 340px)', height: 'clamp(304px, 99vw, 430px)', perspective: 1300 }}>
        <div
          ref={arenaRef}
          className="relative w-full h-full hero-stack-arena"
          style={{
            transformStyle: 'preserve-3d',
            transform: arenaTransform,
            transition: isDragging ? 'none' : 'transform .45s cubic-bezier(.22,.85,.3,1)',
            animationPlayState: hovering || isAnimating || isDragging ? 'paused' : 'running',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'pan-y',
          }}
          onPointerDown={onArenaPointerDown}
          onPointerMove={onArenaPointerMove}
          onPointerUp={onArenaPointerUp}
          onPointerLeave={onArenaPointerLeave}
        >
          {/* ambient glow that intensifies while a card is being dealt in */}
          <div
            className="absolute -inset-10 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, color-mix(in srgb, var(--color-primary) ${isAnimating ? 22 : 12}%, transparent), transparent 70%)`,
              filter: 'blur(30px)',
              transition: 'background 0.4s ease',
            }}
          />

          <AnimatePresence>
            {order.map((domainIdx, slotPos) => {
              const role: Role = (['front', 'mid', 'back'] as Role[])[slotPos]
              const domain = DOMAINS[domainIdx]
              const Icon = domain.icon || Monitor
              const isFront = role === 'front'
              const metrics = subMetrics(domain.avgScore)

              const isEntering = isAnimating && enteringRef.current?.id === domainIdx && isFront
              const cameFrom = enteringRef.current?.cameFromRole ?? null
              const start = isEntering ? (cameFrom ? ROLE_TARGET[cameFrom] : OFFSTAGE) : null

              const target = ROLE_TARGET[role]

              return (
                <motion.div
                  key={domain.id}
                  className="absolute left-0 top-0 w-full h-full rounded-[18px] p-[26px] flex flex-col"
                  style={{
                    background: 'linear-gradient(155deg, var(--color-surface), var(--color-surface2))',
                    border: '1px solid var(--color-border)',
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                  }}
                  initial={isEntering ? (start as object) : target}
                  animate={
                    isEntering
                      ? {
                          x: [start!.x, ARC_PEAK.x, target.x],
                          y: [start!.y, ARC_PEAK.y, target.y],
                          z: [start!.z, ARC_PEAK.z, target.z],
                          rotate: [start!.rotate, ARC_PEAK.rotate, target.rotate],
                          scale: [start!.scale, ARC_PEAK.scale, target.scale],
                          opacity: [start!.opacity, 1, target.opacity],
                          zIndex: target.zIndex,
                        }
                      : { ...target }
                  }
                  exit={EXIT_TARGET}
                  transition={
                    isEntering
                      ? { duration: DEAL_DURATION, times: [0, 0.42, 1], ease: ['easeOut', 'easeInOut'] }
                      : { type: 'spring', stiffness: 210, damping: 24 }
                  }
                  onAnimationComplete={() => { if (isEntering) onFrontLanded() }}
                >
                  {/* comet glow trailing the dealt-in card */}
                  {isEntering && (
                    <motion.div
                      className="absolute -inset-6 rounded-[24px] pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, color-mix(in srgb, ${domain.color} 55%, transparent), transparent 70%)`,
                        filter: 'blur(20px)',
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0, 0.9, 0], scale: [0.8, 1.5, 1.05] }}
                      transition={{ duration: DEAL_DURATION, times: [0, 0.45, 1] }}
                    />
                  )}

                  <div
                    className="absolute inset-0 rounded-[18px] pointer-events-none"
                    style={{
                      boxShadow: isFront && hovering
                        ? `var(--shadow-panel), 0 0 32px color-mix(in srgb, ${domain.color} 30%, transparent)`
                        : 'var(--shadow-panel)',
                      transition: 'box-shadow .35s ease',
                    }}
                  />

                  <div className="flex justify-between items-center mb-[18px]">
                    <div
                      className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                      style={{ background: `color-mix(in srgb, ${domain.color} 18%, transparent)`, color: domain.color }}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-[11px] px-2.5 py-1 rounded-[5px] inline-flex items-center gap-1.5"
                        style={{ background: `color-mix(in srgb, ${domain.color} 14%, transparent)`, color: domain.color }}
                      >
                        DOMAIN
                      </span>
                      <span
                        className="w-[9px] h-[9px] rounded-full flex-shrink-0"
                        style={{
                          background: 'var(--color-warning)',
                          boxShadow: '0 0 10px var(--color-warning)',
                          animation: 'cardStatusPulse 1.8s ease-in-out infinite',
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className="text-[18px] font-semibold mb-1.5"
                    style={{ color: 'var(--color-text)', fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {domain.name}
                  </div>

                  {isFront ? (
                    <>
                      <div className="text-[12.5px] mb-[16px] leading-[1.55]" style={{ color: 'var(--color-muted)' }}>
                        {domain.description}
                      </div>
                      <div className="flex flex-col gap-[9px] mb-3">
                        {metrics.map((m, mi) => (
                          <div key={m.label} className="flex items-center gap-2.5">
                            <span className="font-mono text-[10px] w-[84px] flex-shrink-0" style={{ color: 'var(--color-muted)' }}>{m.label}</span>
                            <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(127,127,127,.15)' }}>
                              <div
                                className="h-full rounded-full transition-[width] ease-out"
                                style={{
                                  width: meterFilled ? `${m.value}%` : '0%',
                                  background: `linear-gradient(90deg, ${domain.color}, var(--color-secondary))`,
                                  transitionDuration: '1.1s',
                                  transitionDelay: `${mi * 0.12}s`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-[12px] italic mb-[16px] font-mono" style={{ color: 'var(--color-muted)' }}>
                      {ROLE_PLACEHOLDER[role]}
                    </div>
                  )}

                  <div className="mt-auto flex items-baseline gap-2 font-mono pt-2">
                    <b className="text-[30px]" style={{ color: domain.color }}>{domain.avgScore}</b>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>/ 100 · avg score</span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        <div
          className="absolute -bottom-[30px] left-0 right-0 text-center font-mono text-[10.5px] opacity-70"
          style={{ color: 'var(--color-muted)' }}
        >
          Drag to rotate · click to deal the next one in
        </div>
      </div>

      <style>{`@keyframes cardStatusPulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }`}</style>
    </div>
  )
}
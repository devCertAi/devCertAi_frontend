import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Cpu } from 'lucide-react'

/**
 * A floating, glowing, draggable 3D object that sits behind/within the
 * hero. Built with pure CSS 3D transforms (no extra runtime deps), so it
 * stays lightweight while still feeling like a real interactive object:
 *  - idle auto-rotation + bob
 *  - drag-to-spin with momentum
 *  - parallax tilt that follows the pointer when not dragging
 *  - a soft glow field behind it that drifts independently
 */

const FACE_COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-purple)',
  'var(--color-success)',
]

export function Hero3DObject() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ active: boolean; lastX: number; lastY: number; vx: number; vy: number }>({
    active: false, lastX: 0, lastY: 0, vx: 0, vy: 0,
  })

  const rotateX = useMotionValue(-18)
  const rotateY = useMotionValue(28)
  const springX = useSpring(rotateX, { stiffness: 60, damping: 16 })
  const springY = useSpring(rotateY, { stiffness: 60, damping: 16 })

  const [isDragging, setIsDragging] = useState(false)
  const autoSpin = useRef(0.18)

  // idle auto-rotation, paused while the user is dragging
  useEffect(() => {
    let raf: number
    const tick = () => {
      if (!dragState.current.active) {
        rotateY.set(rotateY.get() + autoSpin.current)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [rotateY])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragState.current = { active: true, lastX: e.clientX, lastY: e.clientY, vx: 0, vy: 0 }
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.active) return
    const dx = e.clientX - dragState.current.lastX
    const dy = e.clientY - dragState.current.lastY
    dragState.current.vx = dx
    dragState.current.vy = dy
    dragState.current.lastX = e.clientX
    dragState.current.lastY = e.clientY
    rotateY.set(rotateY.get() + dx * 0.5)
    rotateX.set(Math.max(-60, Math.min(60, rotateX.get() - dy * 0.5)))
  }, [rotateX, rotateY])

  const endDrag = useCallback(() => {
    if (!dragState.current.active) return
    dragState.current.active = false
    setIsDragging(false)
    // a little momentum so the release feels alive
    autoSpin.current = Math.max(-3, Math.min(3, dragState.current.vx * 0.15)) || 0.18
    setTimeout(() => { autoSpin.current = 0.18 }, 1400)
  }, [])

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* floating glow field behind the object */}
      <div
        className="absolute rounded-full"
        style={{
          width: 420, height: 420,
          background: 'radial-gradient(circle, var(--glow-primary), transparent 70%)',
          filter: 'blur(10px)',
          animation: 'floatGlow 7s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 280, height: 280,
          background: 'radial-gradient(circle, var(--glow-secondary), transparent 72%)',
          filter: 'blur(6px)',
          animation: 'floatGlow 9s ease-in-out infinite reverse',
          transform: 'translate(60px,40px)',
        }}
      />

      {/* the object itself — draggable, so it needs pointer events */}
      <motion.div
        className="relative pointer-events-auto"
        style={{
          width: 190, height: 190,
          animation: 'floatY 5.5s ease-in-out infinite',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        whileHover={{ scale: 1.04 }}
      >
        <div
          ref={sceneRef}
          className="absolute inset-0"
          style={{ perspective: 900 }}
        >
          <motion.div
            className="relative w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              rotateX: springX,
              rotateY: springY,
            }}
          >
            {/* 4 faces of an open glowing prism, evenly spaced around Y */}
            {FACE_COLORS.map((color, i) => (
              <div
                key={i}
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{
                  background: `linear-gradient(155deg, color-mix(in srgb, ${color} 22%, var(--color-surface)), color-mix(in srgb, ${color} 6%, var(--color-surface2)))`,
                  border: `1px solid color-mix(in srgb, ${color} 55%, transparent)`,
                  boxShadow: `0 0 40px color-mix(in srgb, ${color} 35%, transparent), inset 0 0 30px color-mix(in srgb, ${color} 12%, transparent)`,
                  transform: `rotateY(${i * 90}deg) translateZ(95px)`,
                  backfaceVisibility: 'hidden',
                }}
              >
                <Cpu size={34} strokeWidth={1.5} style={{ color, opacity: 0.9 }} />
              </div>
            ))}
            {/* top + bottom caps to suggest closed volume */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'color-mix(in srgb, var(--color-primary) 14%, var(--color-surface))',
                border: '1px solid var(--color-border)',
                transform: 'rotateX(90deg) translateZ(95px)',
                boxShadow: '0 0 30px var(--glow-primary)',
              }}
            />
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'color-mix(in srgb, var(--color-secondary) 14%, var(--color-surface))',
                border: '1px solid var(--color-border)',
                transform: 'rotateX(-90deg) translateZ(95px)',
                boxShadow: '0 0 30px var(--glow-secondary)',
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

const CODE_LINES = [
  'const result = await evaluate("your-project");',
  'analyzeCodeQuality(repo.files);',
  'checkArchitecture(repo.structure);',
  'scanSecurity(repo.dependencies);',
  'return result.score',
]

const KEYWORDS = ['const', 'await', 'return']
const FUNCS = ['evaluate', 'analyzeCodeQuality', 'checkArchitecture', 'scanSecurity']

function highlight(line: string) {
  let html = line
  // strings first
  html = html.replace(/"([^"]*)"/g, '<span style="color:var(--color-warning)">"$1"</span>')
  KEYWORDS.forEach((kw) => {
    html = html.replace(new RegExp(`\\b${kw}\\b`, 'g'), `<span style="color:var(--color-purple)">${kw}</span>`)
  })
  FUNCS.forEach((fn) => {
    html = html.replace(new RegExp(`\\b${fn}\\b(?![^<]*>)`, 'g'), `<span style="color:var(--color-secondary)">${fn}</span>`)
  })
  return html
}

function RadialGauge({ value, color, label }: { value: number; color: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)
  const circumference = 251

  useEffect(() => {
    if (!inView) return
    let v = 0
    const step = () => {
      v = Math.min(v + 2, value)
      setCount(v)
      if (v < value) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, value])

  return (
    <div ref={ref} className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(127,127,127,.15)" strokeWidth="8" />
          <circle
            cx="45" cy="45" r="40" fill="none" strokeWidth="8" strokeLinecap="round"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={inView ? circumference - (circumference * value) / 100 : circumference}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center font-mono text-[17px] font-bold"
          style={{ color: 'var(--color-text)' }}
        >
          {count}
        </div>
      </div>
      <div className="font-mono text-[10px] text-center" style={{ color: 'var(--color-muted)' }}>{label}</div>
    </div>
  )
}

function VBar({ value, color, label }: { value: number; color: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  return (
    <div ref={ref} className="flex flex-col items-center gap-[7px] h-full justify-end">
      <div
        className="w-[18px] rounded-[5px_5px_2px_2px] transition-[height] duration-[1400ms] ease-out"
        style={{ height: inView ? `${value}%` : '0%', background: color }}
      />
      <span className="font-mono text-[9px] text-center leading-tight" style={{ color: 'var(--color-muted)' }}>
        {label}<br />{value}
      </span>
    </div>
  )
}

function TypedCode() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [lines, setLines] = useState<string[]>([])
  const [currentPartial, setCurrentPartial] = useState('')
  const startedRef = useRef(false)

  useEffect(() => {
    if (!inView || startedRef.current) return
    startedRef.current = true
    let cancelled = false

    async function run() {
      for (const line of CODE_LINES) {
        let cur = ''
        for (let i = 0; i < line.length; i++) {
          if (cancelled) return
          cur += line[i]
          setCurrentPartial(cur)
          await new Promise((r) => setTimeout(r, 16))
        }
        setLines((prev) => [...prev, cur])
        setCurrentPartial('')
        await new Promise((r) => setTimeout(r, 110))
      }
    }
    run()
    return () => { cancelled = true }
  }, [inView])

  return (
    <div ref={ref} className="font-mono text-[12.5px] leading-[2] min-h-[150px]" style={{ color: 'var(--color-muted)' }}>
      {lines.map((l, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: highlight(l) }} />
      ))}
      {currentPartial && (
        <div>
          <span dangerouslySetInnerHTML={{ __html: highlight(currentPartial) }} />
          <span className="inline-block w-[5px] h-[0.9em] ml-[2px] align-middle" style={{ background: 'var(--color-primary)', animation: 'blinkCursor 1s step-end infinite' }} />
        </div>
      )}
      <style>{`@keyframes blinkCursor { 50% { opacity: 0; } }`}</style>
    </div>
  )
}

interface EvalPanelProps {
  radials: { label: string; value: number; color: string }[]
  bars: { label: string; value: number; color: string }[]
  overall: number
}

export function EvalPanel({ radials, bars, overall }: EvalPanelProps) {
  return (
    <div
      className="rounded-[20px] overflow-hidden"
      style={{ background: 'linear-gradient(155deg, var(--color-surface), var(--color-bg-2))', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-panel)' }}
    >
      <div className="flex gap-[7px] px-4 py-[13px]">
        <span className="w-[9px] h-[9px] rounded-full" style={{ background: 'var(--color-border)' }} />
        <span className="w-[9px] h-[9px] rounded-full" style={{ background: 'var(--color-border)' }} />
        <span className="w-[9px] h-[9px] rounded-full" style={{ background: 'var(--color-border)' }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="p-[34px]" style={{ borderRight: '1px solid var(--color-border)' }}>
          <div className="font-mono text-[11px] mb-4" style={{ color: 'var(--color-muted)' }}>evaluator.run(submission)</div>
          <TypedCode />
        </div>
        <div className="p-[34px] flex flex-col items-center gap-5 justify-center">
          <div className="flex gap-[18px]">
            {radials.map((r) => (
              <RadialGauge key={r.label} value={r.value} color={r.color} label={r.label} />
            ))}
          </div>
          <div className="flex items-end gap-[15px] h-[84px]">
            {bars.map((b) => (
              <VBar key={b.label} value={b.value} color={b.color} label={b.label} />
            ))}
          </div>
          <div
            className="px-[18px] py-[15px] rounded-[10px] w-full flex items-center justify-between"
            style={{ background: 'color-mix(in srgb, var(--color-primary) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)' }}
          >
            <span className="font-mono text-[10.5px]" style={{ color: 'var(--color-muted)' }}>OVERALL VERDICT</span>
            <b className="text-[16px]" style={{ color: 'var(--color-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>{overall} · Certified</b>
          </div>
        </div>
      </div>
    </div>
  )
}

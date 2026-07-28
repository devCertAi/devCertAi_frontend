import { useEffect, useState, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Clock, Calendar as CalendarIcon } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function pad(n: number) { return String(n).padStart(2, '0') }

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

function parseDate(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate(), h: d.getHours(), min: d.getMinutes() }
}

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOfWeek(y: number, m: number) { return new Date(y, m, 1).getDay() }

// ─── Modern Calendar Dropdown ─────────────────────────────────────────────────
function CalendarDropdown({ value, onChange, minDate }: {
  value: string
  onChange: (dateStr: string) => void
  minDate?: string
}) {
  const parsed = parseDate(value + 'T00:00')
  const today = new Date()
  const [view, setView] = useState({ y: parsed?.y ?? today.getFullYear(), m: parsed?.m ?? today.getMonth() })
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Escape key to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // Sync view with selected date
  useEffect(() => {
    if (parsed) setView({ y: parsed.y, m: parsed.m })
  }, [value])

  const minParsed = minDate ? parseDate(minDate + 'T00:00') : null
  const daysInMonth = getDaysInMonth(view.y, view.m)
  const firstDay = getFirstDayOfWeek(view.y, view.m)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const select = (d: number) => {
    if (minParsed && new Date(view.y, view.m, d) < new Date(minParsed.y, minParsed.m, minParsed.d)) return
    onChange(toDateStr(view.y, view.m, d))
    setOpen(false)
    buttonRef.current?.focus()
  }

  const display = parsed ? `${MONTHS[parsed.m]} ${parsed.d}, ${parsed.y}` : 'Select date'

  return (
    <div ref={ref} className="relative flex-1">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="w-full flex items-center justify-between bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all hover:border-[var(--color-primary)]/50"
      >
        <span className={parsed ? 'text-[var(--color-text)] font-medium' : 'text-[var(--color-muted)]'}>{display}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--color-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div 
          role="dialog"
          aria-modal="false"
          aria-label="Calendar"
          className="absolute z-50 mt-2 rounded-2xl border border-[var(--color-border)] shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200"
          style={{ background: 'var(--color-surface)', width: 300 }}
        >
          <div className="flex items-center justify-between mb-4">
            <button 
              type="button" 
              onClick={() => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 })}
              aria-label="Previous month"
              className="p-2 rounded-xl hover:bg-[var(--color-surface2)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <ChevronLeft size={18} className="text-[var(--color-muted)]" />
            </button>
            <span className="text-sm font-semibold text-[var(--color-text)]">{MONTHS[view.m]} {view.y}</span>
            <button 
              type="button" 
              onClick={() => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 })}
              aria-label="Next month"
              className="p-2 rounded-xl hover:bg-[var(--color-surface2)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <ChevronRight size={18} className="text-[var(--color-muted)]" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-[11px] font-semibold text-[var(--color-muted)] py-2">{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />
              const selected = parsed?.y === view.y && parsed?.m === view.m && parsed?.d === day
              const isToday = today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === day
              const disabled = !!(minParsed && new Date(view.y, view.m, day) < new Date(minParsed.y, minParsed.m, minParsed.d))
              
              return (
                <button 
                  key={day} 
                  type="button" 
                  disabled={disabled} 
                  onClick={() => select(day)}
                  aria-label={selected ? `Selected date: ${MONTHS[view.m]} ${day}, ${view.y}` : `${MONTHS[view.m]} ${day}, ${view.y}`}
                  aria-pressed={selected}
                  className={`h-10 w-10 rounded-xl text-sm font-medium transition-all mx-auto
                    ${selected ? 'bg-[var(--color-primary)] text-white shadow-lg scale-105' : ''}
                    ${!selected && isToday ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold ring-2 ring-[var(--color-primary)]/30' : ''}
                    ${!selected && !isToday && !disabled ? 'text-[var(--color-text)] hover:bg-[var(--color-surface2)] hover:scale-105' : ''}
                    ${disabled ? 'text-[var(--color-muted)]/30 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {day}
                </button>
              )
            })}
          </div>
          
          <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
            <button 
              type="button" 
              onClick={() => { const t = new Date(); onChange(toDateStr(t.getFullYear(), t.getMonth(), t.getDate())); setView({ y: t.getFullYear(), m: t.getMonth() }); setOpen(false); buttonRef.current?.focus() }}
              className="text-xs font-medium text-[var(--color-primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded px-2 py-1"
            >
              Today
            </button>
            <button 
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Modern Time Picker ───────────────────────────────────────────────────────
function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [draft, setDraft] = useState(value || '09:00')

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Escape key to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // Sync draft with external value when opening
  useEffect(() => {
    if (open && value) setDraft(value)
  }, [open, value])

  const h = parseInt(draft.split(':')[0]) || 0
  const m = parseInt(draft.split(':')[1]) || 0

  const display = value || '--:--'
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const mins = Array.from({ length: 60 }, (_, i) => i) // All minutes for better precision

  return (
    <div ref={ref} className="relative w-32">
      <button 
        ref={buttonRef}
        type="button" 
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="w-full flex items-center justify-between bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all hover:border-[var(--color-primary)]/50"
      >
        <span className={value ? 'text-[var(--color-text)] font-mono font-medium' : 'text-[var(--color-muted)]'}>{display}</span>
        <Clock className={`w-4 h-4 text-[var(--color-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div 
          role="dialog"
          aria-modal="false"
          aria-label="Time picker"
          className="absolute z-50 mt-2 rounded-2xl border border-[var(--color-border)] shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200"
          style={{ background: 'var(--color-surface)', width: 220 }}
        >
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <div className="text-[11px] font-semibold text-[var(--color-muted)] mb-2 text-center uppercase tracking-wide">Hour</div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--color-border)] p-1" style={{ scrollbarWidth: 'thin' }}>
                {hours.map(hr => (
                  <button 
                    key={hr} 
                    type="button" 
                    onClick={() => setDraft(`${pad(hr)}:${pad(m)}`)}
                    aria-label={`${hr} hours`}
                    className={`w-full text-center text-sm py-2 font-mono rounded-lg transition-colors ${h === hr ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-text)] hover:bg-[var(--color-surface2)]'}`}
                  >
                    {pad(hr)}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[var(--color-muted)] font-bold pt-6">:</div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold text-[var(--color-muted)] mb-2 text-center uppercase tracking-wide">Min</div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--color-border)] p-1" style={{ scrollbarWidth: 'thin' }}>
                {mins.map(mi => (
                  <button 
                    key={mi} 
                    type="button" 
                    onClick={() => setDraft(`${pad(h)}:${pad(mi)}`)}
                    aria-label={`${mi} minutes`}
                    className={`w-full text-center text-sm py-2 font-mono rounded-lg transition-colors ${m === mi ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-text)] hover:bg-[var(--color-surface2)]'}`}
                  >
                    {pad(mi)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
            <button 
              type="button"
              onClick={() => { const now = new Date(); setDraft(`${pad(now.getHours())}:${pad(now.getMinutes())}`) }}
              className="text-xs font-medium text-[var(--color-primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded px-2 py-1"
            >
              Now
            </button>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded px-2 py-1"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => { onChange(draft); setOpen(false); buttonRef.current?.focus() }}
                className="text-xs font-medium text-[var(--color-primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded px-2 py-1"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DateTimeInput (public component) ───────────────────────────────────────────
export function DateTimeInput({
  label,
  icon: Icon,
  value,
  onChange,
  hint,
  required = false,
}: {
  label: string
  icon: any
  value: string | null | undefined
  onChange: (iso: string | null) => void
  hint?: string
  required?: boolean
}) {
  const parsed = parseDate(value)
  const dateStr = parsed ? toDateStr(parsed.y, parsed.m, parsed.d) : ''
  const timeStr = parsed ? `${pad(parsed.h)}:${pad(parsed.min)}` : ''

  const updateDate = useCallback((d: string) => {
    if (!d) { onChange(null); return }
    const p = parseDate(d + 'T00:00')
    const h = parsed?.h ?? new Date().getHours()
    const min = parsed?.min ?? new Date().getMinutes()
    onChange(new Date(p!.y, p!.m, p!.d, h, min).toISOString())
  }, [parsed, onChange])

  const updateTime = useCallback((t: string) => {
    const [hh, mm] = t.split(':').map(Number)
    if (dateStr) {
      const p = parseDate(dateStr + 'T00:00')!
      onChange(new Date(p.y, p.m, p.d, hh, mm).toISOString())
    } else {
      const now = new Date()
      onChange(new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm).toISOString())
    }
  }, [dateStr, onChange])

  const today = new Date()
  const minDate = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-[var(--color-muted)]" />
        <label className="text-sm font-medium text-[var(--color-text)]">
          {label}
          {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
        </label>
      </div>
      <div className="flex gap-3">
        <CalendarDropdown value={dateStr} onChange={updateDate} minDate={minDate} />
        <TimePicker value={timeStr} onChange={updateTime} />
      </div>
      {hint && <p className="text-xs text-[var(--color-muted)] leading-relaxed">{hint}</p>}
    </div>
  )
}

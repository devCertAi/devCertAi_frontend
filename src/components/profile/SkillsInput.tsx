import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Plus, Search } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Skill } from '@/types'
import api from '@/services/api'

interface SkillsInputProps {
  value: Skill[]
  onChange: (skills: Skill[]) => void
  showLevel?: boolean
  showRequired?: boolean
  placeholder?: string
}

export function SkillsInput({ value, onChange, showLevel, showRequired, placeholder }: SkillsInputProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = suggestions.filter(s => !value.some(v => v.name.toLowerCase() === s.name.toLowerCase()))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    const t = setTimeout(() => {
      api.get('/skills', { params: { q: query.trim() } })
        .then(({ data }) => setSuggestions(data.data.skills || []))
        .catch(() => setSuggestions([]))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => { setActiveIdx(-1) }, [suggestions, query])

  const addSkill = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (value.some(v => v.name.toLowerCase() === trimmed.toLowerCase())) { setQuery(''); return }

    const existing = suggestions.find(s => s.name.toLowerCase() === trimmed.toLowerCase())
    if (!existing) { setQuery(''); return }

    const newSkill: Skill & { required?: boolean } = {
      id: existing.id,
      name: existing.name,
      level: showLevel ? 'intermediate' : undefined,
    }
    if (showRequired) (newSkill as any).required = true

    onChange([...value, newSkill as Skill])
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }, [suggestions, value, onChange, showLevel, showRequired])

  const removeSkill = (name: string) => {
    onChange(value.filter(v => v.name.toLowerCase() !== name.toLowerCase()))
  }

  const updateSkill = (name: string, patch: Partial<Skill & { required?: boolean }>) => {
    onChange(value.map(v => (v.name.toLowerCase() === name.toLowerCase() ? { ...v, ...patch } : v)))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && filtered[activeIdx]) {
        addSkill(filtered[activeIdx].name)
      } else if (filtered.length > 0) {
        addSkill(filtered[0].name)
      }
    }
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative">
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-3 text-[var(--color-muted)] pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Type to search skills…'}
            aria-label="Search skills"
            aria-expanded={open && filtered.length > 0}
            aria-autocomplete="list"
            role="combobox"
            className="w-full rounded-xl pl-9 pr-10 py-2.5 text-sm bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => { if (query.trim()) addSkill(query) }}
            className="absolute right-2 p-1 rounded-lg hover:bg-[var(--color-border)] transition-colors"
          >
            <Plus size={16} className="text-[var(--color-muted)]" />
          </button>
        </div>

        {open && (query.trim() || suggestions.length > 0) && filtered.length > 0 && (
          <div className="absolute z-30 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl animate-in fade-in slide-in-from-top-1">
            {filtered.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => addSkill(s.name)}
                onMouseEnter={() => setActiveIdx(i)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  i === activeIdx
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface2)]'
                }`}
              >
                <span className="font-medium">{s.name}</span>
              </button>
            ))}
          </div>
        )}

        {open && query.trim() && filtered.length === 0 && (
          <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-4 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              No skills found for "<span className="font-medium text-[var(--color-text)]">{query.trim()}</span>"
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {value.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 group">
              <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg text-xs font-medium bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] transition-all hover:bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]">
                {s.name}
                <button
                  type="button"
                  onClick={() => removeSkill(s.name)}
                  aria-label={`Remove ${s.name}`}
                  className="p-0.5 rounded-md hover:bg-[color-mix(in_srgb,var(--color-danger)_15%,transparent)] hover:text-[var(--color-danger)] transition-colors"
                >
                  <X size={11} />
                </button>
              </span>
              {showLevel && (
                <Select
                  value={s.level || 'intermediate'}
                  onChange={(e) => updateSkill(s.name, { level: e.target.value as Skill['level'] })}
                  className="!py-1 !px-1.5 !text-[10px] !rounded-lg w-auto !border-[var(--color-border)]"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              )}
              {showRequired && (
                <Select
                  value={(s as any).required === false ? 'nice' : 'required'}
                  onChange={(e) => updateSkill(s.name, { required: e.target.value === 'required' } as any)}
                  className="!py-1 !px-1.5 !text-[10px] !rounded-lg w-auto !border-[var(--color-border)]"
                >
                  <option value="required">Must-have</option>
                  <option value="nice">Nice-to-have</option>
                </Select>
              )}
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-xs text-[var(--color-muted)] mt-2">No skills added yet. Start typing to search.</p>
      )}
    </div>
  )
}

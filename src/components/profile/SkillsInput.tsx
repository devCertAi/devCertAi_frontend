import { useEffect, useRef, useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
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
  const containerRef = useRef<HTMLDivElement>(null)

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

  const alreadyAdded = (name: string) =>
    value.some(v => v.name.toLowerCase() === name.toLowerCase())

  const addSkill = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || alreadyAdded(trimmed)) { setQuery(''); return }

    // Only allow skills that exist in the master list (from suggestions)
    const existing = suggestions.find(s => s.name.toLowerCase() === trimmed.toLowerCase())
    if (!existing) {
      // Not in master list — ignore silently (user must pick from suggestions)
      setQuery('')
      return
    }

    const newSkill: Skill & { required?: boolean } = {
      id: existing.id,
      name: existing.name,
      level: showLevel ? 'intermediate' : undefined,
    }
    if (showRequired) (newSkill as any).required = true

    onChange([...value, newSkill as Skill])
    setQuery('')
    setOpen(false)
  }

  const removeSkill = (name: string) => {
    onChange(value.filter(v => v.name.toLowerCase() !== name.toLowerCase()))
  }

  const updateSkill = (name: string, patch: Partial<Skill & { required?: boolean }>) => {
    onChange(value.map(v => (v.name.toLowerCase() === name.toLowerCase() ? { ...v, ...patch } : v)))
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const firstMatch = suggestions.find(s => !alreadyAdded(s.name))
              addSkill(firstMatch ? firstMatch.name : query)
            }
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder={placeholder || 'Type a skill and press Enter…'}
          rightIcon={<Plus size={16} />}
        />
        {open && (query.trim() || suggestions.length > 0) && (
          <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
            {suggestions
              .filter(s => !alreadyAdded(s.name))
              .map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addSkill(s.name)}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface2)] transition-colors"
                >
                  {s.name}
                </button>
              ))}
            {query.trim() && suggestions.filter(s => !alreadyAdded(s.name)).length === 0 && (
              <p className="px-4 py-2 text-sm text-[var(--color-muted)]">
                No skills found for "{query.trim()}"
              </p>
            )}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {value.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <Badge variant="default" className="flex items-center gap-1.5 pr-1.5">
                {s.name}
                <button type="button" onClick={() => removeSkill(s.name)} className="hover:text-[var(--color-danger)] transition-colors">
                  <X size={12} />
                </button>
              </Badge>
              {showLevel && (
                <Select
                  value={s.level || 'intermediate'}
                  onChange={(e) => updateSkill(s.name, { level: e.target.value as Skill['level'] })}
                  className="!py-1 !px-2 text-xs w-auto"
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
                  className="!py-1 !px-2 text-xs w-auto"
                >
                  <option value="required">Must-have</option>
                  <option value="nice">Nice-to-have</option>
                </Select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
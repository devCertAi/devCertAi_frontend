import { Sun, Moon, Sparkles } from 'lucide-react'
import { useThemeStore, AppTheme } from '@/store/themeStore'
import { cn } from '@/lib/utils'

const THEME_ICONS: Record<AppTheme, typeof Sun> = {
  dark: Moon,
  light: Sun,
  super: Sparkles,
}

const THEMES: AppTheme[] = ['dark', 'light', 'super']

export function ThemeSwitch() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-[3px]"
      style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
    >
      {THEMES.map((t) => {
        const Icon = THEME_ICONS[t]
        const active = theme === t
        return (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            title={t.charAt(0).toUpperCase() + t.slice(1)}
            aria-label={`${t} theme`}
            className={cn(
              'w-[30px] h-[28px] rounded-md flex items-center justify-center transition-all duration-200',
              active ? 'text-[var(--color-inverse)]' : 'hover:text-[var(--color-text)]'
            )}
            style={{
              background: active ? 'var(--color-primary)' : 'transparent',
              color: active ? 'var(--color-inverse)' : 'var(--color-muted)',
            }}
          >
            <Icon size={15} strokeWidth={2} />
          </button>
        )
      })}
    </div>
  )
}

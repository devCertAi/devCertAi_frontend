import { useThemeStore } from '@/store/themeStore'

export function LoadingScreen() {
  const { theme } = useThemeStore()
  // The lockup SVGs bake their wordmark color in (unlike the rest of the
  // app, which colors text live via --color-text), so pick the matching
  // variant here: light theme gets dark text, dark/super both read fine
  // against the light-text "dark" lockup.
  const lockup = theme === 'light' ? '/assets/proeva-lockup-light.svg' : '/assets/proeva-lockup-dark.svg'

  return (
    <div className="fixed inset-0 bg-[var(--color-bg)] flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-5">
        <img src={lockup} alt="Proeva" className="h-9 w-auto animate-pulse" />
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

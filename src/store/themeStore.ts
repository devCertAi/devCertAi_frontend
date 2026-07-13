import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppTheme = 'dark' | 'light' | 'super'

interface ThemeState {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
}

function applyThemeToDocument(theme: AppTheme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyThemeToDocument(theme)
        set({ theme })
      },
    }),
    {
      name: 'proeva-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeToDocument(state.theme)
      },
    }
  )
)

// Apply immediately on module load (covers first paint before React hydrates)
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('proeva-theme')
    if (raw) {
      const parsed = JSON.parse(raw)
      const t = parsed?.state?.theme
      if (t === 'dark' || t === 'light' || t === 'super') applyThemeToDocument(t)
    }
  } catch {
    // ignore, default dark theme in CSS already applies
  }
}

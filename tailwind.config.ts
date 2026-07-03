import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // All colors now reference CSS variables from theme.css
        // Change theme.css → tailwind classes update automatically
        bg:         'var(--color-bg)',
        surface:    'var(--color-surface)',
        surface2:   'var(--color-surface2)',
        primary:    'var(--color-primary)',
        'primary-d':'var(--color-primary-d)',
        secondary:  'var(--color-secondary)',
        success:    'var(--color-success)',
        warning:    'var(--color-warning)',
        danger:     'var(--color-danger)',
        textprimary:'var(--color-text)',
        textmuted:  'var(--color-muted)',
        border:     'var(--color-border)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
export default config
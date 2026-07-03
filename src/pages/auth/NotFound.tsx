import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center text-center px-4">
      {/* Glow */}
      <div className="absolute w-64 h-64 bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] rounded-full blur-3xl pointer-events-none" />
      
      <p className="text-[120px] font-bold text-[var(--color-primary)] leading-none mb-4 relative">404</p>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Page Not Found</h1>
      <p className="text-[var(--color-muted)] text-sm mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-inverse)] rounded-xl text-sm font-medium hover:bg-[var(--color-primary-d)] transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
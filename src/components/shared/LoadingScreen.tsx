export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[var(--color-bg)] flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center animate-pulse">
          <span className="text-[var(--color-inverse)] font-bold text-lg">DC</span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

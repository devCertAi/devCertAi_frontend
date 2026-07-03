import { Component, ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Error:', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Something went wrong</h1>
            <p className="text-[var(--color-muted)] mb-6">{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-inverse)] rounded-xl hover:bg-[var(--color-primary-d)] transition-colors">
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

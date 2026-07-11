import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer
      className="py-12 mt-auto"
      style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--gradient-brand)' }}
              >
                <span className="text-[var(--color-inverse)] font-bold text-xs">DC</span>
              </div>
              <span className="font-bold" style={{ color: 'var(--color-text)' }}>DevCert</span>
            </div>
            <p className="text-sm leading-relaxed max-w-[280px]" style={{ color: 'var(--color-muted)' }}>
              AI-powered project evaluation and skill certification for developers.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Platform</h4>
            <ul className="space-y-2">
              {[['/', 'Home'], ['/projects', 'Projects'], ['/exam', 'Exams'], ['/certificates', 'Certificates']].map(([href, label]) => (
                <li key={href}>
                  <Link to={href} className="text-sm transition-colors hover:opacity-80" style={{ color: 'var(--color-muted)' }}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Company</h4>
            <ul className="space-y-2">
              {[['/about', 'About'], ['/pricing', 'Pricing'], ['/contact', 'Contact']].map(([href, label], i) => (
                <li key={i}>
                  <Link to={href} className="text-sm transition-colors hover:opacity-80" style={{ color: 'var(--color-muted)' }}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Legal</h4>
            <ul className="space-y-2">
              {[
                ['/privacy-policy', 'Privacy Policy'],
                ['/terms-of-service', 'Terms of Service'],
                ['/cookie-policy', 'Cookie Policy'],
              ].map(([href, label], i) => (
                <li key={i}>
                  <Link to={href} className="text-sm transition-colors hover:opacity-80" style={{ color: 'var(--color-muted)' }}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div
          className="mt-10 pt-6 text-center text-xs"
          style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
        >
          © {new Date().getFullYear()} DevCert. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

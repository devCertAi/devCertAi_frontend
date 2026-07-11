import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'

const lastUpdated = 'July 11, 2026'

export default function CookiePolicy() {
  return (
    <PageWrapper className="bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">Cookie Policy</h1>
        <p className="text-xs text-[var(--color-muted)] mb-10">Last updated: {lastUpdated}</p>

        <Card className="p-8 space-y-8 text-sm text-[var(--color-muted)] leading-relaxed">

          <section>
            <p>
              This Cookie Policy explains how DevCert ("DevCert," "we," "us," or "our") uses cookies
              and similar tracking technologies when you visit or use our website and Service. It
              should be read together with our{' '}
              <a href="/privacy-policy" className="text-[var(--color-primary)] hover:underline">Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">1. What Are Cookies</h2>
            <p>
              Cookies are small text files placed on your device when you visit a website. They are
              widely used to make websites function, function more efficiently, and to provide
              information to the site owner. We also use similar technologies such as local storage
              and pixels, which this policy refers to collectively as "cookies."
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">2. Categories of Cookies We Use</h2>

            <p className="mb-2"><strong className="text-[var(--color-text)]">Strictly necessary cookies.</strong> Required for the Service to function, such as keeping you signed in and maintaining security. These cannot be disabled without affecting core functionality.</p>

            <p className="mb-2"><strong className="text-[var(--color-text)]">Preference cookies.</strong> Remember choices you make, such as display settings, so we can provide a more personalized experience.</p>

            <p className="mb-2"><strong className="text-[var(--color-text)]">Analytics cookies.</strong> Help us understand how visitors interact with the Service, such as which pages are viewed and how long users spend on them, so we can improve performance and usability.</p>

            <p><strong className="text-[var(--color-text)]">Advertising cookies.</strong> Used to display relevant ads to non-premium users and to measure the effectiveness of advertising. Premium users on paid plans do not receive advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">3. Third-Party Cookies</h2>
            <p>
              Some cookies are placed by third-party services that appear on our pages, such as
              analytics providers and advertising partners. These third parties may use cookies,
              web beacons, and similar technologies to collect information about your use of the
              Service and other websites. We do not control these third-party cookies, and their use
              is governed by the relevant third party's own privacy and cookie policies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">4. Managing Your Cookie Preferences</h2>
            <p className="mb-2">
              You can control or delete cookies through your browser settings. Most browsers allow
              you to block or delete cookies, or to be notified before a cookie is placed. Please
              note that blocking strictly necessary cookies may prevent parts of the Service from
              working correctly.
            </p>
            <p>
              Where required by law, we will request your consent for non-essential cookies before
              they are placed, and you can update your preferences at any time through the cookie
              settings available on our site or your browser controls.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">5. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in the cookies
              we use or for legal or regulatory reasons. We encourage you to review this page
              periodically for the latest information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">6. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us at{' '}
              <a href="mailto:privacy@devcert.com" className="text-[var(--color-primary)] hover:underline">privacy@devcert.com</a>{' '}
              or via our <a href="/contact" className="text-[var(--color-primary)] hover:underline">Contact page</a>.
            </p>
          </section>

        </Card>

        <p className="text-xs text-[var(--color-muted)] mt-6">
          This document is a general-purpose template and does not constitute legal advice. We
          recommend having it reviewed by a qualified attorney to ensure it fully reflects your
          business practices and complies with the laws applicable to your users and jurisdictions.
        </p>
      </div>
    </PageWrapper>
  )
}

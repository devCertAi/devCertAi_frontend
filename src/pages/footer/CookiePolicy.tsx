// CookiePolicy.tsx – Proeva Cookie Policy (matching About/Contact layout)
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Cookie, Info, ShieldCheck } from 'lucide-react'

const lastUpdated = 'July 11, 2026'

export default function CookiePolicy() {
  return (
    <PageWrapper className="bg-white">
      {/* ─── HERO ─── */}
      <section className="relative w-full min-h-[400px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1600&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-white w-full">
          <div className="max-w-3xl">
            <div className="inline-block bg-blue-500/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-blue-200 border border-blue-400/30 mb-4">
              Privacy &amp; Legal
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4 tracking-tight">
              Cookie Policy
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-2xl">
              How Proeva uses cookies to improve your experience.
            </p>
            <p className="text-sm text-gray-300 mt-3">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </section>

      {/* ─── CONTENT ─── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white p-8 md:p-10 space-y-8 text-gray-700 leading-relaxed">

            {/* Intro with icon */}
            <div className="flex items-start gap-4">
              <Info size={20} className="shrink-0 mt-1 text-blue-600" />
              <div>
                <p>
                  This Cookie Policy explains how Proeva ("Proeva," "we," "us," or "our") uses cookies
                  and similar tracking technologies when you visit or use our website and Service. It
                  should be read together with our{' '}
                  <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                </p>
              </div>
            </div>

            {/* Section 1 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 1. What Are Cookies
              </h2>
              <p className="mt-2">
                Cookies are small text files placed on your device when you visit a website. They are
                widely used to make websites function, function more efficiently, and to provide
                information to the site owner. We also use similar technologies such as local storage
                and pixels, which this policy refers to collectively as "cookies."
              </p>
            </div>

            {/* Section 2 – Categories */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 2. Categories of Cookies We Use
              </h2>
              <div className="mt-3 space-y-3">
                {[
                  { title: 'Strictly necessary cookies', desc: 'Required for the Service to function, such as keeping you signed in and maintaining security. These cannot be disabled without affecting core functionality.' },
                  { title: 'Preference cookies', desc: 'Remember choices you make, such as display settings, so we can provide a more personalized experience.' },
                  { title: 'Analytics cookies', desc: 'Help us understand how visitors interact with the Service, such as which pages are viewed and how long users spend on them, so we can improve performance and usability.' },
                  { title: 'Advertising cookies', desc: 'Used to display relevant ads to non-premium users and to measure the effectiveness of advertising. Premium users on paid plans do not receive advertising cookies.' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 border border-gray-200">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3 – Third-party */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 3. Third-Party Cookies
              </h2>
              <p className="mt-2">
                Some cookies are placed by third-party services that appear on our pages, such as
                analytics providers and advertising partners. These third parties may use cookies,
                web beacons, and similar technologies to collect information about your use of the
                Service and other websites. We do not control these third-party cookies, and their use
                is governed by the relevant third party's own privacy and cookie policies.
              </p>
            </div>

            {/* Section 4 – Manage */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 4. Managing Your Cookie Preferences
              </h2>
              <p className="mt-2">
                You can control or delete cookies through your browser settings. Most browsers allow
                you to block or delete cookies, or to be notified before a cookie is placed. Please
                note that blocking strictly necessary cookies may prevent parts of the Service from
                working correctly.
              </p>
              <p className="mt-2">
                Where required by law, we will request your consent for non-essential cookies before
                they are placed, and you can update your preferences at any time through the cookie
                settings available on our site or your browser controls.
              </p>
            </div>

            {/* Section 5 – Changes */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 5. Changes to This Policy
              </h2>
              <p className="mt-2">
                We may update this Cookie Policy from time to time to reflect changes in the cookies
                we use or for legal or regulatory reasons. We encourage you to review this page
                periodically for the latest information.
              </p>
            </div>

            {/* Contact – same as the final CTA in About */}
            <div className="bg-gray-50 p-6 border-l-4 border-l-blue-600 flex items-start gap-4">
              <ShieldCheck size={20} className="shrink-0 mt-0.5 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Contact Us</h2>
                <p className="mt-1">
                  If you have questions about our use of cookies, please contact us at{' '}
                  <a href="mailto:privacy@proeva.com" className="text-blue-600 hover:underline">privacy@proeva.com</a>{' '}
                  or via our <a href="/contact" className="text-blue-600 hover:underline">Contact page</a>.
                </p>
              </div>
            </div>

          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 mt-6 flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5" />
            This document is a general-purpose template and does not constitute legal advice. We
            recommend having it reviewed by a qualified attorney to ensure it fully reflects your
            business practices and complies with the laws applicable to your users and jurisdictions.
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA (same as About/Contact) ─── */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-3">Let’s build better hiring together</h2>
          <p className="text-gray-300 text-lg mb-6">
            Whether you're a developer looking to validate your skills or an employer seeking reliable talent, we're here to help.
          </p>
        <a
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 transition rounded-full font-medium"
          >
            Get Started
          </a>
        </div>
      </section>
    </PageWrapper>
  )
}
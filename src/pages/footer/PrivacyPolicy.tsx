// PrivacyPolicy.tsx – Proeva Privacy Policy (matching About/Contact/Cookie layout)
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Shield, Lock, Eye, Users } from 'lucide-react'

const lastUpdated = 'July 11, 2026'

export default function PrivacyPolicy() {
  return (
    <PageWrapper className="bg-white">
      {/* ─── HERO ─── */}
      <section className="relative w-full min-h-[400px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1600&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-white w-full">
          <div className="max-w-3xl">
            <div className="inline-block bg-blue-500/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-blue-200 border border-blue-400/30 mb-4">
              Privacy &amp; Legal
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-2xl">
              How Proeva handles your personal information.
            </p>
            <p className="text-sm text-gray-300 mt-3">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </section>

      {/* ─── CONTENT ─── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white p-8 md:p-10 space-y-8 text-gray-700 leading-relaxed">

            {/* Intro */}
            <section>
              <p>
                This Privacy Policy explains how Proeva ("Proeva," "we," "us," or "our") collects,
                uses, discloses, and safeguards information when you use our website, applications,
                and services (collectively, the "Service"). By using the Service, you agree to the
                collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* 1. Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 1. Information We Collect
              </h2>
              <div className="mt-3 space-y-2 text-sm">
                <p><strong className="text-gray-900">Account information:</strong> name, email address, password (hashed), and profile details you provide when creating an account.</p>
                <p><strong className="text-gray-900">Content you submit:</strong> code, projects, exam responses, and related materials you upload for evaluation or certification.</p>
                <p><strong className="text-gray-900">Usage data:</strong> log data, device and browser information, IP address, pages visited, and interactions with the Service, collected automatically.</p>
                <p><strong className="text-gray-900">Payment information:</strong> where applicable, billing details are processed by our third-party payment providers; we do not store full payment card numbers on our servers.</p>
              </div>
            </section>

            {/* 2. How We Use Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 2. How We Use Information
              </h2>
              <p className="mt-2">We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-1 text-sm">
                <li>Provide, operate, and maintain the Service, including project evaluation and certification</li>
                <li>Create and manage your account</li>
                <li>Process transactions and manage credits or subscriptions</li>
                <li>Communicate with you about updates, security alerts, and support requests</li>
                <li>Monitor and analyze usage to improve the Service</li>
                <li>Detect, prevent, and address fraud, abuse, or technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* 3. AI-Assisted Evaluation */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 3. AI-Assisted Evaluation
              </h2>
              <p className="mt-2">
                Projects and exam submissions you provide may be processed by automated and AI-assisted
                tools as part of our evaluation process. We take reasonable steps to secure this content
                and do not use your submitted project code to train third-party public models without
                your consent.
              </p>
            </section>

            {/* 4. Sharing of Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 4. Sharing of Information
              </h2>
              <p className="mt-2">We do not sell your personal information. We may share information with:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-1 text-sm">
                <li>Service providers who perform functions on our behalf (hosting, analytics, payment processing, email delivery)</li>
                <li>Employers or partners, only where you have explicitly chosen to share a certificate or profile with them</li>
                <li>Advertising partners, in the form of non-identifying, aggregated, or anonymized data, where ads are displayed to non-premium users</li>
                <li>Authorities, where required by law, regulation, or valid legal process</li>
                <li>A successor entity, in connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            {/* 5. Cookies and Tracking */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 5. Cookies and Tracking
              </h2>
              <p className="mt-2">
                We use cookies and similar technologies to operate the Service, remember your
                preferences, and understand usage patterns. See our{' '}
                <a href="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</a>{' '}
                for details on the categories of cookies we use and how to manage your preferences.
              </p>
            </section>

            {/* 6. Data Retention */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 6. Data Retention
              </h2>
              <p className="mt-2">
                We retain personal information for as long as your account is active or as needed to
                provide the Service, comply with legal obligations, resolve disputes, and enforce our
                agreements. You may request deletion of your account and associated data at any time,
                subject to legal or legitimate business retention requirements.
              </p>
            </section>

            {/* 7. Data Security */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 7. Data Security
              </h2>
              <p className="mt-2">
                We implement reasonable technical and organizational measures designed to protect your
                information against unauthorized access, alteration, disclosure, or destruction. No
                method of transmission or storage is completely secure, and we cannot guarantee
                absolute security.
              </p>
            </section>

            {/* 8. Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 8. Your Rights
              </h2>
              <p className="mt-2">
                Depending on your location, you may have the right to access, correct, export, or
                delete your personal information, and to object to or restrict certain processing.
                To exercise these rights, contact us using the details below.
              </p>
              <p className="mt-2">
                If you are located in the European Economic Area or United Kingdom, you may also have
                the right to lodge a complaint with your local data protection authority. If you are a
                California resident, you may have additional rights under applicable California privacy
                law, including the right to know, delete, and opt out of certain data sharing.
              </p>
            </section>

            {/* 9. Children's Privacy */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 9. Children's Privacy
              </h2>
              <p className="mt-2">
                The Service is not directed to children under 16, and we do not knowingly collect
                personal information from children under 16. If you believe a child has provided us
                with personal information, please contact us so we can take appropriate action.
              </p>
            </section>

            {/* 10. International Data Transfers */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 10. International Data Transfers
              </h2>
              <p className="mt-2">
                Your information may be transferred to, and processed in, countries other than the one
                in which you reside. Where required, we use appropriate safeguards to protect
                information transferred internationally.
              </p>
            </section>

            {/* 11. Changes to This Policy */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 11. Changes to This Policy
              </h2>
              <p className="mt-2">
                We may update this Privacy Policy from time to time. We will notify you of material
                changes by posting the updated policy on this page and revising the "Last updated" date.
                Continued use of the Service after changes take effect constitutes acceptance of the
                revised policy.
              </p>
            </section>

            {/* 12. Contact Us – styled like the Cookie Policy contact box */}
            <section className="bg-gray-50 p-6 border-l-4 border-l-blue-600 flex items-start gap-4">
              <Shield size={20} className="shrink-0 mt-0.5 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">12. Contact Us</h2>
                <p className="mt-1">
                  If you have questions about this Privacy Policy or how we handle your information,
                  please contact us at{' '}
                  <a href="mailto:privacy@proeva.com" className="text-blue-600 hover:underline">privacy@proeva.com</a>{' '}
                  or via our <a href="/contact" className="text-blue-600 hover:underline">Contact page</a>.
                </p>
              </div>
            </section>

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

      {/* ─── FINAL CTA (same as all other pages) ─── */}
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
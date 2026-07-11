import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'

const lastUpdated = 'July 11, 2026'

export default function PrivacyPolicy() {
  return (
    <PageWrapper className="bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">Privacy Policy</h1>
        <p className="text-xs text-[var(--color-muted)] mb-10">Last updated: {lastUpdated}</p>

        <Card className="p-8 space-y-8 text-sm text-[var(--color-muted)] leading-relaxed">

          <section>
            <p>
              This Privacy Policy explains how DevCert ("DevCert," "we," "us," or "our") collects,
              uses, discloses, and safeguards information when you use our website, applications,
              and services (collectively, the "Service"). By using the Service, you agree to the
              collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">1. Information We Collect</h2>
            <p className="mb-2"><strong className="text-[var(--color-text)]">Account information:</strong> name, email address, password (hashed), and profile details you provide when creating an account.</p>
            <p className="mb-2"><strong className="text-[var(--color-text)]">Content you submit:</strong> code, projects, exam responses, and related materials you upload for evaluation or certification.</p>
            <p className="mb-2"><strong className="text-[var(--color-text)]">Usage data:</strong> log data, device and browser information, IP address, pages visited, and interactions with the Service, collected automatically.</p>
            <p><strong className="text-[var(--color-text)]">Payment information:</strong> where applicable, billing details are processed by our third-party payment providers; we do not store full payment card numbers on our servers.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">2. How We Use Information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Provide, operate, and maintain the Service, including project evaluation and certification</li>
              <li>Create and manage your account</li>
              <li>Process transactions and manage credits or subscriptions</li>
              <li>Communicate with you about updates, security alerts, and support requests</li>
              <li>Monitor and analyze usage to improve the Service</li>
              <li>Detect, prevent, and address fraud, abuse, or technical issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">3. AI-Assisted Evaluation</h2>
            <p>
              Projects and exam submissions you provide may be processed by automated and AI-assisted
              tools as part of our evaluation process. We take reasonable steps to secure this content
              and do not use your submitted project code to train third-party public models without
              your consent.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">4. Sharing of Information</h2>
            <p className="mb-2">We do not sell your personal information. We may share information with:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Service providers who perform functions on our behalf (hosting, analytics, payment processing, email delivery)</li>
              <li>Employers or partners, only where you have explicitly chosen to share a certificate or profile with them</li>
              <li>Advertising partners, in the form of non-identifying, aggregated, or anonymized data, where ads are displayed to non-premium users</li>
              <li>Authorities, where required by law, regulation, or valid legal process</li>
              <li>A successor entity, in connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">5. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to operate the Service, remember your
              preferences, and understand usage patterns. See our{' '}
              <a href="/cookie-policy" className="text-[var(--color-primary)] hover:underline">Cookie Policy</a>{' '}
              for details on the categories of cookies we use and how to manage your preferences.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">6. Data Retention</h2>
            <p>
              We retain personal information for as long as your account is active or as needed to
              provide the Service, comply with legal obligations, resolve disputes, and enforce our
              agreements. You may request deletion of your account and associated data at any time,
              subject to legal or legitimate business retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">7. Data Security</h2>
            <p>
              We implement reasonable technical and organizational measures designed to protect your
              information against unauthorized access, alteration, disclosure, or destruction. No
              method of transmission or storage is completely secure, and we cannot guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">8. Your Rights</h2>
            <p className="mb-2">
              Depending on your location, you may have the right to access, correct, export, or
              delete your personal information, and to object to or restrict certain processing.
              To exercise these rights, contact us using the details below.
            </p>
            <p>
              If you are located in the European Economic Area or United Kingdom, you may also have
              the right to lodge a complaint with your local data protection authority. If you are a
              California resident, you may have additional rights under applicable California privacy
              law, including the right to know, delete, and opt out of certain data sharing.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">9. Children's Privacy</h2>
            <p>
              The Service is not directed to children under 16, and we do not knowingly collect
              personal information from children under 16. If you believe a child has provided us
              with personal information, please contact us so we can take appropriate action.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to, and processed in, countries other than the one
              in which you reside. Where required, we use appropriate safeguards to protect
              information transferred internationally.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by posting the updated policy on this page and revising the "Last updated" date.
              Continued use of the Service after changes take effect constitutes acceptance of the
              revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or how we handle your information,
              please contact us at{' '}
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

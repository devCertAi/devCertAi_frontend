import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'

const lastUpdated = 'July 11, 2026'

export default function TermsOfService() {
  return (
    <PageWrapper className="bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">Terms of Service</h1>
        <p className="text-xs text-[var(--color-muted)] mb-10">Last updated: {lastUpdated}</p>

        <Card className="p-8 space-y-8 text-sm text-[var(--color-muted)] leading-relaxed">

          <section>
            <p>
              These Terms of Service ("Terms") govern your access to and use of DevCert (the
              "Service"), operated by DevCert ("we," "us," or "our"). By creating an account or
              using the Service, you agree to be bound by these Terms. If you do not agree, do not
              use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">1. Eligibility</h2>
            <p>
              You must be at least 16 years old, or the age of legal majority in your jurisdiction if
              higher, to use the Service. By using the Service, you represent that you meet this
              requirement and that all registration information you provide is accurate.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">2. Your Account</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activity under your account. You agree to notify us promptly of any unauthorized
              use of your account. We are not liable for any loss arising from unauthorized use of
              your credentials.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">3. The Service</h2>
            <p className="mb-2">
              DevCert provides AI-assisted project evaluation, skills exams, and certification for
              developers. Evaluations, scores, and certificates reflect our assessment methodology
              at the time of review and are provided for informational and professional-development
              purposes.
            </p>
            <p>
              We do not guarantee that any evaluation, score, or certificate will result in
              employment, promotion, or any other outcome, and we make no representation as to how
              third parties, including employers, will interpret or weigh a DevCert certificate.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">4. User Content</h2>
            <p className="mb-2">
              You retain ownership of the projects, code, and other materials you submit ("User
              Content"). By submitting User Content, you grant us a non-exclusive, worldwide,
              royalty-free license to host, store, process, and analyze that content solely for the
              purpose of providing and improving the Service, including AI-assisted evaluation.
            </p>
            <p>
              You are solely responsible for your User Content and represent that you have the
              necessary rights to submit it, and that it does not infringe the intellectual property,
              privacy, or other rights of any third party.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">5. Credits, Fees, and Payments</h2>
            <p>
              Certain features of the Service, including project submissions, exams, or premium
              access, may require the purchase or use of credits or a subscription. All fees are
              stated in advance and are non-refundable except as required by law or as expressly
              stated at the time of purchase. We may change our pricing with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">6. Acceptable Use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Submit content that is unlawful, infringing, fraudulent, or that you do not have the right to submit</li>
              <li>Attempt to manipulate, circumvent, or reverse-engineer our evaluation or scoring systems</li>
              <li>Misrepresent your identity or impersonate any person or entity</li>
              <li>Use the Service to distribute malware or interfere with its operation or security</li>
              <li>Resell, sublicense, or misrepresent DevCert certificates as issued to someone other than you</li>
              <li>Use automated means to access the Service except as expressly permitted</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">7. Certificates</h2>
            <p>
              Certificates issued through the Service are non-transferable and remain subject to
              revocation if we determine, in our reasonable judgment, that they were obtained through
              fraud, misrepresentation, or a violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">8. Intellectual Property</h2>
            <p>
              The Service, including its software, design, branding, and underlying technology, is
              owned by DevCert and its licensors and is protected by intellectual property laws.
              Nothing in these Terms grants you any right to use our trademarks, logos, or branding
              without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">9. Third-Party Services and Advertising</h2>
            <p>
              The Service may display advertising to non-premium users and may include links to or
              integrations with third-party services. We are not responsible for the content,
              accuracy, or practices of third parties, and your interactions with them are solely
              between you and that third party.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">10. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without
              notice, if we believe you have violated these Terms or engaged in conduct that harms
              the Service, other users, or third parties. You may stop using the Service and close
              your account at any time.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">11. Disclaimers</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind,
              express or implied, including warranties of merchantability, fitness for a particular
              purpose, and non-infringement. We do not warrant that the Service will be uninterrupted,
              error-free, or completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">12. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, DevCert and its officers, employees, and agents
              shall not be liable for any indirect, incidental, special, consequential, or punitive
              damages, or any loss of profits, data, or goodwill, arising from your use of the
              Service. Our total liability for any claim arising from these Terms or the Service
              shall not exceed the amount you paid us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">13. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the jurisdiction in which DevCert is
              incorporated, without regard to conflict-of-law principles, unless otherwise required
              by applicable local law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">14. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will be communicated by
              posting the updated Terms with a revised "Last updated" date. Continued use of the
              Service after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">15. Contact Us</h2>
            <p>
              Questions about these Terms can be sent to{' '}
              <a href="mailto:legal@devcert.com" className="text-[var(--color-primary)] hover:underline">legal@devcert.com</a>{' '}
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

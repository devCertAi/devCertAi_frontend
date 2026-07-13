// TermsOfService.tsx – Proeva Terms of Service (matching About/Contact/Privacy/Cookie layout)
import { PageWrapper } from '@/components/layout/PageWrapper'
import { FileText, Scale, Shield } from 'lucide-react'

const lastUpdated = 'July 11, 2026'

export default function TermsOfService() {
  return (
    <PageWrapper className="bg-white">
      {/* ─── HERO ─── */}
      <section className="relative w-full min-h-[400px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-white w-full">
          <div className="max-w-3xl">
            <div className="inline-block bg-blue-500/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-blue-200 border border-blue-400/30 mb-4">
              Legal
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-2xl">
              The rules that govern your use of Proeva.
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
                These Terms of Service ("Terms") govern your access to and use of Proeva (the
                "Service"), operated by Proeva ("we," "us," or "our"). By creating an account or
                using the Service, you agree to be bound by these Terms. If you do not agree, do not
                use the Service.
              </p>
            </section>

            {/* 1. Eligibility */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 1. Eligibility
              </h2>
              <p className="mt-2">
                You must be at least 16 years old, or the age of legal majority in your jurisdiction if
                higher, to use the Service. By using the Service, you represent that you meet this
                requirement and that all registration information you provide is accurate.
              </p>
            </section>

            {/* 2. Your Account */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 2. Your Account
              </h2>
              <p className="mt-2">
                You are responsible for maintaining the confidentiality of your account credentials and
                for all activity under your account. You agree to notify us promptly of any unauthorized
                use of your account. We are not liable for any loss arising from unauthorized use of
                your credentials.
              </p>
            </section>

            {/* 3. The Service */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 3. The Service
              </h2>
              <p className="mt-2">
                Proeva provides AI-assisted project evaluation, skills exams, and certification for
                developers. Evaluations, scores, and certificates reflect our assessment methodology
                at the time of review and are provided for informational and professional-development
                purposes.
              </p>
              <p className="mt-2">
                We do not guarantee that any evaluation, score, or certificate will result in
                employment, promotion, or any other outcome, and we make no representation as to how
                third parties, including employers, will interpret or weigh a Proeva certificate.
              </p>
            </section>

            {/* 4. User Content */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 4. User Content
              </h2>
              <p className="mt-2">
                You retain ownership of the projects, code, and other materials you submit ("User
                Content"). By submitting User Content, you grant us a non-exclusive, worldwide,
                royalty-free license to host, store, process, and analyze that content solely for the
                purpose of providing and improving the Service, including AI-assisted evaluation.
              </p>
              <p className="mt-2">
                You are solely responsible for your User Content and represent that you have the
                necessary rights to submit it, and that it does not infringe the intellectual property,
                privacy, or other rights of any third party.
              </p>
            </section>

            {/* 5. Credits, Fees, and Payments */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 5. Credits, Fees, and Payments
              </h2>
              <p className="mt-2">
                Certain features of the Service, including project submissions, exams, or premium
                access, may require the purchase or use of credits or a subscription. All fees are
                stated in advance and are non-refundable except as required by law or as expressly
                stated at the time of purchase. We may change our pricing with reasonable notice.
              </p>
            </section>

            {/* 6. Acceptable Use */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 6. Acceptable Use
              </h2>
              <p className="mt-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-1 text-sm">
                <li>Submit content that is unlawful, infringing, fraudulent, or that you do not have the right to submit</li>
                <li>Attempt to manipulate, circumvent, or reverse-engineer our evaluation or scoring systems</li>
                <li>Misrepresent your identity or impersonate any person or entity</li>
                <li>Use the Service to distribute malware or interfere with its operation or security</li>
                <li>Resell, sublicense, or misrepresent Proeva certificates as issued to someone other than you</li>
                <li>Use automated means to access the Service except as expressly permitted</li>
              </ul>
            </section>

            {/* 7. Certificates */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 7. Certificates
              </h2>
              <p className="mt-2">
                Certificates issued through the Service are non-transferable and remain subject to
                revocation if we determine, in our reasonable judgment, that they were obtained through
                fraud, misrepresentation, or a violation of these Terms.
              </p>
            </section>

            {/* 8. Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 8. Intellectual Property
              </h2>
              <p className="mt-2">
                The Service, including its software, design, branding, and underlying technology, is
                owned by Proeva and its licensors and is protected by intellectual property laws.
                Nothing in these Terms grants you any right to use our trademarks, logos, or branding
                without our prior written consent.
              </p>
            </section>

            {/* 9. Third-Party Services and Advertising */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 9. Third-Party Services and Advertising
              </h2>
              <p className="mt-2">
                The Service may display advertising to non-premium users and may include links to or
                integrations with third-party services. We are not responsible for the content,
                accuracy, or practices of third parties, and your interactions with them are solely
                between you and that third party.
              </p>
            </section>

            {/* 10. Termination */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 10. Termination
              </h2>
              <p className="mt-2">
                We may suspend or terminate your access to the Service at any time, with or without
                notice, if we believe you have violated these Terms or engaged in conduct that harms
                the Service, other users, or third parties. You may stop using the Service and close
                your account at any time.
              </p>
            </section>

            {/* 11. Disclaimers */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 11. Disclaimers
              </h2>
              <p className="mt-2">
                The Service is provided "as is" and "as available" without warranties of any kind,
                express or implied, including warranties of merchantability, fitness for a particular
                purpose, and non-infringement. We do not warrant that the Service will be uninterrupted,
                error-free, or completely secure.
              </p>
            </section>

            {/* 12. Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 12. Limitation of Liability
              </h2>
              <p className="mt-2">
                To the maximum extent permitted by law, Proeva and its officers, employees, and agents
                shall not be liable for any indirect, incidental, special, consequential, or punitive
                damages, or any loss of profits, data, or goodwill, arising from your use of the
                Service. Our total liability for any claim arising from these Terms or the Service
                shall not exceed the amount you paid us in the twelve months preceding the claim.
              </p>
            </section>

            {/* 13. Governing Law */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 13. Governing Law
              </h2>
              <p className="mt-2">
                These Terms are governed by the laws of the jurisdiction in which Proeva is
                incorporated, without regard to conflict-of-law principles, unless otherwise required
                by applicable local law.
              </p>
            </section>

            {/* 14. Changes to These Terms */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 14. Changes to These Terms
              </h2>
              <p className="mt-2">
                We may update these Terms from time to time. Material changes will be communicated by
                posting the updated Terms with a revised "Last updated" date. Continued use of the
                Service after changes take effect constitutes acceptance of the revised Terms.
              </p>
            </section>

            {/* 15. Contact Us – styled like the other contact boxes */}
            <section className="bg-gray-50 p-6 border-l-4 border-l-blue-600 flex items-start gap-4">
              <Scale size={20} className="shrink-0 mt-0.5 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">15. Contact Us</h2>
                <p className="mt-1">
                  Questions about these Terms can be sent to{' '}
                  <a href="mailto:legal@proeva.com" className="text-blue-600 hover:underline">legal@proeva.com</a>{' '}
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
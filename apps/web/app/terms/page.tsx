import Link from 'next/link'
import { Database } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Terms of Use</h1>
            <p className="text-sm text-gray-500">Last updated: January 2024</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-8 space-y-6 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By using DataHarvest, you agree to these Terms of Use. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>DataHarvest is a web application that allows users to collect publicly available data from websites that permit automated access. The service is designed for research, monitoring, and legitimate data collection purposes only.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You must have permission to collect data from your target URLs</li>
              <li>You must respect robots.txt directives</li>
              <li>You must comply with target websites' Terms of Service</li>
              <li>You are responsible for how you use the collected data</li>
              <li>You must not collect personal or sensitive information</li>
              <li>You must not attempt to bypass security measures</li>
              <li>You must not use the service for any illegal purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Prohibited Uses</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Scraping websites that prohibit automated access</li>
              <li>Collecting personal data (PII) without consent</li>
              <li>Bypassing CAPTCHA or anti-bot systems</li>
              <li>Accessing private or authenticated pages</li>
              <li>Overloading target servers</li>
              <li>Using the service for competitive intelligence that violates terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Limitation of Liability</h2>
            <p>DataHarvest is provided &ldquo;as is&rdquo; without warranties. We are not responsible for how you use the data or for any damages resulting from use of the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use after changes constitutes acceptance of new terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Contact</h2>
            <p>For questions about these terms, please contact the administrator.</p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-primary hover:underline text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

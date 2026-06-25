import Link from 'next/link'
import { Database } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last updated: January 2024</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-8 space-y-6 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Account information: email address and name provided during registration</li>
              <li>Usage data: projects created, URLs submitted, scrape results</li>
              <li>Technical data: browser type, device information, IP address</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide and maintain the service</li>
              <li>To improve and personalize user experience</li>
              <li>To monitor and prevent abuse of the service</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Data Storage and Security</h2>
            <p>Your data is stored securely in Supabase PostgreSQL with encryption at rest. We use Row Level Security to ensure data isolation between users. We implement industry-standard security measures to protect your information.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You can delete your account and associated data at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Third-Party Services</h2>
            <p>We use Supabase for database, authentication, and storage. Your data is processed according to Supabase&apos;s security and privacy practices.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Export your data</li>
              <li>Withdraw consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Contact</h2>
            <p>For privacy-related inquiries, please contact the administrator.</p>
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Shield, BookOpen, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [consentChecked, setConsentChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      const { data: consent } = await supabase
        .from('user_consents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (consent) {
        router.push('/dashboard')
      }
    })
  }, [router])

  const handleFinish = async () => {
    if (!consentChecked) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error: insertError } = await supabase.from('user_consents').insert({
      user_id: user.id,
      consent_text: 'Saya menyatakan bahwa saya memiliki izin untuk mengambil data dari URL target ini, atau data tersebut tersedia secara publik dan diizinkan untuk diakses secara otomatis.',
      consent_version: '1.0',
      consent_at: new Date().toISOString(),
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to DataHarvest</h1>
          <p className="text-gray-500 mt-2">Let's get you started with data collection</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s <= step
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-1 w-12 ${
                    s < step ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <CardTitle>Responsible Data Collection</CardTitle>
              </div>
              <CardDescription>
                DataHarvest is designed for ethical and legal data collection only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                This application may only be used for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Collecting publicly available data from websites that permit crawling</li>
                <li>Research and academic purposes</li>
                <li>Monitoring publicly listed product catalogs</li>
                <li>Gathering publicly available articles and business information</li>
                <li>Websites that provide official APIs for data access</li>
              </ul>
              <p className="text-sm text-gray-600">
                You are responsible for ensuring you have permission to scrape your target URLs.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setStep(2)} className="w-full">
                I Understand
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                <CardTitle>Terms & Consent</CardTitle>
              </div>
              <CardDescription>
                Please read and accept our terms of use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 border max-h-48 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-2">DataHarvest Terms of Use</h3>
                <p>
                  By using DataHarvest, you agree to:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Only collect publicly available data</li>
                  <li>Respect robots.txt directives</li>
                  <li>Not circumvent security measures</li>
                  <li>Not collect personal or sensitive information</li>
                  <li>Comply with target website terms of service</li>
                  <li>Use appropriate request delays</li>
                  <li>Not exceed rate limits</li>
                </ul>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                />
                <label htmlFor="consent" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                  Saya menyatakan bahwa saya memiliki izin untuk mengambil data dari URL target ini,
                  atau data tersebut tersedia secara publik dan diizinkan untuk diakses secara otomatis.
                </label>
              </div>

              <p className="text-xs text-gray-400">
                Read our{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1"
                disabled={!consentChecked}
              >
                Continue
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle>You're All Set!</CardTitle>
              <CardDescription>
                You can now start creating projects and collecting data responsibly.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Remember to always respect website rules and only collect publicly available data.
              </p>
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleFinish} className="w-full" disabled={loading}>
                {loading ? 'Please wait...' : 'Start Using DataHarvest'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
